import { buildRoleCapabilities } from './rbac.js';

let tenantCounter = 0;

export class TenantManagerError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TenantManagerError';
  }
}

function nextTenantId() {
  tenantCounter += 1;
  return `tenant-${tenantCounter}`;
}

export function createTenantManager() {
  const tenants = new Map();
  const tenantNamesByReseller = new Map();

  function ensureTenant(tenantId) {
    const tenant = tenants.get(tenantId);
    if (!tenant) {
      throw new TenantManagerError(`Tenant ${tenantId} not found`);
    }
    return tenant;
  }

  function createTenant({ name, resellerId = 'selfhost', owner }) {
    if (!name) {
      throw new TenantManagerError('Tenant name is required');
    }
    if (!owner) {
      throw new TenantManagerError('Owner user is required');
    }
    const key = `${resellerId ?? 'selfhost'}::${name.toLowerCase()}`;
    if (tenantNamesByReseller.has(key)) {
      throw new TenantManagerError(`Tenant ${name} already exists for reseller ${resellerId}`);
    }
    const id = nextTenantId();
    const tenantRecord = {
      id,
      name,
      resellerId,
      owner,
      users: new Map([[owner.id, { ...owner, role: 'Owner' }]]),
      createdAt: new Date(),
    };
    tenants.set(id, tenantRecord);
    tenantNamesByReseller.set(key, id);
    return {
      id,
      name,
      resellerId,
      owner,
      createdAt: tenantRecord.createdAt,
    };
  }

  function assignUser(tenantId, user, role) {
    const tenant = ensureTenant(tenantId);
    const capabilities = buildRoleCapabilities();
    if (!capabilities[role]) {
      throw new TenantManagerError(`Unsupported role ${role}`);
    }
    tenant.users.set(user.id, { ...user, role });
    return listUsers(tenantId);
  }

  function listUsers(tenantId) {
    const tenant = ensureTenant(tenantId);
    return Array.from(tenant.users.values()).map((user) => ({ ...user }));
  }

  function getTenant(tenantId) {
    const tenant = ensureTenant(tenantId);
    return {
      id: tenant.id,
      name: tenant.name,
      resellerId: tenant.resellerId,
      owner: tenant.owner,
    };
  }

  function promoteToOwner(tenantId, userId) {
    const tenant = ensureTenant(tenantId);
    const user = tenant.users.get(userId);
    if (!user) {
      throw new TenantManagerError(`User ${userId} is not assigned to tenant ${tenantId}`);
    }
    tenant.users.set(tenant.owner.id, { ...tenant.owner, role: 'Admin' });
    tenant.owner = { id: user.id, email: user.email };
    tenant.users.set(user.id, { ...user, role: 'Owner' });
    return getTenant(tenantId);
  }

  return {
    createTenant,
    assignUser,
    listUsers,
    getTenant,
    promoteToOwner,
  };
}

export function buildTenantHierarchy(tenants = []) {
  const lookup = new Map();
  const roots = [];
  tenants.forEach((tenant) => {
    lookup.set(tenant.id, { ...tenant, children: [] });
  });
  lookup.forEach((node) => {
    if (node.parentId && lookup.has(node.parentId)) {
      lookup.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}
