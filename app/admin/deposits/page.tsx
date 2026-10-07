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
  payment_method: string | null;
  transaction_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  users: { name: string; phone: string } | null;
};

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

const MERCHANTS: Record<string, { code: string; name: string; dial: string }> = {
  bank_a: { code: '7182484', name: 'Essentials Limited', dial: '*185*9#' },
  bank_b: { code: '44867602', name: 'Nabirye Flavia', dial: '*165*3#' },
};

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
      return { label: 'APPROVED', color: 'text-[#00A86B] bg-[#E6F7F0]' };
    if (status === 'rejected' || status === 'failed')
      return { label: 'REJECTED', color: 'text-[#E11D48] bg-[#FFF1F3]' };
    return { label: 'PENDING', color: 'text-[#B8860B] bg-[#FFF8E5]' };
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
          {deposits.map((d) => {
            const badge = statusBadge(d.status);
            const merchant = d.payment_method
              ? MERCHANTS[d.payment_method]
              : null;

            return (
              <div key={d.id} className="card p-4">
                {/* Header — user + amount */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#0A2540] text-base truncate">
                      {d.users?.name ?? 'Unknown'}
                    </div>
                    <div className="text-xs text-[#6B7A8F] mt-0.5">
                      {d.users?.phone ?? '—'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-[#0A2540]">
                      UGX {Number(d.amount).toLocaleString()}
                    </div>
                    <div
                      className={`text-[10px] font-bold mt-1 uppercase px-2 py-0.5 rounded-full inline-block ${badge.color}`}
                    >
                      {badge.label}
                    </div>
                  </div>
                </div>

                {/* Merchant info */}
                <div className="rounded-xl bg-[#F5F7FA] border border-[#E1E7EF] p-3 mb-3">
                  {merchant ? (
                    <div className="text-[11px] text-[#6B7A8F] leading-relaxed">
                      <div>
                        <span className="font-semibold text-[#0A2540]">
                          Merchant Code:
                        </span>{' '}
                        <span className="font-bold text-[#0A2540]">
                          {merchant.code}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-[#0A2540]">
                          Merchant Name:
                        </span>{' '}
                        {merchant.name}
                      </div>
                      <div>
                        <span className="font-semibold text-[#0A2540]">
                          Dial:
                        </span>{' '}
                        {merchant.dial}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#8A8A8A]">
                      No payment method recorded
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-[#E1E7EF] text-[11px]">
                    <span className="font-semibold text-[#0A2540]">
                      Transaction ID:
                    </span>{' '}
                    <span className="font-mono font-bold text-[#0A2540]">
                      {d.transaction_id ?? '—'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {d.status === 'pending' && (
                  <div className="grid grid-cols-2 gap-2">
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
            );
          })}
        </div>
      )}
    </main>
  );
      }
