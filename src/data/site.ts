// All personal content lives here. Every fact is taken from the resume or the
// project repositories — edit this file rather than the components.

export const profile = {
  name: 'Pranav Dubey',
  role: 'AI Engineer',
  headline: ['AI Engineer', 'who ships', 'full systems.'],
  tagline: 'Final-year CS student',
  intro:
    'I work in computer vision and generative AI, and I take models past the notebook: trained, served behind APIs, and deployed where people can use them.',
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
      body: 'Detection, classification and video understanding: the kind of work behind both projects above.',
    },
  ],
};

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
  pipeline: string[];
  decisions: string[];
  results: { value: string; label: string }[];
  note?: string;
  /** Add screenshots later: { src: '/projects/x.png', alt: '...' } */
  images?: { src: string; alt: string }[];
}

export const projects: Project[] = [
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
    note: 'Weakest on fast events like Fighting and Shooting, where a 16-frame clip covers only half a second of context.',
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
      github: 'https://github.com/pranavdubey1725/CHD-For-EPICS',
    },
    problem:
      'A prediction is only useful if it lives where the patient record lives: behind authentication, alongside the patient’s history, and safe to use with medical data.',
    role: 'Built solo, end to end: model, ML service, backend and frontend.',
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
];

export const skills: { group: string; items: string[] }[] = [
  { group: 'Languages & Frameworks', items: ['Python', 'FastAPI', 'Streamlit'] },
  { group: 'Generative AI & LLMs', items: ['LangChain', 'ChromaDB', 'Ollama', 'Hugging Face'] },
  { group: 'Machine & Deep Learning', items: ['PyTorch', 'TensorFlow', 'Keras', 'Scikit-learn', 'YOLOv8'] },
  { group: 'Data & Analytics', items: ['NumPy', 'Pandas', 'Matplotlib', 'PostgreSQL'] },
  { group: 'MLOps & Tools', items: ['AWS', 'Docker', 'Git', 'Postman'] },
];
