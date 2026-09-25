'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Me = {
  id: string;
  name: string;
  phone: string;
  balance: number;
};

export default function ProfilePage() {
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

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-[#8A8A8A]">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="px-2 mb-5">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-[#8A8A8A] text-sm mt-1">
          {me?.name} · {me?.phone}
        </p>
      </div>

      {/* Balance card */}
      <div className="rounded-3xl p-5 bg-gradient-to-br from-[#E31937] to-[#8A0F22] mb-4">
        <div className="text-xs text-white/80 mb-1">Account Balance</div>
        <div className="text-3xl font-bold text-white mb-4">
          UGX {me?.balance?.toLocaleString() ?? 0}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="bg-white text-[#0A0A0A] font-semibold py-2.5 rounded-2xl text-sm active:scale-[0.98] transition">
            Recharge
          </button>
          <button className="bg-black/30 text-white font-semibold py-2.5 rounded-2xl text-sm active:scale-[0.98] transition">
            Withdraw
          </button>
        </div>
      </div>

      {/* Deposit / Withdraw details */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button className="card p-3 text-left">
          <div className="text-[10px] text-[#8A8A8A] mb-1">Deposit details</div>
          <div className="text-xs font-semibold">View history →</div>
        </button>
        <button className="card p-3 text-left">
          <div className="text-[10px] text-[#8A8A8A] mb-1">Withdraw details</div>
          <div className="text-xs font-semibold">View history →</div>
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full border border-[#2A2A2A] text-[#FF7A8A] font-semibold py-3 rounded-2xl active:scale-[0.98] transition"
      >
        Log out
      </button>
    </main>
  );
}
