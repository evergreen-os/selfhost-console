import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionManager, SessionError } from '../sessionManager.js';

const allowedRoles = ['Owner', 'Admin', 'Auditor'];

function createAuthClient({ expectedCredentials, response, refreshResponse }) {
  return {
    async login(credentials) {
      if (expectedCredentials && expectedCredentials.email !== credentials.email) {
        throw new SessionError('invalid credentials');
      }
      return response;
    },
    async refresh(refreshToken) {
      if (refreshResponse instanceof Error) {
        throw refreshResponse;
      }
      if (refreshToken !== 'valid-refresh') {
        throw new SessionError('invalid refresh');
      }
      return refreshResponse;
    },
  };
}

describe('sessionManager', () => {
  test('issues HttpOnly cookie instructions on successful login', async () => {
    const loginResponse = {
      token: 'jwt-token',
      refreshToken: 'refresh-token',
      role: 'Admin',
      expiresAt: new Date('2024-01-01T00:30:00Z'),
    };

    const manager = createSessionManager({
      authClient: createAuthClient({ response: loginResponse }),
      clock: () => new Date('2024-01-01T00:00:00Z'),
      allowedRoles,
    });

    const session = await manager.login({ email: 'admin@example.com', password: 'pw' });

    assert.equal(session.token, 'jwt-token');
    assert.equal(session.refreshToken, 'refresh-token');
    assert.deepEqual(session.cookie, {
      name: 'session',
      value: 'jwt-token',
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
      path: '/',
      expires: new Date('2024-01-01T00:30:00Z'),
    });
    assert.equal(session.role, 'Admin');
  });

  test('rejects logins from unsupported roles', async () => {
    const manager = createSessionManager({
      authClient: createAuthClient({
        response: {
          token: 'jwt',
          refreshToken: 'refresh',
          role: 'Student',
          expiresAt: new Date('2024-01-01T00:30:00Z'),
        },
      }),
      clock: () => new Date('2024-01-01T00:00:00Z'),
      allowedRoles,
    });

    await assert.rejects(() => manager.login({ email: 'x', password: 'y' }), {
      name: 'SessionError',
      message: 'Role Student is not permitted',
    });
  });

  test('refreshSession updates expiry and cookie attributes', async () => {
    const manager = createSessionManager({
      authClient: createAuthClient({
        response: {
          token: 'jwt',
          refreshToken: 'valid-refresh',
          role: 'Owner',
          expiresAt: new Date('2024-01-01T00:30:00Z'),
        },
        refreshResponse: {
          token: 'new-jwt',
          refreshToken: 'valid-refresh',
          role: 'Owner',
          expiresAt: new Date('2024-01-01T01:00:00Z'),
        },
      }),
      clock: () => new Date('2024-01-01T00:00:00Z'),
      allowedRoles,
    });

    await manager.login({ email: 'owner@example.com', password: 'pw' });
    const refreshed = await manager.refreshSession('valid-refresh');

    assert.equal(refreshed.token, 'new-jwt');
    assert.equal(refreshed.cookie.expires.toISOString(), '2024-01-01T01:00:00.000Z');
  });

  test('requireRole enforces hierarchical permissions', async () => {
    const manager = createSessionManager({
      authClient: createAuthClient({
        response: {
          token: 'jwt',
          refreshToken: 'refresh',
          role: 'Admin',
          expiresAt: new Date('2024-01-01T00:30:00Z'),
        },
      }),
      clock: () => new Date('2024-01-01T00:00:00Z'),
      allowedRoles,
    });

    const session = await manager.login({ email: 'admin@example.com', password: 'pw' });

    manager.requireRole(session, 'Auditor');
    manager.requireRole(session, 'Admin');
    assert.throws(() => manager.requireRole(session, 'Owner'), {
      name: 'SessionError',
      message: 'Role Admin cannot perform Owner action',
    });
  });

  test('refreshSession bubbles backend failures', async () => {
    const refreshError = new SessionError('backend unavailable');
    const manager = createSessionManager({
      authClient: createAuthClient({
        response: {
          token: 'jwt',
          refreshToken: 'valid-refresh',
          role: 'Admin',
          expiresAt: new Date('2024-01-01T00:30:00Z'),
        },
        refreshResponse: refreshError,
      }),
      clock: () => new Date('2024-01-01T00:00:00Z'),
      allowedRoles,
    });

    await manager.login({ email: 'admin@example.com', password: 'pw' });
    await assert.rejects(() => manager.refreshSession('valid-refresh'), refreshError);
  });
});
