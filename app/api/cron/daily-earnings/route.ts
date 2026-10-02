export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Vercel Cron sends Authorization: Bearer ${CRON_SECRET}
// We check it to prevent public triggering
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // if not set, allow (dev)
  const auth = req.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}

async function handle(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Find all active rentals whose last credit was over 24h ago
  const { data: dueRentals, error } = await supabaseAdmin
    .from('tesla_rentals')
    .select('id, user_id, product_id, daily_profit, duration_days, days_remaining, total_earned, last_credit_at')
    .eq('status', 'active')
    .lt('last_credit_at', twentyFourHoursAgo.toISOString());

  if (error) {
    console.error('Cron fetch error:', error);
    return NextResponse.json({ error: 'Failed to load rentals' }, { status: 500 });
  }

  if (!dueRentals || dueRentals.length === 0) {
    return NextResponse.json({
      success: true,
      credited: 0,
      message: 'No rentals due for crediting',
    });
  }

  const results = {
    credited: 0,
    completed: 0,
    errors: 0,
    details: [] as any[],
  };

  for (const rental of dueRentals) {
    try {
      // 1. Credit daily profit to user
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('balance')
        .eq('id', rental.user_id)
        .maybeSingle();

      if (!user) {
        results.errors++;
        continue;
      }

      await supabaseAdmin
        .from('users')
        .update({ balance: Number(user.balance) + Number(rental.daily_profit) })
        .eq('id', rental.user_id);

      // 2. Log transaction
      await supabaseAdmin.from('tesla_transactions').insert({
        user_id: rental.user_id,
        type: 'daily',
        amount: Number(rental.daily_profit),
        status: 'completed',
        meta: { rental_id: rental.id, source: 'cron' },
      });

      // 3. Update rental (total_earned, days_remaining, last_credit_at)
      const newTotalEarned = Number(rental.total_earned) + Number(rental.daily_profit);
      const newDaysRemaining = Math.max(0, rental.days_remaining - 1);
      const isFinished = newDaysRemaining === 0;

      await supabaseAdmin
        .from('tesla_rentals')
        .update({
          total_earned: newTotalEarned,
          days_remaining: newDaysRemaining,
          last_credit_at: now.toISOString(),
          status: isFinished ? 'completed' : 'active',
        })
        .eq('id', rental.id);

      results.credited++;
      if (isFinished) results.completed++;
      results.details.push({
        rental_id: rental.id,
        user_id: rental.user_id,
        amount: rental.daily_profit,
        finished: isFinished,
      });
    } catch (err) {
      console.error('Credit error for rental', rental.id, err);
      results.errors++;
    }
  }

  return NextResponse.json({
    success: true,
    processed: dueRentals.length,
    ...results,
  });
}
