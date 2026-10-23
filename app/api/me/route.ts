export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
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

    // 1. Fetch user data (Using * to prevent errors if columns are missing)
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', session.userId)
      .maybeSingle();

    if (error || !user) {
      console.error('User fetch error:', error);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Calculate total deposited (Wrapped in try/catch so it doesn't crash the app)
    let totalDeposited = 0;
    try {
      const { data: deposits } = await supabaseAdmin
        .from('payments') // If your deposits table is 'tesla_deposits', change it here
        .select('amount')
        .eq('user_id', session.userId)
        .eq('status', 'completed');

      if (deposits) {
        totalDeposited = deposits.reduce((sum, d) => sum + Number(d.amount), 0);
      }
    } catch (e) {
      console.error('Deposit calc error:', e);
    }

    // 3. Return combined data
    return NextResponse.json(
      { 
        user: {
          ...user,
          total_deposited: totalDeposited,
          total_withdrawn: Number(user.total_withdrawn || 0)
        } 
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('Me error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
