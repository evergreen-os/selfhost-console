import { NextResponse } from 'next/server';
import { login } from '@/lib/server/sessionManager';

export async function POST(request: Request) {
  const payload = await request.json();
  const session = await login({ email: payload.email, password: payload.password });
  return NextResponse.json({
    session: {
      role: session.role,
      email: payload.email,
      expiresAt: session.expiresAt.toISOString()
    }
  });
}
