import { NextResponse } from 'next/server';
import { logout } from '@/lib/server/sessionManager';

export async function POST() {
  await logout();
  return NextResponse.json({ session: null });
}
