'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Withdrawal = {
  id: string;
  amount: number;
  status: string;
  phone: string | null;
  full_name: string | null;
  created_at: string;
  reviewed_at: string | null;
  net_amount: number;
  fee: number;
};

function statusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s === 'pending') return 'Reviewing';
  if (s === 'approved') return 'Reviewed';
  if (s === 'completed') return 'Completed';
  if (s === 'failed') return 'Failed';
  if (s === 'rejected') return 'Rejected';
  return status;
}

function statusStyle(status: string) {
  const s = status.toLowerCase();
  if (s === 'completed')
    return 'text-[#4ADE80] bg-[#0F2A1A] border-[#4ADE80]/40';
  if (s === 'approved')
    return 'text-[#E0A44C] bg-[#2A1F13] border-[#E0A44C]/40';
  if (s === 'pending')
    return 'text-[#E0A44C] bg-[#2A1F13] border-[#E0A44C]/40';
  if (s === 'failed' || s === 'rejected')
    return 'text-[#FF8A8A] bg-[#2A1416] border-[#E5484D]/40';
  return 'text-[#8A8580] bg-[#1A1A1F] border-[#2A2823]';
}

export default function WithdrawalsPage() {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/withdrawals/history?t=' + Date.now(), {
        cache: 'no-store',
      });
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

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-5 px-2">
        <Link href="/profile" className="text-[#8A8580] text-xl">←</Link>
        <h1 className="text-xl font-bold text-[#F5F2ED]">Withdraw History</h1>
      </div>

      {loading ? (
        <div className="text-center text-[#8A8580] py-8">Loading…</div>
      ) : withdrawals.length === 0 ? (
        <div className="text-center text-[#8A8580] py-16">
          <div className="text-5xl mb-3">💸</div>
          <div>No withdrawals yet.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {withdrawals.map((w) => (
            <div key={w.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#F5F2ED]">
                    UGX {w.amount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[#8A8580] mt-1">
                    {new Date(w.created_at).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[#8A8580] mt-0.5">
                    Fee: UGX {w.fee.toLocaleString()} · Receive: UGX{' '}
                    {w.net_amount.toLocaleString()}
                  </div>
                  {w.phone && (
                    <div className="text-[10px] text-[#8A8580] mt-0.5">
                      To: {w.full_name} · {w.phone}
                    </div>
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${statusStyle(
                    w.status
                  )}`}
                >
                  {statusLabel(w.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
