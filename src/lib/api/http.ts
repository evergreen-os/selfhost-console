const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://127.0.0.1:4000';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  baseUrl?: string;
}

function buildUrl(path: string, params?: RequestOptions['params'], baseUrl: string = DEFAULT_BASE_URL) {
  const url = new URL(path, baseUrl);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, String(value));
    });
  }
  return url;
}

export async function requestJson<T>(path: string, { params, baseUrl, headers, ...init }: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, params, baseUrl);
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(headers || {})
    },
    credentials: 'include'
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body?.error || response.statusText || 'Request failed';
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function postJson<T>(path: string, body: unknown, options: RequestOptions = {}) {
  return requestJson<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) });
}

export async function patchJson<T>(path: string, body: unknown, options: RequestOptions = {}) {
  return requestJson<T>(path, { ...options, method: 'PATCH', body: JSON.stringify(body) });
}

export async function deleteJson<T>(path: string, options: RequestOptions = {}) {
  return requestJson<T>(path, { ...options, method: 'DELETE' });
}
