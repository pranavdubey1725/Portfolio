import { defineConfig } from 'astro/config';

// Set SITE_URL to the deployed domain so canonical and Open Graph URLs are absolute.
export default defineConfig({
  site: process.env.SITE_URL || 'https://pranavdubey.vercel.app',
  compressHTML: true,
});
