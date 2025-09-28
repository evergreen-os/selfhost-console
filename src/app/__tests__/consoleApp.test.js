import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createConsoleApp } from '../consoleApp.js';
import { createSessionManager } from '../../features/auth/sessionManager.js';
import { createSessionStore } from '../../features/auth/sessionStore.js';
import { createPolicyService } from '../../features/policies/policyService.js';
import { createTenantManager } from '../../features/users/tenantManager.js';

function createMockAuthClient() {
  const users = new Map([
    [
      'owner@example.com',
      {
        password: 'pw',
        role: 'Owner',
        refreshToken: 'refresh-owner'
      }
    ],
    [
      'admin@example.com',
      {
        password: 'pw',
        role: 'Admin',
        refreshToken: 'refresh-admin'
      }
    ],
    [
      'auditor@example.com',
      {
        password: 'pw',
        role: 'Auditor',
        refreshToken: 'refresh-auditor'
      }
    ]
  ]);

  return {
    async login({ email, password }) {
      const user = users.get(email);
      if (!user || user.password !== password) {
        throw new Error('invalid credentials');
      }
      return {
        token: `token-${email}`,
        refreshToken: user.refreshToken,
        role: user.role,
        expiresAt: new Date('2024-06-01T01:00:00Z')
      };
    },
    async refresh(refreshToken) {
      for (const [email, user] of users.entries()) {
        if (user.refreshToken === refreshToken) {
          return {
            token: `token-${email}`,
            refreshToken,
            role: user.role,
            expiresAt: new Date('2024-06-01T01:30:00Z')
          };
        }
      }
      throw new Error('invalid refresh');
    }
  };
}

function buildPolicyBundle({ id = 'policy-baseline', version = '1.0.0', orgId = 'org-a' } = {}) {
  return {
    id,
    name: 'Baseline',
    version,
    orgId,
    configuration: {
      apps: [
        { id: 'app-slack', target: 'all' },
        { id: 'app-zoom', target: 'group', groupIds: ['teachers'] }
      ],
      updateChannel: 'stable',
      browser: {
        homepageUrl: 'https://evergreen.example.com',
        allowPopups: false
      },
      network: {
        wifiNetworks: [{ ssid: 'EvergreenNet', security: 'wpa2' }]
      },
      security: {
        diskEncryption: true,
        lockAfterMinutes: 10
      }
    }
  };
}

const seedDevices = [
  {
    id: 'device-1',
    hostname: 'alpha-01',
    model: 'EvergreenBook',
    osVersion: '1.2.3',
    policyVersion: '2024.05',
    health: { battery: 0.82, diskFree: 0.7, temperatureC: 40 },
    orgId: 'org-a',
    lastSeen: '2024-05-30T12:00:00Z',
    status: 'online',
    installedApps: [
      { id: 'app-slack', name: 'Slack', version: '5.0.0' }
    ],
    updateStatus: { channel: 'stable', state: 'up_to_date' },
    lastSync: '2024-05-30T11:00:00Z'
  },
  {
    id: 'device-2',
    hostname: 'beta-02',
    model: 'EvergreenSlate',
    osVersion: '1.2.3',
    policyVersion: '2024.05',
    health: { battery: 0.45, diskFree: 0.4, temperatureC: 55 },
    orgId: 'org-b',
    lastSeen: '2024-05-29T09:30:00Z',
    status: 'offline',
    installedApps: [],
    updateStatus: { channel: 'beta', state: 'update_available' },
    lastSync: '2024-05-29T09:00:00Z'
  }
];

const seedEvents = [
  {
    id: 'evt-1',
    orgId: 'org-a',
    deviceId: 'device-1',
    type: 'install',
    severity: 'info',
    actor: 'device-1',
    summary: 'Installed Slack',
    message: 'Installed Slack',
    timestamp: '2024-05-30T10:00:00Z'
  },
  {
    id: 'evt-2',
    orgId: 'org-a',
    deviceId: 'device-1',
    type: 'policy_publish',
    severity: 'info',
    actor: 'admin@example.com',
    summary: 'Policy applied',
    message: 'Policy applied to device',
    timestamp: '2024-05-30T09:00:00Z'
  }
];

describe('createConsoleApp', () => {
  let sessionStore;
  let consoleApp;

  beforeEach(() => {
    const authClient = createMockAuthClient();
    const sessionManager = createSessionManager({ authClient, clock: () => new Date('2024-06-01T00:00:00Z') });
    sessionStore = createSessionStore(sessionManager, { autoRefresh: false });
    consoleApp = createConsoleApp({
      sessionStore,
      policyService: createPolicyService(),
      tenantManager: createTenantManager(),
      devices: seedDevices,
      events: seedEvents,
      now: () => new Date('2024-06-01T00:00:00Z')
    });
  });

  it('supports owner device and policy workflow', async () => {
    await consoleApp.signIn({ email: 'owner@example.com', password: 'pw' });

    const devices = consoleApp.listDevices({ orgIds: ['org-a'], statuses: ['online'] });
    assert.equal(devices.length, 1);
    assert.equal(devices[0].hostname, 'alpha-01');

    const detail = consoleApp.getDeviceDetail('device-1');
    assert.equal(detail.summary.hostname, 'alpha-01');
    assert.equal(detail.timeline.count, 2);

    const created = await consoleApp.publishPolicy('org-a', buildPolicyBundle());
    assert.equal(created.orgId, 'org-a');

    const updated = await consoleApp.updatePolicy(created.id, { version: '1.0.1' });
    assert.equal(updated.version, '1.0.1');

    const policyEvents = consoleApp.listEvents({ actionTypes: ['policy_publish'] });
    assert.ok(policyEvents.some((event) => event.message.includes('Baseline')));

    const exportCsv = consoleApp.exportEvents({ format: 'csv', filter: { actionTypes: ['policy_publish'] } });
    assert.ok(exportCsv.includes('policy_publish'));
  });

  it('manages tenants and user roles with hierarchy view', async () => {
    await consoleApp.signIn({ email: 'owner@example.com', password: 'pw' });

    const tenant = consoleApp.createTenant({
      name: 'Evergreen High',
      resellerId: 'reseller-1',
      owner: { id: 'user-1', email: 'principal@evergreen.example.com' }
    });

    const users = consoleApp.assignUserRole(tenant.id, { id: 'teacher-1', email: 'teacher@evergreen.example.com' }, 'Admin');
    assert.equal(users.find((user) => user.id === 'teacher-1').role, 'Admin');

    const hierarchy = consoleApp.getResellerHierarchy();
    assert.deepEqual(hierarchy, [
      {
        resellerId: 'reseller-1',
        tenants: [
          { id: tenant.id, name: 'Evergreen High' }
        ]
      }
    ]);

    const tenantEvents = consoleApp.listEvents({ actionTypes: ['tenant_created'] });
    assert.ok(tenantEvents.length >= 1);
  });

  it('enforces RBAC restrictions for auditors', async () => {
    await consoleApp.signIn({ email: 'auditor@example.com', password: 'pw' });

    assert.doesNotThrow(() => consoleApp.listDevices({}));
    await assert.rejects(() => consoleApp.publishPolicy('org-a', buildPolicyBundle({ id: 'policy-auditor' })), /does not allow editPolicies/);
    assert.throws(() => consoleApp.createTenant({
      name: 'Blocked Tenant',
      resellerId: 'reseller-1',
      owner: { id: 'owner-2', email: 'owner2@example.com' }
    }), /does not allow manageTenants/);
  });
});
