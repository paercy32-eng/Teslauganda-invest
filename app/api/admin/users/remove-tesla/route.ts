export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyAdminSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId, rentalId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // If a specific rentalId is provided, cancel just that one
    if (rentalId) {
      const { error } = await supabaseAdmin
        .from('tesla_rentals')
        .update({ status: 'cancelled' })
        .eq('id', rentalId)
        .eq('user_id', userId);

      if (error) {
        return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 });
      }
    } else {
      // Otherwise cancel ALL active rentals for this user
      const { error } = await supabaseAdmin
        .from('tesla_rentals')
        .update({ status: 'cancelled' })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) {
        return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 });
      }
    }

    await supabaseAdmin.from('tesla_admin_logs').insert({
      admin_action: 'remove_tesla',
      target_user_id: userId,
      reason: null,
      meta: { rental_id: rentalId || 'all_active' },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Remove tesla error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
