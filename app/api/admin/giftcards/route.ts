export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyAdminSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from('gift_cards')
      .select('*')
      .eq('is_used', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ giftCards: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyAdminSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { value, quantity } = await req.json();
    const numValue = Number(value);
    const numQuantity = Number(quantity);

    if (!numValue || numValue < 100) {
      return NextResponse.json({ error: 'Minimum value is 100 UGX' }, { status: 400 });
    }
    if (!numQuantity || numQuantity < 1 || numQuantity > 100) {
      return NextResponse.json({ error: 'Quantity must be between 1 and 100' }, { status: 400 });
    }

    // 1. Delete old active codes
    await supabaseAdmin
      .from('gift_cards')
      .delete()
      .eq('is_used', false);

    // 2. Generate new codes
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const newCodes = [];

    for (let i = 0; i < numQuantity; i++) {
      let code = 'SAIKEN-';
      for (let j = 0; j < 6; j++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      newCodes.push({
        code,
        total_value: numValue,
        claimed_value: 0,
        is_active: true,
        value: numValue,
        balance: numValue,
        expires_at: expiresAt,
        is_used: false,
      });
    }

    const { data, error } = await supabaseAdmin
      .from('gift_cards')
      .insert(newCodes)
      .select('code');

    if (error) {
      console.error('Gift code generation error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      codes: data.map((c: any) => c.code),
      message: `${numQuantity} gift card(s) created. Expires in 5 minutes.`,
    });

  } catch (err: any) {
    console.error('Generate gift card error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
