import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('MarzPay Webhook received:', JSON.stringify(body));

    const { event_type, transaction, collection } = body;

    // 1. Check if the event is a successful collection
    if (event_type === 'collection.completed') {
      
      // The reference is inside the transaction object
      const reference = transaction?.reference;
      
      if (!reference) {
        console.error('Webhook: No reference found in transaction');
        return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
      }

      // 2. Find the pending deposit in your database using the reference
      const { data: deposit, error: findError } = await supabaseAdmin
        .from('tesla_deposits')
        .select('*')
        .eq('reference', reference)
        .maybeSingle();

      if (findError || !deposit) {
        console.error('Webhook: Deposit not found for ref:', reference);
        return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
      }

      // 3. Prevent double-crediting
      if (deposit.status === 'approved') {
        console.log('Webhook: Deposit already approved:', deposit.id);
        return NextResponse.json({ success: true, message: 'Already processed' });
      }

      // 4. Get the actual amount deposited (MarzPay sends raw amount in collection.amount.raw)
      const depositAmount = collection?.amount?.raw || deposit.amount;

      // 5. Update deposit status to 'approved'
      await supabaseAdmin
        .from('tesla_deposits')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString() 
        })
        .eq('id', deposit.id);

      // 6. Get the user's current balance
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('balance')
        .eq('id', deposit.user_id)
        .single();

      // 7. Update the user's balance
      if (user) {
        const newBalance = (user.balance || 0) + depositAmount;
        await supabaseAdmin
          .from('users')
          .update({ balance: newBalance })
          .eq('id', deposit.user_id);
      }

      // 8. Log the transaction
      await supabaseAdmin.from('tesla_transactions').insert({
        user_id: deposit.user_id,
        type: 'deposit',
        amount: depositAmount,
        status: 'completed',
        meta: { reference, provider_transaction_id: collection?.provider_transaction_id },
      });

      console.log('Webhook: Successfully credited deposit:', deposit.id);
    } 
    else if (event_type === 'collection.failed') {
      // Handle failed payment
      const reference = transaction?.reference;
      if (reference) {
        await supabaseAdmin
          .from('tesla_deposits')
          .update({ status: 'failed' })
          .eq('reference', reference);
      }
      console.log('Webhook: Collection failed for ref:', reference);
    }

    // Always return a 200 OK to MarzPay
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
