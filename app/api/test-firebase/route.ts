import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Try to fetch the 'products' collection
    const snapshot = await db.collection('products').get();
    
    if (snapshot.empty) {
      return NextResponse.json({ 
        success: true, 
        message: 'Connected to Firebase successfully! (The products collection is currently empty).' 
      });
    }

    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ 
      success: true, 
      message: 'Connected to Firebase successfully!',
      products: products
    });

  } catch (error: any) {
    console.error('Firebase test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
