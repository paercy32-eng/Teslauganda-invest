import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const session = await verifySession(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const userId = session.userId;

    // 1. Get current user's referral code
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('referral_code')
      .eq('id', userId)
      .single();

    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // 2. Get Level 1 referrals (Direct)
    const { data: level1Users } = await supabaseAdmin
      .from('users')
      .select('id, name, phone, created_at')
      .eq('referred_by', userId)
      .order('created_at', { ascending: false });

    const level1Ids = (level1Users || []).map(u => u.id);

    // 3. Get Level 2 referrals
    let level2Users: any[] = [];
    if (level1Ids.length > 0) {
      const { data } = await supabaseAdmin
        .from('users')
        .select('id, name, phone, created_at')
        .in('referred_by', level1Ids)
        .order('created_at', { ascending: false });
      level2Users = data || [];
    }

    const level2Ids = level2Users.map(u => u.id);

    // 4. Get Level 3 referrals
    let level3Users: any[] = [];
    if (level2Ids.length > 0) {
      const { data } = await supabaseAdmin
        .from('users')
        .select('id, name, phone, created_at')
        .in('referred_by', level2Ids)
        .order('created_at', { ascending: false });
      level3Users = data || [];
    }

    // 5. Fetch earnings from the 'referrals' table
    const { data: earningsData } = await supabaseAdmin
      .from('referrals')
      .select('referred_id, earnings')
      .eq('referrer_id', userId);

    const earningsMap: Record<string, number> = {};
    let totalEarnings = 0;

    if (earningsData) {
      earningsData.forEach((row) => {
        const amount = Number(row.earnings) || 0;
        earningsMap[row.referred_id] = (earningsMap[row.referred_id] || 0) + amount;
        totalEarnings += amount;
      });
    }

    // 6. Format the entries for the frontend
    const formatEntry = (user: any) => ({
      id: user.id,
      referred_id: user.id,
      name: user.name,
      phone: user.phone,
      joined_at: user.created_at,
      earnings: earningsMap[user.id] || 0,
    });

    return NextResponse.json({
      referralCode: currentUser.referral_code,
      totalEarnings: totalEarnings,
      counts: {
        level1: level1Users?.length || 0,
        level2: level2Users.length,
        level3: level3Users.length,
      },
      levels: {
        level1: (level1Users || []).map(formatEntry),
        level2: level2Users.map(formatEntry),
        level3: level3Users.map(formatEntry),
      },
    });

  } catch (err) {
    console.error('Team stats error:', err);
    return NextResponse.json({ error: 'Failed to load team' }, { status: 500 });
  }
}
