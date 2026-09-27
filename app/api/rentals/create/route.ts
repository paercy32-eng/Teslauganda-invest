export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const session = await verifySession(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 });
    }

    // 2. Load user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, balance, is_banned')
      .eq('id', session.userId)
      .maybeSingle();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.is_banned) return NextResponse.json({ error: 'Account suspended' }, { status: 403 });

    // 3. Load product
    const { data: product } = await supabaseAdmin
      .from('tesla_products')
      .select('id, name, price, daily_profit, duration_days, is_active')
      .eq('id', productId)
      .maybeSingle();

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    if (!product.is_active) return NextResponse.json({ error: 'Product unavailable' }, { status: 400 });

    const price = Number(product.price);

    // 4. Count existing rentals
    const { count: rentalCount } = await supabaseAdmin
      .from('tesla_rentals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', session.userId);

    const isFirstPurchase = (rentalCount ?? 0) === 0;

    // 5. Enforce first-purchase rule
    if (isFirstPurchase) {
      const { data: deposits } = await supabaseAdmin
        .from('tesla_deposits')
        .select('amount')
        .eq('user_id', session.userId)
        .eq('status', 'approved');

      const approvedTotal = (deposits ?? []).reduce(
        (sum, d) => sum + Number(d.amount),
        0
      );

      if (approvedTotal < price) {
        const missing = price - approvedTotal;
        return NextResponse.json(
          {
            error: `First purchase requires approved deposits of at least UGX ${price.toLocaleString()}. You need to deposit UGX ${missing.toLocaleString()} more.`,
            reason: 'first_purchase_deposit_required',
            approvedTotal,
            required: price,
            missing,
          },
          { status: 400 }
        );
      }
    }

    // 6. Check balance
    if (Number(user.balance) < price) {
      return NextResponse.json(
        {
          error: `Insufficient balance. You need UGX ${(price - Number(user.balance)).toLocaleString()} more.`,
          reason: 'insufficient_balance',
        },
        { status: 400 }
      );
    }

    // 7. Deduct balance
    await supabaseAdmin
      .from('users')
      .update({ balance: Number(user.balance) - price })
      .eq('id', session.userId);

    // 8. Create the rental
    const { data: rental, error: rentalErr } = await supabaseAdmin
      .from('tesla_rentals')
      .insert({
        user_id: session.userId,
        product_id: product.id,
        price_paid: price,
        daily_profit: product.daily_profit,
        duration_days: product.duration_days,
        days_remaining: product.duration_days,
        status: 'active',
      })
      .select('id, product_id, price_paid, daily_profit, duration_days, start_at')
      .single();

    if (rentalErr || !rental) {
      // Refund if rental creation failed
      await supabaseAdmin
        .from('users')
        .update({ balance: Number(user.balance) })
        .eq('id', session.userId);

      console.error('Rental insert error:', rentalErr);
      return NextResponse.json({ error: 'Failed to create rental' }, { status: 500 });
    }

    // 9. Update user's total_invested
    const { data: fresh } = await supabaseAdmin
      .from('users')
      .select('total_invested')
      .eq('id', session.userId)
      .maybeSingle();

    await supabaseAdmin
      .from('users')
      .update({ total_invested: Number(fresh?.total_invested ?? 0) + price })
      .eq('id', session.userId);

    // 10. Log transaction (referral commissions handled by DB trigger)
    await supabaseAdmin.from('tesla_transactions').insert({
      user_id: session.userId,
      type: 'rental',
      amount: price,
      status: 'completed',
      meta: { product_id: product.id, product_name: product.name, rental_id: rental.id },
    });

    return NextResponse.json({
      success: true,
      rental: {
        id: rental.id,
        product: product.name,
        dailyProfit: product.daily_profit,
        durationDays: product.duration_days,
      },
    });
  } catch (err) {
    console.error('Rental create error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
        }
