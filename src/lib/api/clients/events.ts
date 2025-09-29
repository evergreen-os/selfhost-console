import type { PlainMessage } from '@bufbuild/protobuf';
import {
  EventRecord as EventRecordMessage,
  ListEventsRequest as ListEventsRequestMessage,
  ListEventsResponse as ListEventsResponseMessage
} from '@gen/evergreen/console/v1/console_pb.ts';
import { eventClient } from './transport';
import { requestJson } from '@/lib/api/http';

export type EventRecord = PlainMessage<EventRecordMessage>;
export type ListEventsRequest = Partial<PlainMessage<ListEventsRequestMessage>>;
export type ListEventsResponse = PlainMessage<ListEventsResponseMessage>;

const BASE_PATH = '/api/events';

export async function listEvents(params: ListEventsRequest = {}): Promise<ListEventsResponse> {
  try {
    const response = await eventClient.listEvents(params);
    return { events: response.events.map((event) => ({ ...event })) };
  } catch (error) {
    return requestJson<ListEventsResponse>(BASE_PATH, { params });
  }
}

export async function exportEvents(params: ListEventsRequest = {}, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
  const url = new URL(`${BASE_PATH}/export`, process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://127.0.0.1:4000');
  Object.entries({ ...params, format }).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Unable to export events');
  }
  return await response.blob();
}
