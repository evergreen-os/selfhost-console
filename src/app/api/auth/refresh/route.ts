import { NextResponse } from 'next/server';
import { refresh } from '@/lib/server/sessionManager';

export async function POST() {
  const session = await refresh();
  return NextResponse.json({
    session: {
      role: session.role,
      expiresAt: session.expiresAt.toISOString()
    }
  });
}
