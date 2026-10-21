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

    // 1. Total Users
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true });

    // 2. Total Deposited
    const { data: depositsData } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('status', 'completed');
    
    const totalDeposited = (depositsData || []).reduce(
      (sum, d) => sum + Number(d.amount), 
      0
    );

    // 3. Total Invested
    const { data: modulesData } = await supabaseAdmin
      .from('user_modules')
      .select('price_paid');
    
    const totalInvested = (modulesData || []).reduce(
      (sum, m) => sum + Number(m.price_paid), 
      0
    );

    // 4. Total Withdrawn
    const { data: withdrawalsData } = await supabaseAdmin
      .from('withdrawals')
      .select('amount')
      .eq('status', 'completed');
    
    const totalWithdrawn = (withdrawalsData || []).reduce(
      (sum, w) => sum + Number(w.amount), 
      0
    );

    // 5. Pending Withdrawals
    const { count: pendingWithdrawals } = await supabaseAdmin
      .from('withdrawals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    return NextResponse.json(
      {
        totalUsers: totalUsers ?? 0,
        totalDeposited,
        totalInvested,
        totalWithdrawn,
        pendingWithdrawals: pendingWithdrawals ?? 0,
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
