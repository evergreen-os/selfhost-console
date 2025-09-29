import type { PlainMessage } from '@bufbuild/protobuf';
import {
  ListTenantsRequest as ListTenantsRequestMessage,
  ListTenantsResponse as ListTenantsResponseMessage,
  TenantRecord as TenantRecordMessage
} from '@gen/evergreen/console/v1/console_pb.ts';
import { tenantClient } from './transport';
import { patchJson, postJson, requestJson } from '@/lib/api/http';

export type TenantRecord = PlainMessage<TenantRecordMessage>;
export type ListTenantsRequest = Partial<PlainMessage<ListTenantsRequestMessage>>;
export type ListTenantsResponse = PlainMessage<ListTenantsResponseMessage>;

export interface TenantInput {
  name: string;
  parentId?: string;
  reseller?: boolean;
}

const BASE_PATH = '/api/tenants';

export async function listTenants(params: ListTenantsRequest = {}): Promise<ListTenantsResponse> {
  try {
    const response = await tenantClient.listTenants(params);
    return { tenants: response.tenants.map((tenant) => ({ ...tenant })) };
  } catch (error) {
    return requestJson<ListTenantsResponse>(BASE_PATH, { params });
  }
}

export async function createTenant(payload: TenantInput): Promise<TenantRecord> {
  try {
    return await tenantClient.upsertTenant({ tenant: { ...payload, id: '' } });
  } catch (error) {
    return postJson<TenantRecord>(BASE_PATH, payload);
  }
}

export async function updateTenant(tenantId: string, payload: TenantInput): Promise<TenantRecord> {
  try {
    return await tenantClient.upsertTenant({ tenant: { ...payload, id: tenantId } });
  } catch (error) {
    return patchJson<TenantRecord>(`${BASE_PATH}/${tenantId}`, payload);
  }
}
