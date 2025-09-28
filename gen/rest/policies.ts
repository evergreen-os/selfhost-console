import { requestJson, postJson, patchJson, deleteJson } from '@/lib/api/http';

export interface PolicySummary {
  id: string;
  orgId: string;
  name: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  signed: boolean;
}

export interface PolicyDetail extends PolicySummary {
  description?: string;
  bundle: unknown;
}

export interface UpsertPolicyRequest {
  name: string;
  orgId: string;
  bundle: unknown;
  signed?: boolean;
}

export async function listPolicies(): Promise<{ policies: PolicySummary[] }> {
  return requestJson<{ policies: PolicySummary[] }>('/api/policies');
}

export async function getPolicy(policyId: string): Promise<PolicyDetail> {
  return requestJson<PolicyDetail>(`/api/policies/${policyId}`);
}

export async function createPolicy(input: UpsertPolicyRequest): Promise<PolicyDetail> {
  return postJson<PolicyDetail>('/api/policies', input);
}

export async function updatePolicy(policyId: string, input: UpsertPolicyRequest): Promise<PolicyDetail> {
  return patchJson<PolicyDetail>(`/api/policies/${policyId}`, input);
}

export async function deletePolicy(policyId: string) {
  return deleteJson(`/api/policies/${policyId}`);
}

export async function publishPolicy(policyId: string) {
  return postJson(`/api/policies/${policyId}/publish`, {});
}
