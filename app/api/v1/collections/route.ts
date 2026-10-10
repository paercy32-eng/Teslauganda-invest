// app/api/v1/collections/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering to always get fresh data
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse the request body from your frontend
    const body = await request.json();
    const { phone_number, amount, description } = body;

    // 2. Basic validation
    if (!phone_number || !amount) {
      return NextResponse.json(
        { success: false, error: 'Phone number and amount are required.' },
        { status: 400 }
      );
    }

    // 3. Call the MarzPay Collections API
    const marzpayResponse = await fetch(`${process.env.MARZPAY_BASE_URL}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.MARZPAY_API_SECRET}`, // Authentication header
      },
      body: JSON.stringify({
        phone_number: phone_number, // e.g., "256701234567"
        amount: amount,             // e.g., 15000
        description: description || 'Deposit to Teslauganda Invest',
        // Add other required fields like country or reference if needed
      }),
    });

    const data = await marzpayResponse.json();

    // 4. Handle MarzPay's response
    if (!marzpayResponse.ok) {
      console.error('MarzPay API Error:', data);
      return NextResponse.json(
        { success: false, error: data.message || 'Payment initiation failed.' },
        { status: marzpayResponse.status }
      );
    }

    // 5. Return success response to your frontend
    return NextResponse.json({
      success: true,
      message: 'Payment request sent. Check your phone for the PIN prompt.',
      data: data.data, // Contains collection_id, etc.
    });

  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json(
      { success: false, error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
