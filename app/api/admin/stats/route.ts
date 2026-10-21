export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Total Users
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true });

    // 2. Total Deposited (from 'payments' table, only completed)
    const { data: depositsData } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('status', 'completed');
    
    const totalDeposited = (depositsData || []).reduce(
      (sum, d) => sum + Number(d.amount), 
      0
    );

    // 3. Total Invested (from 'user_modules' table)
    const { data: modulesData } = await supabaseAdmin
      .from('user_modules')
      .select('price_paid');
    
    const totalInvested = (modulesData || []).reduce(
      (sum, m) => sum + Number(m.price_paid), 
      0
    );

    // 4. Total Withdrawn (from 'withdrawals' table, only completed)
    const { data: withdrawalsData } = await supabaseAdmin
      .from('withdrawals')
      .select('amount')
      .eq('status', 'completed');
    
    const totalWithdrawn = (withdrawalsData || []).reduce(
      (sum, w) => sum + Number(w.amount), 
      0
    );

    // 5. Pending Withdrawals (count)
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
