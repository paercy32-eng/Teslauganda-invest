export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

const CHECKIN_BONUS = 200;

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const session = await verifySession(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    // 2. Load user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, balance, last_checkin_at')
      .eq('id', session.userId)
      .maybeSingle();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // 3. Calculate today's date in East Africa Time (EAT = UTC+3)
    const nowUTC = new Date();
    const nowEAT = new Date(nowUTC.getTime() + 3 * 60 * 60 * 1000);
    const todayStartEAT = Date.UTC(
      nowEAT.getUTCFullYear(),
      nowEAT.getUTCMonth(),
      nowEAT.getUTCDate(),
      0, 0, 0, 0
    );

    // 4. Check if already checked in today
    if (user.last_checkin_at) {
      const lastCheckinUTC = new Date(user.last_checkin_at).getTime();
      const lastCheckinEAT = lastCheckinUTC + 3 * 60 * 60 * 1000;

      if (lastCheckinEAT >= todayStartEAT) {
        return NextResponse.json(
          { error: 'You have already checked in today. Come back tomorrow!' },
          { status: 400 }
        );
      }
    }

    // 5. Add bonus to balance
    const newBalance = Number(user.balance ?? 0) + CHECKIN_BONUS;

    await supabaseAdmin
      .from('users')
      .update({
        balance: newBalance,
        last_checkin_at: nowUTC.toISOString(),
      })
      .eq('id', session.userId);

    // 6. Log the transaction
    await supabaseAdmin.from('tesla_transactions').insert({
      user_id: session.userId,
      type: 'daily_checkin',
      amount: CHECKIN_BONUS,
      status: 'completed',
      meta: { reason: 'Daily check-in bonus' },
    });

    return NextResponse.json({
      success: true,
      bonus: CHECKIN_BONUS,
      newBalance,
      message: `You received UGX ${CHECKIN_BONUS.toLocaleString()} for checking in today!`,
    });

  } catch (err) {
    console.error('Check-in error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const session = await verifySession(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('last_checkin_at')
      .eq('id', session.userId)
      .maybeSingle();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Check if already checked in today (EAT timezone)
    let canCheckIn = true;
    if (user.last_checkin_at) {
      const nowUTC = new Date();
      const nowEAT = new Date(nowUTC.getTime() + 3 * 60 * 60 * 1000);
      const todayStartEAT = Date.UTC(
        nowEAT.getUTCFullYear(),
        nowEAT.getUTCMonth(),
        nowEAT.getUTCDate(),
        0, 0, 0, 0
      );
      const lastCheckinUTC = new Date(user.last_checkin_at).getTime();
      const lastCheckinEAT = lastCheckinUTC + 3 * 60 * 60 * 1000;
      if (lastCheckinEAT >= todayStartEAT) {
        canCheckIn = false;
      }
    }

    return NextResponse.json({
      canCheckIn,
      bonus: 200,
      lastCheckinAt: user.last_checkin_at,
    });
  } catch (err) {
    console.error('Check-in GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
