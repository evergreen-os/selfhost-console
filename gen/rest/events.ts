import { requestJson } from '@/lib/api/http';

export interface EventRecord {
  id: string;
  occurredAt: string;
  actor: string;
  action: string;
  severity: 'info' | 'warning' | 'error';
  deviceId?: string;
  orgId?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface ListEventsRequest {
  deviceId?: string;
  orgId?: string;
  action?: string;
  severity?: string;
  search?: string;
  limit?: number;
}

export interface ListEventsResponse {
  events: EventRecord[];
}

export async function listEvents(params: ListEventsRequest = {}): Promise<ListEventsResponse> {
  return requestJson<ListEventsResponse>('/api/events', { params });
}

export async function exportEvents(params: ListEventsRequest = {}, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
  const url = new URL('/api/events/export', process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://127.0.0.1:4000');
  Object.entries({ ...params, format }).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Unable to export events');
  }
  return await response.blob();
}
