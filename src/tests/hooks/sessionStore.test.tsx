import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { SessionProvider, useSessionStore } from '@/hooks/useSessionStore';

const originalFetch = global.fetch;

function mockFetchSuccess(body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(body)
  }) as any;
}

function mockFetchFailure(error: string, statusText = 'Unauthorized') {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    statusText,
    json: () => Promise.resolve({ error })
  }) as any;
}

describe('SessionProvider', () => {
  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = originalFetch;
  });

  it('loads session on mount', async () => {
    mockFetchSuccess({ session: { role: 'Owner', expiresAt: new Date().toISOString() } });

    const { result } = renderHook(() => useSessionStore(), {
      wrapper: ({ children }) => <SessionProvider>{children}</SessionProvider>
    });

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    expect(result.current.session?.role).toBe('Owner');
  });

  it('signs in via API', async () => {
    mockFetchSuccess({ session: null });
    const fetchMock = jest.spyOn(global, 'fetch');

    const { result } = renderHook(() => useSessionStore(), {
      wrapper: ({ children }) => <SessionProvider>{children}</SessionProvider>
    });

    await waitFor(() => expect(result.current.status).not.toBe('loading'));

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ session: { role: 'Admin', expiresAt: new Date().toISOString() } })
    } as any);

    await act(async () => {
      await result.current.signIn({ email: 'admin@example.com', password: 'secret' });
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.any(Object));
    expect(result.current.session?.role).toBe('Admin');
  });

  it('refreshes the session', async () => {
    mockFetchSuccess({ session: null });
    const fetchMock = jest.spyOn(global, 'fetch');

    const { result } = renderHook(() => useSessionStore(), {
      wrapper: ({ children }) => <SessionProvider>{children}</SessionProvider>
    });

    await waitFor(() => expect(result.current.status).toBe('signedOut'));

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ session: { role: 'Admin', expiresAt: new Date().toISOString() } })
    } as any);

    await act(async () => {
      await result.current.refresh();
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/refresh', expect.objectContaining({ method: 'POST' }));
    expect(result.current.session?.role).toBe('Admin');
  });

  it('sets signedOut when refresh returns no session', async () => {
    mockFetchSuccess({ session: { role: 'Admin', expiresAt: new Date().toISOString() } });
    const fetchMock = jest.spyOn(global, 'fetch');

    const { result } = renderHook(() => useSessionStore(), {
      wrapper: ({ children }) => <SessionProvider>{children}</SessionProvider>
    });

    await waitFor(() => expect(result.current.status).toBe('authenticated'));

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ session: null })
    } as any);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.session).toBeNull();
    expect(result.current.status).toBe('signedOut');
  });

  it('signs out and clears session state', async () => {
    mockFetchSuccess({ session: { role: 'Owner', expiresAt: new Date().toISOString() } });
    const fetchMock = jest.spyOn(global, 'fetch');

    const { result } = renderHook(() => useSessionStore(), {
      wrapper: ({ children }) => <SessionProvider>{children}</SessionProvider>
    });

    await waitFor(() => expect(result.current.status).toBe('authenticated'));

    fetchMock.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ session: null }) } as any);

    await act(async () => {
      await result.current.signOut();
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({ method: 'POST' }));
    expect(result.current.session).toBeNull();
    expect(result.current.status).toBe('signedOut');
  });

  it('exposes canAccess helper based on role hierarchy', async () => {
    mockFetchSuccess({ session: { role: 'Admin', expiresAt: new Date().toISOString() } });

    const { result } = renderHook(() => useSessionStore(), {
      wrapper: ({ children }) => <SessionProvider>{children}</SessionProvider>
    });

    await waitFor(() => expect(result.current.status).toBe('authenticated'));

    expect(result.current.canAccess('Auditor')).toBe(true);
    expect(result.current.canAccess('Owner')).toBe(false);
  });

  it('returns false from canAccess when no session is present', async () => {
    mockFetchSuccess({ session: null });

    const { result } = renderHook(() => useSessionStore(), {
      wrapper: ({ children }) => <SessionProvider>{children}</SessionProvider>
    });

    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    expect(result.current.canAccess('Auditor')).toBe(false);
  });

  it('clears errors after failed sign-in', async () => {
    mockFetchSuccess({ session: null });
    const fetchMock = jest.spyOn(global, 'fetch');

    const { result } = renderHook(() => useSessionStore(), {
      wrapper: ({ children }) => <SessionProvider>{children}</SessionProvider>
    });

    await waitFor(() => expect(result.current.status).toBe('signedOut'));

    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid credentials' })
    } as any);

    await act(async () => {
      await expect(
        result.current.signIn({ email: 'bad@example.com', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Invalid credentials');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('handles initial session load failure', async () => {
    mockFetchFailure('Not authorized');

    const { result } = renderHook(() => useSessionStore(), {
      wrapper: ({ children }) => <SessionProvider>{children}</SessionProvider>
    });

    await waitFor(() => expect(result.current.status).toBe('signedOut'));

    expect(result.current.error).toBe('Not authorized');
    expect(result.current.session).toBeNull();
  });

  it('uses status text when backend omits error message', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      statusText: 'Forbidden',
      json: () => Promise.resolve({})
    }) as any;

    const { result } = renderHook(() => useSessionStore(), {
      wrapper: ({ children }) => <SessionProvider>{children}</SessionProvider>
    });

    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    expect(result.current.error).toBe('Forbidden');
  });

  it('falls back to default message when parsing error response fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      statusText: '',
      json: () => Promise.reject(new Error('bad json'))
    }) as any;

    const { result } = renderHook(() => useSessionStore(), {
      wrapper: ({ children }) => <SessionProvider>{children}</SessionProvider>
    });

    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    expect(result.current.error).toBe('Request failed');
  });

  it('handles load session rejection with non-error reason', async () => {
    global.fetch = jest.fn().mockRejectedValue('network down') as any;

    const { result } = renderHook(() => useSessionStore(), {
      wrapper: ({ children }) => <SessionProvider>{children}</SessionProvider>
    });

    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    expect(result.current.error).toBe('Unable to load session');
  });

  it('uses fallback message when sign-in throws non-error value', async () => {
    mockFetchSuccess({ session: null });
    const fetchMock = jest.spyOn(global, 'fetch');

    const { result } = renderHook(() => useSessionStore(), {
      wrapper: ({ children }) => <SessionProvider>{children}</SessionProvider>
    });

    await waitFor(() => expect(result.current.status).toBe('signedOut'));

    fetchMock.mockRejectedValueOnce('timeout');

    await act(async () => {
      await expect(result.current.signIn({ email: 'admin@example.com', password: 'secret' })).rejects.toEqual('timeout');
    });

    expect(result.current.error).toBe('Unable to sign in');
    expect(result.current.status).toBe('error');
  });
});

describe('useSessionStore', () => {
  it('throws when used outside provider', () => {
    expect(() => renderHook(() => useSessionStore())).toThrow(
      'useSessionStore must be used within a SessionProvider'
    );
  });
});
