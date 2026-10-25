import type { Blog, Site } from './types';

const API = `${process.env.API_INTERNAL_URL || 'http://localhost:8080'}/api/v1`;

export class NotFoundError extends Error {}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { cache: 'no-store' });
  if (res.status === 404) throw new NotFoundError(path);
  if (!res.ok) throw new Error(`API ${path} failed with HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const getSite = () => get<Site>('/site');
export const getBlogs = () => get<Blog[]>('/blogs');
export const getBlog = (slug: string) => get<Blog>(`/blogs/${encodeURIComponent(slug)}`);
