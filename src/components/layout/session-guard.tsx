'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/hooks/useSessionStore';
import { Button } from '@/components/ui/button';

interface SessionGuardProps {
  children: ReactNode;
  redirectTo: string;
  requiredRole?: 'Owner' | 'Admin' | 'Auditor';
}

export function SessionGuard({ children, redirectTo, requiredRole = 'Auditor' }: SessionGuardProps) {
  const router = useRouter();
  const { session, status, canAccess, refresh } = useSessionStore();

  useEffect(() => {
    if (status === 'signedOut') {
      router.replace(redirectTo);
    }
  }, [status, router, redirectTo]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (session?.expiresAt) {
      const expires = new Date(session.expiresAt).getTime();
      const now = Date.now();
      const refreshIn = Math.max(30_000, expires - now - 60_000);
      timer = setTimeout(() => {
        refresh().catch(() => {
          router.replace(redirectTo);
        });
      }, refreshIn);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [session?.expiresAt, refresh, router, redirectTo]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 text-slate-600">
        <span className="text-sm font-medium">Checking your session…</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 text-slate-600">
        <span className="text-sm font-medium">Your session expired. Please sign in again.</span>
        <Button onClick={() => router.replace(redirectTo)}>Return to login</Button>
      </div>
    );
  }

  if (!session || !canAccess(requiredRole)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 text-slate-600">
        <span className="text-sm font-medium">You do not have access to this area.</span>
        <Button onClick={() => router.replace(redirectTo)}>Return to login</Button>
      </div>
    );
  }

  return <>{children}</>;
}
