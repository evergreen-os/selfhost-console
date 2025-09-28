import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getRoleCapabilities, assertRoleAllows } from '../rbac.js';

describe('getRoleCapabilities', () => {
  it('returns full capabilities for owner', () => {
    const capabilities = getRoleCapabilities('Owner');

    assert.equal(capabilities.manageTenants, true);
    assert.equal(capabilities.manageUsers, true);
    assert.equal(capabilities.editPolicies, true);
    assert.equal(capabilities.viewDevices, true);
  });

  it('restricts auditors to read-only access', () => {
    const capabilities = getRoleCapabilities('Auditor');

    assert.equal(capabilities.manageTenants, false);
    assert.equal(capabilities.manageUsers, false);
    assert.equal(capabilities.editPolicies, false);
    assert.equal(capabilities.viewDevices, true);
  });
});

describe('assertRoleAllows', () => {
  it('does not throw when capability is permitted', () => {
    assert.doesNotThrow(() => assertRoleAllows('Admin', 'editPolicies'));
  });

  it('throws a descriptive error when capability is not allowed', () => {
    assert.throws(
      () => assertRoleAllows('Auditor', 'manageUsers'),
      /Auditor role does not allow manageUsers/
    );
  });
});
