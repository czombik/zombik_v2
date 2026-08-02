import { defineCollection, z, type ImageFunction } from 'astro:content';
import { glob } from 'astro/loaders';

const tagSchema = z.object({
  title: z.string(),
  slug: z.string(),
});

const entryFields = (image: ImageFunction) => ({
  title: z.string(),
  publishedAt: z.string().datetime(),
  excerpt: z.string(),
  tags: z.array(tagSchema).default([]),
  heroImage: image().optional(),
  heroImageAlt: z.string().optional(),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: ({ image }) => z.object(entryFields(image)),
});

const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: ({ image }) => z.object(entryFields(image)),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.discriminatedUnion('type', [
      z.object({
        type: z.literal('home'),
        title: z.string(),
        heroHeading: z.string(),
        heroSubheading: z.string(),
        heroImage: image().optional(),
        heroImageAlt: z.string().optional(),
        novelCardCopy: z.string(),
        memoirCardCopy: z.string(),
        featuredPosts: z.array(z.string()).default([]),
      }),
      z.object({
        type: z.literal('about'),
        title: z.string(),
      }),
      z.object({
        type: z.literal('now'),
        title: z.string(),
        lastUpdated: z.string().optional(),
      }),
    ]),
});

const site = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/site' }),
  schema: ({ image }) =>
    z.discriminatedUnion('type', [
      z.object({
        type: z.literal('author'),
        name: z.string(),
        roleLine: z.string(),
        portrait: image().optional(),
        portraitAlt: z.string().optional(),
        socialLinks: z
          .array(z.object({ label: z.string(), url: z.string().url() }))
          .default([]),
      }),
      z.object({
        type: z.literal('settings'),
        siteTitle: z.string(),
        siteDescription: z.string(),
        navItems: z
          .array(z.object({ title: z.string(), href: z.string() }))
          .default([]),
        defaultOgImage: image().optional(),
        defaultOgImageAlt: z.string().optional(),
      }),
    ]),
});

export const collections = { posts, writing, pages, site };
