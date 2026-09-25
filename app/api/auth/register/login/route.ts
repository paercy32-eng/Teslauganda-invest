import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { hashPassword, signSession, SESSION_COOKIE } from '@/lib/auth';

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'TSLA';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, password, confirmPassword, referralCode } = body;

    // --- Validation ---
    if (!name || !phone || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim();
    if (!/^\+?\d{9,15}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Enter a valid phone number.' },
        { status: 400 }
      );
    }

    // --- Check if phone already exists ---
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'This phone number is already registered.' },
        { status: 409 }
      );
    }

    // --- Resolve referrer (if referral code supplied) ---
    let referredBy: string | null = null;
    if (referralCode && referralCode.trim()) {
      const { data: referrer } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('referral_code', referralCode.trim().toUpperCase())
        .maybeSingle();

      if (referrer) {
        referredBy = referrer.id;
      }
    }

    // --- Hash password ---
    const passwordHash = await hashPassword(password);

    // --- Generate unique referral code ---
    let newCode = generateReferralCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: clash } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('referral_code', newCode)
        .maybeSingle();
      if (!clash) break;
      newCode = generateReferralCode();
    }

    // --- Insert user (welcome bonus of 3000) ---
    const { data: newUser, error: insertErr } = await supabaseAdmin
      .from('users')
      .insert({
        name: name.trim(),
        phone: cleanPhone,
        password_hash: passwordHash,
        balance: 3000,
        referral_code: newCode,
        referred_by: referredBy,
        welcome_bonus_credited: true,
      })
      .select('id, name, phone, referral_code')
      .single();

    if (insertErr || !newUser) {
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    // --- Log the welcome bonus transaction ---
    await supabaseAdmin.from('tesla_transactions').insert({
      user_id: newUser.id,
      type: 'welcome',
      amount: 3000,
      status: 'completed',
      meta: { reason: 'Welcome bonus' },
    });

    // --- Create session cookie ---
    const token = await signSession({
      userId: newUser.id,
      phone: newUser.phone,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        referralCode: newUser.referral_code,
      },
    });

    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return res;
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
      }
