import { NextResponse } from 'next/server';
import { currentSession } from '@/lib/server/sessionManager';

export async function GET() {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ session: null });
  }
  return NextResponse.json({
    session: {
      role: session.role,
      email: session.email,
      tenantId: session.tenantId,
      expiresAt: session.expiresAt
    }
  });
}
