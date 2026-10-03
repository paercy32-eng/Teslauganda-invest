'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type LevelStats = {
  count: number;
  validCount: number;
  earnings: number;
  invest: number;
};

type TeamData = {
  referralCode: string;
  totalEarnings: number;
  totalInvites: number;
  levels: {
    1: LevelStats;
    2: LevelStats;
    3: LevelStats;
  };
};

export default function TeamPage() {
  const router = useRouter();
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/team?t=' + Date.now(), {
        cache: 'no-store',
      });
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  function copy(text: string, kind: 'code' | 'link') {
    navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  }

  if (loading || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-[#6B7A8F]">Loading…</div>
      </main>
    );
  }

  const levelStats = data.levels[activeLevel];
  const levelPercent = activeLevel === 1 ? 25 : activeLevel === 2 ? 2 : 1;
  const referralLink = `https://robots-invest.vercel.app/register?ref=${data.referralCode}`;

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="px-2 pt-4 pb-6 text-center relative">
        <h1 className="text-3xl font-bold text-[#0A2540]">Robots Invest Team</h1>
        <p className="text-[#6B7A8F] text-sm mt-1">
          Invite friends &amp; earn commissions
        </p>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="absolute right-2 top-4 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0A2540] text-[#00D9FF] disabled:opacity-50"
        >
          {refreshing ? '…' : '↻ Refresh'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Top summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4 text-center">
            <div className="text-[10px] tracking-wider text-[#6B7A8F] font-semibold mb-1">
              TOTAL INCOME
            </div>
            <div className="text-2xl font-bold text-[#00B8DB]">
              UGX {data.totalEarnings.toLocaleString()}
            </div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-[10px] tracking-wider text-[#6B7A8F] font-semibold mb-1">
              TOTAL INVITATIONS
            </div>
            <div className="text-2xl font-bold text-[#00B8DB]">
              {data.totalInvites}
            </div>
          </div>
        </div>

        {/* Invitation code + link */}
        <div className="card p-5 space-y-4">
          <div>
            <div className="text-[11px] tracking-wider text-[#6B7A8F] font-semibold mb-2">
              INVITATION CODE
            </div>
            <div className="flex gap-2">
              <div className="flex-1 rounded-xl px-4 py-3 font-bold text-[#0A2540] bg-[#F5F7FA] border border-[#E1E7EF]">
                {data.referralCode}
              </div>
              <button
                onClick={() => copy(data.referralCode, 'code')}
                className="px-5 rounded-xl font-bold text-[#0A2540] text-sm bg-[#00D9FF] active:scale-[0.97] transition"
              >
                {copied === 'code' ? '✓' : 'COPY'}
              </button>
            </div>
          </div>

          <div>
            <div className="text-[11px] tracking-wider text-[#6B7A8F] font-semibold mb-2">
              INVITATION LINK
            </div>
            <div className="flex gap-2">
              <div className="flex-1 rounded-xl px-4 py-3 text-[#6B7A8F] text-xs truncate bg-[#F5F7FA] border border-[#E1E7EF]">
                {referralLink}
              </div>
              <button
                onClick={() => copy(referralLink, 'link')}
                className="px-5 rounded-xl font-bold text-[#0A2540] text-sm bg-[#00D9FF] active:scale-[0.97] transition"
              >
                {copied === 'link' ? '✓' : 'COPY'}
              </button>
            </div>
          </div>
        </div>

        {/* Level tabs */}
        <div className="grid grid-cols-3 gap-2">
          {([1, 2, 3] as const).map((lvl) => {
            const pct = lvl === 1 ? 25 : lvl === 2 ? 2 : 1;
            const active = activeLevel === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setActiveLevel(lvl)}
                className="rounded-xl py-3 text-sm font-semibold transition border"
                style={{
                  background: active ? '#0A2540' : '#FFFFFF',
                  color: active ? '#00D9FF' : '#6B7A8F',
                  borderColor: active ? '#0A2540' : '#E1E7EF',
                }}
              >
                Level {lvl} ({pct}%)
              </button>
            );
          })}
        </div>

        {/* Level stats grid */}
        <div className="card p-4">
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="TOTAL INVITE" value={levelStats.count.toString()} />
            <StatBox label="VALID INVITE" value={levelStats.validCount.toString()} />
            <StatBox
              label="TOTAL INCOME"
              value={`UGX ${levelStats.earnings.toLocaleString()}`}
            />
            <StatBox
              label="TEAM INVEST"
              value={`UGX ${levelStats.invest.toLocaleString()}`}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-3 text-center bg-[#F5F7FA] border border-[#E1E7EF]">
      <div className="text-[9px] tracking-wider text-[#6B7A8F] font-semibold mb-1">
        {label}
      </div>
      <div className="text-lg font-bold text-[#00B8DB]">{value}</div>
    </div>
  );
}
