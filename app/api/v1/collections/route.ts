import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone_number, amount, description } = body;

    if (!phone_number || !amount) {
      return NextResponse.json(
        { success: false, error: 'Phone number and amount are required.' },
        { status: 400 }
      );
    }

    const marzpayResponse = await fetch(`${process.env.MARZPAY_BASE_URL}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.MARZPAY_API_SECRET}`,
      },
      body: JSON.stringify({
        phone_number: phone_number,
        amount: amount,
        description: description || 'Deposit to Teslauganda Invest',
      }),
    });

    const data = await marzpayResponse.json();

    if (!marzpayResponse.ok) {
      console.error('MarzPay API Error:', data);
      return NextResponse.json(
        { success: false, error: data.message || 'Payment initiation failed.' },
        { status: marzpayResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment request sent. Check your phone for the PIN prompt.',
      data: data.data,
    });

  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json(
      { success: false, error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
