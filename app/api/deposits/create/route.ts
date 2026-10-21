import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';
import { pesajet } from '@/lib/pesajet';

export const dynamic = 'force-dynamic';

const MIN_DEPOSIT = 2000;

export async function POST(req: NextRequest) {
  try {
    // 1. Auth Check
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const session = await verifySession(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    // 2. Parse and Validate Body
    const { amount, phone } = await req.json();
    const numAmount = Number(amount);

    if (!numAmount || isNaN(numAmount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (numAmount < MIN_DEPOSIT) {
      return NextResponse.json(
        { error: `Minimum deposit is UGX ${MIN_DEPOSIT.toLocaleString()}` },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // 3. Load User
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name, phone')
      .eq('id', session.userId)
      .maybeSingle();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // 4. Format Phone & Detect Provider using PesaJet Utils
    // PesaJet expects +256XXXXXXXXX
    const formattedPhone = pesajet.utils.formatPhoneNumber(phone);
    
    // Detect MTN or Airtel. 
    // Note: If it's a shared prefix (like 073), it returns null, so we default to 'mtn'
    let provider = pesajet.utils.detectProvider(phone);
    if (!provider) {
      provider = 'mtn'; 
    }

    // 5. Generate unique reference
    const reference = crypto.randomUUID();

    // 6. Save pending deposit row FIRST in the 'payments' table
    const { data: deposit, error: insErr } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: user.id,
        amount: numAmount,
        status: 'pending',
        reference: reference,
      })
      .select('id, reference, amount, status, created_at')
      .single();

    if (insErr || !deposit) {
      console.error('Deposit insert error:', insErr);
      return NextResponse.json({ error: 'Failed to create deposit' }, { status: 500 });
    }

    // 7. Call PesaJet to initiate the Collection (STK Push / USSD Prompt)
    try {
      const payment = await pesajet.payments.create({
        type: 'COLLECTION', // Note: If PesaJet docs say use 'DEPOSIT' instead, change this word.
        amount: numAmount,
        currency: 'UGX',
        phoneNumber: formattedPhone,
        provider: provider, // 'mtn' or 'airtel'
        reference: reference,
        description: `Deposit for ${user.name || user.phone}`,
      });

      console.log('PesaJet Collection initiated:', payment.transactionId);

      // 8. Return success
      return NextResponse.json({
        success: true,
        depositId: deposit.id,
        reference,
        amount: numAmount,
        message: 'A PIN prompt was sent to your phone. Enter your PIN to complete.',
      });

    } catch (apiError: any) {
      // If PesaJet fails, mark the deposit as failed so it doesn't stay pending forever
      console.error('PesaJet API error:', apiError);
      await supabaseAdmin.from('payments').update({ status: 'failed' }).eq('id', deposit.id);
      
      return NextResponse.json(
        { error: apiError.message || 'Payment request failed' },
        { status: 400 }
      );
    }

  } catch (err) {
    console.error('Deposit create error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
