'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  phone: string | null;
  full_name: string | null;
  created_at: string;
  reviewed_at: string | null;
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
    const res = await fetch(`/api/admin/withdrawals?status=${f}`);
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

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4 px-2">
        <Link href="/admin" className="text-[#6B7A8F] text-xl">←</Link>
        <h1 className="text-xl font-bold text-[#0A2540]">Withdrawals</h1>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4 px-2">
        {(['pending', 'approved', 'rejected', 'all'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="py-2 rounded-xl text-[11px] font-semibold transition border capitalize"
            style={{
              background: filter === f ? '#0A2540' : '#FFFFFF',
              color: filter === f ? '#00D9FF' : '#6B7A8F',
              borderColor: filter === f ? '#0A2540' : '#E1E7EF',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-[#6B7A8F] py-8">Loading…</div>
      ) : withdrawals.length === 0 ? (
        <div className="text-center text-[#6B7A8F] py-8">No {filter} withdrawals.</div>
      ) : (
        <div className="space-y-2">
          {withdrawals.map((w) => (
            <div key={w.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#0A2540]">
                    {w.users?.name ?? 'Unknown'}
                  </div>
                  <div className="text-xs text-[#6B7A8F] mt-0.5">
                    {w.phone ?? w.users?.phone}
                  </div>
                  <div className="text-[10px] text-[#6B7A8F] mt-1">
                    Bound name: {w.full_name ?? '—'}
                  </div>
                  <div className="text-[10px] text-[#6B7A8F] mt-1">
                    Requested: {new Date(w.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[#0A2540]">
                    UGX {Number(w.amount).toLocaleString()}
                  </div>
                  <div
                    className={`text-[10px] font-bold mt-1 uppercase ${
                      w.status === 'approved'
                        ? 'text-[#00A86B]'
                        : w.status === 'rejected'
                        ? 'text-[#E11D48]'
                        : 'text-[#B8860B]'
                    }`}
                  >
                    {w.status}
                  </div>
                </div>
              </div>

              {w.status === 'pending' && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    disabled={busyId === w.id}
                    onClick={() => act(w.id, 'approve')}
                    className="bg-[#0A2540] text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50"
                  >
                    {busyId === w.id ? '...' : 'Approve'}
                  </button>
                  <button
                    disabled={busyId === w.id}
                    onClick={() => act(w.id, 'reject')}
                    className="bg-white border border-[#E1E7EF] text-[#E11D48] font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
