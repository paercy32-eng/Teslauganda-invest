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
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-emerald-600 font-semibold">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in bg-slate-50 pb-24">
      <div className="px-2 mb-6">
        <h1 className="text-3xl font-black text-slate-900">My Holdings</h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">
          {rentals.length === 0
            ? 'Your active pumps will appear here.'
            : `You have ${rentals.length} active pump${rentals.length > 1 ? 's' : ''}.`}
        </p>
      </div>

      {rentals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          {/* New 3D Order Box SVG */}
          <div className="mb-6 text-slate-300">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 8L12 3L3 8V16L12 21L21 16V8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M3 8L12 13L21 8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M12 21V13" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M12 3L3 8L12 13L21 8L12 3Z" fill="#F1F5F9" />
            </svg>
          </div>
          
          <div className="text-slate-400 mb-6 font-bold text-lg">
            No active pumps
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {rentals.map((r) => {
            const progress =
              ((r.duration_days - r.days_remaining) / r.duration_days) * 100;

            const nextPayout = new Date(
              new Date(r.last_credit_at).getTime() + 24 * 60 * 60 * 1000
            );

            return (
              <div key={r.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-bold text-slate-900 text-base">
                      {r.product_name}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                      Started {new Date(r.start_at).toLocaleString()}
                    </div>
                    {r.status === 'active' && (
                      <div className="text-[10px] text-emerald-600 mt-1 font-bold">
                        Next payout: {nextPayout.toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div
                    className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-full ${
                      r.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {r.status}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
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
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1.5">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
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
    <div className="rounded-2xl p-2.5 text-center bg-slate-50 border border-slate-100">
      <div className="text-[9px] text-slate-500 font-bold mb-1">
        {label}
      </div>
      <div
        className={`text-[11px] font-bold ${
          highlight ? 'text-emerald-600' : 'text-slate-900'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
