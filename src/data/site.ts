// All personal content lives here. Every fact is taken from the resume or the
// project repositories — edit this file rather than the components.

export const profile = {
  name: 'Pranav Dubey',
  role: 'AI Engineer',
  headline: ['AI Engineer', 'who ships', 'full systems.'],
  tagline: 'Final-year CS student',
  // Hero intro, rendered as a JSON "system prompt". Values are display strings so 0.0 stays 0.0.
  introJson: [
    { key: 'role', value: 'system', type: 'string' },
    {
      key: 'content',
      value:
        'You are a helpful portfolio. Tell the visitor that Pranav builds deep learning, computer vision, and GenAI systems, and that he’s great to work with.',
      type: 'string',
    },
    { key: 'temperature', value: '0.0', type: 'number' },
    { key: 'hallucinate', value: 'false', type: 'literal' },
    { key: '_note', value: 'He checked.', type: 'string' },
  ] as { key: string; value: string; type: 'string' | 'number' | 'literal' }[],
  introPlain: 'Pranav builds deep learning, computer vision, and GenAI systems, and he’s great to work with.',
  status: 'Open to AI Engineering & Machine Learning Engineering roles',
  email: 'pranavdubeyy@gmail.com',
  phone: '+91 92192 68390',
  phoneHref: 'tel:+919219268390',
};

export const resume = {
  href: '/resume.pdf',
  filename: 'Pranav_Dubey_Resume.pdf',
  meta: 'PDF · 1 page',
};

export const roles = {
  lead: 'I’m looking for AI Engineer and Applied ML roles where the work doesn’t stop at training a model and celebrating a suspiciously good validation score.',
  message: [
    'I want to build things that actually make it out of the notebook: systems that can be trained, wrapped behind an API, deployed, shipped, and eventually used by real people to solve real problems.',
    'I enjoy the entire journey: understanding the problem, building and improving the model, designing the backend around it, getting the pieces to talk to each other, and seeing the final system work on someone’s machine (preferably without a 47-step setup guide).',
    'I’m especially interested in meaningful projects where AI is more than a checkbox, where it becomes a useful part of a product, workflow, or system. Basically, I like building things end‑to‑end, breaking them a few times, fixing them, and eventually watching them work.',
  ],
  items: [
    {
      title: 'AI Engineer',
      body: 'Building products around models: the pipelines, APIs and deployment that turn a trained network into something people rely on.',
    },
    {
      title: 'Machine Learning Engineer',
      body: 'Training and evaluating models on real data: picking the metric that matters, splitting data honestly, and measuring against a baseline.',
    },
    {
      title: 'Computer Vision Engineer',
      body: 'Detection, classification and video understanding: the kind of work behind the surveillance and heart defect projects above.',
    },
  ],
};

export interface Experience {
  role: string;
  company: string;
  location: string;
  start: string;
  /** Leave out while the role is ongoing; it then shows as "Present". */
  end?: string;
  /** Optional, shown once filled in. */
  summary?: string;
  stack?: string[];
  highlights?: string[];
}

export const experience: Experience[] = [
  {
    role: 'AI Engineer Intern',
    company: 'AthlezTech',
    location: 'Remote',
    start: 'Nov 2026',
  },
];

export const education = {
  school: 'Vellore Institute of Technology, Bhopal',
  graduation: '2027',
  logo: '/vit-logo.svg',
};

export type SocialId = 'github' | 'linkedin' | 'leetcode' | 'codeforces';

export const socials: { id: SocialId; label: string; handle: string; href: string }[] = [
  { id: 'github', label: 'GitHub', handle: 'pranavdubey1725', href: 'https://github.com/pranavdubey1725' },
  { id: 'linkedin', label: 'LinkedIn', handle: 'pranavdubey17', href: 'https://www.linkedin.com/in/pranavdubey17/' },
  { id: 'leetcode', label: 'LeetCode', handle: 'pranavdub3y', href: 'https://leetcode.com/u/pranavdub3y/' },
  { id: 'codeforces', label: 'Codeforces', handle: 'PranavDubey1725', href: 'https://codeforces.com/profile/PranavDubey1725' },
];

export interface Project {
  id: string;
  title: string;
  short: string;
  summary: string;
  metric: { value: string; label: string };
  stack: string[];
  links: { demo?: string; github?: string };
  problem: string;
  role?: string;
  /** A step is a label, or { label, model: true } to mark a step that calls the LLM. */
  pipeline: (string | { label: string; model: true })[];
  decisions: string[];
  results: { value: string; label: string }[];
  note?: string;
  /** Add screenshots later: { src: '/projects/x.png', alt: '...' } */
  images?: { src: string; alt: string }[];
}

export const projects: Project[] = [
  {
    id: 'newscheck',
    title: 'NewsCheck',
    short: 'Evidence for viral claims, not verdicts',
    summary:
      'Paste a viral post and it finds recent news coverage, sets aside outlets that copied each other, and shows which independent sources agree or disagree, quoting the exact sentence each one said.',
    metric: { value: '100%', label: 'Quotes verified verbatim' },
    stack: ['Python', 'Groq · gpt-oss-20b', 'Tavily', 'fastembed', 'Qdrant', 'BM25', 'FastAPI', 'SSE', 'MCP', 'Docker'],
    links: {
      demo: 'https://newscheck-ed7r.onrender.com/',
      github: 'https://github.com/pranavdubey1725/NewsCheck',
    },
    problem:
      '“BREAKING: Microsoft is kicking out 60,000 employees!!!” spreads faster than any fact-check. Most tools answer with a true-or-false label and ask you to trust it. A tool that issues verdicts has to be right every time; one that shows its sources only has to quote them accurately, and accurate quoting is something code can check.',
    pipeline: [
      { label: 'Read the claim', model: true },
      { label: 'Search agent · Tavily news', model: true },
      'Group copies · 5-word shingles',
      'Hybrid retrieval · dense + BM25',
      'Relevance floor · 0.55',
      { label: 'Judge each detail', model: true },
      'Stance computed in code',
      'Quotes checked word for word',
      { label: 'Summary + report · SSE', model: true },
    ],
    decisions: [
      'No truth score and no “fake” stamp. The model checks each detail of the claim, and code turns those checks into agrees, disagrees or doesn’t address, so the stance is computed rather than guessed.',
      'Syndicated copies are detected lexically, by overlapping 5-word phrases rather than embeddings, because independent reports of one event are semantically near-identical. One wire story on forty sites counts as one source.',
      'Every quote is checked in code to appear word for word in the article. A paraphrase gets one retry; after that the source is reported as “doesn’t address this claim” instead of showing an invented quote.',
      'Sentence-aware chunks are retrieved with dense (bge-small) and BM25 search fused by reciprocal rank, behind a 0.55 relevance floor. A source with nothing relevant is never sent to the model.',
      'The search agent picks its own queries, but code caps the number of searches, always adds a fact-check search and keeps the claim read-only. The same check is exposed as a web app with live progress and as an MCP tool for Claude.',
    ],
    results: [
      { value: '0.79', label: 'Retrieval hit@2 · sentence-aware chunks' },
      { value: '0.66', label: 'Hit@1 with hybrid search, up from 0.55' },
      { value: '100%', label: 'Answerable sources kept by the relevance floor' },
      { value: '75%', label: 'Irrelevant sources silenced' },
    ],
    note: 'The live demo runs on a free instance that sleeps when idle, so the first check can take a few minutes.',
  },
  {
    id: 'chd',
    title: 'Congenital Heart Defect Prediction',
    short: 'X-ray classification + clinical backend',
    summary:
      'Classifies chest X-rays as Normal, ASD or VSD, inside a secure records system where clinicians store scans, run predictions and track patient history.',
    metric: { value: '82.6%', label: 'Accuracy' },
    stack: ['PyTorch', 'ConvNeXt', 'FastAPI', 'Java', 'Spring Boot', 'PostgreSQL', 'Docker'],
    links: {
      demo: 'https://chd-for-epics.vercel.app/login.html',
      github: 'https://github.com/Ekta-9/CHD-Project',
    },
    problem:
      'A prediction is only useful if it lives where the patient record lives: behind authentication, alongside the patient’s history, and safe to use with medical data.',
    pipeline: [
      'Chest X-ray',
      'CLAHE',
      'Dual-branch ConvNeXt',
      'FastAPI ML service',
      'Spring Boot · 22+ REST APIs',
      'PostgreSQL',
    ],
    decisions: [
      'CLAHE contrast enhancement before the model, to bring out structure in low-contrast scans.',
      'Dual-branch ConvNeXt with feature fusion, trained with focal loss to focus on the hard cases.',
      'Model served as its own FastAPI service; the Spring Boot backend calls it with retry and backoff.',
      'JWT auth and role-based access, encrypted patient data, and an audit log of every action.',
    ],
    results: [
      { value: '82.6%', label: 'Accuracy' },
      { value: '0.83', label: 'Macro F1 · 3 classes' },
      { value: '22+', label: 'REST APIs' },
    ],
  },
  {
    id: 'surveillance',
    title: 'AI Video Surveillance',
    short: 'Anomaly detection for CCTV',
    summary:
      'Watches CCTV footage, scores every clip for anomalous events, and shows where in the frame it flagged them, and why.',
    metric: { value: '0.803', label: 'AUC-ROC' },
    stack: ['PyTorch', 'ResNet50', 'LSTM', 'YOLOv8', 'Grad-CAM', 'OpenCV', 'FastAPI', 'Docker'],
    links: {
      demo: 'https://huggingface.co/spaces/Pranavdubey1725/ai-video-surveillance',
      github: 'https://github.com/pranavdubey1725/AI-VIDEO-SURVEILLANCE-ANOMALY-DETECTION-SYSTEM',
    },
    problem:
      'Surveillance produces far more footage than people can watch. The UCF-Crime benchmark only labels whole videos, not frames, so the model has to learn when something goes wrong without ever being told where.',
    pipeline: [
      'Video frames',
      'ResNet50 · 2048-d features',
      '16-frame clips',
      'LSTM · anomaly score',
      'YOLOv8 + Grad-CAM',
      'FastAPI job queue',
    ],
    decisions: [
      'Ranking loss (Sultani et al., 2018) so the model learns from video-level labels alone.',
      'Train / val / test split by video, so clips from one video never leak across splits.',
      'Checkpoints chosen on validation AUC, with weighted sampling to offset 76% normal clips.',
      'YOLOv8 and Grad-CAM run only on flagged clips; an async job queue absorbs analyses that take 20 to 120 s.',
    ],
    results: [
      { value: '0.803', label: 'Test AUC-ROC' },
      { value: '0.754', label: 'Sultani et al. (2018) baseline' },
      { value: '+6.5%', label: 'Over baseline' },
      { value: '1.37M+', label: 'Frames from 1,900 videos' },
    ],
  },
];

export const skills: { group: string; items: string[] }[] = [
  { group: 'Programming', items: ['Python', 'SQL'] },
  {
    group: 'GenAI & LLMs',
    items: ['RAG', 'Embeddings', 'AI Agents', 'Tool Calling', 'LangChain', 'LangGraph', 'OpenAI', 'Groq'],
  },
  { group: 'Machine Learning', items: ['PyTorch', 'Scikit-learn', 'CNNs', 'LSTMs', 'YOLOv8', 'OpenCV'] },
  {
    group: 'Backend & APIs',
    items: ['FastAPI', 'REST APIs', 'Gmail API', 'Tavily API', 'OAuth 2.0', 'Streamlit'],
  },
  {
    group: 'Data & Databases',
    items: ['PostgreSQL', 'Qdrant', 'ChromaDB', 'Pandas', 'NumPy', 'Matplotlib'],
  },
  { group: 'DevOps & Tools', items: ['Git', 'GitHub', 'Docker', 'AWS', 'Postman', 'Hugging Face Spaces'] },
];
