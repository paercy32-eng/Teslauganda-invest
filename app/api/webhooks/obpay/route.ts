export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    // 1. Read the RAW body (must not be parsed first — signature is on raw bytes)
    const raw = await req.text();
    const signature = req.headers.get('x-obpay-signature') || '';

    // 2. Verify signature
    const secret = process.env.OBPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error('Missing OBPAY_WEBHOOK_SECRET');
      return NextResponse.json({ error: 'Not configured' }, { status: 500 });
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(raw)
      .digest('hex');

    const signatureOk =
      signature.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

    if (!signatureOk) {
      console.error('Invalid Obpay webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3. Parse payload
    let payload: any;
    try {
      payload = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const event = String(payload?.event || '');
    const data = payload?.data || {};
    const reference = data?.reference || null;
    const amount = Number(data?.amount || 0);

    if (!reference) {
      console.error('Webhook missing reference:', payload);
      return NextResponse.json({ received: true, note: 'no reference' });
    }

    // 4. Find deposit by reference
    const { data: deposit } = await supabaseAdmin
      .from('tesla_deposits')
      .select('id, user_id, amount, status')
      .eq('reference', reference)
      .maybeSingle();

    if (!deposit) {
      console.error('No deposit found for reference:', reference);
      return NextResponse.json({ received: true, note: 'no matching deposit' });
    }

    // 5. Duplicate protection
    if (deposit.status === 'approved' || deposit.status === 'rejected') {
      return NextResponse.json({ received: true, note: 'already processed' });
    }

    // 6. Handle by event
    if (event === 'collection.success') {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('balance, total_deposited')
        .eq('id', deposit.user_id)
        .maybeSingle();

      if (!user) {
        console.error('User not found for deposit:', deposit.id);
        return NextResponse.json({ received: true, note: 'user missing' });
      }

      await supabaseAdmin
        .from('users')
        .update({
          balance: Number(user.balance) + Number(deposit.amount),
          total_deposited: Number(user.total_deposited) + Number(deposit.amount),
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
        meta: {
          reference,
          obpay_amount: amount,
          source: 'obpay_webhook',
        },
      });

      console.log('✓ Deposit credited:', reference, deposit.amount);
      return NextResponse.json({ received: true, credited: true });
    }

    if (event === 'collection.failed') {
      await supabaseAdmin
        .from('tesla_deposits')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', deposit.id);

      return NextResponse.json({ received: true, note: 'marked failed' });
    }

    // Unknown event
    console.log('Unhandled Obpay event:', event);
    return NextResponse.json({ received: true, note: `unhandled event: ${event}` });
  } catch (err) {
    console.error('Obpay webhook error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
