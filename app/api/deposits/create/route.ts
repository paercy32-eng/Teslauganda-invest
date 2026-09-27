export const dynamic = 'force-dynamic';

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

    // 2. Parse amount
    const { amount } = await req.json();
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

    // 3. Load user info
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name, phone')
      .eq('id', session.userId)
      .maybeSingle();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // 4. Build reference
    const reference = `DEP-${Date.now()}-${user.id.slice(0, 6)}`;

    // 5. Generate placeholder email (Obpay requires it)
    const email = `user-${user.phone.replace(/\D/g, '')}@teslauganda.app`;

    // 6. Save a pending deposit row first
    const { data: deposit, error: insErr } = await supabaseAdmin
      .from('tesla_deposits')
      .insert({
        user_id: user.id,
        amount: numAmount,
        status: 'pending',
        reference,
      })
      .select('id, reference, amount, status, created_at')
      .single();

    if (insErr || !deposit) {
      console.error('Deposit insert error:', insErr);
      return NextResponse.json({ error: 'Failed to create deposit' }, { status: 500 });
    }

    // 7. Send to Obpay collect endpoint
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://teslauganda-invest.vercel.app';
    const secretKey = process.env.OBPAY_SECRET_KEY;

    if (!secretKey) {
      console.error('Missing OBPAY_SECRET_KEY');
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }

    const obpayRes = await fetch('https://obpay.online/api/public/v1/collect', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: numAmount,
        phone_number: user.phone,
        customer_name: user.name,
        customer_email: email,
        reference,
        callback_url: `${appUrl}/api/webhooks/obpay`,
        description: `Tesla deposit for ${user.name}`,
      }),
    });

    const obpayData = await obpayRes.json();

    if (!obpayRes.ok || !obpayData?.success) {
      console.error('Obpay collect failed:', obpayData);
      // Mark deposit as failed
      await supabaseAdmin
        .from('tesla_deposits')
        .update({ status: 'failed' })
        .eq('id', deposit.id);

      return NextResponse.json(
        { error: obpayData?.error || 'Payment request failed' },
        { status: 400 }
      );
    }

    // 8. Return success to client. Frontend will show "Check your phone..."
    return NextResponse.json({
      success: true,
      depositId: deposit.id,
      reference,
      amount: numAmount,
      promptSent: obpayData?.data?.prompt_sent ?? true,
      checkoutUrl: obpayData?.data?.checkout_url ?? null,
      message: obpayData?.data?.message || 'A PIN prompt was sent to your phone.',
    });
  } catch (err) {
    console.error('Deposit create error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
