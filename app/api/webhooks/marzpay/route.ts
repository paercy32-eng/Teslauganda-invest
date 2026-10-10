export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    console.log('=== MARZPAY WEBHOOK ===');
    console.log('Raw body:', raw);

    let payload: any;
    try {
      payload = JSON.parse(raw);
    } catch {
      console.error('Invalid JSON');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const eventType = String(payload?.event_type || '').toLowerCase();
    const transaction = payload?.transaction || {};
    const reference = transaction?.reference || null;
    const status = String(transaction?.status || '').toLowerCase();

    console.log('Event:', eventType);
    console.log('Reference:', reference);
    console.log('Status:', status);

    if (!reference) {
      console.error('No reference in payload');
      return NextResponse.json({ received: true, note: 'no reference' });
    }

    // Find the deposit by reference
    const { data: deposit } = await supabaseAdmin
      .from('tesla_deposits')
      .select('id, user_id, amount, status')
      .eq('reference', reference)
      .maybeSingle();

    if (!deposit) {
      console.error('No deposit found for reference:', reference);
      return NextResponse.json({ received: true, note: 'no matching deposit' });
    }

    // Duplicate protection
    if (deposit.status === 'approved' || deposit.status === 'rejected') {
      return NextResponse.json({ received: true, note: 'already processed' });
    }

    // Handle completed collection
    if (eventType === 'collection.completed' || status === 'completed') {
      // Credit user's balance
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
          total_deposited:
            Number(user.total_deposited ?? 0) + Number(deposit.amount),
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
          source: 'marzpay_webhook',
          event: eventType,
          provider: payload?.collection?.provider,
          provider_transaction_id: payload?.collection?.provider_transaction_id,
        },
      });

      console.log('✓ Deposit credited:', reference, deposit.amount);
      return NextResponse.json({ received: true, credited: true });
    }

    // Handle failed / cancelled collection
    if (
      eventType === 'collection.failed' ||
      eventType === 'collection.cancelled' ||
      status === 'failed' ||
      status === 'cancelled'
    ) {
      await supabaseAdmin
        .from('tesla_deposits')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', deposit.id);

      console.log('✗ Deposit failed/cancelled:', reference);
      return NextResponse.json({ received: true, note: 'marked failed' });
    }

    console.log('Unhandled event:', eventType);
    return NextResponse.json({ received: true, note: 'unhandled event' });
  } catch (err) {
    console.error('MarzPay webhook error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'ok' });
              }
