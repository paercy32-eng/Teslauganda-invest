export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const session = await verifySession(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const { data: withdrawals, error } = await supabaseAdmin.rpc('user_withdrawals', {
      p_user_id: session.userId,
    });

    if (error) {
      console.error('Withdrawals history error:', error);
      return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
    }

    const formatted = (withdrawals ?? []).map((w: any) => ({
      id: w.id,
      amount: Number(w.amount),
      status: w.status,
      phone: w.phone,
      full_name: w.full_name,
      created_at: w.created_at,
      reviewed_at: w.reviewed_at,
      net_amount: Math.round(Number(w.amount) * 0.85),
      fee: Math.round(Number(w.amount) * 0.15),
      meta: w.meta ?? {},
    }));

    return NextResponse.json(
      { withdrawals: formatted },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('Withdrawals history error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
