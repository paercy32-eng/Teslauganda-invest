export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

// GET — fetch currently bound account
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const session = await verifySession(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('bound_phone, bound_name')
      .eq('id', session.userId)
      .maybeSingle();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      boundPhone: user.bound_phone,
      boundName: user.bound_name,
    });
  } catch (err) {
    console.error('Bind account GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — save or update bound account
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const session = await verifySession(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const { phone, fullName } = await req.json();

    if (!phone || !fullName) {
      return NextResponse.json(
        { error: 'Phone number and full name are required.' },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).trim();
    const cleanName = String(fullName).trim();

    if (!/^\+?\d{9,15}$/.test(cleanPhone)) {
      return NextResponse.json({ error: 'Enter a valid phone number.' }, { status: 400 });
    }

    if (cleanName.length < 3) {
      return NextResponse.json({ error: 'Enter your full registered name.' }, { status: 400 });
    }

    const { error: updateErr } = await supabaseAdmin
      .from('users')
      .update({
        bound_phone: cleanPhone,
        bound_name: cleanName,
      })
      .eq('id', session.userId);

    if (updateErr) {
      console.error('Bind account update error:', updateErr);
      return NextResponse.json({ error: 'Failed to save account.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Account bound successfully.',
      boundPhone: cleanPhone,
      boundName: cleanName,
    });
  } catch (err) {
    console.error('Bind account POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
