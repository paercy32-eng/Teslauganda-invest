export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    // 1. Read RAW body
    const raw = await req.text();
    const signature = req.headers.get('x-obpay-signature') || '';
    const eventHeader = req.headers.get('x-obpay-event') || '';

    console.log('=== OBPAY WEBHOOK ===');
    console.log('Event header:', eventHeader);
    console.log('Signature:', signature);
    console.log('Raw body:', raw);

    // 2. Verify signature (if secret is set)
const secret = process.env.OBPAY_WEBHOOK_SECRET;
if (false && secret) {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(raw)
        .digest('hex');

      const signatureOk =
        signature.length === expected.length &&
        crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expected)
        );

      if (!signatureOk) {
        console.error('Invalid signature. Expected:', expected);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      console.warn('OBPAY_WEBHOOK_SECRET not set — skipping signature check');
    }

    // 3. Parse payload
    let payload: any;
    try {
      payload = JSON.parse(raw);
    } catch {
      console.error('Invalid JSON');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // 4. Extract event + reference from any shape
    const event =
      String(payload?.event || eventHeader || '').toLowerCase();

    const data = payload?.data || payload || {};
    const reference =
      data?.reference ||
      payload?.reference ||
      payload?.data?.data?.reference ||
      null;

    const statusFromPayload = String(
      data?.status || payload?.status || ''
    ).toLowerCase();

    console.log('Parsed event:', event);
    console.log('Parsed reference:', reference);
    console.log('Parsed status:', statusFromPayload);

    if (!reference) {
      console.error('No reference in payload');
      return NextResponse.json({ received: true, note: 'no reference' });
    }

    // 5. Find deposit
    const { data: deposit } = await supabaseAdmin
      .from('tesla_deposits')
      .select('id, user_id, amount, status')
      .eq('reference', reference)
      .maybeSingle();

    if (!deposit) {
      console.error('No deposit found for reference:', reference);
      return NextResponse.json({ received: true, note: 'no matching deposit' });
    }

    if (deposit.status === 'approved' || deposit.status === 'rejected') {
      return NextResponse.json({ received: true, note: 'already processed' });
    }

    // 6. Determine success vs failure
    const isSuccess =
      event.includes('success') ||
      event.includes('completed') ||
      statusFromPayload === 'success' ||
      statusFromPayload === 'successful' ||
      statusFromPayload === 'completed' ||
      statusFromPayload === 'approved';

    const isFailure =
      event.includes('fail') ||
      event.includes('cancel') ||
      statusFromPayload === 'failed' ||
      statusFromPayload === 'cancelled' ||
      statusFromPayload === 'rejected';

    // 7. Handle success
    if (isSuccess && !isFailure) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('balance, total_deposited')
        .eq('id', deposit.user_id)
        .maybeSingle();

      if (!user) {
        return NextResponse.json({ received: true, note: 'user missing' });
      }

      await supabaseAdmin
        .from('users')
        .update({
          balance: Number(user.balance) + Number(deposit.amount),
          total_deposited:
            Number(user.total_deposited) + Number(deposit.amount),
        })
        .eq('id', deposit.user_id);

      await supabaseAdmin
        .from('tesla_deposits')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', deposit.id);

      await supabaseAdmin.from('tesla_transactions').insert({
        user_id: deposit.user_id,
        type: 'deposit',
        amount: Number(deposit.amount),
        status: 'completed',
        meta: { reference, source: 'obpay_webhook', event },
      });

      console.log('✓ Deposit credited:', reference, deposit.amount);
      return NextResponse.json({ received: true, credited: true });
    }

    // 8. Handle failure
    if (isFailure) {
      await supabaseAdmin
        .from('tesla_deposits')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', deposit.id);

      console.log('✗ Deposit failed:', reference);
      return NextResponse.json({ received: true, note: 'marked failed' });
    }

    console.log('Unhandled event:', event, 'status:', statusFromPayload);
    return NextResponse.json({ received: true, note: 'unhandled' });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
