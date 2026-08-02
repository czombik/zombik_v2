# chriszombik.com

Chris Zombik's Astro site. All editorial content and media live in this repository; there is no CMS or content API.

## Stack

- Astro with statically generated pages
- Markdown content collections with validated frontmatter
- Repository-managed images optimized by Astro at build time
- Vercel Analytics
- Resend and Cloudflare Turnstile for the contact form

The public pages are static. The contact form is the sole server-side route: it verifies Turnstile and sends directly through Resend. Submissions are not stored in the repository or in a CMS.

## Local development

```bash
bun install
cp .env.example .env
bun run dev
```

Open `http://localhost:4321`.

The content pages and production build do not require credentials. The contact form uses Turnstile's test site key locally when `PUBLIC_TURNSTILE_SITE_KEY` is empty; sending a real message still requires the private contact variables described below.

## Content layout

```text
src/content/
├── pages/       # Home, About, and Now
├── posts/       # Blog posts; filename is the public URL slug
├── site/        # Author profile, navigation, and site metadata
└── writing/     # Fiction and other long-form writing

src/assets/images/  # Local editorial images
```

Schemas are defined in `src/content.config.ts`. A build fails when required frontmatter is missing or malformed, which makes content errors visible before deployment.

## Managing content with Codex

You can ask Codex to create or edit content in plain language. For example:

> Create a draft post titled "Working title" dated August 1, 2026. Use `notes/draft.md` as source material, add the attached image with descriptive alt text, and show me the local result without committing.

For a new post, add `src/content/posts/<slug>.md`:

```markdown
---
title: "Post title"
publishedAt: "2026-08-01T16:00:00.000Z"
excerpt: "A short summary used on cards, in RSS, and for search previews."
tags: [{"title":"Writing","slug":"writing"}]
heroImage: "../../assets/images/descriptive-filename.jpg"
heroImageAlt: "A concise description of the image"
---

The post body is ordinary Markdown.
```

The filename controls the URL: the example above at `src/content/posts/example.md` is published at `/posts/example`.

- Put images in `src/assets/images/` and reference them with the relative path shown above.
- Use normal Markdown for headings, links, emphasis, lists, blockquotes, code, and footnotes.
- Feature a post on the homepage by adding its filename/slug to `featuredPosts` in `src/content/pages/home.md`.
- Edit navigation and global metadata in `src/content/site/settings.md`.
- Edit the portrait and social links in `src/content/site/author.md`.
- Edit the homepage, About page, or Now page in `src/content/pages/`.

## Verification

Run these before requesting a commit:

```bash
bun run check
bun test
bun run build
bun run preview
```

The build generates all post and writing routes, optimized image variants, RSS at `/rss.xml`, and page metadata without contacting an external content service.

## Environment variables

Only deployment and contact settings remain:

- `PUBLIC_SITE_URL` — canonical site origin; defaults to `https://chriszombik.com`
- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL`
- `CONTACT_SUBJECT_PREFIX` — optional; defaults to `[chriszombik.com]`
- `PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

## Deployment

On Vercel, use `bun install` and `bun run build`. Configure the environment variables above in project settings. Content changes deploy through the normal Git/Vercel workflow; there is no CMS webhook or Studio deployment.
