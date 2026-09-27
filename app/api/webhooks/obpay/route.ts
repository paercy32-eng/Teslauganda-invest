export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Obpay will POST here when a payment succeeds or fails.
// We look up the deposit by reference, credit the user if successful.

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    let payload: any = null;
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }

    console.log('Obpay webhook received:', raw);

    // Extract reference + status from common webhook shapes
    const reference =
      payload?.reference ||
      payload?.data?.reference ||
      payload?.transaction?.reference ||
      null;

    const status =
      payload?.status ||
      payload?.data?.status ||
      payload?.transaction?.status ||
      null;

    if (!reference) {
      return NextResponse.json({ error: 'No reference in payload' }, { status: 400 });
    }

    // Find the pending deposit
    const { data: deposit } = await supabaseAdmin
      .from('tesla_deposits')
      .select('id, user_id, amount, status')
      .eq('reference', reference)
      .maybeSingle();

    if (!deposit) {
      console.error('Deposit not found for reference:', reference);
      return NextResponse.json({ received: true, note: 'no matching deposit' });
    }

    // If already processed, ignore
    if (deposit.status === 'approved' || deposit.status === 'rejected') {
      return NextResponse.json({ received: true, note: 'already processed' });
    }

    const normalizedStatus = String(status || '').toLowerCase();

    if (normalizedStatus === 'success' || normalizedStatus === 'successful' || normalizedStatus === 'approved' || normalizedStatus === 'completed') {
      // Credit the user
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('balance, total_deposited')
        .eq('id', deposit.user_id)
        .maybeSingle();

      if (!user) {
        console.error('User not found for deposit:', deposit.id);
        return NextResponse.json({ received: true, note: 'user missing' });
      }

      const newBalance = Number(user.balance) + Number(deposit.amount);
      const newTotalDeposited = Number(user.total_deposited) + Number(deposit.amount);

      await supabaseAdmin
        .from('users')
        .update({
          balance: newBalance,
          total_deposited: newTotalDeposited,
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
        meta: { reference, source: 'obpay_webhook' },
      });

      console.log('Deposit approved & credited:', reference, deposit.amount);
      return NextResponse.json({ received: true, credited: true });
    }

    if (normalizedStatus === 'failed' || normalizedStatus === 'cancelled' || normalizedStatus === 'rejected') {
      await supabaseAdmin
        .from('tesla_deposits')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', deposit.id);

      return NextResponse.json({ received: true, note: 'marked failed' });
    }

    // Unknown status — just acknowledge
    return NextResponse.json({ received: true, note: `unknown status: ${status}` });
  } catch (err) {
    console.error('Obpay webhook error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Some gateways send a GET for verification — respond OK
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
