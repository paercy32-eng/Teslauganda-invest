import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { pesajet } from '@/lib/pesajet';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify the webhook signature
    const signature = req.headers.get('x-webhook-signature') || '';
    const body = await req.json();

    const isValid = pesajet.webhooks.verify(body, signature);
    if (!isValid) {
      console.error('Invalid PesaJet webhook signature');
      return NextResponse.json({ error: 'Signature mismatch' }, { status: 401 });
    }

    // 2. Extract details
    const { event, status, reference, amount } = body;
    console.log(`Received PesaJet webhook: ${event} for ref ${reference} (${status})`);

    const isSuccess = event === 'payment.completed' || status === 'COMPLETED';
    const isFailure = event === 'payment.failed' || status === 'FAILED';

    if (!isSuccess && !isFailure) {
      return NextResponse.json({ received: true }); // Ignore other statuses (like pending)
    }

    // ==========================================
    // 3. CHECK IF IT'S A DEPOSIT (COLLECTION)
    // ==========================================
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('id, user_id, status')
      .eq('reference', reference)
      .maybeSingle();

    if (payment) {
      if (payment.status === 'pending') {
        if (isSuccess) {
          // Mark deposit as completed
          await supabaseAdmin
            .from('payments')
            .update({ status: 'completed', reviewed_at: new Date().toISOString() })
            .eq('id', payment.id);

          // Credit user balance
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('balance')
            .eq('id', payment.user_id)
            .single();

          if (user) {
            await supabaseAdmin
              .from('users')
              .update({ balance: Number(user.balance || 0) + Number(amount) })
              .eq('id', payment.user_id);
          }

          // Log transaction
          await supabaseAdmin.from('tesla_transactions').insert({
            user_id: payment.user_id,
            amount: amount,
            type: 'deposit',
            status: 'completed',
            meta: { reference: reference }
          });

          console.log(`Deposit successful: Credited UGX ${amount} to user ${payment.user_id}`);
        } else {
          // Mark deposit as failed
          await supabaseAdmin.from('payments').update({ status: 'failed' }).eq('id', payment.id);
          console.log(`Deposit failed for ref ${reference}`);
        }
      }
      return NextResponse.json({ received: true });
    }

    // ==========================================
    // 4. CHECK IF IT'S A WITHDRAWAL (DISBURSEMENT)
    // ==========================================
    // Admin withdrawals use a 'meta' column to store the reference
    const { data: withdrawal } = await supabaseAdmin
      .from('tesla_withdrawals')
      .select('id, user_id, amount, status')
      .filter('meta->>payout_reference', 'eq', reference)
      .maybeSingle();

    if (withdrawal) {
      if (withdrawal.status === 'approved') { // Only process if currently approved (waiting for PesaJet)
        if (isSuccess) {
          // Mark withdrawal as completed
          await supabaseAdmin
            .from('tesla_withdrawals')
            .update({ status: 'completed' })
            .eq('id', withdrawal.id);
            
          console.log(`Withdrawal ${withdrawal.id} successfully paid out to user.`);
        } else {
          // 🚨 PAYOUT FAILED: We must refund the user's balance
          await supabaseAdmin
            .from('tesla_withdrawals')
            .update({ status: 'failed' })
            .eq('id', withdrawal.id);

          const { data: user } = await supabaseAdmin
            .from('users')
            .select('balance')
            .eq('id', withdrawal.user_id)
            .single();

          if (user) {
            await supabaseAdmin
              .from('users')
              .update({ balance: Number(user.balance || 0) + Number(withdrawal.amount) })
              .eq('id', withdrawal.user_id);
          }

          // Update transaction log to failed
          await supabaseAdmin
            .from('tesla_transactions')
            .update({ status: 'failed', type: 'withdrawal_failed' })
            .eq('user_id', withdrawal.user_id)
            .eq('meta->>withdrawal_id', withdrawal.id);

          console.log(`Withdrawal failed: Refunded UGX ${withdrawal.amount} to user ${withdrawal.user_id}`);
        }
      }
      return NextResponse.json({ received: true });
    }

    // If reference not found in either table
    console.log(`Webhook reference ${reference} not found in database.`);
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('PesaJet Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
