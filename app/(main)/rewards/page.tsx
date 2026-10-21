'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Tier = {
  target: number;
  reward: number;
  isClaimed: boolean;
};

// Hardcoded 6 Tiers
const DEFAULT_TIERS: Tier[] = [
  { target: 200000, reward: 10000, isClaimed: false },
  { target: 500000, reward: 25000, isClaimed: false },
  { target: 1000000, reward: 50000, isClaimed: false },
  { target: 2000000, reward: 100000, isClaimed: false },
  { target: 5000000, reward: 250000, isClaimed: false },
  { target: 10000000, reward: 500000, isClaimed: false },
];

export default function RewardsPage() {
  const router = useRouter();
  const [teamInvestment, setTeamInvestment] = useState(0);
  const [teamSize, setTeamSize] = useState(0);
  const [tiers, setTiers] = useState<Tier[]>(DEFAULT_TIERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/rewards');
        
        if (res.status === 401) {
          router.replace('/login');
          return;
        }

        if (!res.ok) {
          throw new Error('Failed to load rewards');
        }

        const data = await res.json();
        setTeamInvestment(data.teamInvestment ?? 0);
        setTeamSize(data.teamSize ?? 0);
        
        if (data.tiers && data.tiers.length > 0) {
          setTiers(data.tiers);
        }
      } catch (err) {
        console.error('Rewards load error:', err);
      } finally {
        setLoading(false);
      }
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
    <main className="min-h-screen relative animate-fade-in pb-24">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80')" 
        }}
      />
      <div className="fixed inset-0 z-0 bg-slate-50/85 backdrop-blur-[3px]" />

      {/* Main Content Wrapper */}
      <div className="relative z-10 px-4 pt-6">
        
        {/* Summary Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 mb-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            {/* Replaced Gift Emoji with SVG */}
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 12 20 22 4 22 4 12"></polyline>
                <rect x="2" y="7" width="20" height="5"></rect>
                <line x1="12" y1="22" x2="12" y2="7"></line>
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
              </svg>
            </div>
            <h1 className="text-xl font-black text-slate-900">Team Rewards</h1>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
              <div className="text-[10px] text-slate-500 font-bold tracking-wider mb-1 uppercase">Team Investment</div>
              <div className="text-lg font-bold text-emerald-600">UGX {teamInvestment.toLocaleString()}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
              <div className="text-[10px] text-slate-500 font-bold tracking-wider mb-1 uppercase">Team Size</div>
              <div className="text-lg font-bold text-slate-900">{teamSize}</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 font-medium">
            {/* Replaced Check Emoji with SVG */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Automatic claim once reached!
          </div>
        </div>

        {/* Reward Tiers Header */}
        <h2 className="text-lg font-bold text-slate-900 mb-3 px-1">Reward Tiers</h2>

        {/* Tiers List */}
        <div className="space-y-3">
          {tiers.map((tier, index) => {
            const progress = Math.min((teamInvestment / tier.target) * 100, 100);
            const isCompleted = teamInvestment >= tier.target;
            const remaining = Math.max(tier.target - teamInvestment, 0);

            return (
              <div key={index} className="bg-white/90 backdrop-blur-md rounded-3xl p-4 shadow-sm border border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Replaced Lock/Check Emoji with SVG inside the circle */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                      {isCompleted ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">UGX {tier.target.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500 font-medium">Team Investment</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600 text-sm">+UGX {tier.reward.toLocaleString()}</div>
                    <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block border ${isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {isCompleted ? 'UNLOCKED' : 'LOCKED'}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${isCompleted ? 'bg-emerald-500' : 'bg-emerald-400'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Progress Text */}
                <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                  <span>UGX {teamInvestment.toLocaleString()} / UGX {tier.target.toLocaleString()}</span>
                  {!isCompleted && (
                    <span className="text-emerald-600 font-bold">+UGX {remaining.toLocaleString()} to go</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
