'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type RewardsData = {
  teamInvestment: number;
  teamSize: number;
  currentTier: number;
  currentReward: number;
};

const TIERS = [
  { threshold: 100000, reward: 5000 },
  { threshold: 300000, reward: 10000 },
  { threshold: 500000, reward: 20000 },
  { threshold: 1000000, reward: 30000 },
  { threshold: 1500000, reward: 40000 },
  { threshold: 2000000, reward: 100000 },
];

export default function RewardsPage() {
  const router = useRouter();
  const [data, setData] = useState<RewardsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/tasks/check', { method: 'POST' });
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      const json = await res.json();

      // If a reward was just credited, reload user info later
      setData({
        teamInvestment: json.teamInvestment ?? 0,
        teamSize: json.teamSize ?? 0,
        currentTier: json.tier ?? json.currentTier ?? 0,
        currentReward: json.credited ?? json.currentReward ?? 0,
      });
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-[#6B7A8F]">Loading…</div>
      </main>
    );
  }

  const nextTier = TIERS.find((t) => t.threshold > data.teamInvestment);
  const toGo = nextTier ? nextTier.threshold - data.teamInvestment : 0;

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 px-2">
        <Link href="/profile" className="text-[#6B7A8F] text-xl">←</Link>
        <h1 className="text-xl font-bold text-[#0A2540]">Invitation Rewards</h1>
      </div>

      {/* Top card */}
      <div className="rounded-3xl p-5 mb-5 bg-gradient-to-br from-[#0A2540] to-[#061829] border border-[#00D9FF]/20">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🎁</span>
          <span className="text-white font-semibold text-sm">
            Total Team Investment
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-black/30 rounded-2xl p-3 border border-[#00D9FF]/20">
            <div className="text-[10px] text-[#00D9FF] font-semibold tracking-wider mb-1">
              TEAM INVESTMENT
            </div>
            <div className="text-lg font-bold text-white">
              UGX {data.teamInvestment.toLocaleString()}
            </div>
          </div>
          <div className="bg-black/30 rounded-2xl p-3 border border-[#00D9FF]/20">
            <div className="text-[10px] text-[#00D9FF] font-semibold tracking-wider mb-1">
              TEAM SIZE
            </div>
            <div className="text-lg font-bold text-white">
              {data.teamSize}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-[#00D9FF]">
          <span>✓</span>
          <span>Automatic claim once reached!</span>
        </div>
      </div>

      {/* Tiers */}
      <h2 className="text-sm font-bold text-[#0A2540] mb-3 px-2">
        Reward Tiers
      </h2>

      <div className="space-y-3">
        {TIERS.map((tier, index) => {
          const claimed = data.teamInvestment >= tier.threshold;
          const progress = Math.min(
            100,
            (data.teamInvestment / tier.threshold) * 100
          );
          const remaining = Math.max(0, tier.threshold - data.teamInvestment);

          return (
            <div
              key={index}
              className={`rounded-2xl p-4 border ${
                claimed
                  ? 'bg-[#E6F7F0] border-[#00A86B]/30'
                  : 'bg-white border-[#E1E7EF]'
              }`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      claimed
                        ? 'bg-[#00A86B] text-white'
                        : 'bg-[#F5F7FA] text-[#6B7A8F] border border-[#E1E7EF]'
                    }`}
                  >
                    {claimed ? '✓' : '🔒'}
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7A8F] font-semibold">
                      UGX {tier.threshold.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[#6B7A8F] mt-0.5">
                      Team Investment
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-[#00B8DB]">
                    +UGX {tier.reward.toLocaleString()}
                  </div>
                  <div
                    className={`text-[9px] font-bold uppercase mt-1 px-2 py-0.5 rounded-full inline-block ${
                      claimed
                        ? 'bg-[#00A86B] text-white'
                        : 'bg-[#F5F7FA] text-[#6B7A8F] border border-[#E1E7EF]'
                    }`}
                  >
                    {claimed ? 'Claimed' : 'Locked'}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-[#E1E7EF] overflow-hidden mb-1.5">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progress}%`,
                    background: claimed ? '#00A86B' : '#00D9FF',
                  }}
                />
              </div>

              {/* Bottom info */}
              <div className="flex justify-between text-[10px]">
                <span className="text-[#6B7A8F]">
                  UGX {Math.min(data.teamInvestment, tier.threshold).toLocaleString()} / UGX {tier.threshold.toLocaleString()}
                </span>
                {claimed ? (
                  <span className="text-[#00A86B] font-semibold">✓ Completed</span>
                ) : (
                  <span className="text-[#B8860B] font-semibold">
                    +UGX {remaining.toLocaleString()} to go
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
  }
