import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionManager } from '../sessionManager.js';
import { createSessionStore } from '../sessionStore.js';

function buildAuthClient({ role = 'Admin', expiresInMinutes = 5 } = {}) {
  let refreshCount = 0;
  return {
    login: async () => {
      return {
        token: 'token-1',
        refreshToken: 'refresh-1',
        role,
        expiresAt: new Date(Date.UTC(2024, 0, 1, 0, expiresInMinutes)).toISOString(),
      };
    },
    refresh: async () => {
      refreshCount += 1;
      if (refreshCount > 1) {
        throw new Error('backend unavailable');
      }
      return {
        token: `token-refresh-${refreshCount}`,
        refreshToken: `refresh-${refreshCount}`,
        role,
        expiresAt: new Date(Date.UTC(2024, 0, 1, 0, expiresInMinutes + 5)).toISOString(),
      };
    },
  };
}

describe('createSessionStore', () => {
  let authClient;
  let sessionManager;

  beforeEach(() => {
    authClient = buildAuthClient();
    sessionManager = createSessionManager({
      authClient,
      clock: () => new Date(Date.UTC(2024, 0, 1, 0, 0, 0)),
    });
  });

  it('notifies subscribers on login, refresh, and logout', async () => {
    const scheduledDelays = [];
    let scheduledCallback;
    const store = createSessionStore(sessionManager, {
      autoRefresh: true,
      refreshWindowMs: 60_000,
      now: () => new Date(Date.UTC(2024, 0, 1, 0, 0, 0)),
      schedule: (callback, delay) => {
        scheduledDelays.push(delay);
        scheduledCallback = callback;
        return 'timer-id';
      },
      cancel: () => {
        scheduledCallback = undefined;
      },
    });

    const snapshots = [];
    const unsubscribe = store.subscribe((state) => {
      snapshots.push({ status: state.status, session: state.session && state.session.token });
    });

    assert.deepEqual(snapshots, [{ status: 'signedOut', session: null }]);

    await store.signIn({ username: 'admin', password: 'secret' });

    assert.equal(snapshots.at(-1).status, 'authenticated');
    assert.equal(store.getState().session.role, 'Admin');
    assert.deepEqual(scheduledDelays, [240_000]);

    await store.refreshSession();
    assert.equal(store.getState().session.token, 'token-refresh-1');
    assert.equal(snapshots.at(-1).status, 'authenticated');

    store.signOut();

    assert.equal(store.getState().status, 'signedOut');
    assert.equal(snapshots.at(-1).status, 'signedOut');
    assert.equal(scheduledCallback, undefined);

    unsubscribe();
  });

  it('returns capability-aware access checks and records refresh errors', async () => {
    const store = createSessionStore(sessionManager);

    await store.signIn({ username: 'admin', password: 'secret' });

    assert.equal(store.canAccess('Admin'), true);
    assert.equal(store.canAccess('Owner'), false);

    await store.refreshSession();
    assert.equal(store.getState().status, 'authenticated');

    await assert.rejects(store.refreshSession(), /backend unavailable/);
    assert.equal(store.getState().status, 'error');
    assert.equal(store.canAccess('Admin'), true);
  });

  it('throws when refreshing without an authenticated session', async () => {
    const store = createSessionStore(sessionManager);

    await assert.rejects(store.refreshSession(), /No active session/);
    assert.equal(store.getState().status, 'signedOut');
    assert.equal(store.canAccess('Admin'), false);
  });
});
