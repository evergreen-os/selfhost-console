import { filterDevices } from '../features/devices/filterDevices.js';
import { buildDeviceDetailView } from '../features/devices/detailView.js';
import { filterEvents as applyEventFilters } from '../features/events/filterEvents.js';
import { exportEvents as serializeEvents } from '../features/events/exporter.js';
import {
  assertRoleAllows,
  canViewDevices,
  canManageUsers,
  canManageTenants,
  canEditPolicies
} from '../features/users/rbac.js';

export class ConsoleAppError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConsoleAppError';
  }
}

function cloneDevice(device) {
  if (!device) return null;
  return {
    ...device,
    health: device.health ? { ...device.health } : undefined,
    installedApps: Array.isArray(device.installedApps)
      ? device.installedApps.map((app) => ({ ...app }))
      : [],
    updateStatus: device.updateStatus ? { ...device.updateStatus } : undefined,
  };
}

function clonePolicy(policy) {
  if (!policy) return null;
  return {
    ...policy,
    createdAt: policy.createdAt ? new Date(policy.createdAt) : undefined,
    updatedAt: policy.updatedAt ? new Date(policy.updatedAt) : undefined,
    auditLog: Array.isArray(policy.auditLog)
      ? policy.auditLog.map((entry) => ({ ...entry, timestamp: new Date(entry.timestamp) }))
      : [],
  };
}

function cloneEvent(event) {
  return {
    ...event,
    timestamp: new Date(event.timestamp).toISOString(),
  };
}

function cloneTenantRecord(tenant) {
  if (!tenant) return null;
  return {
    ...tenant,
    createdAt: tenant.createdAt ? new Date(tenant.createdAt) : undefined,
    owner: tenant.owner ? { ...tenant.owner } : undefined,
  };
}

export function createConsoleApp({
  sessionStore,
  policyService,
  tenantManager,
  devices = [],
  events = [],
  now = () => new Date(),
} = {}) {
  if (!sessionStore) {
    throw new ConsoleAppError('sessionStore is required');
  }
  if (!policyService) {
    throw new ConsoleAppError('policyService is required');
  }
  if (!tenantManager) {
    throw new ConsoleAppError('tenantManager is required');
  }

  const deviceStore = new Map();
  devices.forEach((device) => {
    if (!device?.id) {
      return;
    }
    deviceStore.set(device.id, cloneDevice(device));
  });

  let eventCounter = 0;
  const eventStore = [];

  function normalizeEvent(event) {
    eventCounter += 1;
    const timestamp = event.timestamp ? new Date(event.timestamp).toISOString() : now().toISOString();
    const type = event.type ?? event.actionType ?? 'info';
    return {
      id: event.id ?? `evt-${eventCounter}`,
      orgId: event.orgId ?? null,
      deviceId: event.deviceId ?? null,
      type,
      actionType: event.actionType ?? type,
      severity: event.severity ?? 'info',
      actor: event.actor ?? 'system',
      message: event.message ?? event.summary ?? '',
      summary: event.summary ?? event.message ?? '',
      timestamp,
    };
  }

  events.forEach((event) => {
    eventStore.push(normalizeEvent(event));
  });

  const resellerTenants = new Map();

  function ensureDevice(deviceId) {
    const device = deviceStore.get(deviceId);
    if (!device) {
      throw new ConsoleAppError(`Device ${deviceId} not found`);
    }
    return device;
  }

  function ensureSignedIn() {
    const state = sessionStore.getState();
    if (state.status !== 'authenticated' || !state.session) {
      throw new ConsoleAppError('Authentication required');
    }
    return state.session;
  }

  function ensureViewAccess() {
    const session = ensureSignedIn();
    if (!canViewDevices(session.role)) {
      throw new ConsoleAppError(`${session.role} role cannot view devices`);
    }
    return session;
  }

  function ensureCapability(capability) {
    const session = ensureSignedIn();
    assertRoleAllows(session.role, capability);
    return session;
  }

  function recordEvent(event) {
    const normalized = normalizeEvent(event);
    eventStore.push(normalized);
    return normalized;
  }

  function currentActor(session) {
    return session.role;
  }

  function deviceEvents(deviceId) {
    return eventStore.filter((event) => event.deviceId === deviceId);
  }

  function ensureResellerBucket(resellerId) {
    if (!resellerTenants.has(resellerId)) {
      resellerTenants.set(resellerId, new Set());
    }
    return resellerTenants.get(resellerId);
  }

  return {
    async signIn(credentials) {
      return sessionStore.signIn(credentials);
    },
    signOut() {
      sessionStore.signOut();
    },
    getSessionState() {
      return sessionStore.getState();
    },
    listDevices(filters = {}) {
      ensureViewAccess();
      const list = Array.from(deviceStore.values()).map(cloneDevice);
      return filterDevices(list, filters).map(cloneDevice);
    },
    getDeviceDetail(deviceId, filters = {}) {
      ensureViewAccess();
      const device = cloneDevice(ensureDevice(deviceId));
      const timelineEvents = deviceEvents(deviceId).map(({ id, type, severity, timestamp, summary }) => ({
        id,
        type,
        severity,
        timestamp,
        summary,
      }));
      return buildDeviceDetailView(device, timelineEvents, filters);
    },
    triggerDeviceSync(deviceId) {
      const session = ensureViewAccess();
      const device = ensureDevice(deviceId);
      device.lastSync = now().toISOString();
      recordEvent({
        actionType: 'device_sync',
        type: 'device_sync',
        deviceId,
        orgId: device.orgId,
        severity: 'info',
        actor: currentActor(session),
        summary: `Sync triggered for ${device.hostname}`,
        message: `Sync triggered for ${device.hostname}`,
      });
      return cloneDevice(device);
    },
    decommissionDevice(deviceId) {
      const session = ensureCapability('editPolicies');
      const device = ensureDevice(deviceId);
      device.status = 'decommissioned';
      recordEvent({
        actionType: 'device_decommissioned',
        type: 'device_decommissioned',
        deviceId,
        orgId: device.orgId,
        severity: 'warning',
        actor: currentActor(session),
        summary: `Device ${device.hostname} decommissioned`,
        message: `Device ${device.hostname} decommissioned`,
      });
      return cloneDevice(device);
    },
    async publishPolicy(orgId, bundle) {
      const session = ensureCapability('editPolicies');
      if (bundle.orgId !== orgId) {
        throw new ConsoleAppError(`Policy orgId ${bundle.orgId} does not match target org ${orgId}`);
      }
      const policy = await policyService.createPolicy(orgId, bundle, currentActor(session));
      recordEvent({
        actionType: 'policy_publish',
        type: 'policy_publish',
        orgId,
        severity: 'info',
        actor: currentActor(session),
        summary: `Published policy ${policy.name} v${policy.version}`,
        message: `Published policy ${policy.name} v${policy.version}`,
      });
      return clonePolicy(policy);
    },
    async updatePolicy(policyId, updates) {
      const session = ensureCapability('editPolicies');
      const policy = await policyService.updatePolicy(policyId, updates, currentActor(session));
      recordEvent({
        actionType: 'policy_update',
        type: 'policy_update',
        orgId: policy.orgId,
        severity: 'info',
        actor: currentActor(session),
        summary: `Updated policy ${policy.name}`,
        message: `Updated policy ${policy.name}`,
      });
      return clonePolicy(policy);
    },
    async listPolicies(orgId) {
      ensureViewAccess();
      const policies = await policyService.listPolicies(orgId);
      return policies.map(clonePolicy);
    },
    listEvents(filter = {}) {
      ensureViewAccess();
      const filtered = applyEventFilters(eventStore, filter);
      return filtered
        .map(cloneEvent)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    exportEvents(options = {}) {
      ensureViewAccess();
      return serializeEvents(eventStore.map(cloneEvent), options);
    },
    createTenant(tenantInput) {
      const session = ensureCapability('manageTenants');
      const tenant = cloneTenantRecord(tenantManager.createTenant(tenantInput));
      const resellerId = tenant.resellerId ?? 'selfhost';
      ensureResellerBucket(resellerId).add(tenant.id);
      recordEvent({
        actionType: 'tenant_created',
        type: 'tenant_created',
        orgId: tenant.id,
        severity: 'info',
        actor: currentActor(session),
        summary: `Tenant ${tenant.name} created`,
        message: `Tenant ${tenant.name} created`,
      });
      return tenant;
    },
    assignUserRole(tenantId, user, role) {
      const session = ensureCapability('manageUsers');
      const users = tenantManager.assignUser(tenantId, user, role).map((record) => ({ ...record }));
      recordEvent({
        actionType: 'user_role_change',
        type: 'user_role_change',
        orgId: tenantId,
        severity: 'info',
        actor: currentActor(session),
        summary: `Assigned ${role} to ${user.email}`,
        message: `Assigned ${role} to ${user.email}`,
      });
      return users;
    },
    listTenantUsers(tenantId) {
      ensureCapability('manageUsers');
      return tenantManager.listUsers(tenantId).map((record) => ({ ...record }));
    },
    promoteTenantOwner(tenantId, userId) {
      const session = ensureCapability('manageTenants');
      const tenant = cloneTenantRecord(tenantManager.promoteToOwner(tenantId, userId));
      ensureResellerBucket(tenant.resellerId ?? 'selfhost').add(tenant.id);
      recordEvent({
        actionType: 'tenant_owner_promoted',
        type: 'tenant_owner_promoted',
        orgId: tenantId,
        severity: 'info',
        actor: currentActor(session),
        summary: `Promoted ${userId} to owner`,
        message: `Promoted ${userId} to owner`,
      });
      return tenant;
    },
    getResellerHierarchy() {
      ensureCapability('manageTenants');
      return Array.from(resellerTenants.entries())
        .map(([resellerId, tenantIds]) => ({
          resellerId,
          tenants: Array.from(tenantIds).map((id) => {
            const tenant = tenantManager.getTenant(id);
            return { id: tenant.id, name: tenant.name };
          }),
        }))
        .sort((a, b) => a.resellerId.localeCompare(b.resellerId));
    },
    getState() {
      ensureSignedIn();
      return {
        devices: Array.from(deviceStore.values()).map(cloneDevice),
        events: eventStore.map(cloneEvent),
      };
    },
  };
}
