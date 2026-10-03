export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

const MIN_WITHDRAW = 4000;
const WITHDRAW_OPEN_HOUR = 9;  // 9 AM EAT
const WITHDRAW_CLOSE_HOUR = 19; // 7 PM EAT

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const session = await verifySession(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
// Check withdrawal time window (EAT = UTC+3)
const nowUTC = new Date();
const eatHour = (nowUTC.getUTCHours() + 3) % 24;

if (eatHour < WITHDRAW_OPEN_HOUR || eatHour >= WITHDRAW_CLOSE_HOUR) {
  return NextResponse.json(
    {
      error: `Withdrawals are only available between 9:00 AM and 7:00 PM EAT. Try again during these hours.`,
    },
    { status: 400 }
  );
}

    const { amount, phone, fullName } = await req.json();
    const numAmount = Number(amount);

    if (!numAmount || isNaN(numAmount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (numAmount < MIN_WITHDRAW) {
      return NextResponse.json(
        { error: `Minimum withdrawal is UGX ${MIN_WITHDRAW.toLocaleString()}` },
        { status: 400 }
      );
    }

    if (!phone || !fullName) {
      return NextResponse.json(
        { error: 'Phone and full name are required' },
        { status: 400 }
      );
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, balance, is_banned')
      .eq('id', session.userId)
      .maybeSingle();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.is_banned) {
      return NextResponse.json({ error: 'Account suspended' }, { status: 403 });
    }

    if (Number(user.balance) < numAmount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Deduct balance immediately
    await supabaseAdmin
      .from('users')
      .update({ balance: Number(user.balance) - numAmount })
      .eq('id', session.userId);

    // Create the withdrawal request
    const { data: withdrawal, error: insErr } = await supabaseAdmin
      .from('tesla_withdrawals')
      .insert({
        user_id: session.userId,
        amount: numAmount,
        status: 'pending',
        phone: phone.trim(),
        full_name: fullName.trim(),
      })
      .select('id, amount, status, created_at')
      .single();

    if (insErr || !withdrawal) {
      // Refund if insertion failed
      await supabaseAdmin
        .from('users')
        .update({ balance: Number(user.balance) })
        .eq('id', session.userId);

      console.error('Withdrawal insert error:', insErr);
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }

    // Log transaction
    await supabaseAdmin.from('tesla_transactions').insert({
      user_id: session.userId,
      type: 'withdrawal_request',
      amount: numAmount,
      status: 'pending',
      meta: { withdrawal_id: withdrawal.id, phone, full_name: fullName },
    });

    return NextResponse.json({
      success: true,
      withdrawalId: withdrawal.id,
      amount: numAmount,
      netAmount: Math.round(numAmount * 0.85),
      fee: Math.round(numAmount * 0.15),
    });
  } catch (err) {
    console.error('Withdrawal create error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
