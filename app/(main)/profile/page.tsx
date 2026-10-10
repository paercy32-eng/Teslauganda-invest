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

// 👇 YOUR LINKS ARE HERE
const TELEGRAM_LINK = 'https://t.me/+GM_Fo41-HFsxNTc0';
const WHATSAPP_LINK = 'https://whatsapp.com/channel/0029Vb9OlFtKrWR36rpMst0O';

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
        setGiftMsg(`You received UGX ${data.amount.toLocaleString()}`);
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
          <div className="text-xs font-bold text-[#F5F2ED]">Deposit History</div>
          <div className="text-[10px] text-[#8A8580] mt-1">View all deposits</div>
        </Link>

        <Link href="/withdrawals" className="card p-4 bg-[#1A1A1F] border-[#2A2823] active:scale-[0.98] transition">
          <div className="text-xs font-bold text-[#F5F2ED]">Withdraw History</div>
          <div className="text-[10px] text-[#8A8580] mt-1">View all withdrawals</div>
        </Link>

        <button
          onClick={() => setShowGiftCard(true)}
          className="card p-4 bg-[#1A1A1F] border-[#2A2823] active:scale-[0.98] transition text-left"
        >
          <div className="text-xs font-bold text-[#F5F2ED]">Gift Cards</div>
          <div className="text-[10px] text-[#8A8580] mt-1">Redeem a code</div>
        </button>

        <Link href="/rewards" className="card p-4 bg-[#1A1A1F] border-[#2A2823] active:scale-[0.98] transition">
          <div className="text-xs font-bold text-[#F5F2ED]">Rewards</div>
          <div className="text-[10px] text-[#8A8580] mt-1">Team milestones</div>
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
          <div className="w-10 h-10 rounded-xl bg-[#229ED9]"></div>
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
          <div className="w-10 h-10 rounded-xl bg-[#25D366]"></div>
          <div className="flex-1">
            <div className="font-semibold text-[#F5F2ED] text-sm">Join WhatsApp Channel</div>
            <div className="text-[10px] text-[#8A8580] mt-0.5">Follow the Vortex Markets channel</div>
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

// ============================================================
// RECHARGE MODAL — MarzPay flow
// ============================================================
function RechargeModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState(String(MIN_DEPOSIT));
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    async function prefill() {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const data = await res.json();
          if (data?.user?.phone) setPhone(data.user.phone);
        }
      } catch {}
    }
    prefill();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');

    const cleanPhone = phone.trim();
    if (!/^\+?\d{9,15}$/.test(cleanPhone)) {
      setMsg('Enter a valid phone number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/deposits/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          phone: cleanPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || 'Failed to send payment request.');
      } else {
        setSent(true);
        startPolling();
      }
    } catch {
      setMsg('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  function startPolling() {
    let count = 0;
    const interval = setInterval(async () => {
      count++;
      setPollCount(count);
      if (count >= 20) {
        clearInterval(interval);
        onSuccess();
      }
    }, 3000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#1A1A1F] rounded-t-3xl p-5 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-lg font-bold text-[#F5F2ED]">Recharge</div>
            <div className="text-xs text-[#8A8580]">Pay via Mobile Money</div>
          </div>
          <button onClick={onClose} className="text-[#8A8580] text-xl">×</button>
        </div>

        {!sent ? (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-[10px] text-[#8A8580] font-bold mb-1">
                AMOUNT (UGX)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-light"
                min={MIN_DEPOSIT}
                required
              />
              <div className="text-[10px] text-[#8A8580] mt-1">
                Minimum: UGX {MIN_DEPOSIT.toLocaleString()}
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#8A8580] font-bold mb-1">
                MOBILE MONEY NUMBER
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0700123456"
                className="input-light"
                required
              />
              <div className="text-[10px] text-[#8A8580] mt-1">
                The PIN prompt will be sent to this number.
              </div>
            </div>

            {msg && (
              <div className="text-sm text-[#FF8A8A] bg-[#2A1416] rounded-xl px-3 py-2 border border-[#E5484D]/40">
                {msg}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending…' : 'Send payment request'}
            </button>
          </form>
        ) : (
          <div className="text-center py-4">
            <div className="font-semibold text-[#F5F2ED] mb-1 text-lg">
              Check your phone
            </div>
            <div className="text-sm text-[#8A8580] mb-4">
              Enter your mobile money PIN to complete the payment of UGX{' '}
              {Number(amount).toLocaleString()}.
            </div>
            <div className="text-xs text-[#E0A44C] font-semibold mb-2">
              Status: Reviewing
            </div>
            <div className="text-[10px] text-[#8A8580]">
              Waiting for confirmation… ({pollCount * 3}s)
            </div>
            <button
              onClick={onClose}
              className="mt-6 text-xs text-[#8A8580] underline"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// WITHDRAW MODAL
// ============================================================
function WithdrawModal({
  balance,
  defaultPhone,
  defaultName,
  onClose,
  onSuccess,
}: {
  balance: number;
  defaultPhone: string;
  defaultName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState(String(MIN_WITHDRAW));
  const [phone, setPhone] = useState(defaultPhone);
  const [fullName, setFullName] = useState(defaultName);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  const numAmount = Number(amount) || 0;
  const fee = Math.round(numAmount * 0.15);
  const net = Math.round(numAmount * 0.85);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');

    if (numAmount < MIN_WITHDRAW) {
      setMsg(`Minimum withdrawal is UGX ${MIN_WITHDRAW.toLocaleString()}`);
      return;
    }

    if (numAmount > balance) {
      setMsg('Amount exceeds your balance');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/withdrawals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          phone: phone.trim(),
          fullName: fullName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || 'Failed to submit request.');
      } else {
        setDone(true);
      }
    } catch {
      setMsg('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#1A1A1F] rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-lg font-bold text-[#F5F2ED]">Withdraw</div>
            <div className="text-xs text-[#8A8580]">
              Balance: UGX {balance.toLocaleString()}
            </div>
          </div>
          <button onClick={onClose} className="text-[#8A8580] text-xl">×</button>
        </div>

        {!done ? (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-[10px] text-[#8A8580] font-bold mb-1">
                AMOUNT (UGX)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-light"
                min={MIN_WITHDRAW}
                required
              />
              <div className="text-[10px] text-[#8A8580] mt-1">
                Minimum: UGX {MIN_WITHDRAW.toLocaleString()}
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#8A8580] font-bold mb-1">
                MOBILE MONEY NUMBER
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0700123456"
                className="input-light"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] text-[#8A8580] font-bold mb-1">
                FULL REGISTERED NAME
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="As registered on mobile money"
                className="input-light"
                required
              />
            </div>

            {numAmount >= MIN_WITHDRAW && (
              <div className="bg-[#15151A] border border-[#2A2823] rounded-2xl p-3 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-[#8A8580]">You request</span>
                  <span className="font-semibold text-[#F5F2ED]">
                    UGX {numAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#8A8580]">Fee (15%)</span>
                  <span className="font-semibold text-[#FF8A8A]">
                    -UGX {fee.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#2A2823] pt-1 mt-1">
                  <span className="text-[#8A8580]">You receive</span>
                  <span className="font-bold text-[#E0A44C]">
                    UGX {net.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {msg && (
              <div className="text-sm text-[#FF8A8A] bg-[#2A1416] rounded-xl px-3 py-2 border border-[#E5484D]/40">
                {msg}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting…' : 'Request withdrawal'}
            </button>

            <p className="text-[10px] text-[#8A8580] text-center">
              Withdrawals are processed within 24 hours.
            </p>
          </form>
        ) : (
          <div className="text-center py-4">
            <div className="font-semibold text-[#F5F2ED] mb-1 text-lg">
              Request submitted
            </div>
            <div className="text-xs text-[#E0A44C] font-semibold mb-2">
              Status: Reviewing
            </div>
            <div className="text-sm text-[#8A8580] mb-4">
              You'll receive UGX {net.toLocaleString()} once approved.
            </div>
            <button
              onClick={onSuccess}
              className="mt-2 text-xs text-[#8A8580] underline"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
                                          }
