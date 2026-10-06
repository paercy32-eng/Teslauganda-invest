export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyAdminSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId, productId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    if (!productId) {
      return NextResponse.json({ error: 'Select a robot to grant' }, { status: 400 });
    }

    const { data: product } = await supabaseAdmin
      .from('tesla_products')
      .select('id, name, price, daily_profit, duration_days')
      .eq('id', productId)
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Insert rental with price_paid = 0
    const { error: rentalErr } = await supabaseAdmin
      .from('tesla_rentals')
      .insert({
        user_id: userId,
        product_id: product.id,
        price_paid: 0,
        daily_profit: product.daily_profit,
        duration_days: product.duration_days,
        days_remaining: product.duration_days,
        status: 'active',
      });

    if (rentalErr) {
      console.error('Grant tesla error:', rentalErr);
      return NextResponse.json({ error: 'Failed to grant' }, { status: 500 });
    }

    await supabaseAdmin.from('tesla_admin_logs').insert({
      admin_action: 'grant_tesla',
      target_user_id: userId,
      reason: null,
      meta: { product_id: product.id, product_name: product.name },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Grant tesla error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
