import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: 'abfi_onboarded',
    value: '1',
    path: '/',
    httpOnly: false,    // ok for this simple gate; set true if not read by client at all
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: 'abfi_onboarded',
    value: '',
    path: '/',
    maxAge: 0,
  });
  return res;
}
