import os
import re
import json
from pathlib import Path
import requests
from dotenv import load_dotenv
from pypdf import PdfReader
from fastembed import TextEmbedding
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, PayloadSchemaType

# Run this once, and again every time the resume, GitHub or knowledge.json changes:
#   python chatbot/ingest.py
# It rebuilds the Qdrant collection from scratch.

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")  # optional, only needed if GitHub rate-limits you

COLLECTION_NAME = "portfolio"
EMBEDDING_SIZE = 384

RESUME_PATH = ROOT / "public" / "resume.pdf"
KNOWLEDGE_PATH = Path(__file__).resolve().parent / "knowledge.json"

GITHUB_USER = "pranavdubey1725"
EXTRA_REPOS = ["Ekta-9/CHD-Project"]  # repos you worked on that live under someone else's account
SKIP_REPOS = ["pranavdubey1725", "StarPatternsPractice", "Portfolio"]  # profile README / practice / this site

# Headings exactly as they appear on the resume. Add one here if you add a section.
RESUME_SECTIONS = ["Education", "Technical Skills", "Experience", "Projects", "Certifications", "Achievements"]

MAX_CHUNK_CHARS = 800  # all-MiniLM-L6-v2 only reads ~256 tokens, longer text gets cut off


# ============================================================
# PART 1 — HELPERS
# ============================================================

def split_text(text, max_chars=MAX_CHUNK_CHARS):
    # Split on blank lines, then pack paragraphs together until a chunk is full
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks = []
    current = ""

    for paragraph in paragraphs:
        if len(current) + len(paragraph) > max_chars and current:
            chunks.append(current)
            current = ""
        current = (current + "\n" + paragraph).strip()

        # A single paragraph can still be too long, so hard-cut it
        while len(current) > max_chars:
            chunks.append(current[:max_chars])
            current = current[max_chars:]

    if current:
        chunks.append(current)

    return chunks


def make_document(text, category, source, url=None):
    return {"text": text, "category": category, "source": source, "url": url}


# ============================================================
# PART 2 — RESUME
# ============================================================

def load_resume():
    reader = PdfReader(RESUME_PATH)
    documents = []

    for page in reader.pages:
        # layout mode keeps the spaces between words better than the default
        text = page.extract_text(extraction_mode="layout")
        lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines()]
        lines = [line.replace("•", "- ") for line in lines if line]

        # Group lines under the section heading they belong to
        sections = {"Header": []}
        current = "Header"
        for line in lines:
            if line in RESUME_SECTIONS:
                current = line
                sections[current] = []
            else:
                sections[current].append(line)

        for name, section_lines in sections.items():
            if not section_lines:
                continue

            if name == "Projects":
                # One chunk per project. A project starts on the line just before "Tech Stack:"
                projects = []
                for i, line in enumerate(section_lines):
                    next_line = section_lines[i + 1] if i + 1 < len(section_lines) else ""
                    if next_line.startswith("Tech Stack:") or not projects:
                        projects.append([])
                    projects[-1].append(line)

                for project in projects:
                    text = "From Pranav's resume, project: " + "\n".join(project)
                    documents.append(make_document(text, "resume", "resume"))
            else:
                label = "contact details" if name == "Header" else name
                text = f"From Pranav's resume, {label}:\n" + "\n".join(section_lines)
                documents.append(make_document(text, "resume", "resume"))

        # The "Live Demo" and "GitHub" words on the resume are hyperlinks, collect them too
        urls = []
        for annotation in page.get("/Annots") or []:
            uri = annotation.get_object().get("/A", {}).get("/URI")
            if uri and uri.startswith("http"):
                urls.append(uri)
        if urls:
            text = "Links on Pranav's resume (live demos, code and profiles):\n" + "\n".join(urls)
            documents.append(make_document(text, "resume", "resume"))

    print(f"Resume: {len(documents)} chunks")
    return documents


# ============================================================
# PART 3 — GITHUB
# ============================================================

def github_get(url, raw=False):
    headers = {"Accept": "application/vnd.github.raw" if raw else "application/vnd.github+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    response = requests.get(url, headers=headers, timeout=20)
    if response.status_code == 404:
        return None
    if response.status_code == 403 and not GITHUB_TOKEN:
        raise SystemExit(
            "GitHub rate limit hit (60 requests/hour without a token). Wait an hour, or create a token at "
            "https://github.com/settings/tokens (no scopes needed) and add GITHUB_TOKEN=... to .env"
        )
    response.raise_for_status()
    return response.text if raw else response.json()


def clean_readme(markdown):
    text = re.sub(r"```.*?```", "", markdown, flags=re.DOTALL)   # code blocks (install commands etc.)
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", text)              # images and badges
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)          # [text](link) -> text
    text = re.sub(r"<[^>]+>", "", text)                           # html tags
    text = re.sub(r"^\s*[-*_]{3,}\s*$", "", text, flags=re.MULTILINE)  # horizontal rules
    return text.strip()


def load_github():
    repos = github_get(f"https://api.github.com/users/{GITHUB_USER}/repos?per_page=100")
    repos = [r for r in repos if not r["fork"] and r["name"] not in SKIP_REPOS]
    for full_name in EXTRA_REPOS:
        repo = github_get(f"https://api.github.com/repos/{full_name}")
        if repo:
            repos.append(repo)

    documents = []

    # One chunk that lists every repo, so "what has he built?" finds them all at once
    repo_list = "\n".join(
        f"- {r['name']}" + (f": {r['description']}" if r.get("description") else "")
        for r in repos
    )
    text = f"All of Pranav's GitHub projects ({len(repos)} repositories):\n{repo_list}"
    documents.append(make_document(text, "github", "github", f"https://github.com/{GITHUB_USER}"))

    for repo in repos:
        name = repo["name"]
        url = repo["html_url"]

        # One summary chunk per repo
        summary = f"GitHub repository '{name}' by Pranav: {url}"
        if repo.get("description"):
            summary += f"\nDescription: {repo['description']}"
        if repo.get("language"):
            summary += f"\nMain language: {repo['language']}"
        if repo.get("topics"):
            summary += f"\nTopics: {', '.join(repo['topics'])}"
        if repo.get("homepage"):
            summary += f"\nLive demo: {repo['homepage']}"
        documents.append(make_document(summary, "github", name, url))

        # README, split by heading so each chunk is about one thing
        readme = github_get(f"https://api.github.com/repos/{repo['full_name']}/readme", raw=True)
        if not readme:
            continue

        sections = re.split(r"\n(?=#{1,3} )", clean_readme(readme))
        readme_chunks = []
        for section in sections:
            for chunk in split_text(section):
                if len(chunk) > 80:  # skip near-empty bits like a lone heading
                    readme_chunks.append(chunk)

        for chunk in readme_chunks[:15]:  # cap very long READMEs
            text = f"From the README of Pranav's GitHub project '{name}':\n{chunk}"
            documents.append(make_document(text, "github", name, url))

    print(f"GitHub: {len(repos)} repos, {len(documents)} chunks")
    return documents


# ============================================================
# PART 4 — HAND-WRITTEN KNOWLEDGE (links, roles, contact)
# ============================================================

def load_knowledge():
    with open(KNOWLEDGE_PATH, "r", encoding="utf-8") as f:
        documents = json.load(f)
    documents = [make_document(d["text"], d["category"], d["source"], d.get("url")) for d in documents]
    print(f"knowledge.json: {len(documents)} chunks")
    return documents


# ============================================================
# PART 5 — EMBED AND UPLOAD
# ============================================================

def main():
    documents = load_resume() + load_github() + load_knowledge()

    print("Loading embedding model...")
    model = TextEmbedding("sentence-transformers/all-MiniLM-L6-v2", cache_dir=str(Path(__file__).parent / "model_cache"))  # 384

    texts = [document["text"] for document in documents]
    embeddings = list(model.embed(texts))
    print(f"Generated {len(embeddings)} embeddings")

    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    print("Connected to Qdrant Cloud")

    if client.collection_exists(COLLECTION_NAME):
        print(f"Deleting existing collection: {COLLECTION_NAME}")
        client.delete_collection(COLLECTION_NAME)

    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=EMBEDDING_SIZE, distance=Distance.COSINE),
    )
    client.create_payload_index(
        collection_name=COLLECTION_NAME,
        field_name="category",
        field_schema=PayloadSchemaType.KEYWORD,
    )

    points = []
    for i in range(len(documents)):
        point = PointStruct(
            id=i + 1,
            vector=embeddings[i].tolist(),
            payload=documents[i],
        )
        points.append(point)

    client.upsert(collection_name=COLLECTION_NAME, points=points)
    print(f"Uploaded {len(points)} documents to Qdrant collection '{COLLECTION_NAME}'")


if __name__ == "__main__":
    main()
