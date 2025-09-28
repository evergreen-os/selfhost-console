'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type Role = 'Owner' | 'Admin' | 'Auditor';

type SessionStatus = 'loading' | 'authenticated' | 'signedOut' | 'error';

interface SessionPayload {
  email?: string;
  role: Role;
  tenantId?: string;
  expiresAt: string;
  capabilities?: string[];
}

interface SessionStoreValue {
  session: SessionPayload | null;
  status: SessionStatus;
  error: string | null;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  canAccess: (role: Role) => boolean;
}

const SessionContext = createContext<SessionStoreValue | undefined>(undefined);

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    },
    credentials: 'include'
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body?.error || response.statusText || 'Request failed';
    throw new Error(message);
  }

  return (await response.json()) as T;
}

interface SessionResponse {
  session: SessionPayload | null;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    try {
      setStatus('loading');
      const data = await jsonRequest<SessionResponse>('/api/auth/session', { method: 'GET' });
      setSession(data.session);
      setStatus(data.session ? 'authenticated' : 'signedOut');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load session');
      setStatus('signedOut');
      setSession(null);
    }
  }, []);

  useEffect(() => {
    loadSession().catch(() => {
      // handled in loadSession
    });
  }, [loadSession]);

  const signIn = useCallback<SessionStoreValue['signIn']>(async (credentials) => {
    try {
      const data = await jsonRequest<SessionResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
      setSession(data.session);
      setStatus('authenticated');
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign in';
      setError(message);
      setStatus('error');
      throw err;
    }
  }, []);

  const refresh = useCallback(async () => {
    const data = await jsonRequest<SessionResponse>('/api/auth/refresh', { method: 'POST' });
    setSession((current) => (data.session ? { ...current, ...data.session } : null));
    setStatus(data.session ? 'authenticated' : 'signedOut');
    return data;
  }, []);

 const signOut = useCallback(async () => {
    await jsonRequest<SessionResponse>('/api/auth/logout', { method: 'POST' });
    setSession(null);
    setStatus('signedOut');
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<SessionStoreValue>(
    () => ({
      session,
      status,
      error,
      signIn,
      refresh,
      signOut,
      clearError,
      canAccess: (role: Role) => {
        if (!session) return false;
        const hierarchy: Record<Role, number> = { Owner: 3, Admin: 2, Auditor: 1 };
        return hierarchy[session.role] >= hierarchy[role];
      }
    }),
    [session, status, error, signIn, refresh, signOut, clearError]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionStore() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionStore must be used within a SessionProvider');
  }
  return context;
}
