// Hexagonal API Client Adapter
// Configured to target Go REST Backend (Chi Router) & Python ML microservices

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1') {
    this.baseUrl = baseUrl;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', headers = {}, body, timeoutMs = 8000 } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...headers,
        },
        credentials: 'include', // Automatically passes HttpOnly JWT auth cookies
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errDetail = response.statusText;
        try {
          const errJson = await response.json();
          if (errJson.error || errJson.message) {
            errDetail = errJson.error || errJson.message;
          }
        } catch {
          // ignore non-json error
        }
        throw new Error(`[ApiClient] HTTP ${response.status}: ${errDetail}`);
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const message = err instanceof Error ? err.message : 'Network Failure';
      console.warn(`[ApiClient Boundary] Endpoint: ${endpoint} -> ${message}`);
      throw new Error(message);
    }
  }
}

export const apiClient = new ApiClient();
