export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';

// GET — list withdrawals
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyAdminSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? 'pending';

    let query = supabaseAdmin
      .from('tesla_withdrawals')
      .select('id, user_id, amount, status, phone, full_name, created_at, reviewed_at, meta');

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Admin withdrawals fetch error:', error);
      return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
    }

    const userIds = Array.from(new Set((data ?? []).map((w) => w.user_id)));
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

    const enriched = (data ?? []).map((w) => ({
      ...w,
      users: userMap[w.user_id] ?? null,
    }));

    // Sort newest first
    enriched.sort((a, b) => {
      const aT = new Date(a.created_at).getTime();
      const bT = new Date(b.created_at).getTime();
      return bT - aT;
    });

    return NextResponse.json(
      { withdrawals: enriched },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('Admin withdrawals error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — approve or reject
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyAdminSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { withdrawalId, action } = await req.json();

    if (!withdrawalId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { data: wd } = await supabaseAdmin
      .from('tesla_withdrawals')
      .select('id, user_id, amount, status, phone, full_name, meta')
      .eq('id', withdrawalId)
      .maybeSingle();

    if (!wd) return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });

    if (wd.status !== 'pending') {
      return NextResponse.json({ error: `Already ${wd.status}` }, { status: 400 });
    }

    if (action === 'approve') {
      // Prevent double approval
      const existingMeta = (wd.meta && typeof wd.meta === 'object') ? wd.meta : {};
      const alreadyApproved = (existingMeta as any)?.manual_payout_required === true;

      if (alreadyApproved) {
        return NextResponse.json({
          success: true,
          status: 'already_approved',
        });
      }

      // Bump total_withdrawn tracker
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('total_withdrawn')
        .eq('id', wd.user_id)
        .maybeSingle();

      await supabaseAdmin
        .from('users')
        .update({
          total_withdrawn: Number(user?.total_withdrawn ?? 0) + Number(wd.amount),
        })
        .eq('id', wd.user_id);

      // Get user contact details for the payout
      const { data: payer } = await supabaseAdmin
        .from('users')
        .select('phone, name')
        .eq('id', wd.user_id)
        .maybeSingle();

      const payoutPhone = wd.phone || payer?.phone;
      const payoutName = wd.full_name || payer?.name || 'User';
      const userNet = Math.round(Number(wd.amount) * 0.85);

      // Update withdrawal with approved status + manual payout flag
      await supabaseAdmin
        .from('tesla_withdrawals')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          meta: {
            manual_payout_required: true,
            user_net: userNet,
            phone: payoutPhone,
            name: payoutName,
          },
        })
        .eq('id', withdrawalId);

      // Log transaction
      await supabaseAdmin.from('tesla_transactions').insert({
        user_id: wd.user_id,
        type: 'withdrawal',
        amount: Number(wd.amount),
        status: 'completed',
        meta: { approved_by: session.username, method: 'manual' },
      });

      await supabaseAdmin.from('tesla_admin_logs').insert({
        admin_action: 'approve_withdrawal',
        target_user_id: wd.user_id,
        amount: Number(wd.amount),
        reason: null,
        meta: { withdrawal_id: withdrawalId, method: 'manual' },
      });

      return NextResponse.json({ success: true, status: 'approved' });
    }

    // reject — refund
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('balance')
      .eq('id', wd.user_id)
      .maybeSingle();

    await supabaseAdmin
      .from('users')
      .update({ balance: Number(user?.balance ?? 0) + Number(wd.amount) })
      .eq('id', wd.user_id);

    await supabaseAdmin
      .from('tesla_withdrawals')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', withdrawalId);

    await supabaseAdmin.from('tesla_transactions').insert({
      user_id: wd.user_id,
      type: 'withdrawal_refund',
      amount: Number(wd.amount),
      status: 'completed',
      meta: { rejected_by: session.username },
    });

    await supabaseAdmin.from('tesla_admin_logs').insert({
      admin_action: 'reject_withdrawal',
      target_user_id: wd.user_id,
      amount: Number(wd.amount),
      reason: null,
      meta: { withdrawal_id: withdrawalId },
    });

    return NextResponse.json({ success: true, status: 'rejected' });
  } catch (err) {
    console.error('Admin withdrawals action error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH — mark as completed or failed manually
export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyAdminSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { withdrawalId, action } = await req.json();

    if (!withdrawalId || !['mark_completed', 'mark_failed'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { data: wd } = await supabaseAdmin
      .from('tesla_withdrawals')
      .select('id, user_id, amount, status, meta')
      .eq('id', withdrawalId)
      .maybeSingle();

    if (!wd) return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });

    const existingMeta = (wd.meta && typeof wd.meta === 'object') ? wd.meta : {};
    const newMeta = {
      ...(existingMeta as any),
      manual_status: action === 'mark_completed' ? 'completed' : 'failed',
      manual_marked_at: new Date().toISOString(),
      manual_marked_by: session.username,
    };

    await supabaseAdmin
      .from('tesla_withdrawals')
      .update({ meta: newMeta })
      .eq('id', withdrawalId);

    return NextResponse.json({ success: true, manual_status: newMeta.manual_status });
  } catch (err) {
    console.error('Mark withdrawal error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
      }
