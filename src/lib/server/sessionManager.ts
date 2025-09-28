import { cookies } from 'next/headers';
import { createSessionManager } from '@/features/auth/sessionManager.js';
import { authClient } from './authClient';

const sessionManager = createSessionManager({ authClient });

export async function login(credentials: { email: string; password: string }) {
  const result = await sessionManager.login(credentials);
  persistCookies(result.token, result.refreshToken, result.expiresAt);
  return result;
}

export async function refresh() {
  const cookieStore = cookies();
  const refreshToken = cookieStore.get('session_refresh')?.value;
  if (!refreshToken) {
    throw new Error('Missing refresh token');
  }
  const result = await sessionManager.refreshSession(refreshToken);
  persistCookies(result.token, result.refreshToken, result.expiresAt);
  return result;
}

export async function logout() {
  clearCookies();
  await authClient.logout();
}

export async function currentSession() {
  const cookieStore = cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) {
    return null;
  }
  const apiSession = await authClient.session().catch(() => null);
  return apiSession;
}

function persistCookies(token: string, refreshToken: string, expiresAt: Date) {
  const cookieStore = cookies();
  const expires = new Date(expiresAt);
  cookieStore.set('session', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    path: '/',
    expires
  });
  cookieStore.set('session_refresh', refreshToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    path: '/',
    expires: new Date(expires.getTime() + 1000 * 60 * 60)
  });
}

function clearCookies() {
  const cookieStore = cookies();
  cookieStore.set('session', '', { httpOnly: true, sameSite: 'strict', secure: true, path: '/', maxAge: 0 });
  cookieStore.set('session_refresh', '', { httpOnly: true, sameSite: 'strict', secure: true, path: '/', maxAge: 0 });
}
