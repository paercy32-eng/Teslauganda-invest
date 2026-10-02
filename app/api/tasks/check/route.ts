export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

// Tier structure: team_investment → reward
const TIERS = [
  { threshold: 2000000, reward: 100000 },
  { threshold: 1500000, reward: 40000 },
  { threshold: 1000000, reward: 30000 },
  { threshold: 500000, reward: 20000 },
  { threshold: 300000, reward: 10000 },
  { threshold: 100000, reward: 5000 },
];

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const session = await verifySession(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const userId = session.userId;

    // ============================================================
    // 1. Get all referrals (levels 1, 2, 3)
    // ============================================================
    const { data: level1 } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('referred_by', userId);
    const l1Ids = (level1 ?? []).map((u) => u.id);

    let l2Ids: string[] = [];
    if (l1Ids.length > 0) {
      const { data: level2 } = await supabaseAdmin
        .from('users')
        .select('id')
        .in('referred_by', l1Ids);
      l2Ids = (level2 ?? []).map((u) => u.id);
    }

    let l3Ids: string[] = [];
    if (l2Ids.length > 0) {
      const { data: level3 } = await supabaseAdmin
        .from('users')
        .select('id')
        .in('referred_by', l2Ids);
      l3Ids = (level3 ?? []).map((u) => u.id);
    }

    const allReferredIds = [...l1Ids, ...l2Ids, ...l3Ids];
    const teamSize = allReferredIds.length;

    // ============================================================
    // 2. Calculate total team investment (sum of total_deposited)
    // ============================================================
    let teamInvestment = 0;
    if (allReferredIds.length > 0) {
      const { data: referredUsers } = await supabaseAdmin
        .from('users')
        .select('total_deposited')
        .in('id', allReferredIds);

      teamInvestment = (referredUsers ?? []).reduce(
        (sum, u) => sum + Number(u.total_deposited ?? 0),
        0
      );
    }

    // ============================================================
    // 3. Find highest tier reached
    // ============================================================
    let qualifyingTier: { threshold: number; reward: number } | null = null;
    for (const t of TIERS) {
      if (teamInvestment >= t.threshold) {
        qualifyingTier = t;
        break;
      }
    }

    // ============================================================
    // 4. Check if user already claimed
    // ============================================================
    const { data: existing } = await supabaseAdmin
      .from('tesla_task_rewards')
      .select('tier, amount')
      .eq('user_id', userId)
      .maybeSingle();

    // If already claimed the same tier or higher, do nothing
    if (existing) {
      if (qualifyingTier && qualifyingTier.threshold > existing.tier) {
        // Upgraded — credit the difference of new tier minus old
        const difference = qualifyingTier.reward - Number(existing.amount);

        if (difference > 0) {
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('balance')
            .eq('id', userId)
            .maybeSingle();

          if (user) {
            await supabaseAdmin
              .from('users')
              .update({ balance: Number(user.balance) + difference })
              .eq('id', userId);

            await supabaseAdmin.from('tesla_transactions').insert({
              user_id: userId,
              type: 'task_reward',
              amount: difference,
              status: 'completed',
              meta: {
                tier: qualifyingTier.threshold,
                reward: qualifyingTier.reward,
                previous_amount: existing.amount,
              },
            });

            await supabaseAdmin
              .from('tesla_task_rewards')
              .update({
                tier: qualifyingTier.threshold,
                amount: qualifyingTier.reward,
              })
              .eq('user_id', userId);
          }

          return NextResponse.json({
            teamInvestment,
            teamSize,
            credited: difference,
            tier: qualifyingTier.threshold,
          });
        }
      }

      return NextResponse.json({
        teamInvestment,
        teamSize,
        alreadyClaimed: true,
        currentTier: existing.tier,
        currentReward: existing.amount,
        credited: 0,
      });
    }

    // ============================================================
    // 5. First-time claim
    // ============================================================
    if (!qualifyingTier) {
      return NextResponse.json({
        teamInvestment,
        teamSize,
        credited: 0,
      });
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('balance')
      .eq('id', userId)
      .maybeSingle();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await supabaseAdmin
      .from('users')
      .update({ balance: Number(user.balance) + qualifyingTier.reward })
      .eq('id', userId);

    await supabaseAdmin.from('tesla_transactions').insert({
      user_id: userId,
      type: 'task_reward',
      amount: qualifyingTier.reward,
      status: 'completed',
      meta: { tier: qualifyingTier.threshold },
    });

    await supabaseAdmin.from('tesla_task_rewards').insert({
      user_id: userId,
      tier: qualifyingTier.threshold,
      amount: qualifyingTier.reward,
    });

    return NextResponse.json({
      teamInvestment,
      teamSize,
      credited: qualifyingTier.reward,
      tier: qualifyingTier.threshold,
    });
  } catch (err) {
    console.error('Task check error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
