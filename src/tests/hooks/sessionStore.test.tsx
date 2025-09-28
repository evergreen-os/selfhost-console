import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { SessionProvider, useSessionStore } from '@/hooks/useSessionStore';

function setup(response: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(response)
  }) as any;
}

const originalFetch = global.fetch;

describe('SessionProvider', () => {
  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = originalFetch;
  });

  it('loads session on mount', async () => {
    setup({ session: { role: 'Owner', expiresAt: new Date().toISOString() } });

    const { result } = renderHook(() => useSessionStore(), {
      wrapper: ({ children }) => <SessionProvider>{children}</SessionProvider>
    });

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    expect(result.current.session?.role).toBe('Owner');
  });

  it('signs in via API', async () => {
    setup({ session: null });
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
});
