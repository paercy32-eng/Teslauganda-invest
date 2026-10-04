export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminCredentials,
  signAdminSession,
  ADMIN_SESSION_COOKIE,
} from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password required.' },
        { status: 400 }
      );
    }

    const admin = await verifyAdminCredentials(username, password);
    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    const token = await signAdminSession({
      userId: admin.id,
      username: admin.username,
      name: admin.name ?? admin.username,
      role: 'admin',
    });

    const res = NextResponse.json({ success: true });
    res.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return res;
  } catch (err) {
    console.error('Admin login error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
