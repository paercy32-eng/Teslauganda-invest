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

    const { data: transactions, error } = await supabaseAdmin
      .from('tesla_transactions')
      .select('id, type, amount, status, meta, created_at')
      .eq('user_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Transactions fetch error:', error);
      return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
    }

    return NextResponse.json(
      { transactions: transactions ?? [] },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('Transactions error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
