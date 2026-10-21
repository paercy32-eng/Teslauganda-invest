import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getCurrentAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET — list deposits
export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? 'pending';

    let query: any = db.collection('payments');

    if (status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    
    const payments = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort manually in JS since Firestore requires a composite index for where + orderBy
    payments.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Fetch user details for each payment
    const enrichedPayments = await Promise.all(payments.map(async (payment: any) => {
      try {
        const userDoc = await db.collection('users').doc(payment.user_id).get();
        const userData = userDoc.data();
        return {
          ...payment,
          users: userData ? { name: userData.name, phone: userData.phone } : null
        };
      } catch {
        return { ...payment, users: null };
      }
    }));

    return NextResponse.json(
      { deposits: enrichedPayments },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('Admin deposits fetch error:', err);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}

// POST — manually approve or reject a deposit (Fallback)
export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { depositId, action } = await req.json();

    if (!depositId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const paymentRef = db.collection('payments').doc(depositId);
    const paymentDoc = await paymentRef.get();

    if (!paymentDoc.exists) {
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
    }

    const paymentData = paymentDoc.data();
    if (!paymentData) return NextResponse.json({ error: 'Data missing' }, { status: 404 });
    
    if (paymentData.status !== 'pending') {
      return NextResponse.json({ error: `Already ${paymentData.status}` }, { status: 400 });
    }

    if (action === 'approve') {
      // Update payment status
      await paymentRef.update({
        status: 'completed',
        reviewed_at: new Date().toISOString()
      });

      // Get user and update balance
      const userRef = db.collection('users').doc(paymentData.user_id);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const currentBalance = Number(userData?.balance) || 0;
        await userRef.update({
          balance: currentBalance + Number(paymentData.amount)
        });
      }

      // Log transaction
      await db.collection('transactions').add({
        user_id: paymentData.user_id,
        type: 'deposit',
        amount: Number(paymentData.amount),
        status: 'completed',
        meta: { reference: paymentData.reference, method: 'manual_admin' },
        created_at: new Date().toISOString()
      });
    }

    if (action === 'reject') {
      await paymentRef.update({
        status: 'rejected',
        reviewed_at: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true, status: action === 'approve' ? 'completed' : 'rejected' });
  } catch (err: any) {
    console.error('Admin deposits action error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
        }
