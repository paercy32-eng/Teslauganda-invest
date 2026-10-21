'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface ReferralEntry {
  id: string;
  referred_id: string;
  name: string;
  phone: string;
  earnings: number;
  joined_at: string;
}

interface ReferralsResponse {
  referralCode: string;
  totalEarnings: number;
  counts: { level1: number; level2: number; level3: number };
  levels: {
    level1: ReferralEntry[];
    level2: ReferralEntry[];
    level3: ReferralEntry[];
  };
}

const LEVEL_RATES: Record<number, string> = {
  1: '20%',
  2: '3%',
  3: '1%',
};

export default function TeamPage() {
  const router = useRouter();
  const [data, setData] = useState<ReferralsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);

  async function loadReferrals() {
    setLoading(true);
    try {
      const res = await fetch('/api/team?t=' + Date.now(), {
        cache: 'no-store',
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || 'Could not load team');
        setLoading(false);
        return;
      }

      setData(json);
      setLoading(false);
    } catch (err) {
      toast.error('Network error');
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReferrals();
  }, []);

  async function copyToClipboard(text: string, type: 'code' | 'link') {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(type === 'code' ? 'Code copied!' : 'Link copied!');
    } catch {
      toast.error('Could not copy');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20 bg-gray-50 min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 bg-gray-50 min-h-screen">
        <p className="text-gray-500 text-sm">Could not load team data.</p>
      </div>
    );
  }

  const sumEarnings = (list: ReferralEntry[]) =>
    list.reduce((sum, r) => sum + (Number(r.earnings) || 0), 0);

  const currentLevelList =
    activeLevel === 1
      ? data.levels.level1
      : activeLevel === 2
      ? data.levels.level2
      : data.levels.level3;

  const currentCount =
    activeLevel === 1
      ? data.counts.level1
      : activeLevel === 2
      ? data.counts.level2
      : data.counts.level3;

  const currentEarnings = sumEarnings(currentLevelList);
  const referralLink = `https://chinasaikenpumps.vercel.app/register?ref=${data.referralCode}`;

  return (
    <div className="animate-fade-in bg-gray-50 min-h-screen pb-24">
      
      {/* Header */}
      <div className="bg-white px-4 py-6 shadow-sm mb-4">
        <h1 className="text-2xl font-extrabold text-gray-900">Saiken Team</h1>
        <p className="text-green-600 font-semibold text-xs mt-1 tracking-wide uppercase">Build your network & earn commissions</p>
      </div>

      <div className="px-4">
        
        {/* Educational Image Section */}
        <div className="mb-5 rounded-2xl overflow-hidden shadow-sm border border-gray-200 relative">
          {/* 👇 YOUR NEW IMAGE IS HERE */}
          <img 
            src="/grok_image_1792588008016.jpg" 
            alt="Engineers teaching pump operation" 
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4">
            <h2 className="text-white font-bold text-lg leading-tight">Empowering Local Expertise</h2>
            <p className="text-gray-200 text-xs mt-1">Join us in revolutionizing industrial pump technology.</p>
          </div>
        </div>

        {/* Top Totals */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Total Commission</div>
            <div className="text-xl font-bold text-green-600">UGX {data.totalEarnings.toLocaleString()}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Total Team Size</div>
            <div className="text-xl font-bold text-gray-900">{data.counts.level1 + data.counts.level2 + data.counts.level3}</div>
          </div>
        </div>

        {/* Referral Link Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-6">
          <div className="mb-4">
            <label className="block text-[10px] text-gray-500 font-bold mb-1.5 uppercase tracking-wider">Your Invite Code</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 font-bold font-mono tracking-widest text-sm">
                {data.referralCode}
              </div>
              <button
                onClick={() => copyToClipboard(data.referralCode, 'code')}
                className="bg-green-600 text-white px-4 rounded-xl text-xs font-bold active:scale-95 transition"
              >
                Copy
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 font-bold mb-1.5 uppercase tracking-wider">Your Invite Link</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-500 text-xs truncate">
                {referralLink}
              </div>
              <button
                onClick={() => copyToClipboard(referralLink, 'link')}
                className="bg-green-600 text-white px-4 rounded-xl text-xs font-bold active:scale-95 transition"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Level Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {([1, 2, 3] as const).map((level) => {
            const count = level === 1 ? data.counts.level1 : level === 2 ? data.counts.level2 : data.counts.level3;
            const isActive = activeLevel === level;

            return (
              <button
                key={level}
                onClick={() => setActiveLevel(level)}
                className={`py-3 rounded-2xl text-xs font-bold transition flex flex-col items-center leading-tight border ${
                  isActive
                    ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20'
                    : 'bg-white border-gray-200 text-gray-600'
                }`}
              >
                <span>Level {level} ({count})</span>
                <span className={`text-[10px] mt-1 font-semibold ${isActive ? 'text-green-200' : 'text-green-600'}`}>
                  {LEVEL_RATES[level]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Level Stats */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <div>
              <p className="text-gray-900 font-bold text-sm">Level {activeLevel} Network</p>
              <p className="text-gray-500 text-[10px]">Direct {activeLevel === 1 ? 'referrals' : 'sub-referrals'}</p>
            </div>
            <p className="text-gray-900 font-extrabold text-2xl">{currentCount}</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 font-bold text-sm">Earned from Level {activeLevel}</p>
              <p className="text-gray-500 text-[10px]">Commission generated</p>
            </div>
            <div className="text-right">
              <p className="text-green-600 font-extrabold text-lg">UGX {currentEarnings.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-400 text-[10px] mt-6 px-4">
          Commissions are credited automatically to your wallet when your team members invest in Saiken Pumps.
        </p>

      </div>
    </div>
  );
}
