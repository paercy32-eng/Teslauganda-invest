import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// These are the fixed tiers shown on your Rewards page
const REWARD_TIERS = [
  { target: 100000, reward: 5000 },
  { target: 300000, reward: 10000 },
  { target: 500000, reward: 20000 },
  { target: 1000000, reward: 30000 },
  { target: 1500000, reward: 40000 },
  { target: 2000000, reward: 100000 },
];

export async function GET(req: NextRequest) {
  try {
    // 1. Auth
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const session = await verifySession(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    // 2. Get team stats from the SAME RPC the Team page uses
    const { data, error } = await supabaseAdmin.rpc('user_team_stats', {
      p_user_id: session.userId,
    });

    if (error) {
      console.error('Rewards stats error:', error);
      return NextResponse.json({ error: 'Failed to load team stats' }, { status: 500 });
    }

    // 3. Calculate total network size and total investment from all levels
    const level1 = data?.levels?.['1'] || {};
    const level2 = data?.levels?.['2'] || {};
    const level3 = data?.levels?.['3'] || {};

    const teamSize =
      Number(level1.invites || 0) +
      Number(level2.invites || 0) +
      Number(level3.invites || 0);

    const teamInvestment =
      Number(level1.invest || 0) +
      Number(level2.invest || 0) +
      Number(level3.invest || 0);

    // 4. Map tiers to check if they are claimed/unlocked
    const tiers = REWARD_TIERS.map((tier) => ({
      target: tier.target,
      reward: tier.reward,
      isClaimed: teamInvestment >= tier.target,
    }));

    return NextResponse.json(
      {
        teamInvestment,
        teamSize,
        tiers,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('Rewards API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
