// The access token lives only in memory; the HttpOnly refresh cookie restores it after reloads.

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public headers?: Headers,
  ) {
    super(message);
  }
}

const BASE = '/api/v1';
let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

/** Asks the API for a new access token using the refresh cookie. Concurrent callers share one request. */
export function refreshAccessToken(): Promise<boolean> {
  refreshing ??= fetch(`${BASE}/users/refresh`, { method: 'POST', credentials: 'include' })
    .then(async (res) => {
      if (!res.ok) {
        accessToken = null;
        return false;
      }
      accessToken = ((await res.json()) as { access_token: string }).access_token;
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  /** Retry once after refreshing the token on 401 (off for login/refresh themselves). */
  retry?: boolean;
}

async function send(path: string, opts: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json', ...opts.headers };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let body: BodyInit | undefined;
  if (opts.body instanceof FormData) {
    body = opts.body;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  return fetch(`${BASE}${path}`, { method: opts.method ?? 'GET', headers, body, credentials: 'include' });
}

export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<{ data: T; headers: Headers }> {
  let res = await send(path, opts);
  if (res.status === 401 && opts.retry !== false && (await refreshAccessToken())) {
    res = await send(path, opts);
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      message = ((await res.json()) as { error?: string }).error ?? message;
    } catch {
    }
    throw new ApiError(res.status, message, res.headers);
  }
  return { data: (await res.json()) as T, headers: res.headers };
}

export const api = {
  get: <T>(path: string, headers?: Record<string, string>) => apiRequest<T>(path, { headers }).then((r) => r.data),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body }).then((r) => r.data),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PUT', body }).then((r) => r.data),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body }).then((r) => r.data),
  del: <T = { status: string }>(path: string) => apiRequest<T>(path, { method: 'DELETE' }).then((r) => r.data),

  upload: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const { url } = await apiRequest<{ url: string }>('/admin/uploads', { method: 'POST', body: form }).then((r) => r.data);
    return url;
  },
};
