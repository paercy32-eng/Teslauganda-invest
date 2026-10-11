'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Stats = {
  totalUsers: number;
  totalDeposited: number;
  totalInvested: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/stats?t=' + Date.now());
      if (!res.ok) {
        router.replace('/admin/login');
        return;
      }
      const data = await res.json();
      setStats(data);
      setLoading(false);
    }

    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [router]);

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  if (loading || !stats) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in bg-gray-50 text-gray-900">
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center text-white font-bold">
            A
          </div>
          <span className="text-xl font-bold text-gray-900">Safran Admin</span>
        </div>
        <button
          onClick={logout}
          className="text-xs text-red-500 font-semibold hover:text-red-600 transition"
        >
          Log out
        </button>
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-3 px-2">Overview</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Total Users" value={stats.totalUsers.toString()} />
        <StatCard
          label="Total Deposited"
          value={`UGX ${stats.totalDeposited.toLocaleString()}`}
        />
        <StatCard
          label="Total Invested"
          value={`UGX ${stats.totalInvested.toLocaleString()}`}
        />
        <StatCard
          label="Total Withdrawn"
          value={`UGX ${stats.totalWithdrawn.toLocaleString()}`}
        />
        <StatCard
          label="Pending Withdrawals"
          value={stats.pendingWithdrawals.toString()}
          highlight={stats.pendingWithdrawals > 0}
        />
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-3 px-2">Manage</h2>
      <div className="space-y-2">
        <NavCard
          href="/admin/users"
          title="Users"
          subtitle="View, ban, adjust balance, grant/remove robots"
        />
        <NavCard
          href="/admin/deposits"
          title="Deposits"
          subtitle="Approve or reject pending deposits"
        />
        <NavCard
          href="/admin/withdrawals"
          title="Withdrawals"
          subtitle="Approve or reject withdrawal requests"
        />
        <NavCard
          href="/admin/giftcards"
          title="Gift Codes"
          subtitle="Generate redeemable codes"
        />
        <NavCard
          href="/admin/products"
          title="Products"
          subtitle="Manage pricing, images, active status"
        />
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="text-[10px] tracking-wider text-gray-500 font-semibold mb-1">
        {label.toUpperCase()}
      </div>
      <div
        className={`text-base font-bold ${
          highlight ? 'text-red-500' : 'text-gray-900'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function NavCard({
  href,
  title,
  subtitle,
}: {
  href: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between active:scale-[0.99] transition shadow-sm hover:shadow-md"
    >
      <div>
        <div className="font-semibold text-gray-900">{title}</div>
        <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
      </div>
      <div className="text-gray-400">→</div>
    </Link>
  );
}
