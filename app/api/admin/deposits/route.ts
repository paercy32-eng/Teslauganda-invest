export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';

// GET — list deposits
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyAdminSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? 'pending';

    let query = supabaseAdmin
      .from('tesla_deposits')
      .select('id, user_id, amount, status, reference, created_at, reviewed_at');

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Admin deposits fetch error:', error);
      return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
    }

    const userIds = Array.from(new Set((data ?? []).map((d) => d.user_id)));
    let userMap: Record<string, { name: string; phone: string }> = {};
    if (userIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, name, phone')
        .in('id', userIds);
      (users ?? []).forEach((u) => {
        userMap[u.id] = { name: u.name, phone: u.phone };
      });
    }

    const enriched = (data ?? []).map((d) => ({
      ...d,
      users: userMap[d.user_id] ?? null,
    }));

    // Sort newest first
    enriched.sort((a, b) => {
      const aT = new Date(a.created_at).getTime();
      const bT = new Date(b.created_at).getTime();
      return bT - aT;
    });

    return NextResponse.json(
      { deposits: enriched },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('Admin deposits error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — approve or reject a deposit
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyAdminSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { depositId, action } = await req.json();

    if (!depositId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { data: dep } = await supabaseAdmin
      .from('tesla_deposits')
      .select('id, user_id, amount, status')
      .eq('id', depositId)
      .maybeSingle();

    if (!dep) return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });

    if (dep.status !== 'pending') {
      return NextResponse.json({ error: `Already ${dep.status}` }, { status: 400 });
    }

    if (action === 'approve') {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('balance, total_deposited')
        .eq('id', dep.user_id)
        .maybeSingle();

      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      await supabaseAdmin
        .from('users')
        .update({
          balance: Number(user.balance) + Number(dep.amount),
          total_deposited: Number(user.total_deposited) + Number(dep.amount),
        })
        .eq('id', dep.user_id);

      await supabaseAdmin
        .from('tesla_deposits')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', depositId);

      await supabaseAdmin.from('tesla_transactions').insert({
        user_id: dep.user_id,
        type: 'deposit',
        amount: Number(dep.amount),
        status: 'completed',
        meta: { approved_by: session.username, source: 'admin_manual' },
      });

      await supabaseAdmin.from('tesla_admin_logs').insert({
        admin_action: 'approve_deposit',
        target_user_id: dep.user_id,
        amount: Number(dep.amount),
        reason: null,
        meta: { deposit_id: depositId },
      });

      return NextResponse.json({ success: true, status: 'approved' });
    }

    // reject
    await supabaseAdmin
      .from('tesla_deposits')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', depositId);

    await supabaseAdmin.from('tesla_admin_logs').insert({
      admin_action: 'reject_deposit',
      target_user_id: dep.user_id,
      amount: Number(dep.amount),
      reason: null,
      meta: { deposit_id: depositId },
    });

    return NextResponse.json({ success: true, status: 'rejected' });
  } catch (err) {
    console.error('Admin deposits action error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
