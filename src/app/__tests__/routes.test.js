import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getAccessibleRoutes } from '../routes.js';

describe('getAccessibleRoutes', () => {
  it('returns authenticated routes with capability metadata for admins', () => {
    const routes = getAccessibleRoutes('Admin').filter((route) => route.requiresAuth);

    assert.deepEqual(
      routes.map((route) => ({ path: route.path, disabled: route.disabled, mode: route.mode })),
      [
        { path: '/', disabled: false, mode: 'full' },
        { path: '/devices', disabled: false, mode: 'full' },
        { path: '/devices/:deviceId', disabled: false, mode: 'full' },
        { path: '/policies', disabled: false, mode: 'full' },
        { path: '/policies/:policyId/edit', disabled: false, mode: 'full' },
        { path: '/events', disabled: false, mode: 'full' },
        { path: '/users', disabled: false, mode: 'full' },
      ]
    );
  });

  it('marks restricted routes as read-only for auditors and omits management pages', () => {
    const routes = getAccessibleRoutes('Auditor');

    assert(routes.some((route) => route.path === '/login' && route.requiresAuth === false));

    assert.deepEqual(
      routes
        .filter((route) => route.requiresAuth)
        .map((route) => ({ path: route.path, mode: route.mode })),
      [
        { path: '/', mode: 'full' },
        { path: '/devices', mode: 'full' },
        { path: '/devices/:deviceId', mode: 'full' },
        { path: '/policies', mode: 'read-only' },
        { path: '/events', mode: 'full' },
      ]
    );
  });
});
