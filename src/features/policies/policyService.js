import { validatePolicyBundle } from './policyValidator.js';

let idCounter = 0;

export class PolicyServiceError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PolicyServiceError';
  }
}

function nextId() {
  idCounter += 1;
  return `policy-${idCounter}`;
}

function resolvePolicyId(bundle) {
  if (bundle?.id && typeof bundle.id === 'string' && bundle.id.trim().length > 0) {
    return bundle.id;
  }
  return nextId();
}

export function createPolicyService({ validator = { validate: validatePolicyBundle }, storage = new Map() } = {}) {
  const orgIndex = new Map();

  function getOrgPolicies(orgId) {
    if (!orgIndex.has(orgId)) {
      orgIndex.set(orgId, new Set());
    }
    return orgIndex.get(orgId);
  }

  async function createPolicy(orgId, bundle, actor = 'system') {
    const id = resolvePolicyId(bundle);
    const candidate = { ...bundle, id };
    const { valid, errors, signature } = validator.validate(candidate);
    if (!valid) {
      throw new PolicyServiceError(`Policy bundle failed validation: ${errors.join(', ')}`);
    }

    const record = {
      orgId,
      ...candidate,
      id,
      signature: signature ?? candidate.signature ?? { status: 'unsigned' },
      createdAt: new Date(),
      updatedAt: new Date(),
      auditLog: [
        {
          timestamp: new Date(),
          actor,
          action: 'create',
        },
      ],
    };
    storage.set(id, record);
    getOrgPolicies(orgId).add(id);
    return { ...record };
  }

  async function listPolicies(orgId) {
    const ids = getOrgPolicies(orgId);
    return Array.from(ids).map((id) => ({ ...storage.get(id) }));
  }

  async function updatePolicy(id, updates, actor = 'system') {
    if (!storage.has(id)) {
      throw new PolicyServiceError(`Policy ${id} not found`);
    }
    const current = storage.get(id);
    const bundle = { ...current, ...updates };
    const { valid, errors, signature } = validator.validate(bundle);
    if (!valid) {
      throw new PolicyServiceError(`Policy bundle failed validation: ${errors.join(', ')}`);
    }
    const updated = {
      ...current,
      ...updates,
      signature: signature ?? current.signature,
      updatedAt: new Date(),
      auditLog: [
        ...current.auditLog,
        {
          timestamp: new Date(),
          actor,
          action: 'update',
          changes: Object.keys(updates),
        },
      ],
    };
    storage.set(id, updated);
    return { ...updated };
  }

  return {
    createPolicy,
    listPolicies,
    updatePolicy,
    storage,
  };
}
