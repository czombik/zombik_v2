import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type {
  AuthorData,
  EntryCardData,
  PostPageData,
  SiteSettingsData,
  WritingPageData,
} from './content.types';

function toCardData(
  entry: CollectionEntry<'posts'> | CollectionEntry<'writing'>,
): EntryCardData {
  return {
    id: entry.id,
    slug: entry.id,
    title: entry.data.title,
    publishedAt: entry.data.publishedAt,
    excerpt: entry.data.excerpt,
    heroImage: entry.data.heroImage,
    heroImageAlt: entry.data.heroImageAlt,
    tags: entry.data.tags,
  };
}

function newestFirst(a: EntryCardData, b: EntryCardData): number {
  return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
}

export async function getPostIndexData(): Promise<EntryCardData[]> {
  return (await getCollection('posts')).map(toCardData).sort(newestFirst);
}

export async function getWritingIndexData(): Promise<EntryCardData[]> {
  return (await getCollection('writing')).map(toCardData).sort(newestFirst);
}

export async function getPostSlugs(): Promise<string[]> {
  return (await getCollection('posts')).map((entry: CollectionEntry<'posts'>) => entry.id);
}

export async function getWritingSlugs(): Promise<string[]> {
  return (await getCollection('writing')).map((entry: CollectionEntry<'writing'>) => entry.id);
}

export async function getPostBySlug(slug: string): Promise<PostPageData | null> {
  const entry = await getEntry('posts', slug);
  return entry ? { ...toCardData(entry), entry } : null;
}

export async function getWritingBySlug(slug: string): Promise<WritingPageData | null> {
  const entry = await getEntry('writing', slug);
  return entry ? { ...toCardData(entry), entry } : null;
}

export async function getPageEntry(id: 'home' | 'about' | 'now') {
  const entry = await getEntry('pages', id);
  if (!entry) throw new Error(`Missing required page content: ${id}`);
  return entry;
}

export async function getHomePageData() {
  const [entry, posts] = await Promise.all([getPageEntry('home'), getPostIndexData()]);
  if (entry.data.type !== 'home') throw new Error('Home content has the wrong page type.');

  const postsBySlug = new Map(posts.map((post) => [post.slug, post]));
  return {
    ...entry.data,
    featuredPosts: entry.data.featuredPosts
      .map((slug: string) => postsBySlug.get(slug))
      .filter((post: EntryCardData | undefined): post is EntryCardData => Boolean(post)),
  };
}

export async function getAuthorData(): Promise<AuthorData> {
  const entry = await getEntry('site', 'author');
  if (!entry || entry.data.type !== 'author') throw new Error('Missing author content.');
  return entry.data;
}

export async function getSiteSettingsData(): Promise<SiteSettingsData> {
  const entry = await getEntry('site', 'settings');
  if (!entry || entry.data.type !== 'settings') throw new Error('Missing site settings content.');
  return entry.data;
}
