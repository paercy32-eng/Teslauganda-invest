'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Deposit = {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'failed';
  reference: string | null;
  created_at: string;
  reviewed_at: string | null;
  users: { name: string; phone: string } | null;
};

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

export default function AdminDepositsPage() {
  const router = useRouter();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load(f: Filter, showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    const res = await fetch(
      `/api/admin/deposits?status=${f}&t=${Date.now()}`,
      { cache: 'no-store' }
    );

    if (res.status === 401) {
      router.replace('/admin/login');
      return;
    }
    const data = await res.json();
    setDeposits(data.deposits ?? []);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    load(filter);
  }, [router, filter]);

  async function act(id: string, action: 'approve' | 'reject') {
    if (
      action === 'approve' &&
      !confirm('Approve this deposit and credit the user?')
    ) {
      return;
    }
    setBusyId(id);
    await fetch('/api/admin/deposits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ depositId: id, action }),
    });
    setBusyId(null);
    load(filter);
  }

  function statusBadge(status: string) {
    if (status === 'approved')
      return { label: 'APPROVED', color: 'text-green-700 bg-green-100' };
    if (status === 'rejected' || status === 'failed')
      return { label: 'REJECTED', color: 'text-red-600 bg-red-100' };
    return { label: 'PENDING', color: 'text-amber-700 bg-amber-100' };
  }

  return (
    <main className="min-h-screen px-4 py-6 bg-gray-50 text-gray-900">
      <div className="flex items-center justify-between gap-3 mb-4 px-2">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-500 text-xl">←</Link>
          <h1 className="text-xl font-bold text-gray-900">Deposits</h1>
        </div>
        <button
          onClick={() => load(filter, true)}
          disabled={refreshing}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-900 text-white disabled:opacity-50 active:scale-[0.98] transition"
        >
          {refreshing ? '…' : '↻ Refresh'}
        </button>
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
      ) : deposits.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No {filter} deposits.
        </div>
      ) : (
        <div className="space-y-2">
          {deposits.map((d) => {
            const badge = statusBadge(d.status);

            return (
              <div
                key={d.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
              >
                {/* Header — user + amount */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 text-base truncate">
                      {d.users?.name ?? 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {d.users?.phone ?? '—'}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      Requested: {new Date(d.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      UGX {Number(d.amount).toLocaleString()}
                    </div>
                    <div
                      className={`text-[10px] font-bold mt-1 uppercase px-2 py-0.5 rounded-full inline-block ${badge.color}`}
                    >
                      {badge.label}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {d.status === 'pending' && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                      disabled={busyId === d.id}
                      onClick={() => act(d.id, 'approve')}
                      className="bg-green-600 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 active:scale-[0.98] transition"
                    >
                      {busyId === d.id ? '...' : '✓ Approve'}
                    </button>
                    <button
                      disabled={busyId === d.id}
                      onClick={() => act(d.id, 'reject')}
                      className="bg-white border border-red-300 text-red-600 font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 active:scale-[0.98] transition"
                    >
                      Reject
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
