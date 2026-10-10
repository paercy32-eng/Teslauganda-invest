'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Rental = {
  id: string;
  product_name: string;
  price_paid: number;
  daily_profit: number;
  duration_days: number;
  days_remaining: number;
  total_earned: number;
  start_at: string;
  last_credit_at: string;
  status: string;
};

export default function MyRobotPage() {
  const router = useRouter();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/rentals/mine');
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      const data = await res.json();
      setRentals(data.rentals ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-[#6B7A8F]">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in">
      <div className="px-2 mb-5">
        <h1 className="text-3xl font-bold text-[#0A2540]">My Holdings</h1>
        <p className="text-[#6B7A8F] text-sm mt-1">
          {rentals.length === 0
            ? 'Your active investments will appear here.'
            : `You have ${rentals.length} active investment${rentals.length > 1 ? 's' : ''}.`}
        </p>
      </div>

      {rentals.length === 0 ? (
        <div className="text-center text-[#6B7A8F] py-16">
          <div className="text-5xl mb-3">🤖</div>
          <div className="mb-4">No holdings yet.</div>
          <button
            onClick={() => router.push('/')}
            className="btn-primary max-w-[200px] mx-auto"
          >
            Browse Investments
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rentals.map((r) => {
            const progress =
              ((r.duration_days - r.days_remaining) / r.duration_days) * 100;

            const nextPayout = new Date(
              new Date(r.last_credit_at).getTime() + 24 * 60 * 60 * 1000
            );

            return (
              <div key={r.id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-[#0A2540] text-base">
                      {r.product_name}
                    </div>
                    <div className="text-[10px] text-[#6B7A8F] mt-0.5">
                      Started {new Date(r.start_at).toLocaleString()}
                    </div>
                    {r.status === 'active' && (
                      <div className="text-[10px] text-[#00B8DB] mt-0.5 font-semibold">
                        Next payout: {nextPayout.toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div
                    className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                      r.status === 'active'
                        ? 'bg-[#E6F7F0] text-[#00A86B]'
                        : 'bg-[#F5F7FA] text-[#6B7A8F]'
                    }`}
                  >
                    {r.status}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <Stat
                    label="DAILY"
                    value={`UGX ${r.daily_profit.toLocaleString()}`}
                    highlight
                  />
                  <Stat
                    label="EARNED"
                    value={`UGX ${r.total_earned.toLocaleString()}`}
                  />
                  <Stat label="DAYS LEFT" value={r.days_remaining.toString()} />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-[#6B7A8F] mb-1">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E1E7EF] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#00D9FF] transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl p-2.5 text-center bg-[#F5F7FA] border border-[#E1E7EF]">
      <div className="text-[9px] text-[#6B7A8F] font-semibold mb-1">
        {label}
      </div>
      <div
        className={`text-[11px] font-bold ${
          highlight ? 'text-[#00B8DB]' : 'text-[#0A2540]'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
