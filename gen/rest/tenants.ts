import { requestJson, postJson, patchJson } from '@/lib/api/http';

export interface TenantRecord {
  id: string;
  name: string;
  parentId?: string;
  reseller?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertTenantRequest {
  name: string;
  parentId?: string;
  reseller?: boolean;
}

export async function listTenants(): Promise<{ tenants: TenantRecord[] }> {
  return requestJson<{ tenants: TenantRecord[] }>('/api/tenants');
}

export async function createTenant(input: UpsertTenantRequest) {
  return postJson<TenantRecord>('/api/tenants', input);
}

export async function updateTenant(tenantId: string, input: UpsertTenantRequest) {
  return patchJson<TenantRecord>(`/api/tenants/${tenantId}`, input);
}
