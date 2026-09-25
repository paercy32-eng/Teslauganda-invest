'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Me = {
  id: string;
  name: string;
  phone: string;
  balance: number;
};

type Tab = 'main' | 'giftcard' | 'tasks';

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('main');

  // Gift card state
  const [giftCode, setGiftCode] = useState('');
  const [giftMsg, setGiftMsg] = useState('');
  const [giftLoading, setGiftLoading] = useState(false);

  // Task state
  const [taskMsg, setTaskMsg] = useState('');
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskData, setTaskData] = useState<{ validCount: number; currentReward?: number } | null>(null);

  async function loadMe() {
    const res = await fetch('/api/me');
    if (res.status === 401) {
      router.replace('/login');
      return;
    }
    const data = await res.json();
    setMe(data.user);
    setLoading(false);
  }

  useEffect(() => {
    loadMe();
  }, [router]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  async function redeemGift(e: React.FormEvent) {
    e.preventDefault();
    setGiftMsg('');
    setGiftLoading(true);
    try {
      const res = await fetch('/api/giftcard/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: giftCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGiftMsg(data.error || 'Failed to redeem.');
      } else {
        setGiftMsg(`🎉 You received UGX ${data.amount.toLocaleString()}`);
        setGiftCode('');
        await loadMe();
      }
    } catch {
      setGiftMsg('Something went wrong.');
    } finally {
      setGiftLoading(false);
    }
  }

  async function checkTasks() {
    setTaskMsg('');
    setTaskLoading(true);
    try {
      const res = await fetch('/api/tasks/check', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setTaskMsg(data.error || 'Failed to check tasks.');
      } else {
        setTaskData({ validCount: data.validCount, currentReward: data.currentReward });
        if (data.credited > 0) {
          setTaskMsg(`🎉 Reward credited: UGX ${data.credited.toLocaleString()}`);
          await loadMe();
        } else if (data.alreadyClaimed) {
          setTaskMsg(`You already claimed UGX ${Number(data.currentReward).toLocaleString()} for tier ${data.currentTier}.`);
        } else {
          setTaskMsg(`You have ${data.validCount} valid invites. Keep inviting to unlock a reward.`);
        }
      }
    } catch {
      setTaskMsg('Something went wrong.');
    } finally {
      setTaskLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-[#6B7A62]">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="px-2 mb-5">
        <h1 className="text-3xl font-bold text-[#1F2A1B]">Profile</h1>
        <p className="text-[#6B7A62] text-sm mt-1">
          {me?.name} · {me?.phone}
        </p>
      </div>

      {/* Balance card */}
      <div className="rounded-3xl p-5 bg-gradient-to-br from-[#7C9070] to-[#5A6E50] mb-4">
        <div className="text-xs text-white/80 mb-1">Account Balance</div>
        <div className="text-3xl font-bold text-white mb-4">
          UGX {me?.balance?.toLocaleString() ?? 0}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="bg-white text-[#1F2A1B] font-semibold py-2.5 rounded-2xl text-sm active:scale-[0.98] transition">
            Recharge
          </button>
          <button className="bg-black/20 text-white font-semibold py-2.5 rounded-2xl text-sm active:scale-[0.98] transition">
            Withdraw
          </button>
        </div>
      </div>

      {/* Deposit / Withdraw details */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button className="card p-3 text-left">
          <div className="text-[10px] text-[#6B7A62] mb-1">Deposit details</div>
          <div className="text-xs font-semibold text-[#1F2A1B]">View history →</div>
        </button>
        <button className="card p-3 text-left">
          <div className="text-[10px] text-[#6B7A62] mb-1">Withdraw details</div>
          <div className="text-xs font-semibold text-[#1F2A1B]">View history →</div>
        </button>
      </div>

      {/* Tab switcher */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {([
          { k: 'main', label: 'Telegram' },
          { k: 'giftcard', label: 'Gift Cards' },
          { k: 'tasks', label: 'Tasks' },
        ] as const).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as Tab)}
            className="py-2.5 rounded-2xl text-xs font-semibold transition border"
            style={{
              background: tab === t.k ? '#7C9070' : '#FFFFFF',
              color: tab === t.k ? '#FFFFFF' : '#6B7A62',
              borderColor: tab === t.k ? '#7C9070' : '#E3E8DE',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* --- TAB: TELEGRAM --- */}
      {tab === 'main' && (
        <a
          href="https://t.me/+wgO5sblcLZdlNDQ8"
          target="_blank"
          rel="noopener noreferrer"
          className="card p-4 flex items-center gap-3 mb-4 active:scale-[0.99] transition"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#229ED9] flex items-center justify-center text-white text-2xl">
            ✈️
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[#1F2A1B]">Join Telegram</div>
            <div className="text-xs text-[#6B7A62] mt-0.5">
              Get updates & support
            </div>
          </div>
          <div className="text-[#6B7A62]">→</div>
        </a>
      )}

      {/* --- TAB: GIFT CARDS --- */}
      {tab === 'giftcard' && (
        <div className="card p-4 mb-4">
          <div className="font-semibold text-[#1F2A1B] mb-1">Redeem Gift Card</div>
          <p className="text-xs text-[#6B7A62] mb-3">
            Enter code from admin. Codes expire in 5 minutes.
          </p>
          <form onSubmit={redeemGift} className="space-y-3">
            <input
              type="text"
              className="input-light uppercase"
              placeholder="GIFT CODE"
              value={giftCode}
              onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
              required
            />
            {giftMsg && (
              <div className="text-sm text-[#1F2A1B] bg-[#F7F8F5] rounded-xl px-3 py-2 border border-[#E3E8DE]">
                {giftMsg}
              </div>
            )}
            <button type="submit" className="btn-primary" disabled={giftLoading}>
              {giftLoading ? 'Redeeming…' : 'Redeem'}
            </button>
          </form>
        </div>
      )}

      {/* --- TAB: TASKS --- */}
      {tab === 'tasks' && (
        <div className="card p-4 mb-4">
          <div className="font-semibold text-[#1F2A1B] mb-1">Task Center</div>
          <p className="text-xs text-[#6B7A62] mb-3">
            Earn rewards when your valid invites (with active rentals) hit a tier.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <TierBox count={5} amount={5000} />
            <TierBox count={20} amount={10000} />
            <TierBox count={50} amount={30000} />
            <TierBox count={100} amount={50000} />
            <TierBox count={300} amount={100000} />
          </div>
          {taskMsg && (
            <div className="text-sm text-[#1F2A1B] bg-[#F7F8F5] rounded-xl px-3 py-2 border border-[#E3E8DE] mb-3">
              {taskMsg}
            </div>
          )}
          <button onClick={checkTasks} className="btn-primary" disabled={taskLoading}>
            {taskLoading ? 'Checking…' : 'Check my tasks'}
          </button>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full border border-[#E3E8DE] text-[#A13A3A] font-semibold py-3 rounded-2xl active:scale-[0.98] transition bg-white"
      >
        Log out
      </button>
    </main>
  );
}

function TierBox({ count, amount }: { count: number; amount: number }) {
  return (
    <div className="rounded-xl p-3 text-center bg-[#F7F8F5] border border-[#E3E8DE]">
      <div className="text-[10px] text-[#6B7A62] font-semibold">
        {count} INVITES
      </div>
      <div className="text-sm font-bold text-[#7C9070] mt-1">
        UGX {amount.toLocaleString()}
      </div>
    </div>
  );
            }
