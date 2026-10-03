export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const session = await verifySession(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const { data, error } = await supabaseAdmin.rpc('user_team_stats', {
      p_user_id: session.userId,
    });

    if (error) {
      console.error('Team stats error:', error);
      return NextResponse.json({ error: 'Failed to load team stats' }, { status: 500 });
    }

    return NextResponse.json(
      {
        referralCode: data?.referral_code ?? '',
        totalEarnings: Number(data?.total_income ?? 0),
        totalInvites: Number(data?.total_invites ?? 0),
        levels: {
          1: {
            count: Number(data?.levels?.['1']?.invites ?? 0),
            validCount: Number(data?.levels?.['1']?.valid ?? 0),
            earnings: Number(data?.levels?.['1']?.income ?? 0),
            invest: Number(data?.levels?.['1']?.invest ?? 0),
          },
          2: {
            count: Number(data?.levels?.['2']?.invites ?? 0),
            validCount: Number(data?.levels?.['2']?.valid ?? 0),
            earnings: Number(data?.levels?.['2']?.income ?? 0),
            invest: Number(data?.levels?.['2']?.invest ?? 0),
          },
          3: {
            count: Number(data?.levels?.['3']?.invites ?? 0),
            validCount: Number(data?.levels?.['3']?.valid ?? 0),
            earnings: Number(data?.levels?.['3']?.income ?? 0),
            invest: Number(data?.levels?.['3']?.invest ?? 0),
          },
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('Team route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
