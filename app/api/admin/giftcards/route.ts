export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'TSLA';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// GET — list all gift cards
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyAdminSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from('tesla_giftcards')
      .select('id, code, total_value, claimed_value, expires_at, is_active, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Giftcards fetch error:', error);
      return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
    }

    return NextResponse.json({ giftcards: data ?? [] });
  } catch (err) {
    console.error('Admin giftcards GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — create a new gift card
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyAdminSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const totalValue = Number(body.totalValue ?? 5000);
    const expiryMinutes = Number(body.expiryMinutes ?? 5);

    if (totalValue <= 0 || expiryMinutes <= 0) {
      return NextResponse.json({ error: 'Invalid values' }, { status: 400 });
    }

    // Generate unique code
    let code = generateCode();
    for (let i = 0; i < 5; i++) {
      const { data: clash } = await supabaseAdmin
        .from('tesla_giftcards')
        .select('id')
        .eq('code', code)
        .maybeSingle();
      if (!clash) break;
      code = generateCode();
    }

    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();

    const { data: card, error } = await supabaseAdmin
      .from('tesla_giftcards')
      .insert({
        code,
        total_value: totalValue,
        claimed_value: 0,
        expires_at: expiresAt,
        is_active: true,
      })
      .select('id, code, total_value, claimed_value, expires_at, is_active, created_at')
      .single();

    if (error || !card) {
      console.error('Giftcard create error:', error);
      return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    }

    await supabaseAdmin.from('tesla_admin_logs').insert({
      admin_action: 'create_giftcard',
      reason: null,
      meta: { code, total_value: totalValue, expiry_minutes: expiryMinutes },
    });

    return NextResponse.json({ giftcard: card });
  } catch (err) {
    console.error('Admin giftcards POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE — deactivate a gift card
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyAdminSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await supabaseAdmin
      .from('tesla_giftcards')
      .update({ is_active: false })
      .eq('id', id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin giftcards DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
