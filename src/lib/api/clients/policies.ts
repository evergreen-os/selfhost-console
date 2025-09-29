import type { PlainMessage } from '@bufbuild/protobuf';
import {
  Policy as PolicyMessage,
  PolicyBundle as PolicyBundleMessage,
  PolicySignature as PolicySignatureMessage
} from '@gen/evergreen/console/v1/console_pb.ts';
import { policyClient } from './transport';
import { deleteJson, patchJson, postJson, requestJson } from '@/lib/api/http';

export type Policy = PlainMessage<PolicyMessage>;
export type PolicyBundle = PlainMessage<PolicyBundleMessage>;
export type PolicySignature = PlainMessage<PolicySignatureMessage>;

const BASE_PATH = '/api/policies';

export async function listPolicies(orgId?: string): Promise<{ policies: Policy[] }> {
  const params = orgId ? { orgId } : undefined;
  return requestJson<{ policies: Policy[] }>(BASE_PATH, { params });
}

export async function getPolicy(policyId: string): Promise<Policy> {
  return requestJson<Policy>(`${BASE_PATH}/${policyId}`);
}

export async function createPolicy(policy: {
  name: string;
  orgId: string;
  bundle: PolicyBundle;
  signed?: boolean;
}): Promise<Policy> {
  return postJson<Policy>(BASE_PATH, policy);
}

export async function updatePolicy(policyId: string, policy: {
  name: string;
  orgId: string;
  bundle: PolicyBundle;
  signed?: boolean;
}): Promise<Policy> {
  return patchJson<Policy>(`${BASE_PATH}/${policyId}`, policy);
}

export async function deletePolicy(policyId: string): Promise<void> {
  await deleteJson(`${BASE_PATH}/${policyId}`);
}

export async function publishPolicy(policyId: string): Promise<void> {
  // Try gRPC first to take advantage of signature enforcement
  try {
    await policyClient.upsertPolicy({
      policy: { id: policyId } as PolicyMessage
    });
  } catch (error) {
    await postJson(`${BASE_PATH}/${policyId}/publish`, {});
  }
}
