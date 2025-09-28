import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createPolicyService, PolicyServiceError } from '../policyService.js';

function createValidator({ isValid = true, signature = null }) {
  return {
    validate(bundle) {
      if (!isValid) {
        return { valid: false, errors: ['invalid'] };
      }
      return { valid: true, errors: [], signature };
    },
  };
}

describe('policyService', () => {
  test('creates and lists policies per organization', async () => {
    const validator = createValidator({ signature: { status: 'signed', signer: 'owner@example.com' } });
    const storage = new Map();

    const service = createPolicyService({ validator, storage });
    const policy = await service.createPolicy('org-1', {
      name: 'Kiosk policy',
      version: 1,
      apps: [{ id: 'zoom' }],
      update: { channel: 'stable' },
      browser: {},
      network: {},
      security: {},
    });

    assert.equal(policy.signature.status, 'signed');

    const listed = await service.listPolicies('org-1');
    assert.equal(listed.length, 1);
    assert.equal(listed[0].name, 'Kiosk policy');
  });

  test('rejects invalid policies with detailed errors', async () => {
    const service = createPolicyService({ validator: createValidator({ isValid: false }) });

    await assert.rejects(
      () =>
        service.createPolicy('org-1', {
          name: 'Invalid policy',
        }),
      {
        name: 'PolicyServiceError',
        message: /Policy bundle failed validation/,
      }
    );
  });

  test('updates a policy and retains audit trail', async () => {
    const validator = createValidator({ signature: { status: 'signed', signer: 'owner@example.com' } });
    const service = createPolicyService({ validator });

    const created = await service.createPolicy('org-1', {
      name: 'Apps policy',
      version: 1,
      apps: [{ id: 'slack' }],
      update: { channel: 'stable' },
      browser: {},
      network: {},
      security: {},
    });

    const updated = await service.updatePolicy(created.id, {
      version: 2,
      apps: [{ id: 'slack' }, { id: 'vscode' }],
    }, 'admin@example.com');

    assert.equal(updated.version, 2);
    assert.equal(updated.apps.length, 2);
    assert.equal(updated.auditLog.length, 2);
    const lastEntry = updated.auditLog.at(-1);
    assert.equal(lastEntry.actor, 'admin@example.com');
    assert.deepEqual(lastEntry.changes, ['version', 'apps']);
  });

  test('throws when policy not found on update', async () => {
    const service = createPolicyService({ validator: createValidator({}) });

    await assert.rejects(() => service.updatePolicy('missing', { version: 2 }), {
      name: 'PolicyServiceError',
      message: 'Policy missing not found',
    });
  });

  test('allows explicit policy identifiers for create and update', async () => {
    const validator = createValidator({});
    const service = createPolicyService({ validator });

    const created = await service.createPolicy('org-9', {
      id: 'custom-policy',
      name: 'Custom bundle',
      version: 1,
      apps: [],
      update: {},
      browser: {},
      network: {},
      security: {},
    });

    assert.equal(created.id, 'custom-policy');

    const updated = await service.updatePolicy('custom-policy', { version: 2 });

    assert.equal(updated.id, 'custom-policy');
    assert.equal(updated.version, 2);
  });
});
