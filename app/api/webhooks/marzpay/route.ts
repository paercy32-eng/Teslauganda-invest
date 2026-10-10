import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('MarzPay Webhook received:', body);

    // Extract data from MarzPay's payload
    // Adjust the property names if MarzPay uses different keys (check their docs)
    const { reference, status, amount, transaction_id } = body;

    // 1. Check if payment was successful
    if (status === 'success' || status === 'completed') {
      
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

      // 3. Prevent double-crediting the same deposit
      if (deposit.status === 'approved') {
        console.log('Webhook: Deposit already approved:', deposit.id);
        return NextResponse.json({ success: true, message: 'Already processed' });
      }

      // 4. Update deposit status to 'approved'
      await supabaseAdmin
        .from('tesla_deposits')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString() 
        })
        .eq('id', deposit.id);

      // 5. Get the user's current balance
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('balance')
        .eq('id', deposit.user_id)
        .single();

      // 6. Update the user's balance
      if (user) {
        const newBalance = (user.balance || 0) + deposit.amount;
        await supabaseAdmin
          .from('users')
          .update({ balance: newBalance })
          .eq('id', deposit.user_id);
      }

      // 7. Log the transaction
      await supabaseAdmin.from('tesla_transactions').insert({
        user_id: deposit.user_id,
        type: 'deposit',
        amount: deposit.amount,
        status: 'completed',
        meta: { reference, transaction_id },
      });

      console.log('Webhook: Successfully credited deposit:', deposit.id);
    }

    // Always return a 200 OK to MarzPay so they know you received the webhook
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
