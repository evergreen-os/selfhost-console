import { act, fireEvent, render, screen } from '@testing-library/react';
import LoginPage from '@/app/(auth)/login/page';
import { useSessionStore } from '@/hooks/useSessionStore';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn()
  })
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
  beforeEach(() => {
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
  });
});
