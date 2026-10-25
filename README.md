# Pranav Dubey — Portfolio

Single-page portfolio built with Astro (static output), plain CSS and GSAP.

## Run

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # type-check + static build into dist/
npm run preview   # serve the built site
```

## Edit content

All content lives in `src/data/site.ts` — profile, projects, skills, socials, education.
Components never hard-code personal facts.

### Add project screenshots

1. Put images in `public/projects/` (e.g. `public/projects/surveillance-gradcam.png`).
2. Add them to the project in `src/data/site.ts`:

```ts
images: [{ src: '/projects/surveillance-gradcam.png', alt: 'Grad-CAM heatmap over a flagged frame' }],
```

They appear at the bottom of the expanded project.

## Deploy

Any static host works (Vercel, Netlify, GitHub Pages). Set `SITE_URL` to the final domain
so canonical and Open Graph URLs are correct, e.g. `SITE_URL=https://yourdomain.com npm run build`.

## AI chatbot (RAG)

The "Ask AI" bubble in the corner answers questions about me from my resume, GitHub
and `chatbot/knowledge.json`. Code lives in `chatbot/`:

- `ingest.py` — reads `public/resume.pdf`, my GitHub repos + READMEs and `knowledge.json`,
  embeds them with `all-MiniLM-L6-v2` (via fastembed, no torch) and uploads them to the
  Qdrant collection `portfolio`.
- `app.py` — FastAPI `POST /chat`: embeds the question, pulls the top 5 chunks from Qdrant,
  and asks Groq (`openai/gpt-oss-20b`) to answer only from those chunks.

Keys come from `.env` in the project root: `GROQ_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY`.

```bash
python -m venv chatbot/.venv
chatbot/.venv/Scripts/pip install -r chatbot/requirements.txt

chatbot/.venv/Scripts/python chatbot/ingest.py      # rerun after updating resume / GitHub / knowledge.json
cd chatbot && .venv/Scripts/uvicorn app:app --reload --port 8000
npm run dev                                         # bubble talks to http://localhost:8000
```

Deploy the API on Render (free web service), from this repo:

- Root directory: `chatbot`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
- Environment: `GROQ_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY`, `PYTHON_VERSION=3.11.9`,
  `ALLOWED_ORIGINS=https://your-site-domain`

Then set `PUBLIC_CHAT_API_URL=https://<service>.onrender.com` on Vercel and redeploy the site.

## Structure

```
src/
  data/site.ts          content
  layouts/Base.astro    <head>, SEO, fonts
  components/           Nav, Hero, Work, ProjectRow, Skills, Contact, SectionHead, Icon
  scripts/motion.ts     GSAP reveals (disabled under prefers-reduced-motion)
  styles/global.css     tokens and primitives
public/                 favicon, OG image, VIT logo, robots.txt
```
