import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoginPage from '@/app/(auth)/login/page';
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

const mockedUseSessionStore = useSessionStore as jest.MockedFunction<typeof useSessionStore>;

describe('LoginPage', () => {
  const push = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push,
      replace: jest.fn(),
      prefetch: jest.fn(),
      refresh: jest.fn()
    });
    mockedUseSessionStore.mockReturnValue({
      session: null,
      status: 'signedOut',
      error: null,
      signIn: jest.fn().mockResolvedValue(undefined),
      refresh: jest.fn(),
      signOut: jest.fn(),
      clearError: jest.fn(),
      canAccess: jest.fn().mockReturnValue(false)
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    push.mockReset();
  });

  it('submits credentials', async () => {
    const signIn = jest.fn().mockResolvedValue(undefined);
    mockedUseSessionStore.mockReturnValue({
      session: null,
      status: 'signedOut',
      error: null,
      signIn,
      refresh: jest.fn(),
      signOut: jest.fn(),
      clearError: jest.fn(),
      canAccess: jest.fn().mockReturnValue(false)
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      await Promise.resolve();
    });

    expect(signIn).toHaveBeenCalledWith({ email: 'admin@example.com', password: 'secret' });
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/dashboard/devices');
    });
  });

  it('shows backend error when sign-in fails', async () => {
    const signIn = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
    const clearError = jest.fn();

    mockedUseSessionStore.mockReturnValue({
      session: null,
      status: 'signedOut',
      error: 'Previous error',
      signIn,
      refresh: jest.fn(),
      signOut: jest.fn(),
      clearError,
      canAccess: jest.fn().mockReturnValue(false)
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } });

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form')!);
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
    expect(clearError).toHaveBeenCalled();
  });
});
