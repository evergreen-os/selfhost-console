import { SessionError } from './sessionManager.js';

function cloneCookie(cookie) {
  if (!cookie) return undefined;
  return {
    ...cookie,
    expires: cookie.expires ? new Date(cookie.expires) : undefined,
  };
}

function cloneSession(session) {
  if (!session) return null;
  return {
    token: session.token,
    refreshToken: session.refreshToken,
    role: session.role,
    expiresAt: new Date(session.expiresAt),
    cookie: cloneCookie(session.cookie),
    issuedAt: session.issuedAt ? new Date(session.issuedAt) : undefined,
  };
}

export function createSessionStore(sessionManager, {
  autoRefresh = false,
  refreshWindowMs = 60_000,
  now = () => new Date(),
  schedule = (callback, delay) => setTimeout(callback, delay),
  cancel = (id) => clearTimeout(id),
} = {}) {
  if (!sessionManager) {
    throw new SessionError('sessionManager is required');
  }

  let state = { status: 'signedOut', session: null, error: null };
  const listeners = new Set();
  let refreshTimer;

  function emit() {
    const snapshot = getState();
    for (const listener of listeners) {
      listener(snapshot);
    }
  }

  function setState(nextState) {
    state = { ...state, ...nextState };
    emit();
  }

  function cancelRefreshTimer() {
    if (refreshTimer) {
      cancel(refreshTimer);
      refreshTimer = undefined;
    }
  }

  async function refreshSession() {
    if (!state.session) {
      throw new SessionError('No active session');
    }

    try {
      const refreshed = await sessionManager.refreshSession(state.session.refreshToken);
      cancelRefreshTimer();
      if (autoRefresh) {
        scheduleRefresh(refreshed);
      }
      setState({ status: 'authenticated', session: cloneSession(refreshed), error: null });
      return refreshed;
    } catch (error) {
      setState({ status: 'error', error });
      throw error;
    }
  }

  function scheduleRefresh(session) {
    const expiresAtMs = new Date(session.expiresAt).getTime();
    const nowMs = now().getTime();
    const delay = Math.max(refreshWindowMs, expiresAtMs - nowMs - refreshWindowMs);
    refreshTimer = schedule(() => {
      refreshSession().catch(() => {
        // errors already update state; swallow to avoid unhandled rejection
      });
    }, delay);
  }

  return {
    async signIn(credentials) {
      const result = await sessionManager.login(credentials);
      cancelRefreshTimer();
      if (autoRefresh) {
        scheduleRefresh(result);
      }
      setState({ status: 'authenticated', session: cloneSession(result), error: null });
      return result;
    },
    async refreshSession() {
      return refreshSession();
    },
    signOut() {
      cancelRefreshTimer();
      state = { status: 'signedOut', session: null, error: null };
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(getState());
      return () => {
        listeners.delete(listener);
      };
    },
    getState,
    canAccess(role) {
      if (!state.session) {
        return false;
      }
      try {
        sessionManager.requireRole({ role: state.session.role }, role);
        return true;
      } catch (error) {
        return false;
      }
    },
  };

  function getState() {
    return {
      status: state.status,
      session: cloneSession(state.session),
      error: state.error,
    };
  }
}
