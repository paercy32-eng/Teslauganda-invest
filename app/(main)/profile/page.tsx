'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SafranLogo from '@/components/SafranLogo';

type Me = {
  id: string;
  name: string;
  phone: string;
  balance: number;
};

const MIN_DEPOSIT = 15000;
const MIN_WITHDRAW = 5000;

// 👇 PUT YOUR LINKS HERE LATER
const TELEGRAM_LINK = 'https://t.me/+XXU8Ig4lhRQyY2U0';
const WHATSAPP_LINK = 'https://whatsapp.com/channel/YOUR_LINK_HERE';

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRecharge, setShowRecharge] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showGiftCard, setShowGiftCard] = useState(false);

  const [giftCode, setGiftCode] = useState('');
  const [giftMsg, setGiftMsg] = useState('');
  const [giftLoading, setGiftLoading] = useState(false);

  async function loadMe() {
    const res = await fetch('/api/me?t=' + Date.now(), { cache: 'no-store' });
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
      if (!res.ok) setGiftMsg(data.error || 'Failed to redeem.');
      else {
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

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-[#8A8580]">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-5">
        <SafranLogo size={32} textColor="#F5F2ED" accentColor="#1A1A1F" />
        <div className="text-right">
          <div className="text-[11px] text-[#8A8580]">Signed in</div>
          <div className="text-sm font-semibold text-[#F5F2ED]">{me?.name}</div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="rounded-3xl p-5 bg-gradient-to-br from-[#C8833A] to-[#8A5A28] mb-5 shadow-lg shadow-[#C8833A]/20">
        <div className="text-xs text-white/80 mb-1">Account Balance</div>
        <div className="text-4xl font-bold text-white mb-5">
          UGX {me?.balance?.toLocaleString() ?? 0}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowRecharge(true)}
            className="bg-white text-[#1A1A1F] font-bold py-3 rounded-2xl text-sm active:scale-[0.98] transition"
          >
            Recharge
          </button>
          <button
            onClick={() => setShowWithdraw(true)}
            className="bg-black/25 border border-white/20 text-white font-semibold py-3 rounded-2xl text-sm active:scale-[0.98] transition"
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <h2 className="text-sm font-bold text-[#F5F2ED] mb-3 px-1">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/deposits" className="card p-4 bg-[#1A1A1F] border-[#2A2823] active:scale-[0.98] transition">
          <div className="text-2xl mb-2">📥</div>
          <div className="text-xs font-bold text-[#F5F2ED]">Deposit History</div>
          <div className="text-[10px] text-[#8A8580] mt-0.5">View all deposits</div>
        </Link>

        <Link href="/withdrawals" className="card p-4 bg-[#1A1A1F] border-[#2A2823] active:scale-[0.98] transition">
          <div className="text-2xl mb-2">📤</div>
          <div className="text-xs font-bold text-[#F5F2ED]">Withdraw History</div>
          <div className="text-[10px] text-[#8A8580] mt-0.5">View all withdrawals</div>
        </Link>

        <button
          onClick={() => setShowGiftCard(true)}
          className="card p-4 bg-[#1A1A1F] border-[#2A2823] active:scale-[0.98] transition text-left"
        >
          <div className="text-2xl mb-2">🎁</div>
          <div className="text-xs font-bold text-[#F5F2ED]">Gift Cards</div>
          <div className="text-[10px] text-[#8A8580] mt-0.5">Redeem a code</div>
        </button>

        <Link href="/rewards" className="card p-4 bg-[#1A1A1F] border-[#2A2823] active:scale-[0.98] transition">
          <div className="text-2xl mb-2">🏆</div>
          <div className="text-xs font-bold text-[#F5F2ED]">Rewards</div>
          <div className="text-[10px] text-[#8A8580] mt-0.5">Team milestones</div>
        </Link>
      </div>

      {/* Community Section */}
      <h2 className="text-sm font-bold text-[#F5F2ED] mb-3 px-1">Join Our Community</h2>
      <div className="space-y-3 mb-6">
        {/* Telegram Card */}
        <a
          href={TELEGRAM_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="card p-4 flex items-center gap-3 bg-[#1A1A1F] border-[#2A2823] active:scale-[0.99] transition"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#229ED9] flex items-center justify-center text-white text-2xl">
            ✈️
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[#F5F2ED] text-sm">Join Telegram</div>
            <div className="text-[10px] text-[#8A8580] mt-0.5">Get updates & support</div>
          </div>
          <div className="text-[#8A8580]">→</div>
        </a>

        {/* WhatsApp Card */}
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="card p-4 flex items-center gap-3 bg-[#1A1A1F] border-[#2A2823] active:scale-[0.99] transition"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center text-white text-2xl">
            💬
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[#F5F2ED] text-sm">Join WhatsApp Channel</div>
            <div className="text-[10px] text-[#8A8580] mt-0.5">Get updates & support</div>
          </div>
          <div className="text-[#8A8580]">→</div>
        </a>
      </div>

      <button
        onClick={logout}
        className="w-full border border-[#2A2823] text-[#E5484D] font-semibold py-3 rounded-2xl active:scale-[0.98] transition bg-[#1A1A1F]"
      >
        Log out
      </button>

      {/* Modals */}
      {showRecharge && (
        <RechargeModal
          onClose={() => setShowRecharge(false)}
          onSuccess={async () => {
            await loadMe();
          }}
        />
      )}

      {showWithdraw && (
        <WithdrawModal
          balance={me?.balance ?? 0}
          defaultPhone={me?.phone ?? ''}
          defaultName={me?.name ?? ''}
          onClose={() => setShowWithdraw(false)}
          onSuccess={async () => {
            await loadMe();
          }}
        />
      )}

      {showGiftCard && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={() => setShowGiftCard(false)}>
          <div className="w-full max-w-md bg-[#1A1A1F] rounded-t-3xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-lg font-bold text-[#F5F2ED]">Redeem Gift Card</div>
                <div className="text-xs text-[#8A8580]">Enter code from admin</div>
              </div>
              <button onClick={() => setShowGiftCard(false)} className="text-[#8A8580] text-xl">×</button>
            </div>
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
                <div className="text-sm text-[#F5F2ED] bg-[#15151A] rounded-xl px-3 py-2 border border-[#2A2823]">
                  {giftMsg}
                </div>
              )}
              <button type="submit" className="btn-primary" disabled={giftLoading}>
                {giftLoading ? 'Redeeming…' : 'Redeem'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
  }
