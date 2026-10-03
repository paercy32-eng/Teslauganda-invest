export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyAdminSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true });

    // Use SQL aggregates via RPC to avoid row-count issues
    const { data: agg, error: aggErr } = await supabaseAdmin.rpc('admin_stats');

    if (aggErr) {
      console.error('admin_stats RPC error:', aggErr);
      return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
    }

    const row = Array.isArray(agg) ? agg[0] : agg;

    return NextResponse.json(
      {
        totalUsers: totalUsers ?? 0,
        totalDeposited: Number(row?.total_deposited ?? 0),
        totalInvested: Number(row?.total_invested ?? 0),
        totalWithdrawn: Number(row?.total_withdrawn ?? 0),
        pendingWithdrawals: Number(row?.pending_withdrawals ?? 0),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
