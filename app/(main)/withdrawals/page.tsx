'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Withdrawal = {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  phone: string | null;
  full_name: string | null;
  created_at: string;
  reviewed_at: string | null;
  net_amount: number;
  fee: number;
};

export default function WithdrawalsPage() {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/withdrawals/history?t=' + Date.now());
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      const data = await res.json();
      setWithdrawals(data.withdrawals ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  function statusColor(status: string) {
    if (status === 'approved') return 'text-[#00A86B] bg-[#E6F7F0]';
    if (status === 'rejected') return 'text-[#E11D48] bg-[#FFF1F3]';
    return 'text-[#B8860B] bg-[#FFF8E5]';
  }

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-5 px-2">
        <Link href="/profile" className="text-[#6B7A8F] text-xl">←</Link>
        <h1 className="text-xl font-bold text-[#0A2540]">Withdraw History</h1>
      </div>

      {loading ? (
        <div className="text-center text-[#6B7A8F] py-8">Loading…</div>
      ) : withdrawals.length === 0 ? (
        <div className="text-center text-[#6B7A8F] py-16">
          <div className="text-5xl mb-3">💸</div>
          <div>No withdrawals yet.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {withdrawals.map((w) => (
            <div key={w.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#0A2540]">
                    UGX {w.amount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[#6B7A8F] mt-1">
                    {new Date(w.created_at).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[#6B7A8F] mt-0.5">
                    Fee: UGX {w.fee.toLocaleString()} · Receive: UGX{' '}
                    {w.net_amount.toLocaleString()}
                  </div>
                  {w.phone && (
                    <div className="text-[10px] text-[#6B7A8F] mt-0.5">
                      To: {w.full_name} · {w.phone}
                    </div>
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${statusColor(
                    w.status
                  )}`}
                >
                  {w.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
