'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type LevelStats = {
  totalInvite: number;
  validInvite: number;
  totalIncome: number;
  teamInvest: number;
};

type TeamData = {
  referralCode: string;
  totalIncome: number;
  totalInvitations: number;
  level1Stats?: LevelStats;
  level2Stats?: LevelStats;
  level3Stats?: LevelStats;
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

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-[#8A8580]">Loading…</div>
      </main>
    );
  }

  const referralLink = `https://safranfrance.vercel.app/register?ref=${data?.referralCode || ''}`;

  // Calculate grand totals across all levels
  const grandTotalIncome =
    (data?.level1Stats?.totalIncome || 0) +
    (data?.level2Stats?.totalIncome || 0) +
    (data?.level3Stats?.totalIncome || 0);

  const grandTotalInvites =
    (data?.level1Stats?.totalInvite || 0) +
    (data?.level2Stats?.totalInvite || 0) +
    (data?.level3Stats?.totalInvite || 0);

  // Get current level stats based on active tab
  const currentStats =
    activeLevel === 1 ? data?.level1Stats :
    activeLevel === 2 ? data?.level2Stats :
    data?.level3Stats;

  const levelReferrals = currentStats?.totalInvite || 0;

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="px-2 mb-6">
        <h1 className="text-3xl font-bold text-[#F5F2ED]">Safranfrance Team</h1>
        <p className="text-[#8A8580] text-sm mt-1">Invite friends &amp; earn commissions</p>
      </div>

      {/* Top Grand Totals */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card p-4 text-center bg-[#15151A] border-[#2A2823]">
          <div className="text-[10px] text-[#8A8580] font-bold uppercase tracking-wider mb-1">Total Income</div>
          <div className="text-2xl font-bold text-[#E0A44C]">UGX {grandTotalIncome.toLocaleString()}</div>
        </div>
        <div className="card p-4 text-center bg-[#15151A] border-[#2A2823]">
          <div className="text-[10px] text-[#8A8580] font-bold uppercase tracking-wider mb-1">Total Invitations</div>
          <div className="text-2xl font-bold text-[#F5F2ED]">{grandTotalInvites}</div>
        </div>
      </div>

      {/* Referral Details */}
      <div className="card p-5 mb-6 bg-[#1A1A1F] border-[#2A2823] space-y-4">
        {/* Invitation Code */}
        <div>
          <label className="block text-[10px] text-[#8A8580] font-bold mb-2 tracking-wider">INVITATION CODE</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-[#15151A] border border-[#2A2823] rounded-xl px-4 py-3 text-[#F5F2ED] font-bold tracking-widest">
              {data?.referralCode || '------'}
            </div>
            <button
              onClick={() => copyToClipboard(data?.referralCode || '', 'code')}
              className="bg-[#C8833A] text-white font-bold px-4 rounded-xl text-xs active:scale-95 transition"
            >
              {copied === 'code' ? 'Copied!' : 'COPY'}
            </button>
          </div>
        </div>

        {/* Invitation Link */}
        <div>
          <label className="block text-[10px] text-[#8A8580] font-bold mb-2 tracking-wider">INVITATION LINK</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-[#15151A] border border-[#2A2823] rounded-xl px-4 py-3 text-[#F5F2ED] text-xs truncate">
              {referralLink}
            </div>
            <button
              onClick={() => copyToClipboard(referralLink, 'link')}
              className="bg-[#C8833A] text-white font-bold px-4 rounded-xl text-xs active:scale-95 transition"
            >
              {copied === 'link' ? 'Copied!' : 'COPY'}
            </button>
          </div>
        </div>
      </div>

      {/* Level Tabs */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {([1, 2, 3] as const).map((lvl) => {
          const percent = lvl === 1 ? '25%' : lvl === 2 ? '2%' : '1%';
          const isActive = activeLevel === lvl;
          return (
            <button
              key={lvl}
              onClick={() => setActiveLevel(lvl)}
              className={`py-3 rounded-2xl text-xs font-semibold transition border ${
                isActive
                  ? 'bg-[#C8833A] border-[#C8833A] text-white shadow-lg shadow-[#C8833A]/20'
                  : 'bg-[#1A1A1F] border-[#2A2823] text-[#8A8580]'
              }`}
            >
              Level {lvl} ({percent})
            </button>
          );
        })}
      </div>

      {/* Single Level Stats Display */}
      <div className="card p-6 text-center bg-[#15151A] border-[#2A2823]">
        <div className="text-[10px] text-[#8A8580] font-bold tracking-wider mb-2">
          LEVEL {activeLevel} REFERRALS
        </div>
        <div className="text-4xl font-bold text-[#F5F2ED]">
          {levelReferrals}
        </div>
        <div className="text-[10px] text-[#8A8580] mt-2">
          Total number of invites on this level
        </div>
      </div>
    </main>
  );
}
