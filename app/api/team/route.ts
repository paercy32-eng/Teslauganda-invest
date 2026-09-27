export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

type LevelStats = {
  count: number;
  validCount: number;
  earnings: number;
  invest: number;
};

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const session = await verifySession(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const userId = session.userId;

    // Get referral code
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
    const referredIds = all.map((r) => r.referred_id);

    // Which referred users have at least one active rental?
    let activeReferredIds = new Set<string>();
    if (referredIds.length > 0) {
      const { data: activeRentals } = await supabaseAdmin
        .from('tesla_rentals')
        .select('user_id')
        .in('user_id', referredIds)
        .eq('status', 'active');

      activeReferredIds = new Set((activeRentals ?? []).map((r) => r.user_id));
    }

    // Total invested per referred user (sum of price_paid across all their rentals)
    const investByUser: Record<string, number> = {};
    if (referredIds.length > 0) {
      const { data: allRentals } = await supabaseAdmin
        .from('tesla_rentals')
        .select('user_id, price_paid')
        .in('user_id', referredIds);

      (allRentals ?? []).forEach((r) => {
        investByUser[r.user_id] = (investByUser[r.user_id] ?? 0) + Number(r.price_paid);
      });
    }

    function statsForLevel(level: number): LevelStats {
      const filtered = all.filter((r) => r.level === level);
      const count = filtered.length;
      const validCount = filtered.filter((r) => activeReferredIds.has(r.referred_id)).length;
      const earnings = filtered.reduce((sum, r) => sum + Number(r.earnings), 0);
      const invest = filtered.reduce(
        (sum, r) => sum + (investByUser[r.referred_id] ?? 0),
        0
      );
      return { count, validCount, earnings, invest };
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
      levels: { 1: level1, 2: level2, 3: level3 },
    });
  } catch (err) {
    console.error('Team error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
