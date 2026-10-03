export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';

// GET — list withdrawals (optionally filtered by status)
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
      .select(
        'id, user_id, amount, status, phone, full_name, created_at, reviewed_at, users:user_id (name, phone, balance)'
      )
      .order('created_at', { ascending: false })
      .limit(200);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Admin withdrawals fetch error:', error);
      return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
    }

    return NextResponse.json({ withdrawals: data ?? [] });
  } catch (err) {
    console.error('Admin withdrawals error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — approve or reject a withdrawal
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

    // Load the withdrawal (include phone + full_name so we can pay out)
    const { data: wd } = await supabaseAdmin
      .from('tesla_withdrawals')
      .select('id, user_id, amount, status, phone, full_name')
      .eq('id', withdrawalId)
      .maybeSingle();

    if (!wd) return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });

    if (wd.status !== 'pending') {
      return NextResponse.json(
        { error: `Already ${wd.status}` },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Bump the user's total_withdrawn tracker
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

      await supabaseAdmin
        .from('tesla_withdrawals')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId);

      await supabaseAdmin.from('tesla_transactions').insert({
        user_id: wd.user_id,
        type: 'withdrawal',
        amount: Number(wd.amount),
        status: 'completed',
        meta: { approved_by: session.username },
      });

      await supabaseAdmin.from('tesla_admin_logs').insert({
        admin_action: 'approve_withdrawal',
        target_user_id: wd.user_id,
        amount: Number(wd.amount),
        reason: null,
        meta: { withdrawal_id: withdrawalId },
      });

      // Trigger Obpay payout — sends 85% of the requested amount
      try {
        const { data: payer } = await supabaseAdmin
          .from('users')
          .select('phone, name')
          .eq('id', wd.user_id)
          .maybeSingle();

        const payoutPhone = wd.phone || payer?.phone;
        const payoutName = wd.full_name || payer?.name || 'User';
        const payoutAmount = Math.round(Number(wd.amount) * 0.85);

        if (!payoutPhone) {
          console.error('No phone for payout on withdrawal', withdrawalId);
        } else {
          const obpayRes = await fetch('https://obpay.online/api/public/v1/payout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OBPAY_SECRET_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: payoutAmount,
              phone_number: payoutPhone,
              customer_name: payoutName,
              customer_email: `payout-${String(payoutPhone).replace(/\D/g, '')}@teslauganda.app`,
              reference: `WD-${withdrawalId.slice(0, 8)}-${Date.now()}`,
              callback_url: 'https://robots invest.vercel.app/api/webhooks/obpay',invest.vercel.app'}/api/webhooks/obpay`,
              description: 'Robot withdrawal payout',
            }),
          });

          const obpayData = await obpayRes.json();
          console.log('Obpay payout response:', obpayData);

          await supabaseAdmin
            .from('tesla_withdrawals')
            .update({
              meta: { obpay_payout: obpayData?.data ?? obpayData },
            })
            .eq('id', withdrawalId);
        }
      } catch (obpayErr) {
        console.error('Obpay payout error (non-fatal):', obpayErr);
      }

      return NextResponse.json({ success: true, status: 'approved' });
    }

    // action === 'reject' — refund the balance
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
