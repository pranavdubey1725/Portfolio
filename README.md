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
