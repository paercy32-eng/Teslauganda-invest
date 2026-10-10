export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';

// Normalize phone to +256XXXXXXXXX
function normalizePhone(input: string): string {
  let phone = (input || '').replace(/[^\d]/g, '');
  if (phone.startsWith('0')) phone = '256' + phone.slice(1);
  if (phone.startsWith('7') && phone.length === 9) phone = '256' + phone;
  return '+' + phone;
}

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

    // ==============================
    // APPROVE
    // ==============================
    if (action === 'approve') {
      const existingMeta = (wd.meta && typeof wd.meta === 'object') ? wd.meta : {};
      const alreadySent = (existingMeta as any)?.marzpay_payout?.reference;

      if (alreadySent) {
        return NextResponse.json({
          success: true,
          status: 'already_sent',
        });
      }

      const { data: payer } = await supabaseAdmin
        .from('users')
        .select('phone, name')
        .eq('id', wd.user_id)
        .maybeSingle();

      const payoutPhoneRaw = wd.phone || payer?.phone || '';
      const payoutPhone = normalizePhone(payoutPhoneRaw);
      const payoutName = wd.full_name || payer?.name || 'User';
      const userNet = Math.round(Number(wd.amount) * 0.85);

      // Get MarzPay credentials
      const marzpayKey = process.env.MARZPAY_API_KEY;
      const marzpayBaseUrl =
        process.env.MARZPAY_BASE_URL || 'https://wallet.wearemarz.com/api/v1';
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || 'https://safranfrance.vercel.app';

      if (!marzpayKey) {
        return NextResponse.json(
          { error: 'Payment gateway not configured' },
          { status: 500 }
        );
      }

      // Generate unique reference for this payout
      const payoutRef = `WD-${withdrawalId.slice(0, 8)}-${Date.now()}`;

      // Call MarzPay send-money
      const marzpayRes = await fetch(`${marzpayBaseUrl}/send-money`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${marzpayKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          amount: userNet,
          phone_number: payoutPhone,
          recipient_name: payoutName,
          reference: payoutRef,
          callback_url: `${appUrl}/api/webhooks/marzpay`,
          description: `Safran withdrawal payout`,
          metadata: [
            { withdrawalId },
            { reference: payoutRef },
          ],
        }),
      });

      const marzpayData = await marzpayRes.json().catch(() => ({}));
      console.log('MarzPay payout response:', marzpayData);

      if (!marzpayRes.ok || marzpayData?.success === false) {
        console.error('MarzPay payout failed:', marzpayData);
        return NextResponse.json(
          {
            error:
              marzpayData?.message ||
              marzpayData?.error ||
              'Payout request failed',
          },
          { status: 400 }
        );
      }

      // Update withdrawal: status = approved (UI shows "Reviewed"), store payout metadata
      await supabaseAdmin
        .from('tesla_withdrawals')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          meta: {
            marzpay_payout: marzpayData?.data ?? marzpayData,
            payout_reference: payoutRef,
            user_net: userNet,
            payout_phone: payoutPhone,
            payout_name: payoutName,
          },
        })
        .eq('id', withdrawalId);

      // Bump user's total_withdrawn
      const { data: userFull } = await supabaseAdmin
        .from('users')
        .select('total_withdrawn')
        .eq('id', wd.user_id)
        .maybeSingle();

      await supabaseAdmin
        .from('users')
        .update({
          total_withdrawn: Number(userFull?.total_withdrawn ?? 0) + Number(wd.amount),
        })
        .eq('id', wd.user_id);

      await supabaseAdmin.from('tesla_transactions').insert({
        user_id: wd.user_id,
        type: 'withdrawal',
        amount: Number(wd.amount),
        status: 'completed',
        meta: {
          approved_by: session.username,
          marzpay_payout_reference: payoutRef,
          user_net: userNet,
        },
      });

      await supabaseAdmin.from('tesla_admin_logs').insert({
        admin_action: 'approve_withdrawal',
        target_user_id: wd.user_id,
        amount: Number(wd.amount),
        reason: null,
        meta: { withdrawal_id: withdrawalId, method: 'marzpay_payout' },
      });

      return NextResponse.json({ success: true, status: 'approved' });
    }

    // ==============================
    // REJECT — refund
    // ==============================
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
