export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    const eventHeader = req.headers.get('x-obpay-event') || '';

    console.log('=== OBPAY WEBHOOK ===');
    console.log('Event header:', eventHeader);
    console.log('Raw body:', raw);

    let payload: any;
    try {
      payload = JSON.parse(raw);
    } catch {
      console.error('Invalid JSON');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const event = String(payload?.event || eventHeader || '').toLowerCase();
    const data = payload?.data || payload || {};
    const reference = data?.reference || payload?.reference || null;
    const statusFromPayload = String(data?.status || '').toLowerCase();

    console.log('Parsed event:', event);
    console.log('Parsed reference:', reference);
    console.log('Parsed status:', statusFromPayload);

    if (!reference) {
      console.error('No reference in payload');
      return NextResponse.json({ received: true, note: 'no reference' });
    }

    // ============================================================
    // COLLECTION EVENTS (deposits) — log only, admin approves
    // ============================================================
    if (event.startsWith('collection.')) {
      const { data: deposit } = await supabaseAdmin
        .from('tesla_deposits')
        .select('id, user_id, amount, status')
        .eq('reference', reference)
        .maybeSingle();

      if (!deposit) {
        console.error('No deposit found:', reference);
        return NextResponse.json({ received: true, note: 'no deposit' });
      }

      if (deposit.status !== 'pending') {
        return NextResponse.json({ received: true, note: 'already processed' });
      }

      const isSuccess =
        event.includes('success') ||
        statusFromPayload === 'success' ||
        statusFromPayload === 'successful' ||
        statusFromPayload === 'completed';

      if (isSuccess) {
        // NOTE: Webhook no longer auto-approves.
        // Admin must approve manually after checking Obpay.
        console.log(
          '✓ Deposit confirmed by Obpay, awaiting admin approval:',
          reference
        );
        return NextResponse.json({
          received: true,
          note: 'awaiting admin approval',
        });
      }

      // collection.failed → mark rejected
      await supabaseAdmin
        .from('tesla_deposits')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', deposit.id);

      console.log('✗ Deposit failed:', reference);
      return NextResponse.json({ received: true, note: 'deposit failed' });
    }

    // ============================================================
    // PAYOUT EVENTS (withdrawals)
    // ============================================================
    if (event.startsWith('payout.')) {
      const match = reference.match(/^WD-([a-f0-9]{8})/i);
      if (!match) {
        console.error('Invalid payout reference format:', reference);
        return NextResponse.json({ received: true, note: 'invalid ref' });
      }

      const shortId = match[1];

      const { data: withdrawals } = await supabaseAdmin
        .from('tesla_withdrawals')
        .select('id, user_id, amount, status, meta')
        .ilike('id', `${shortId}%`)
        .limit(1);

      if (!withdrawals || withdrawals.length === 0) {
        console.error('No withdrawal found for ref:', reference);
        return NextResponse.json({ received: true, note: 'no withdrawal' });
      }

      const wd = withdrawals[0];
      const existingMeta =
        wd.meta && typeof wd.meta === 'object' ? wd.meta : {};

      const isPayoutSuccess =
        event === 'payout.success' || statusFromPayload === 'success';

      const newMeta = {
        ...existingMeta,
        obpay_status: isPayoutSuccess ? 'success' : 'failed',
        obpay_event: event,
        obpay_data: data,
        obpay_completed_at: new Date().toISOString(),
        manual_payout_required: !isPayoutSuccess,
      };

      await supabaseAdmin
        .from('tesla_withdrawals')
        .update({ meta: newMeta })
        .eq('id', wd.id);

      console.log(
        isPayoutSuccess ? '✓ Payout success:' : '✗ Payout failed:',
        reference
      );

      return NextResponse.json({
        received: true,
        payout: isPayoutSuccess ? 'success' : 'failed',
      });
    }

    console.log('Unhandled event:', event);
    return NextResponse.json({ received: true, note: `unhandled: ${event}` });
  } catch (err) {
    console.error('Obpay webhook error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
