export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

const MIN_REWARD = 5.4;
const MAX_REWARD = 700;

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const session = await verifySession(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const { code } = await req.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Enter a gift card code.' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // Find gift card
    const { data: card } = await supabaseAdmin
      .from('tesla_giftcards')
      .select('id, total_value, claimed_value, expires_at, is_active')
      .eq('code', cleanCode)
      .maybeSingle();

    if (!card) {
      return NextResponse.json({ error: 'Invalid gift card code.' }, { status: 404 });
    }

    if (!card.is_active) {
      return NextResponse.json({ error: 'This gift card is no longer active.' }, { status: 400 });
    }

    if (new Date(card.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This gift card has expired.' }, { status: 400 });
    }

    const remaining = Number(card.total_value) - Number(card.claimed_value);
    if (remaining <= 0) {
      return NextResponse.json({ error: 'This gift card has been fully claimed.' }, { status: 400 });
    }

    // Pick a random reward within remaining pool
    const maxForUser = Math.min(MAX_REWARD, remaining);
    const reward = Math.min(
      maxForUser,
      MIN_REWARD + Math.random() * (maxForUser - MIN_REWARD)
    );
    const rounded = Math.round(reward * 100) / 100;

    // Credit user balance
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('balance')
      .eq('id', session.userId)
      .maybeSingle();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await supabaseAdmin
      .from('users')
      .update({ balance: Number(user.balance) + rounded })
      .eq('id', session.userId);

    // Log transaction
    await supabaseAdmin.from('tesla_transactions').insert({
      user_id: session.userId,
      type: 'giftcard',
      amount: rounded,
      status: 'completed',
      meta: { code: cleanCode },
    });

    // Log claim + bump claimed_value
    await supabaseAdmin.from('tesla_giftcard_claims').insert({
      giftcard_id: card.id,
      user_id: session.userId,
      amount: rounded,
    });

    await supabaseAdmin
      .from('tesla_giftcards')
      .update({ claimed_value: Number(card.claimed_value) + rounded })
      .eq('id', card.id);

    return NextResponse.json({ success: true, amount: rounded });
  } catch (err) {
    console.error('Giftcard error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
