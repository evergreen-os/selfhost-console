import { act, render, screen, waitFor } from '@testing-library/react';
import { SessionGuard } from '@/components/layout/session-guard';
import { useSessionStore } from '@/hooks/useSessionStore';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('@/hooks/useSessionStore', () => {
  const actual = jest.requireActual('@/hooks/useSessionStore');
  return {
    ...actual,
    useSessionStore: jest.fn()
  };
});

const mockUseSessionStore = useSessionStore as jest.MockedFunction<typeof useSessionStore>;

describe('SessionGuard', () => {
  const replace = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ replace });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.resetAllMocks();
    replace.mockReset();
  });

  it('renders loading state', () => {
    mockUseSessionStore.mockReturnValue({
      session: null,
      status: 'loading',
      error: null,
      signIn: jest.fn(),
      refresh: jest.fn(),
      signOut: jest.fn(),
      clearError: jest.fn(),
      canAccess: jest.fn().mockReturnValue(false)
    });

    render(
      <SessionGuard redirectTo="/login">
        <div>Private</div>
      </SessionGuard>
    );

    expect(screen.getByText(/Checking your session/)).toBeInTheDocument();
  });

  it('renders error state', () => {
    mockUseSessionStore.mockReturnValue({
      session: null,
      status: 'error',
      error: 'Expired',
      signIn: jest.fn(),
      refresh: jest.fn(),
      signOut: jest.fn(),
      clearError: jest.fn(),
      canAccess: jest.fn().mockReturnValue(false)
    });

    render(
      <SessionGuard redirectTo="/login">
        <div>Private</div>
      </SessionGuard>
    );

    expect(screen.getByText(/Your session expired/)).toBeInTheDocument();
  });

  it('blocks access when user lacks permissions', () => {
    mockUseSessionStore.mockReturnValue({
      session: { role: 'Auditor', expiresAt: new Date().toISOString() },
      status: 'authenticated',
      error: null,
      signIn: jest.fn(),
      refresh: jest.fn(),
      signOut: jest.fn(),
      clearError: jest.fn(),
      canAccess: jest.fn().mockReturnValue(false)
    });

    render(
      <SessionGuard redirectTo="/login">
        <div>Private</div>
      </SessionGuard>
    );

    expect(screen.getByText(/do not have access/)).toBeInTheDocument();
  });

  it('renders children and schedules refresh for active session', () => {
    const refresh = jest.fn().mockResolvedValue({});
    jest.useFakeTimers();

    mockUseSessionStore.mockReturnValue({
      session: {
        role: 'Owner',
        expiresAt: new Date(Date.now() + 120_000).toISOString()
      },
      status: 'authenticated',
      error: null,
      signIn: jest.fn(),
      refresh,
      signOut: jest.fn(),
      clearError: jest.fn(),
      canAccess: jest.fn().mockReturnValue(true)
    });

    render(
      <SessionGuard redirectTo="/login">
        <div>Private</div>
      </SessionGuard>
    );

    expect(screen.getByText('Private')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(refresh).toHaveBeenCalled();
  });

  it('redirects when session status is signed out', async () => {
    mockUseSessionStore.mockReturnValue({
      session: null,
      status: 'signedOut',
      error: null,
      signIn: jest.fn(),
      refresh: jest.fn(),
      signOut: jest.fn(),
      clearError: jest.fn(),
      canAccess: jest.fn().mockReturnValue(false)
    });

    render(
      <SessionGuard redirectTo="/login">
        <div>Private</div>
      </SessionGuard>
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/login');
    });
  });

  it('redirects when refresh fails during scheduled refresh', async () => {
    jest.useFakeTimers();
    const refresh = jest.fn().mockRejectedValue(new Error('network'));

    mockUseSessionStore.mockReturnValue({
      session: {
        role: 'Admin',
        expiresAt: new Date(Date.now() + 120_000).toISOString()
      },
      status: 'authenticated',
      error: null,
      signIn: jest.fn(),
      refresh,
      signOut: jest.fn(),
      clearError: jest.fn(),
      canAccess: jest.fn().mockReturnValue(true)
    });

    render(
      <SessionGuard redirectTo="/login">
        <div>Private</div>
      </SessionGuard>
    );

    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/login');
    });
  });
});
