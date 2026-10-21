import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { pesajet } from '@/lib/pesajet';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify the webhook signature to ensure it's actually from PesaJet
    const signature = req.headers.get('x-webhook-signature') || '';
    const body = await req.json();

    const isValid = pesajet.webhooks.verify(body, signature);
    if (!isValid) {
      console.error('Invalid PesaJet webhook signature');
      return NextResponse.json({ error: 'Signature mismatch' }, { status: 401 });
    }

    // 2. Extract details from the payload
    const { event, status, reference, amount } = body;

    console.log(`Received PesaJet webhook: ${event} for ref ${reference}`);

    // 3. Handle successful payments
    if (event === 'payment.completed' || status === 'COMPLETED') {
      
      // Find the pending payment in your database
      const { data: payment, error: fetchErr } = await supabaseAdmin
        .from('payments')
        .select('id, user_id, status')
        .eq('reference', reference)
        .single();

      if (fetchErr || !payment) {
        console.error('Payment record not found for reference:', reference);
        return NextResponse.json({ received: true }); // Return 200 so they stop retrying
      }

      // Idempotency check: Only process if it's still pending
      if (payment.status === 'pending') {
        
        // A. Mark payment as completed
        await supabaseAdmin
          .from('payments')
          .update({ status: 'completed', reviewed_at: new Date().toISOString() })
          .eq('id', payment.id);

        // B. Credit the user's balance
        // (Assuming you have a 'balance' column in your 'users' table)
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('balance')
          .eq('id', payment.user_id)
          .single();

        if (user) {
          const newBalance = Number(user.balance || 0) + Number(amount);
          await supabaseAdmin
            .from('users')
            .update({ balance: newBalance })
            .eq('id', payment.user_id);
        }

        // C. Optional: Add to transactions table for history
        await supabaseAdmin
          .from('transactions')
          .insert({
            user_id: payment.user_id,
            amount: amount,
            type: 'deposit',
            status: 'completed',
            reference: reference
          });

        console.log(`Successfully credited UGX ${amount} to user ${payment.user_id}`);
      }
    } 
    // 4. Handle failed payments
    else if (event === 'payment.failed' || status === 'FAILED') {
      await supabaseAdmin
        .from('payments')
        .update({ status: 'failed' })
        .eq('reference', reference);
    }

    // Always return a 200 OK so PesaJet knows we received it
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('PesaJet Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
