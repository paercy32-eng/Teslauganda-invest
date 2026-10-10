export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

const MIN_DEPOSIT = 15000;

// Normalize phone to international format: +256XXXXXXXXX
function normalizePhone(input: string): string {
  let phone = (input || '').replace(/[^\d]/g, '');
  if (phone.startsWith('0')) phone = '256' + phone.slice(1);
  if (phone.startsWith('7') && phone.length === 9) phone = '256' + phone;
  return '+' + phone;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const session = await verifySession(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    // 2. Parse body
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

    const cleanPhone = String(phone).trim();
    if (!/^\+?\d{9,15}$/.test(cleanPhone)) {
      return NextResponse.json({ error: 'Enter a valid phone number' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(cleanPhone);

    // 3. Load user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name, phone')
      .eq('id', session.userId)
      .maybeSingle();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // 4. Generate unique reference (used to match webhook back)
    const reference = `SAF-${Date.now()}-${user.id.slice(0, 6)}`;

    // 5. Save pending deposit row FIRST (before calling MarzPay)
    //    This lets us match the webhook back to this record.
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

    // 6. Get MarzPay credentials
    const marzpayKey = process.env.MARZPAY_API_KEY;
    const marzpayBaseUrl = 'https://wallet.wearemarz.com/api/v1';
      const appUrl = 'https://safranfrance.vercel.app';

    if (!marzpayKey) {
      console.error('Missing MARZPAY_API_KEY');
      await supabaseAdmin
        .from('tesla_deposits')
        .update({ status: 'failed' })
        .eq('id', deposit.id);

      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    // 7. Call MarzPay collect endpoint
    const marzpayRes = await fetch(`${marzpayBaseUrl}/collections`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${marzpayKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        amount: numAmount,
        phone_number: normalizedPhone,
        callback_url: `${appUrl}/api/webhooks/marzpay`,
        description: `Safran deposit for ${user.name || user.phone}`,
        metadata: [
          { depositId: deposit.id },
          { reference },
        ],
      }),
    });

    const marzpayData = await marzpayRes.json().catch(() => ({}));
    console.log('MarzPay collect response:', marzpayData);

    if (!marzpayRes.ok || marzpayData?.success === false) {
      console.error('MarzPay collect failed:', marzpayData);
      await supabaseAdmin
        .from('tesla_deposits')
        .update({ status: 'failed' })
        .eq('id', deposit.id);

      return NextResponse.json(
        {
          error:
            marzpayData?.message ||
            marzpayData?.error ||
            'Payment request failed',
        },
        { status: 400 }
      );
    }

    // 8. Return success — PIN prompt sent to phone
    return NextResponse.json({
      success: true,
      depositId: deposit.id,
      reference,
      amount: numAmount,
      message: 'A PIN prompt was sent to your phone. Enter your PIN to complete.',
    });
  } catch (err) {
    console.error('Deposit create error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
        }
