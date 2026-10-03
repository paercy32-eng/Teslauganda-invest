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

    const { data: depRows } = await supabaseAdmin
      .from('tesla_deposits')
      .select('amount')
      .eq('status', 'approved');
    const totalDeposited =
      depRows?.reduce((sum, r) => sum + Number(r.amount), 0) ?? 0;

    const { data: rentalRows } = await supabaseAdmin
      .from('tesla_rentals')
      .select('price_paid');
    const totalInvested =
      rentalRows?.reduce((sum, r) => sum + Number(r.price_paid), 0) ?? 0;

    const { data: wdRows } = await supabaseAdmin
      .from('tesla_withdrawals')
      .select('amount')
      .eq('status', 'approved');
    const totalWithdrawn =
      wdRows?.reduce((sum, r) => sum + Number(r.amount), 0) ?? 0;

    const { count: pendingWithdrawals } = await supabaseAdmin
      .from('tesla_withdrawals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    
  } catch (err) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ erreturn NextResponse.json(
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
);ror: 'Server error' }, { status: 500 });
  }
}
