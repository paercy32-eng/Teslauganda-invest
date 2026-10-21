export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyAdminSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      console.error('Admin products fetch error:', error);
      return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
    }

    return NextResponse.json({ products: data ?? [] });
  } catch (err) {
    console.error('Admin products error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyAdminSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, productId } = body;

    if (!productId || !action) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (action === 'toggle_status') {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('is_active')
        .eq('id', productId)
        .maybeSingle();

      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

      const newStatus = !product.is_active;
      
      await supabaseAdmin
        .from('products')
        .update({ is_active: newStatus })
        .eq('id', productId);

      return NextResponse.json({ success: true, message: `Product ${newStatus ? 'activated' : 'deactivated'}` });
    }

    if (action === 'update_details') {
      const { name, price, cycle_days, daily_return } = body;
      
      if (!name || !price || !cycle_days || !daily_return) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
      }

      await supabaseAdmin
        .from('products')
        .update({
          name,
          price: Number(price),
          cycle_days: Number(cycle_days),
          daily_return: Number(daily_return),
        })
        .eq('id', productId);

      return NextResponse.json({ success: true, message: 'Product updated successfully' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Admin products action error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
