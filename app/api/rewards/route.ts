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

    // 2. Get team size (direct referrals)
    // Note: Adjust this query if your referral logic uses a different table/column
    const { count: teamSize } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', session.userId);

    // 3. Get team investment
    // Note: This assumes you track team investment somewhere, or you can sum up 
    // the price_paid from the rentals table for all your downlines.
    // For now, we will default to 0 if not found.
    let teamInvestment = 0;
    
    // Example (Uncomment and adjust if you have a team_investment column):
    // const { data: user } = await supabaseAdmin
    //   .from('users')
    //   .select('team_investment')
    //   .eq('id', session.userId)
    //   .single();
    // teamInvestment = user?.team_investment || 0;

    // 4. Map tiers and check if they are claimed/unlocked
    const tiers = REWARD_TIERS.map((tier) => ({
      target: tier.target,
      reward: tier.reward,
      isClaimed: teamInvestment >= tier.target, // Unlocks automatically when reached
    }));

    return NextResponse.json({
      teamInvestment,
      teamSize: teamSize || 0,
      tiers,
    });
  } catch (err) {
    console.error('Rewards API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
