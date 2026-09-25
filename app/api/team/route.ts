export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userId = session.userId;

    // Get user info (referral code)
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('referral_code')
      .eq('id', userId)
      .maybeSingle();

    // Get all referrals where this user is the referrer
    const { data: referrals } = await supabaseAdmin
      .from('tesla_referrals')
      .select('level, earnings, referred_id')
      .eq('referrer_id', userId);

    const all = referrals ?? [];

    // Build stats per level
    function statsForLevel(level: number) {
      const filtered = all.filter((r) => r.level === level);
      const count = filtered.length;
      const earnings = filtered.reduce((sum, r) => sum + Number(r.earnings), 0);
      return { count, earnings };
    }

    const level1 = statsForLevel(1);
    const level2 = statsForLevel(2);
    const level3 = statsForLevel(3);

    const totalEarnings = level1.earnings + level2.earnings + level3.earnings;
    const totalInvites = all.length;

    return NextResponse.json({
      referralCode: user?.referral_code ?? '',
      totalEarnings,
      totalInvites,
      levels: {
        1: level1,
        2: level2,
        3: level3,
      },
    });
  } catch (err) {
    console.error('Team error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
