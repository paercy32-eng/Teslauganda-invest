'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Deposit = {
  id: string;
  amount: number;
  status: string;
  reference: string | null;
  created_at: string;
  reviewed_at: string | null;
};

function statusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s === 'pending') return 'Reviewing';
  if (s === 'approved') return 'Completed';
  if (s === 'rejected' || s === 'failed') return 'Failed';
  return status;
}

function statusStyle(status: string) {
  const s = status.toLowerCase();
  if (s === 'approved')
    return 'text-[#4ADE80] bg-[#0F2A1A] border-[#4ADE80]/40';
  if (s === 'pending')
    return 'text-[#E0A44C] bg-[#2A1F13] border-[#E0A44C]/40';
  if (s === 'rejected' || s === 'failed')
    return 'text-[#FF8A8A] bg-[#2A1416] border-[#E5484D]/40';
  return 'text-[#8A8580] bg-[#1A1A1F] border-[#2A2823]';
}

export default function DepositsPage() {
  const router = useRouter();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/deposits/history?t=' + Date.now(), {
        cache: 'no-store',
      });
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      const data = await res.json();
      setDeposits(data.deposits ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-5 px-2">
        <Link href="/profile" className="text-[#8A8580] text-xl">←</Link>
        <h1 className="text-xl font-bold text-[#F5F2ED]">Deposit History</h1>
      </div>

      {loading ? (
        <div className="text-center text-[#8A8580] py-8">Loading…</div>
      ) : deposits.length === 0 ? (
        <div className="text-center text-[#8A8580] py-16">
          <div className="text-5xl mb-3">📭</div>
          <div>No deposits yet.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {deposits.map((d) => (
            <div key={d.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#F5F2ED]">
                    UGX {d.amount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[#8A8580] mt-1">
                    {new Date(d.created_at).toLocaleString()}
                  </div>
                  {d.reference && (
                    <div className="text-[10px] text-[#8A8580] mt-0.5 truncate">
                      Ref: {d.reference}
                    </div>
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${statusStyle(
                    d.status
                  )}`}
                >
                  {statusLabel(d.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
