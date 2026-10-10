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
      <main className="min-h-screen flex items-center justify-center bg-[#131317]">
        <div className="text-[#8A8580]">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in bg-[#131317]">
      <div className="px-2 mb-6">
        <h1 className="text-3xl font-bold text-[#F5F2ED]">My Holdings</h1>
        <p className="text-[#8A8580] text-sm mt-1">
          {rentals.length === 0
            ? 'Your active investments will appear here.'
            : `You have ${rentals.length} active investment${rentals.length > 1 ? 's' : ''}.`}
        </p>
      </div>

      {rentals.length === 0 ? (
        <div className="text-center py-20">
          {/* Minimalist Empty State Icon */}
          <div className="flex justify-center mb-4">
            <svg
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8A8580"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
          </div>
          <div className="text-[#8A8580] mb-6 font-medium">
            No active holdings
          </div>
          <button
            onClick={() => router.push('/')}
            className="bg-[#C8833A] text-white font-bold px-6 py-3 rounded-xl active:scale-[0.98] transition shadow-lg shadow-[#C8833A]/20"
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
              <div key={r.id} className="card p-4 bg-[#1C1C21] border-[#2A2A30]">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-[#F5F2ED] text-base">
                      {r.product_name}
                    </div>
                    <div className="text-[10px] text-[#8A8580] mt-0.5">
                      Started {new Date(r.start_at).toLocaleString()}
                    </div>
                    {r.status === 'active' && (
                      <div className="text-[10px] text-[#E0A44C] mt-0.5 font-semibold">
                        Next payout: {nextPayout.toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div
                    className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                      r.status === 'active'
                        ? 'bg-[#0F2A1A] text-[#4ADE80]'
                        : 'bg-[#2A2A30] text-[#8A8580]'
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
                  <div className="flex justify-between text-[10px] text-[#8A8580] mb-1">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#2A2A30] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#E0A44C] transition-all"
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
    <div className="rounded-xl p-2.5 text-center bg-[#131317] border border-[#2A2A30]">
      <div className="text-[9px] text-[#8A8580] font-semibold mb-1">
        {label}
      </div>
      <div
        className={`text-[11px] font-bold ${
          highlight ? 'text-[#E0A44C]' : 'text-[#F5F2ED]'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
