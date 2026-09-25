import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyPassword, signSession, SESSION_COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Phone and password are required.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim();

    // Find user by phone
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name, phone, password_hash, referral_code')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid phone number or password.' },
        { status: 401 }
      );
    }

    // Verify password
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return NextResponse.json(
        { error: 'Invalid phone number or password.' },
        { status: 401 }
      );
    }

    // Sign session
    const token = await signSession({
      userId: user.id,
      phone: user.phone,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        referralCode: user.referral_code,
      },
    });

    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return res;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
