import sys
import json
import time
from pathlib import Path
from groq import Groq

# Evaluates the RAG pipeline against golden.json. Run from the project root:
#   chatbot/.venv/Scripts/python chatbot/eval/evaluate.py
#
# For every golden question it runs the real pipeline (search + ask_llm from app.py),
# then a bigger "judge" LLM grades the result. Four scores, all between 0 and 1:
#
#   Correctness       does the answer match the ground truth?             (answer vs ground truth)
#   Context precision of the 5 retrieved chunks, how many were relevant?  (retrieval quality)
#   Context recall    how much of the ground truth is in those chunks?    (retrieval quality)
#   Faithfulness      how much of the answer is backed by the chunks?     (hallucination check)

EVAL_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(EVAL_DIR.parent))  # so we can import app.py

import app  # loads the embedding model, Qdrant and Groq exactly like the live API

GOLDEN_PATH = EVAL_DIR / "golden.json"
RESULTS_PATH = EVAL_DIR / "results.json"

# The judge is a bigger model than the one answering, so it isn't grading its own homework
JUDGE_MODEL = "openai/gpt-oss-120b"

# Groq's free tier has per-minute token limits, so retry (with backoff) instead of crashing
judge_client = Groq(api_key=app.GROQ_API_KEY, max_retries=8)
app.groq_client = app.groq_client.with_options(max_retries=8)


# ============================================================
# PART 1 — THE JUDGE
# ============================================================

JUDGE_PROMPT = """You are grading a RAG chatbot on a personal portfolio website. It answers questions about Pranav Dubey.

Question:
{question}

Ground truth answer (written by a human, this is correct):
{ground_truth}

Question type: {qtype}

Retrieved context chunks:
{chunks}

Chatbot answer:
{answer}

Grade it and return ONLY a JSON object with these keys:

"chunk_relevance": a list with one entry per retrieved chunk, in order. 1 if that chunk contains information needed to answer the question (judged against the ground truth), else 0.

"ground_truth_claims": split the ground truth into its separate factual claims. For each, an object {{"claim": "...", "in_context": true/false}} saying whether the retrieved chunks contain that claim. For "unanswerable" or "off_topic" questions return [].

"answer_claims": split the chatbot answer into its separate factual claims about Pranav. For each, an object {{"claim": "...", "supported": true/false}} saying whether the retrieved chunks support it. Paraphrasing is fine, a claim is supported if the chunks say the same thing in other words. Do NOT list as claims: declining to answer, saying it doesn't know or that something isn't listed/mentioned, saying it only answers questions about Pranav, or suggesting to email pranavdubeyy@gmail.com (those come from the bot's instructions).

"correctness": judge only the facts the question actually asks for. The ground truth sometimes includes extra background (e.g. a tech stack when the question only asks for a number); leaving out that extra background must NOT lower the score. 1 if the answer gives every fact the question asks for and nothing wrong, 0.5 if it is partly right (part of what was asked is missing, or a minor error), 0 if it is wrong, missing the point, or invents facts. For "unanswerable" questions: 1 if it says it doesn't know without inventing anything, else 0. For "off_topic" questions: 1 if it politely declines and stays on Pranav, else 0.

"reason": one short sentence explaining the correctness score."""


def judge(item, chunks, answer):
    numbered = "\n\n".join(f"[{i + 1}] {chunk}" for i, chunk in enumerate(chunks))

    prompt = JUDGE_PROMPT.format(
        question=item["question"],
        ground_truth=item["ground_truth"],
        qtype=item["type"],
        chunks=numbered,
        answer=answer,
    )

    response = judge_client.chat.completions.create(
        model=JUDGE_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        response_format={"type": "json_object"},
        reasoning_effort="medium",
    )

    return json.loads(response.choices[0].message.content)


# ============================================================
# PART 2 — TURN THE JUDGE'S VERDICT INTO SCORES
# ============================================================

def fraction(values):
    # None means "doesn't apply" (e.g. recall for a question with no answer in the data)
    return sum(values) / len(values) if values else None


def score(item, verdict):
    answerable = item["type"] not in ("unanswerable", "off_topic")

    precision = fraction(verdict["chunk_relevance"]) if answerable else None
    recall = fraction([c["in_context"] for c in verdict["ground_truth_claims"]]) if answerable else None

    answer_claims = [c["supported"] for c in verdict["answer_claims"]]
    faithfulness = fraction(answer_claims) if answer_claims else 1.0  # no claims = nothing made up

    return {
        "correctness": float(verdict["correctness"]),
        "context_precision": precision,
        "context_recall": recall,
        "faithfulness": faithfulness,
    }


def average(rows, metric):
    values = [r["scores"][metric] for r in rows if r["scores"][metric] is not None]
    return round(sum(values) / len(values), 3) if values else None


# ============================================================
# PART 3 — RUN THE GOLDEN DATASET
# ============================================================

METRICS = ["correctness", "context_precision", "context_recall", "faithfulness"]


def main():
    with open(GOLDEN_PATH, "r", encoding="utf-8") as f:
        golden = json.load(f)

    rows = []
    for item in golden:
        start = time.time()

        # The exact same steps as POST /chat in app.py
        results = app.search(item["question"])
        chunks = [result.payload["text"] for result in results]
        answer = app.ask_llm(item["question"], "\n\n".join(chunks), history=[])

        verdict = judge(item, chunks, answer)
        scores = score(item, verdict)

        rows.append({**item, "answer": answer, "retrieved": chunks, "verdict": verdict, "scores": scores})
        print(f"[{item['id']:>2}/{len(golden)}] correctness={scores['correctness']:.1f}  {item['question']}  ({time.time() - start:.0f}s)")

        # Save after every question so a crash or rate limit doesn't lose progress
        with open(RESULTS_PATH, "w", encoding="utf-8") as f:
            json.dump(rows, f, ensure_ascii=False, indent=2)

    # Summary: overall, then per question type
    summary = {"overall": {m: average(rows, m) for m in METRICS}, "by_type": {}}
    for qtype in sorted({r["type"] for r in rows}):
        subset = [r for r in rows if r["type"] == qtype]
        summary["by_type"][qtype] = {"count": len(subset), **{m: average(subset, m) for m in METRICS}}

    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump({"summary": summary, "rows": rows}, f, ensure_ascii=False, indent=2)

    print("\n=========== RESULTS ===========")
    for metric in METRICS:
        print(f"{metric:<18} {summary['overall'][metric]}")
    print("\nBy question type:")
    for qtype, s in summary["by_type"].items():
        print(f"  {qtype:<13} n={s['count']:<3} " + "  ".join(f"{m}={s[m]}" for m in METRICS))

    print("\nQuestions that weren't fully correct:")
    for r in rows:
        if r["scores"]["correctness"] < 1:
            print(f"  [{r['id']}] {r['question']} -> {r['verdict'].get('reason', '')}")

    print(f"\nFull details saved to {RESULTS_PATH}")


if __name__ == "__main__":
    main()
