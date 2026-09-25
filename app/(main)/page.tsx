'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Me = {
  id: string;
  name: string;
  phone: string;
  balance: number;
};

export default function HomePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/me');
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      const data = await res.json();
      setMe(data.user);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-[#8A8A8A]">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#E31937] flex items-center justify-center text-white font-bold">
            T
          </div>
          <span className="text-xl font-bold">Tesla</span>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#8A8A8A]">Welcome back</div>
          <div className="text-sm font-semibold">{me?.name}</div>
        </div>
      </div>

      {/* Balance card */}
      <div className="rounded-3xl p-6 bg-gradient-to-br from-[#E31937] to-[#8A0F22] mb-4">
        <div className="text-sm text-white/80 mb-1">Account Balance</div>
        <div className="text-4xl font-bold text-white mb-4">
          UGX {me?.balance?.toLocaleString() ?? 0}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-white text-[#0A0A0A] font-semibold py-3 rounded-2xl active:scale-[0.98] transition">
            Recharge
          </button>
          <button className="bg-black/30 text-white font-semibold py-3 rounded-2xl active:scale-[0.98] transition">
            Withdraw
          </button>
        </div>
      </div>

      {/* Deposit / Withdraw details */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button className="card p-4 text-left">
          <div className="text-xs text-[#8A8A8A] mb-1">Deposit details</div>
          <div className="text-sm font-semibold">View history →</div>
        </button>
        <button className="card p-4 text-left">
          <div className="text-xs text-[#8A8A8A] mb-1">Withdraw details</div>
          <div className="text-sm font-semibold">View history →</div>
        </button>
      </div>

      {/* Products */}
      <h2 className="text-2xl font-bold mb-1">Products</h2>
      <p className="text-[#8A8A8A] text-sm mb-5">
        100-day cycle. Daily profit credited after 24 hours.
      </p>

      <div className="text-center text-[#5A5A5A] py-12">
        Products grid coming next…
      </div>
    </main>
  );
}
