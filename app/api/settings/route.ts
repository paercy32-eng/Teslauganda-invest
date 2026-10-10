import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'min_deposit')
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ 
      minDeposit: Number(data?.value || 2000) 
    });
  } catch (err) {
    console.error('Settings API error:', err);
    return NextResponse.json({ minDeposit: 2000 });
  }
}
