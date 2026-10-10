'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type TeamData = {
  referralCode: string;
  totalIncome: number;
  totalInvitations: number;
  level1Stats?: { totalInvite: number; validInvite: number; totalIncome: number; teamInvest: number };
  level2Stats?: { totalInvite: number; validInvite: number; totalIncome: number; teamInvest: number };
  level3Stats?: { totalInvite: number; validInvite: number; totalIncome: number; teamInvest: number };
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
  
  const currentStats = 
    activeLevel === 1 ? data?.level1Stats :
    activeLevel === 2 ? data?.level2Stats :
    data?.level3Stats;

  const stats = currentStats || { totalInvite: 0, validInvite: 0, totalIncome: 0, teamInvest: 0 };

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="px-2 mb-6">
        <h1 className="text-3xl font-bold text-[#F5F2ED]">Safranfrance Team</h1>
        <p className="text-[#8A8580] text-sm mt-1">Invite friends &amp; earn commissions</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card p-4 text-center bg-[#15151A] border-[#2A2823]">
          <div className="text-[10px] text-[#8A8580] font-bold uppercase tracking-wider mb-1">Total Income</div>
          <div className="text-2xl font-bold text-[#E0A44C]">UGX {(data?.totalIncome ?? 0).toLocaleString()}</div>
        </div>
        <div className="card p-4 text-center bg-[#15151A] border-[#2A2823]">
          <div className="text-[10px] text-[#8A8580] font-bold uppercase tracking-wider mb-1">Total Invitations</div>
          <div className="text-2xl font-bold text-[#F5F2ED]">{data?.totalInvitations ?? 0}</div>
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

      {/* Level Statistics */}
      <div className="grid grid-cols-2 gap-3">
        <StatBox label="TOTAL INVITE" value={stats.totalInvite} />
        <StatBox label="VALID INVITE" value={stats.validInvite} />
        <StatBox label="TOTAL INCOME" value={`UGX ${stats.totalIncome.toLocaleString()}`} highlight />
        <StatBox label="TEAM INVEST" value={`UGX ${stats.teamInvest.toLocaleString()}`} highlight />
      </div>
    </main>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="card p-4 text-center bg-[#15151A] border-[#2A2823]">
      <div className="text-[10px] text-[#8A8580] font-bold tracking-wider mb-1">{label}</div>
      <div className={`text-lg font-bold ${highlight ? 'text-[#E0A44C]' : 'text-[#F5F2ED]'}`}>
        {value}
      </div>
    </div>
  );
}
