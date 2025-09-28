import { ReactNode } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SessionGuard } from '@/components/layout/session-guard';
import { QueryProvider } from '@/components/providers/query-provider';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGuard redirectTo="/login">
      <QueryProvider>
        <DashboardShell>{children}</DashboardShell>
      </QueryProvider>
    </SessionGuard>
  );
}
