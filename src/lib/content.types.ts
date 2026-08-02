import type { CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';

export interface TagData {
  title: string;
  slug: string;
}

export interface EntryCardData {
  id: string;
  title: string;
  slug: string;
  publishedAt: string;
  excerpt: string;
  heroImage?: ImageMetadata;
  heroImageAlt?: string;
  tags: TagData[];
}

export interface PostPageData extends EntryCardData {
  entry: CollectionEntry<'posts'>;
}

export interface WritingPageData extends EntryCardData {
  entry: CollectionEntry<'writing'>;
}

export type PostCardData = EntryCardData;
export type WritingCardData = EntryCardData;

export interface AuthorData {
  name: string;
  roleLine: string;
  portrait?: ImageMetadata;
  portraitAlt?: string;
  socialLinks: Array<{ label: string; url: string }>;
}

export interface SiteSettingsData {
  siteTitle: string;
  siteDescription: string;
  navItems: Array<{ title: string; href: string }>;
  defaultOgImage?: ImageMetadata;
  defaultOgImageAlt?: string;
}
