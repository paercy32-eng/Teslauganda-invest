import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { signUserToken, USER_COOKIE_NAME, USER_COOKIE_OPTIONS } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SKN-'; // Changed to SKN for Saiken
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, password, confirmPassword, referralCode } = body;

    // --- Validation ---
    if (!phone || !password || !confirmPassword) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const cleanPhone = phone.trim();
    if (!/^\+?\d{9,15}$/.test(cleanPhone)) {
      return NextResponse.json({ error: 'Enter a valid phone number.' }, { status: 400 });
    }

    // --- Check if phone already exists ---
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'This phone number is already registered.' }, { status: 409 });
    }

    // --- Resolve referrer ---
    let referredBy: string | null = null;
    if (referralCode && referralCode.trim()) {
      const { data: referrer } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('referral_code', referralCode.trim().toUpperCase())
        .maybeSingle();
      if (referrer) referredBy = referrer.id;
    }

    // --- Hash password ---
    const passwordHash = await bcrypt.hash(password, 10);

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

    // --- Auto-generate name ---
    const defaultName = 'User ' + cleanPhone.slice(-4);

    // --- Insert user ---
    const { data: newUser, error: insertErr } = await supabaseAdmin
      .from('users')
      .insert({
        name: defaultName,
        phone: cleanPhone,
        password_hash: passwordHash,
        balance: 3000,
        referral_code: newCode,
        referred_by: referredBy,
      })
      .select('id, name, phone, referral_code')
      .single();

    if (insertErr || !newUser) {
      console.error('Insert error:', insertErr);
      return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
    }

    // --- Log the welcome bonus transaction ---
    await supabaseAdmin.from('transactions').insert({
      user_id: newUser.id,
      type: 'welcome_bonus',
      amount: 3000,
      status: 'completed',
      meta: { reason: 'Welcome bonus' },
    });

    // --- Create session cookie ---
    const token = signUserToken({
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

    res.cookies.set(USER_COOKIE_NAME, token, USER_COOKIE_OPTIONS);

    return res;
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
