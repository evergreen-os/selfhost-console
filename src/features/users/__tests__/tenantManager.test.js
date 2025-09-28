import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createTenantManager, TenantManagerError } from '../tenantManager.js';

describe('tenantManager', () => {
  test('creates tenants and assigns owners', () => {
    const manager = createTenantManager();
    const tenant = manager.createTenant({
      name: 'Evergreen High',
      resellerId: 'reseller-1',
      owner: { id: 'user-1', email: 'owner@example.com' },
    });

    assert.equal(tenant.name, 'Evergreen High');
    assert.equal(manager.getTenant(tenant.id).owner.email, 'owner@example.com');
  });

  test('assigns users to roles with RBAC guardrails', () => {
    const manager = createTenantManager();
    const tenant = manager.createTenant({
      name: 'Evergreen High',
      owner: { id: 'owner', email: 'owner@example.com' },
    });

    manager.assignUser(tenant.id, { id: 'admin', email: 'admin@example.com' }, 'Admin');
    manager.assignUser(tenant.id, { id: 'auditor', email: 'auditor@example.com' }, 'Auditor');

    const roster = manager.listUsers(tenant.id);
    assert.equal(roster.length, 3); // owner + admin + auditor
  });

  test('prevents duplicate tenant names per reseller', () => {
    const manager = createTenantManager();
    manager.createTenant({ name: 'Evergreen High', resellerId: 'reseller-1', owner: { id: 'u1', email: 'owner@example.com' } });

    assert.throws(
      () =>
        manager.createTenant({ name: 'Evergreen High', resellerId: 'reseller-1', owner: { id: 'u2', email: 'other@example.com' } }),
      TenantManagerError
    );
  });

  test('promotes admin to owner and demotes previous owner to admin', () => {
    const manager = createTenantManager();
    const tenant = manager.createTenant({ name: 'Evergreen High', owner: { id: 'owner', email: 'owner@example.com' } });
    manager.assignUser(tenant.id, { id: 'admin', email: 'admin@example.com' }, 'Admin');

    const updated = manager.promoteToOwner(tenant.id, 'admin');

    assert.equal(updated.owner.id, 'admin');
    const users = manager.listUsers(tenant.id);
    assert.ok(users.some((user) => user.id === 'owner' && user.role === 'Admin'));
  });
});
