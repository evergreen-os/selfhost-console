'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { buildNavigation } from '@/app/navigation.js';
import { useSessionStore } from '@/hooks/useSessionStore';
import { Button } from '@/components/ui/button';
import { cn, formatRelativeTime } from '@/lib/utils';

interface DashboardShellProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function DashboardShell({ title, description, actions, children }: DashboardShellProps) {
  const pathname = usePathname();
  const { session, signOut, status } = useSessionStore();
  const navigation = buildNavigation(session?.role ?? 'Auditor');

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white/70 p-6 shadow-sm lg:flex">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-emerald-700">EvergreenOS Console</h1>
          <p className="mt-1 text-xs text-slate-500">Selfhost administration</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 text-sm">
          {navigation.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.id}
                href={`/dashboard${item.href}`}
                className={cn(
                  'rounded-md px-3 py-2 font-medium transition-colors',
                  active ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700',
                  item.disabled && 'opacity-60 pointer-events-none'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <footer className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-500">
          <p>{session?.email ?? 'Signed in user'}</p>
          {session?.expiresAt && <p>Session refresh {formatRelativeTime(session.expiresAt)}</p>}
          <Button variant="outline" size="sm" className="mt-3" onClick={() => signOut()} disabled={status === 'loading'}>
            Sign out
          </Button>
        </footer>
      </aside>
      <div className="flex w-full flex-1 flex-col">
        <header className="flex flex-col gap-2 border-b border-slate-200 bg-white/90 px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-600">Dashboard</p>
            <h2 className="text-2xl font-semibold text-slate-900">{title ?? 'Overview'}</h2>
            {description && <p className="text-sm text-slate-600">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
        <main className="flex-1 space-y-6 p-6">{children}</main>
      </div>
    </div>
  );
}
