import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

const isCheckCommand = process.argv.some((arg) => arg.includes('check'));
const viteCacheDir = isCheckCommand ? '.astro/vite-check' : '.astro/vite';
const siteUrl = process.env.PUBLIC_SITE_URL || 'https://chriszombik.com';

export default defineConfig({
  site: siteUrl,
  output: 'static',
  adapter: vercel(),
  security: {
    // Contact form posts can arrive via equivalent apex/www domains after redirects.
    // We enforce anti-spam in the endpoint (Turnstile + validation + honeypot), so
    // we disable Astro's strict same-origin POST check here.
    checkOrigin: false,
  },
  vite: {
    cacheDir: viteCacheDir,
  },
});
