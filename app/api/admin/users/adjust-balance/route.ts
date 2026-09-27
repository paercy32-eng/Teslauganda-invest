export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyAdminSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId, amount, reason } = await req.json();

    if (!userId || typeof amount !== 'number' || amount === 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('balance')
      .eq('id', userId)
      .maybeSingle();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const newBalance = Number(user.balance) + amount;
    if (newBalance < 0) {
      return NextResponse.json({ error: 'Balance cannot go negative' }, { status: 400 });
    }

    await supabaseAdmin
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId);

    await supabaseAdmin.from('tesla_transactions').insert({
      user_id: userId,
      type: amount > 0 ? 'admin_credit' : 'admin_debit',
      amount: Math.abs(amount),
      status: 'completed',
      meta: { reason: reason || 'Admin adjustment', admin: session.username },
    });

    await supabaseAdmin.from('tesla_admin_logs').insert({
      admin_action: 'adjust_balance',
      target_user_id: userId,
      amount,
      reason: reason || null,
      meta: { new_balance: newBalance },
    });

    return NextResponse.json({ success: true, newBalance });
  } catch (err) {
    console.error('Adjust balance error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
