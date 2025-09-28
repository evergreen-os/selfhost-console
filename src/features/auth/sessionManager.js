const DEFAULT_ALLOWED_ROLES = ['Owner', 'Admin', 'Auditor'];
const ROLE_HIERARCHY = {
  Owner: 3,
  Admin: 2,
  Auditor: 1,
};

export class SessionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SessionError';
  }
}

function validateRole(role, allowedRoles) {
  if (!allowedRoles.includes(role)) {
    throw new SessionError(`Role ${role} is not permitted`);
  }
}

function buildCookie(token, expiresAt) {
  return {
    name: 'session',
    value: token,
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    path: '/',
    expires: expiresAt,
  };
}

export function createSessionManager({ authClient, clock = () => new Date(), allowedRoles = DEFAULT_ALLOWED_ROLES } = {}) {
  if (!authClient || typeof authClient.login !== 'function' || typeof authClient.refresh !== 'function') {
    throw new SessionError('authClient with login and refresh is required');
  }

  let activeSession = null;

  async function login(credentials) {
    const response = await authClient.login(credentials);
    validateRole(response.role, allowedRoles);

    activeSession = {
      token: response.token,
      refreshToken: response.refreshToken,
      role: response.role,
      expiresAt: new Date(response.expiresAt),
    };

    return {
      ...activeSession,
      cookie: buildCookie(activeSession.token, activeSession.expiresAt),
      issuedAt: clock(),
    };
  }

  async function refreshSession(refreshToken) {
    if (!activeSession) {
      throw new SessionError('No active session');
    }
    if (refreshToken !== activeSession.refreshToken) {
      throw new SessionError('Invalid refresh token');
    }
    const refreshed = await authClient.refresh(refreshToken);
    validateRole(refreshed.role, allowedRoles);
    activeSession = {
      token: refreshed.token,
      refreshToken: refreshed.refreshToken,
      role: refreshed.role,
      expiresAt: new Date(refreshed.expiresAt),
    };
    return {
      ...activeSession,
      cookie: buildCookie(activeSession.token, activeSession.expiresAt),
      issuedAt: clock(),
    };
  }

  function requireRole(session, role) {
    validateRole(role, allowedRoles);
    const grantedLevel = ROLE_HIERARCHY[session.role];
    const requiredLevel = ROLE_HIERARCHY[role];
    if (grantedLevel === undefined || requiredLevel === undefined) {
      throw new SessionError('Unknown role');
    }
    if (grantedLevel < requiredLevel) {
      throw new SessionError(`Role ${session.role} cannot perform ${role} action`);
    }
    return true;
  }

  return {
    login,
    refreshSession,
    requireRole,
    getActiveSession: () => activeSession && { ...activeSession },
  };
}
