export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

const TIERS = [
  { count: 300, amount: 100000 },
  { count: 100, amount: 50000 },
  { count: 50, amount: 30000 },
  { count: 20, amount: 10000 },
  { count: 5, amount: 5000 },
];

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const session = await verifySession(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const userId = session.userId;

    // Count valid invites = referred users with at least one active rental
    const { data: refs } = await supabaseAdmin
      .from('tesla_referrals')
      .select('referred_id, level')
      .eq('referrer_id', userId)
      .eq('level', 1); // direct invites only

    const referredIds = (refs ?? []).map((r) => r.referred_id);

    let validCount = 0;
    if (referredIds.length > 0) {
      const { data: activeRentals } = await supabaseAdmin
        .from('tesla_rentals')
        .select('user_id')
        .in('user_id', referredIds)
        .eq('status', 'active');

      validCount = new Set((activeRentals ?? []).map((r) => r.user_id)).size;
    }

    // Find highest tier achieved
    let qualifyingTier: { count: number; amount: number } | null = null;
    for (const t of TIERS) {
      if (validCount >= t.count) {
        qualifyingTier = t;
        break;
      }
    }

    // Already claimed?
    const { data: existing } = await supabaseAdmin
      .from('tesla_task_rewards')
      .select('id, tier, amount')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        validCount,
        alreadyClaimed: true,
        currentReward: existing.amount,
        currentTier: existing.tier,
        credited: 0,
      });
    }

    if (!qualifyingTier) {
      return NextResponse.json({
        validCount,
        alreadyClaimed: false,
        credited: 0,
      });
    }

    // Credit reward
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('balance')
      .eq('id', userId)
      .maybeSingle();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await supabaseAdmin
      .from('users')
      .update({ balance: Number(user.balance) + qualifyingTier.amount })
      .eq('id', userId);

    await supabaseAdmin.from('tesla_transactions').insert({
      user_id: userId,
      type: 'task_reward',
      amount: qualifyingTier.amount,
      status: 'completed',
      meta: { tier: qualifyingTier.count },
    });

    await supabaseAdmin.from('tesla_task_rewards').insert({
      user_id: userId,
      tier: qualifyingTier.count,
      amount: qualifyingTier.amount,
    });

    return NextResponse.json({
      validCount,
      alreadyClaimed: false,
      credited: qualifyingTier.amount,
      tier: qualifyingTier.count,
    });
  } catch (err) {
    console.error('Task check error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
