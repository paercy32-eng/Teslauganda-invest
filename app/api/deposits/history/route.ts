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

    const { data: deposits, error } = await supabaseAdmin.rpc('user_deposits', {
      p_user_id: session.userId,
    });

    if (error) {
      console.error('Deposits history error:', error);
      return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
    }

    const formatted = (deposits ?? []).map((d: any) => ({
      id: d.id,
      amount: Number(d.amount),
      status: d.status,
      reference: d.reference,
      created_at: d.created_at,
      reviewed_at: d.reviewed_at,
    }));

    return NextResponse.json(
      { deposits: formatted },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('Deposits history error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
