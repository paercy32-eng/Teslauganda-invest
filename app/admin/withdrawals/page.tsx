'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
  phone: string | null;
  full_name: string | null;
  created_at: string;
  reviewed_at: string | null;
  meta: any;
  users: { name: string; phone: string; balance: number } | null;
};

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

export default function AdminWithdrawalsPage() {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load(f: Filter) {
    setLoading(true);
    const res = await fetch(`/api/admin/withdrawals?status=${f}&t=${Date.now()}`);
    if (res.status === 401) {
      router.replace('/admin/login');
      return;
    }
    const data = await res.json();
    setWithdrawals(data.withdrawals ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load(filter);
  }, [router, filter]);

  async function act(id: string, action: 'approve' | 'reject') {
    setBusyId(id);
    await fetch('/api/admin/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ withdrawalId: id, action }),
    });
    setBusyId(null);
    load(filter);
  }

  async function mark(id: string, action: 'mark_completed' | 'mark_failed') {
    setBusyId(id);
    await fetch('/api/admin/withdrawals', {
      method: 'POST', // 👈 Changed from PATCH to POST
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ withdrawalId: id, action }),
    });
    setBusyId(null);
    load(filter);
  }

  function statusBadge(w: Withdrawal) {
    if (w.status === 'pending') {
      return { label: 'PENDING', color: 'text-amber-700 bg-amber-100' };
    }
    if (w.status === 'rejected') {
      return { label: 'REJECTED', color: 'text-red-600 bg-red-100' };
    }
    if (w.status === 'completed') {
      return { label: 'COMPLETED', color: 'text-green-700 bg-green-100' };
    }
    if (w.status === 'failed') {
      return { label: 'FAILED', color: 'text-red-600 bg-red-100' };
    }
    return { label: 'APPROVED', color: 'text-blue-700 bg-blue-100' };
  }

  return (
    <main className="min-h-screen px-4 py-6 bg-gray-50 text-gray-900">
      <div className="flex items-center gap-3 mb-4 px-2">
        <Link href="/admin" className="text-gray-500 text-xl">←</Link>
        <h1 className="text-xl font-bold text-gray-900">Withdrawals</h1>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4 px-2">
        {(['pending', 'approved', 'rejected', 'all'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`py-2 rounded-xl text-[11px] font-semibold transition border capitalize ${
              filter === f
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-8">Loading…</div>
      ) : withdrawals.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No {filter} withdrawals.</div>
      ) : (
        <div className="space-y-2">
          {withdrawals.map((w) => {
            const badge = statusBadge(w);
            const net = Math.round(Number(w.amount) * 0.85);
            const showMarkButtons = w.status === 'approved';

            return (
              <div key={w.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">
                      {w.users?.name ?? 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {w.phone ?? w.users?.phone}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      Bound name: {w.full_name ?? '—'}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      Requested: {new Date(w.created_at).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Net to user: UGX {net.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      UGX {Number(w.amount).toLocaleString()}
                    </div>
                    <div
                      className={`text-[10px] font-bold mt-1 uppercase px-2 py-0.5 rounded-full inline-block ${badge.color}`}
                    >
                      {badge.label}
                    </div>
                  </div>
                </div>

                {w.status === 'pending' && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                      disabled={busyId === w.id}
                      onClick={() => act(w.id, 'approve')}
                      className="bg-gray-900 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 active:scale-[0.98] transition"
                    >
                      {busyId === w.id ? '...' : 'Approve'}
                    </button>
                    <button
                      disabled={busyId === w.id}
                      onClick={() => act(w.id, 'reject')}
                      className="bg-white border border-red-300 text-red-600 font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 active:scale-[0.98] transition"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {showMarkButtons && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                      disabled={busyId === w.id}
                      onClick={() => mark(w.id, 'mark_completed')}
                      className="bg-green-600 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 active:scale-[0.98] transition"
                    >
                      {busyId === w.id ? '...' : '✓ Mark Completed'}
                    </button>
                    <button
                      disabled={busyId === w.id}
                      onClick={() => mark(w.id, 'mark_failed')}
                      className="bg-white border border-red-300 text-red-600 font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 active:scale-[0.98] transition"
                    >
                      Mark Failed
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
      }
