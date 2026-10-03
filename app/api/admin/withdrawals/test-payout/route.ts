export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const key = process.env.OBPAY_SECRET_KEY;
    if (!key) {
      return NextResponse.json({ error: 'OBPAY_SECRET_KEY not set' }, { status: 500 });
    }

    const res = await fetch('https://obpay.online/api/public/v1/payouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 500,
        phone_number: '0731402668',
        customer_name: 'Test User',
        reference: `TEST-${Date.now()}`,
        description: 'Test payout',
      }),
    });

    const status = res.status;
    const data = await res.json().catch(() => ({ raw: 'could not parse JSON' }));

    return NextResponse.json({
      keyPrefix: key.slice(0, 12) + '...',
      status,
      data,
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err?.message || String(err),
      stack: err?.stack,
    }, { status: 500 });
  }
}
