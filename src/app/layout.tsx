import './globals.css';
import { ReactNode } from 'react';
import { Metadata } from 'next';
import { SessionProvider } from '@/hooks/useSessionStore';

export const metadata: Metadata = {
  title: 'EvergreenOS Selfhost Console',
  description: 'Administer EvergreenOS devices, policies, and tenants.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
