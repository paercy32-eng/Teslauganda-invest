'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Tier = {
  target: number;
  reward: number;
  isClaimed: boolean;
};

export default function RewardsPage() {
  const router = useRouter();
  const [teamInvestment, setTeamInvestment] = useState(0);
  const [teamSize, setTeamSize] = useState(0);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/rewards');
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      const data = await res.json();
      setTeamInvestment(data.teamInvestment ?? 0);
      setTeamSize(data.teamSize ?? 0);
      setTiers(data.tiers ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-[#8A8580]">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in">
      {/* Summary Card */}
      <div className="card p-5 mb-6 bg-[#1A1A1F] border-[#2A2823]">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🎁</span>
          <h1 className="text-xl font-bold text-[#F5F2ED]">Team Investment Rewards</h1>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#15151A] border border-[#2A2823] rounded-xl p-3 text-center">
            <div className="text-[10px] text-[#8A8580] font-bold tracking-wider mb-1">TEAM INVESTMENT</div>
            <div className="text-lg font-bold text-[#E0A44C]">UGX {teamInvestment.toLocaleString()}</div>
          </div>
          <div className="bg-[#15151A] border border-[#2A2823] rounded-xl p-3 text-center">
            <div className="text-[10px] text-[#8A8580] font-bold tracking-wider mb-1">TEAM SIZE</div>
            <div className="text-lg font-bold text-[#F5F2ED]">{teamSize}</div>
          </div>
        </div>

        <p className="text-xs text-[#8A8580] text-center flex items-center justify-center gap-1">
          <span className="text-[#E0A44C]">✔</span> Automatic claim once reached!
        </p>
      </div>

      {/* Reward Tiers Header */}
      <h2 className="text-lg font-bold text-[#F5F2ED] mb-3 px-1">Reward Tiers</h2>

      {/* Tiers List */}
      <div className="space-y-3">
        {tiers.map((tier, index) => {
          const progress = Math.min((teamInvestment / tier.target) * 100, 100);
          const isCompleted = teamInvestment >= tier.target;
          const remaining = Math.max(tier.target - teamInvestment, 0);

          return (
            <div key={index} className="card p-4 bg-[#1A1A1F] border-[#2A2823]">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isCompleted ? 'bg-[#0F2A1A] text-[#4ADE80]' : 'bg-[#2A2823] text-[#8A8580]'}`}>
                    {isCompleted ? '✔' : '🔒'}
                  </div>
                  <div>
                    <div className="font-bold text-[#F5F2ED] text-sm">UGX {tier.target.toLocaleString()}</div>
                    <div className="text-[10px] text-[#8A8580]">Team Investment</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#E0A44C] text-sm">+UGX {tier.reward.toLocaleString()}</div>
                  <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${isCompleted ? 'bg-[#0F2A1A] text-[#4ADE80]' : 'bg-[#2A2823] text-[#8A8580]'}`}>
                    {isCompleted ? 'UNLOCKED' : 'LOCKED'}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-[#2A2823] rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${isCompleted ? 'bg-[#4ADE80]' : 'bg-[#C8833A]'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Progress Text */}
              <div className="flex justify-between text-[10px] text-[#8A8580]">
                <span>UGX {teamInvestment.toLocaleString()} / UGX {tier.target.toLocaleString()}</span>
                {!isCompleted && (
                  <span className="text-[#E0A44C] font-semibold">+UGX {remaining.toLocaleString()} to go</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
