export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

const MIN_DEPOSIT = 15000;

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const session = await verifySession(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    // 2. Parse body
    const { amount, phone, paymentMethod, transactionId } = await req.json();
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

    if (!phone || !paymentMethod || !transactionId) {
      return NextResponse.json(
        { error: 'Phone, payment method, and transaction ID are required' },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).trim();
    const cleanTxnId = String(transactionId).trim().toUpperCase();
    const cleanMethod = String(paymentMethod).trim();

    if (!['mtn', 'airtel'].includes(cleanMethod)) {
  return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    if (!/^\+?\d{9,15}$/.test(cleanPhone)) {
      return NextResponse.json({ error: 'Enter a valid phone number' }, { status: 400 });
    }

    if (cleanTxnId.length < 4) {
      return NextResponse.json(
        { error: 'Enter a valid transaction ID' },
        { status: 400 }
      );
    }

    // 3. Load user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name, phone')
      .eq('id', session.userId)
      .maybeSingle();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // 4. Check duplicate transaction ID
    const { data: existing } = await supabaseAdmin
      .from('tesla_deposits')
      .select('id')
      .eq('transaction_id', cleanTxnId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'This transaction ID has already been submitted.' },
        { status: 409 }
      );
    }

    // 5. Generate reference
    const reference = `DEP-${Date.now()}-${user.id.slice(0, 6)}`;

    // 6. Save pending deposit
    const { data: deposit, error: insErr } = await supabaseAdmin
      .from('tesla_deposits')
      .insert({
        user_id: user.id,
        amount: numAmount,
        status: 'pending',
        reference,
        payment_method: cleanMethod,
        transaction_id: cleanTxnId,
      })
      .select('id, reference, amount, status, created_at')
      .single();

    if (insErr || !deposit) {
      console.error('Deposit insert error:', insErr);
      return NextResponse.json({ error: 'Failed to create deposit' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      depositId: deposit.id,
      reference,
      amount: numAmount,
      message:
        'Deposit submitted. Our team will verify and credit your account shortly.',
    });
  } catch (err) {
    console.error('Deposit create error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
