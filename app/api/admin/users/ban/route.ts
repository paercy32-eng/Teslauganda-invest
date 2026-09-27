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

    const { userId, ban, reason } = await req.json();

    if (!userId || typeof ban !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const update: Record<string, unknown> = {
      is_banned: ban,
    };

    if (ban) {
      update.banned_reason = reason || 'Violation of terms';
      update.banned_at = new Date().toISOString();
    } else {
      update.banned_reason = null;
      update.banned_at = null;
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update(update)
      .eq('id', userId);

    if (error) {
      console.error('Ban error:', error);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    await supabaseAdmin.from('tesla_admin_logs').insert({
      admin_action: ban ? 'ban_user' : 'unban_user',
      target_user_id: userId,
      reason: reason || null,
      meta: {},
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Ban route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
