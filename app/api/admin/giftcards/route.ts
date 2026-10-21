import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getCurrentAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET — list active gift cards
export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const snapshot = await db.collection('gift_cards')
      .where('is_used', '==', false)
      .get();

    const giftCards = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by created_at descending
    giftCards.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ giftCards });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}

// POST — generate new gift codes
export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { value, quantity } = await req.json();
    const numValue = Number(value);
    const numQuantity = Number(quantity);

    if (!numValue || numValue < 100) {
      return NextResponse.json({ error: 'Minimum value is 100 UGX' }, { status: 400 });
    }
    if (!numQuantity || numQuantity < 1 || numQuantity > 100) {
      return NextResponse.json({ error: 'Quantity must be between 1 and 100' }, { status: 400 });
    }

    // 1. Delete any existing unused codes (to enforce "one at a time" rule)
    const existingActive = await db.collection('gift_cards').where('is_used', '==', false).get();
    const batch = db.batch();
    existingActive.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // 2. Generate new codes
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const generatedCodes = [];

    for (let i = 0; i < numQuantity; i++) {
      let code = 'SAIKEN-';
      for (let j = 0; j < 6; j++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      const newCard = {
        code,
        value: numValue,
        balance: numValue,
        expires_at: expiresAt,
        is_used: false,
        created_at: new Date().toISOString()
      };

      // Add to Firestore
      await db.collection('gift_cards').add(newCard);
      generatedCodes.push(code);
    }

    return NextResponse.json({
      success: true,
      codes: generatedCodes,
      message: `${numQuantity} gift card(s) created. Expires in 5 minutes.`,
    });

  } catch (err: any) {
    console.error('Generate gift card error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
