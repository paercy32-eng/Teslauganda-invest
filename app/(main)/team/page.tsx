'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type LevelStats = { count: number; earnings: number };

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
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/team');
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      const json = await res.json();
      setData(json);
      setLoading(false);
    }
    load();
  }, [router]);

  function copy(text: string, kind: 'code' | 'link') {
    navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  }

  if (loading || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-[#8A8A8A]">Loading…</div>
      </main>
    );
  }

  const levelStats = data.levels[activeLevel];
  const levelPercent = activeLevel === 1 ? 25 : activeLevel === 2 ? 2 : 1;
  const referralLink = `https://teslauganda-invest.vercel.app/register?ref=${data.referralCode}`;

  return (
    <main
      className="min-h-screen animate-fade-in"
      style={{ background: '#0A1628' }}
    >
      {/* Header */}
      <div className="px-6 pt-10 pb-6 text-center">
        <h1 className="text-3xl font-bold text-white">My Team</h1>
        <p className="text-[#8A9AB8] text-sm mt-1">
          Invite friends &amp; earn commissions
        </p>
      </div>

      <div className="px-4 pb-6 space-y-4">
        {/* Top summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-2xl p-4 text-center"
            style={{ background: '#0F1E3A', border: '1px solid #F5C518' }}
          >
            <div className="text-[10px] tracking-wider text-[#F5C518] font-semibold mb-1">
              TOTAL INCOME
            </div>
            <div className="text-2xl font-bold text-[#F5C518]">
              UGX {data.totalEarnings.toLocaleString()}
            </div>
          </div>
          <div
            className="rounded-2xl p-4 text-center"
            style={{ background: '#0F1E3A', border: '1px solid #F5C518' }}
          >
            <div className="text-[10px] tracking-wider text-[#F5C518] font-semibold mb-1">
              TOTAL INVITATIONS
            </div>
            <div className="text-2xl font-bold text-[#F5C518]">
              {data.totalInvites}
            </div>
          </div>
        </div>

        {/* Invitation code + link */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: '#0F1E3A' }}
        >
          {/* Code */}
          <div>
            <div className="text-[11px] tracking-wider text-[#F5C518] font-semibold mb-2">
              INVITATION CODE
            </div>
            <div className="flex gap-2">
              <div
                className="flex-1 rounded-xl px-4 py-3 font-bold text-[#F5C518]"
                style={{ background: '#0A1628', border: '1px solid #1E3255' }}
              >
                {data.referralCode}
              </div>
              <button
                onClick={() => copy(data.referralCode, 'code')}
                className="px-5 rounded-xl font-bold text-[#0A1628] text-sm"
                style={{ background: '#F5C518' }}
              >
                {copied === 'code' ? '✓' : 'COPY'}
              </button>
            </div>
          </div>

          {/* Link */}
          <div>
            <div className="text-[11px] tracking-wider text-[#F5C518] font-semibold mb-2">
              INVITATION LINK
            </div>
            <div className="flex gap-2">
              <div
                className="flex-1 rounded-xl px-4 py-3 text-[#F5C518] text-xs truncate"
                style={{ background: '#0A1628', border: '1px solid #1E3255' }}
              >
                {referralLink}
              </div>
              <button
                onClick={() => copy(referralLink, 'link')}
                className="px-5 rounded-xl font-bold text-[#0A1628] text-sm"
                style={{ background: '#F5C518' }}
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
                className="rounded-xl py-3 text-sm font-semibold transition"
                style={{
                  background: active ? '#2563EB' : '#0F1E3A',
                  color: active ? '#FFFFFF' : '#8A9AB8',
                  border: active ? '1px solid #2563EB' : '1px solid #1E3255',
                }}
              >
                Level {lvl} ({pct}%)
              </button>
            );
          })}
        </div>

        {/* Level stats grid */}
        <div
          className="rounded-2xl p-4"
          style={{ background: '#0F1E3A' }}
        >
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="TOTAL INVITE" value={levelStats.count.toString()} />
            <StatBox label="VALID INVITE" value={levelStats.count.toString()} />
            <StatBox
              label="TOTAL INCOME"
              value={`UGX ${levelStats.earnings.toLocaleString()}`}
            />
            <StatBox
              label="TEAM INVEST"
              value={`UGX ${(levelStats.earnings * (100 / levelPercent)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl p-3 text-center"
      style={{ background: '#0A1628', border: '1px solid #1E3255' }}
    >
      <div className="text-[9px] tracking-wider text-[#8A9AB8] font-semibold mb-1">
        {label}
      </div>
      <div className="text-lg font-bold text-[#F5C518]">{value}</div>
    </div>
  );
              }
