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
    setBusyId(id);
    await fetch('/api/admin/deposits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ depositId: id, action }),
    });
    setBusyId(null);
    load(filter);
  }

  function statusColor(status: string) {
    if (status === 'approved') return 'text-[#00A86B] bg-[#E6F7F0]';
    if (status === 'rejected' || status === 'failed')
      return 'text-[#E11D48] bg-[#FFF1F3]';
    return 'text-[#B8860B] bg-[#FFF8E5]';
  }

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 mb-4 px-2">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-[#6B7A8F] text-xl">←</Link>
          <h1 className="text-xl font-bold text-[#0A2540]">Deposits</h1>
        </div>
        <button
          onClick={() => load(filter, true)}
          disabled={refreshing}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0A2540] text-[#00D9FF] disabled:opacity-50"
        >
          {refreshing ? '…' : '↻ Refresh'}
        </button>
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
      ) : deposits.length === 0 ? (
        <div className="text-center text-[#6B7A8F] py-8">
          No {filter} deposits.
        </div>
      ) : (
        <div className="space-y-2">
          {deposits.map((d) => (
            <div key={d.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#0A2540]">
                    {d.users?.name ?? 'Unknown'}
                  </div>
                  <div className="text-xs text-[#6B7A8F] mt-0.5">
                    {d.users?.phone}
                  </div>
                  <div className="text-[10px] text-[#6B7A8F] mt-1">
                    {new Date(d.created_at).toLocaleString()}
                  </div>
                  {d.reference && (
                    <div className="text-[10px] text-[#6B7A8F] mt-0.5 truncate">
                      Ref: {d.reference}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[#0A2540]">
                    UGX {Number(d.amount).toLocaleString()}
                  </div>
                  <div
                    className={`text-[10px] font-bold mt-1 uppercase px-2 py-0.5 rounded-full inline-block ${statusColor(
                      d.status
                    )}`}
                  >
                    {d.status}
                  </div>
                </div>
              </div>

              {d.status === 'pending' && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    disabled={busyId === d.id}
                    onClick={() => act(d.id, 'approve')}
                    className="bg-[#00A86B] text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50"
                  >
                    {busyId === d.id ? '...' : '✓ Approve'}
                  </button>
                  <button
                    disabled={busyId === d.id}
                    onClick={() => act(d.id, 'reject')}
                    className="bg-white border border-[#E11D48] text-[#E11D48] font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50"
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
