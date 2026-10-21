import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getCurrentAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET — list all products
export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const snapshot = await db.collection('products').get();
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by price (lowest to highest)
    products.sort((a: any, b: any) => Number(a.price) - Number(b.price));

    return NextResponse.json(
      { products },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('Admin products fetch error:', err);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}

// POST — update a product or toggle its status
export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, productId } = body;

    if (!productId || !action) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const productRef = db.collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (action === 'toggle_status') {
      const currentData = productDoc.data();
      const newStatus = !currentData?.is_active;
      
      await productRef.update({ is_active: newStatus });
      return NextResponse.json({ success: true, message: `Product ${newStatus ? 'activated' : 'deactivated'}` });
    }

    if (action === 'update_details') {
      const { name, price, cycle_days, daily_return } = body;
      
      if (!name || !price || !cycle_days || !daily_return) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
      }

      await productRef.update({
        name,
        price: Number(price),
        cycle_days: Number(cycle_days),
        daily_return: Number(daily_return),
      });

      return NextResponse.json({ success: true, message: 'Product updated successfully' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin products action error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
