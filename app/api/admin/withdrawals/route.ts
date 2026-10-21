export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';
import { pesajet } from '@/lib/pesajet'; // <-- Added PesaJet Import

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

    if (status === 'approved') {
      // Include both approved and completed in the 'approved' filter
      query = query.in('status', ['approved', 'completed']);
    } else if (status !== 'all') {
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

// POST — approve, reject, mark_completed, or mark_failed
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyAdminSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { withdrawalId, action } = await req.json();

    if (!withdrawalId || !['approve', 'reject', 'mark_completed', 'mark_failed'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { data: wd } = await supabaseAdmin
      .from('tesla_withdrawals')
      .select('id, user_id, amount, status, phone, full_name, meta')
      .eq('id', withdrawalId)
      .maybeSingle();

    if (!wd) return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });

    // Only allow approve/reject if it's still pending
    if ((action === 'approve' || action === 'reject') && wd.status !== 'pending') {
      return NextResponse.json({ error: `Already ${wd.status}` }, { status: 400 });
    }

    // ==============================
    // APPROVE (PesaJet Payout)
    // ==============================
    if (action === 'approve') {
      const existingMeta = (wd.meta && typeof wd.meta === 'object') ? wd.meta : {};
      const alreadySent = (existingMeta as any)?.pesajet_payout?.transactionId;

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
      const payoutName = wd.full_name || payer?.name || 'User';
      const userNet = Math.round(Number(wd.amount) * 0.85); // 85% net

      // 1. Format Phone for PesaJet (+256...)
      const formattedPhone = pesajet.utils.formatPhoneNumber(payoutPhoneRaw);
      
      // 2. Detect Network Provider
      let provider = pesajet.utils.detectProvider(payoutPhoneRaw);
      if (!provider) {
        provider = 'mtn'; // Fallback if shared network (e.g., 073)
      }

      // 3. Generate unique reference
      const payoutRef = crypto.randomUUID();

      try {
        // 4. Send the money via PesaJet
        const payout = await pesajet.payments.create({
          type: 'DISBURSEMENT',
          amount: userNet,
          currency: 'UGX',
          phoneNumber: formattedPhone,
          provider: provider,
          reference: payoutRef,
          description: `Withdrawal payout for ${payoutName}`,
        });

        console.log('PesaJet Payout initiated:', payout.transactionId);

        // Update withdrawal: status = approved
        await supabaseAdmin
          .from('tesla_withdrawals')
          .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            meta: {
              pesajet_payout: payout,
              payout_reference: payoutRef,
              user_net: userNet,
              payout_phone: formattedPhone,
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

        // Update the existing 'withdrawal_request' transaction
        await supabaseAdmin
          .from('tesla_transactions')
          .update({
            type: 'withdrawal',
            status: 'completed',
            meta: {
              approved_by: session.username,
              pesajet_payout_reference: payoutRef,
              user_net: userNet,
              withdrawal_id: withdrawalId,
            },
          })
          .eq('user_id', wd.user_id)
          .eq('type', 'withdrawal_request')
          .eq('meta->>withdrawal_id', withdrawalId);

        await supabaseAdmin.from('tesla_admin_logs').insert({
          admin_action: 'approve_withdrawal',
          target_user_id: wd.user_id,
          amount: Number(wd.amount),
          reason: null,
          meta: { withdrawal_id: withdrawalId, method: 'pesajet_payout' },
        });

        return NextResponse.json({ success: true, status: 'approved' });

      } catch (apiError: any) {
        console.error('PesaJet Payout failed:', apiError);
        return NextResponse.json(
          { error: apiError.message || 'Payout request failed' },
          { status: 400 }
        );
      }
    }

    // ==============================
    // REJECT — refund
    // ==============================
    if (action === 'reject') {
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

      // Update the original request to rejected
      await supabaseAdmin
        .from('tesla_transactions')
        .update({
          status: 'rejected',
          meta: {
            rejected_by: session.username,
            withdrawal_id: withdrawalId,
          },
        })
        .eq('user_id', wd.user_id)
        .eq('type', 'withdrawal_request')
        .eq('meta->>withdrawal_id', withdrawalId);

      await supabaseAdmin.from('tesla_admin_logs').insert({
        admin_action: 'reject_withdrawal',
        target_user_id: wd.user_id,
        amount: Number(wd.amount),
        reason: null,
        meta: { withdrawal_id: withdrawalId },
      });

      return NextResponse.json({ success: true, status: 'rejected' });
    }

    // ==============================
    // MARK COMPLETED
    // ==============================
    if (action === 'mark_completed') {
      await supabaseAdmin
        .from('tesla_withdrawals')
        .update({
          status: 'completed',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId);

      await supabaseAdmin.from('tesla_admin_logs').insert({
        admin_action: 'mark_withdrawal_completed',
        target_user_id: wd.user_id,
        amount: Number(wd.amount),
        reason: null,
        meta: { withdrawal_id: withdrawalId },
      });

      return NextResponse.json({ success: true, status: 'completed' });
    }

    // ==============================
    // MARK FAILED
    // ==============================
    if (action === 'mark_failed') {
      await supabaseAdmin
        .from('tesla_withdrawals')
        .update({
          status: 'failed',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId);

      // Refund the user's balance
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('balance')
        .eq('id', wd.user_id)
        .maybeSingle();

      await supabaseAdmin
        .from('users')
        .update({ balance: Number(user?.balance ?? 0) + Number(wd.amount) })
        .eq('id', wd.user_id);

      // Update the transaction to failed
      await supabaseAdmin
        .from('tesla_transactions')
        .update({
          status: 'failed',
          type: 'withdrawal_failed',
          meta: {
            failed_by: session.username,
            withdrawal_id: withdrawalId,
          },
        })
        .eq('user_id', wd.user_id)
        .eq('type', 'withdrawal_request')
        .eq('meta->>withdrawal_id', withdrawalId);

      await supabaseAdmin.from('tesla_admin_logs').insert({
        admin_action: 'mark_withdrawal_failed',
        target_user_id: wd.user_id,
        amount: Number(wd.amount),
        reason: null,
        meta: { withdrawal_id: withdrawalId },
      });

      return NextResponse.json({ success: true, status: 'failed' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (err) {
    console.error('Admin withdrawals action error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
                         }
