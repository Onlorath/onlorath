import type { Blog, Site } from './types';

const API = `${process.env.API_INTERNAL_URL || 'http://localhost:8080'}/api/v1`;

// Pages are regenerated at most this often; if the API is down or asleep during a
// regeneration, Next keeps serving the last successful render.
export const REVALIDATE_SECONDS = 60;

// A free-tier API host can take ~50s to wake up from sleep.
const TIMEOUT_MS = 55_000;

export class NotFoundError extends Error {}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status === 404) throw new NotFoundError(path);
  if (!res.ok) throw new Error(`API ${path} failed with HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const getSite = () => get<Site>('/site');
export const getBlogs = () => get<Blog[]>('/blogs');
export const getBlog = (slug: string) => get<Blog>(`/blogs/${encodeURIComponent(slug)}`);
