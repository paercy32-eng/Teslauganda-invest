'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Stats = {
  totalUsers: number;
  totalDeposited: number;
  totalInvested: number;
  totalWithdrawn: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/stats');
      if (res.status === 401) {
        router.replace('/admin/login');
        return;
      }
      if (!res.ok) {
        router.replace('/admin/login');
        return;
      }
      const data = await res.json();
      setStats(data);
      setLoading(false);
    }
    load();
  }, [router]);

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  if (loading || !stats) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-[#6B7A62]">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#1F2A1B] flex items-center justify-center text-white font-bold">
            A
          </div>
          <span className="text-xl font-bold text-[#1F2A1B]">Admin</span>
        </div>
        <button
          onClick={logout}
          className="text-xs text-[#A13A3A] font-semibold"
        >
          Log out
        </button>
      </div>

      {/* Stats grid */}
      <h2 className="text-lg font-bold text-[#1F2A1B] mb-3 px-2">Overview</h2>
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
          label="Pending Deposits"
          value={stats.pendingDeposits.toString()}
          highlight={stats.pendingDeposits > 0}
        />
        <StatCard
          label="Pending Withdrawals"
          value={stats.pendingWithdrawals.toString()}
          highlight={stats.pendingWithdrawals > 0}
        />
      </div>

      {/* Quick links */}
      <h2 className="text-lg font-bold text-[#1F2A1B] mb-3 px-2">Manage</h2>
      <div className="space-y-2">
        <NavCard href="/admin/users" title="Users" subtitle="View, ban, adjust balance, grant/remove Tesla" />
        <NavCard href="/admin/deposits" title="Deposits" subtitle="Approve or reject incoming deposits" />
        <NavCard href="/admin/withdrawals" title="Withdrawals" subtitle="Approve or reject withdrawal requests" />
        <NavCard href="/admin/giftcards" title="Gift Codes" subtitle="Generate redeemable codes" />
        <NavCard href="/admin/products" title="Products" subtitle="Manage pricing, images, active status" />
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
    <div className="card p-4">
      <div className="text-[10px] tracking-wider text-[#6B7A62] font-semibold mb-1">
        {label.toUpperCase()}
      </div>
      <div
        className={`text-base font-bold ${
          highlight ? 'text-[#A13A3A]' : 'text-[#1F2A1B]'
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
      className="card p-4 flex items-center justify-between active:scale-[0.99] transition block"
    >
      <div>
        <div className="font-semibold text-[#1F2A1B]">{title}</div>
        <div className="text-xs text-[#6B7A62] mt-0.5">{subtitle}</div>
      </div>
      <div className="text-[#6B7A62]">→</div>
    </Link>
  );
}
