export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyAdminSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim().toLowerCase() ?? '';

    // Fetch all users
    let query = supabaseAdmin
      .from('users')
      .select(
        'id, name, phone, balance, total_deposited, total_invested, total_withdrawn, is_banned, banned_reason, referral_code, created_at'
      )
      .order('created_at', { ascending: false });

    if (q) {
      query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Admin users fetch error:', error);
      return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
    }

    // Get valid invites count per user (referred users with at least 1 active rental)
    const userIds = (users ?? []).map((u) => u.id);

    let validInvitesMap: Record<string, number> = {};
    let activeRentalsMap: Record<string, number> = {};

    if (userIds.length > 0) {
      // Referrals where each user is referrer
      const { data: refs } = await supabaseAdmin
        .from('tesla_referrals')
        .select('referrer_id, referred_id')
        .in('referrer_id', userIds);

      const referredIds = (refs ?? []).map((r) => r.referred_id);

      // Which of those referred users have at least one active rental?
      let activeReferredIds = new Set<string>();
      if (referredIds.length > 0) {
        const { data: rentals } = await supabaseAdmin
          .from('tesla_rentals')
          .select('user_id')
          .in('user_id', referredIds)
          .eq('status', 'active');

        activeReferredIds = new Set((rentals ?? []).map((r) => r.user_id));
      }

      (refs ?? []).forEach((r) => {
        if (activeReferredIds.has(r.referred_id)) {
          validInvitesMap[r.referrer_id] = (validInvitesMap[r.referrer_id] ?? 0) + 1;
        }
      });

      // Active rentals per user
      const { data: allRentals } = await supabaseAdmin
        .from('tesla_rentals')
        .select('user_id')
        .in('user_id', userIds)
        .eq('status', 'active');

      (allRentals ?? []).forEach((r) => {
        activeRentalsMap[r.user_id] = (activeRentalsMap[r.user_id] ?? 0) + 1;
      });
    }

    const enriched = (users ?? []).map((u) => ({
      ...u,
      valid_invites: validInvitesMap[u.id] ?? 0,
      active_rentals: activeRentalsMap[u.id] ?? 0,
    }));

    return NextResponse.json({ users: enriched });
  } catch (err) {
    console.error('Admin users error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
