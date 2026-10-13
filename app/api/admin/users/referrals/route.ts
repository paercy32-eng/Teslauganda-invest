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

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // --- Level 1: direct referrals ---
    const { data: level1 } = await supabaseAdmin
      .from('users')
      .select('id, name, phone, created_at')
      .eq('referred_by', userId)
      .order('created_at', { ascending: false });

    const level1Ids = (level1 ?? []).map((u) => u.id);

    // --- Level 2 ---
    let level2: any[] = [];
    if (level1Ids.length > 0) {
      const { data } = await supabaseAdmin
        .from('users')
        .select('id, name, phone, created_at')
        .in('referred_by', level1Ids)
        .order('created_at', { ascending: false });
      level2 = data ?? [];
    }

    const level2Ids = level2.map((u) => u.id);

    // --- Level 3 ---
    let level3: any[] = [];
    if (level2Ids.length > 0) {
      const { data } = await supabaseAdmin
        .from('users')
        .select('id, name, phone, created_at')
        .in('referred_by', level2Ids)
        .order('created_at', { ascending: false });
      level3 = data ?? [];
    }

    // --- Determine which users are "valid" (made at least one approved deposit) ---
    const allIds = [
      ...level1Ids,
      ...level2.map((u) => u.id),
      ...level3.map((u) => u.id),
    ];

    let validIds = new Set<string>();
    if (allIds.length > 0) {
      const { data: deposits } = await supabaseAdmin
        .from('tesla_deposits')
        .select('user_id')
        .in('user_id', allIds)
        .eq('status', 'approved');

      (deposits ?? []).forEach((d) => validIds.add(d.user_id));
    }

    const annotate = (list: any[]) =>
      list.map((u) => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        created_at: u.created_at,
        isValid: validIds.has(u.id),
      }));

    return NextResponse.json(
      {
        level1: annotate(level1 ?? []),
        level2: annotate(level2),
        level3: annotate(level3),
        totals: {
          level1: level1?.length ?? 0,
          level2: level2.length,
          level3: level3.length,
          all: allIds.length,
          valid: validIds.size,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('Referrals API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
      }
