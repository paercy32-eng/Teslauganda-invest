'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Deposit = {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'failed';
  reference: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export default function DepositsPage() {
  const router = useRouter();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/deposits/history');
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

  function statusColor(status: string) {
    if (status === 'approved') return 'text-[#7C9070] bg-[#EFF5EC]';
    if (status === 'rejected' || status === 'failed') return 'text-[#A13A3A] bg-[#FDF3F3]';
    return 'text-[#B8860B] bg-[#FFF8E5]';
  }

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 px-2">
        <Link href="/profile" className="text-[#6B7A62] text-xl">←</Link>
        <h1 className="text-xl font-bold text-[#1F2A1B]">Deposit History</h1>
      </div>

      {loading ? (
        <div className="text-center text-[#6B7A62] py-8">Loading…</div>
      ) : deposits.length === 0 ? (
        <div className="text-center text-[#6B7A62] py-16">
          <div className="text-5xl mb-3">📭</div>
          <div>No deposits yet.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {deposits.map((d) => (
            <div key={d.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#1F2A1B]">
                    UGX {d.amount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[#6B7A62] mt-1">
                    {new Date(d.created_at).toLocaleString()}
                  </div>
                  {d.reference && (
                    <div className="text-[10px] text-[#6B7A62] mt-0.5 truncate">
                      Ref: {d.reference}
                    </div>
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${statusColor(
                    d.status
                  )}`}
                >
                  {d.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
