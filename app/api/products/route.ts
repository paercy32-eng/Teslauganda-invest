import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data: products, error } = await supabaseAdmin
      .from('tesla_products')
      .select('id, name, subtitle, price, daily_profit, duration_days, image_url, tag, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Products fetch error:', error);
      return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
    }

    return NextResponse.json({ products: products ?? [] });
  } catch (err) {
    console.error('Products route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
