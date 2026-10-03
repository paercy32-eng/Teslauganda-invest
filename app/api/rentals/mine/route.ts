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

    const { data: rentals, error } = await supabaseAdmin.rpc('user_rentals', {
      p_user_id: session.userId,
    });

    if (error) {
      console.error('Rentals fetch error:', error);
      return NextResponse.json({ error: 'Failed to load rentals' }, { status: 500 });
    }

    const formatted = (rentals ?? []).map((r: any) => ({
      id: r.id,
      product_id: r.product_id,
      product_name: r.product_name ?? 'Robot',
      price_paid: Number(r.price_paid),
      daily_profit: Number(r.daily_profit),
      duration_days: r.duration_days,
      days_remaining: r.days_remaining,
      total_earned: Number(r.total_earned),
      start_at: r.start_at,
      last_credit_at: r.last_credit_at,
      status: r.status,
    }));

    return NextResponse.json(
      { rentals: formatted },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('Rentals mine error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
