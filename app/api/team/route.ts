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

    // Get my referral code
    const { data: me } = await supabaseAdmin
      .from('users')
      .select('referral_code')
      .eq('id', userId)
      .maybeSingle();

    // === LEVEL 1: users where referred_by = me ===
    const { data: level1Users } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('referred_by', userId);

    const level1Ids = (level1Users ?? []).map((u) => u.id);

    // === LEVEL 2: users where referred_by IN (level1Ids) ===
    let level2Ids: string[] = [];
    if (level1Ids.length > 0) {
      const { data: level2Users } = await supabaseAdmin
        .from('users')
        .select('id')
        .in('referred_by', level1Ids);
      level2Ids = (level2Users ?? []).map((u) => u.id);
    }

    // === LEVEL 3: users where referred_by IN (level2Ids) ===
    let level3Ids: string[] = [];
    if (level2Ids.length > 0) {
      const { data: level3Users } = await supabaseAdmin
        .from('users')
        .select('id')
        .in('referred_by', level2Ids);
      level3Ids = (level3Users ?? []).map((u) => u.id);
    }

    // === Fetch rentals for all referred users (all levels) ===
    const allReferredIds = [...level1Ids, ...level2Ids, ...level3Ids];

    let activeRentalUsers = new Set<string>();
    let investByUser: Record<string, number> = {};

    if (allReferredIds.length > 0) {
      // Active rentals → valid invites
      const { data: activeRentals } = await supabaseAdmin
        .from('tesla_rentals')
        .select('user_id')
        .in('user_id', allReferredIds)
        .eq('status', 'active');

      activeRentalUsers = new Set((activeRentals ?? []).map((r) => r.user_id));

      // All rentals → team invest
      const { data: allRentals } = await supabaseAdmin
        .from('tesla_rentals')
        .select('user_id, price_paid')
        .in('user_id', allReferredIds);

      (allRentals ?? []).forEach((r) => {
        investByUser[r.user_id] = (investByUser[r.user_id] ?? 0) + Number(r.price_paid);
      });
    }

    // === Fetch my commission earnings per referred user from tesla_referrals ===
    const { data: commissions } = await supabaseAdmin
      .from('tesla_referrals')
      .select('referred_id, level, earnings')
      .eq('referrer_id', userId);

    const earningsByLevel: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    (commissions ?? []).forEach((c) => {
      if (earningsByLevel[c.level] !== undefined) {
        earningsByLevel[c.level] += Number(c.earnings);
      }
    });

    // === Build stats per level ===
    function statsForLevel(
      ids: string[],
      level: number
    ): LevelStats {
      const count = ids.length;
      const validCount = ids.filter((id) => activeRentalUsers.has(id)).length;
      const earnings = earningsByLevel[level] ?? 0;
      const invest = ids.reduce((sum, id) => sum + (investByUser[id] ?? 0), 0);
      return { count, validCount, earnings, invest };
    }

    const level1 = statsForLevel(level1Ids, 1);
    const level2 = statsForLevel(level2Ids, 2);
    const level3 = statsForLevel(level3Ids, 3);

    const totalEarnings = level1.earnings + level2.earnings + level3.earnings;
    const totalInvites = level1.count + level2.count + level3.count;

    return NextResponse.json({
      referralCode: me?.referral_code ?? '',
      totalEarnings,
      totalInvites,
      levels: { 1: level1, 2: level2, 3: level3 },
    });
  } catch (err) {
    console.error('Team error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
