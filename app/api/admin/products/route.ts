export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';

// GET — list all products (including inactive)
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyAdminSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from('tesla_products')
      .select('id, name, subtitle, price, daily_profit, duration_days, image_url, tag, is_active, sort_order')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Products fetch error:', error);
      return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
    }

    return NextResponse.json({ products: data ?? [] });
  } catch (err) {
    console.error('Admin products GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — update a product
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyAdminSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    // Only allow specific fields
    const allowed: Record<string, unknown> = {};
    if (typeof updates.name === 'string') allowed.name = updates.name;
    if (typeof updates.subtitle === 'string') allowed.subtitle = updates.subtitle;
    if (typeof updates.price === 'number') allowed.price = updates.price;
    if (typeof updates.daily_profit === 'number') allowed.daily_profit = updates.daily_profit;
    if (typeof updates.duration_days === 'number') allowed.duration_days = updates.duration_days;
    if (typeof updates.image_url === 'string') allowed.image_url = updates.image_url;
    if (typeof updates.tag === 'string') allowed.tag = updates.tag;
    if (typeof updates.is_active === 'boolean') allowed.is_active = updates.is_active;

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('tesla_products')
      .update(allowed)
      .eq('id', id);

    if (error) {
      console.error('Product update error:', error);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    await supabaseAdmin.from('tesla_admin_logs').insert({
      admin_action: 'update_product',
      reason: null,
      meta: { product_id: id, updates: allowed },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin products POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
