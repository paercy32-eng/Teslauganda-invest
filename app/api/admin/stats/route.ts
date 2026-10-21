import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getCurrentAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Total Users
    const usersSnapshot = await db.collection('users').count().get();
    const totalUsers = usersSnapshot.data().count;

    // 2. Total Deposited (Only completed)
    const depositsSnapshot = await db.collection('payments').where('status', '==', 'completed').get();
    let totalDeposited = 0;
    depositsSnapshot.forEach(doc => {
      totalDeposited += Number(doc.data().amount) || 0;
    });

    // 3. Total Invested
    const modulesSnapshot = await db.collection('user_modules').get();
    let totalInvested = 0;
    modulesSnapshot.forEach(doc => {
      totalInvested += Number(doc.data().price_paid) || 0;
    });

    // 4. Total Withdrawn (Only completed)
    const withdrawalsSnapshot = await db.collection('withdrawals').where('status', '==', 'completed').get();
    let totalWithdrawn = 0;
    withdrawalsSnapshot.forEach(doc => {
      totalWithdrawn += Number(doc.data().amount) || 0;
    });

    // 5. Pending Withdrawals
    const pendingSnapshot = await db.collection('withdrawals').where('status', '==', 'pending').count().get();
    const pendingWithdrawals = pendingSnapshot.data().count;

    return NextResponse.json(
      {
        totalUsers,
        totalDeposited,
        totalInvested,
        totalWithdrawn,
        pendingWithdrawals,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err: any) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
