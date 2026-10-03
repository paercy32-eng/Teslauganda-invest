'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Me = {
  id: string;
  name: string;
  phone: string;
  balance: number;
};

type Tab = 'main' | 'giftcard';

const MIN_DEPOSIT = 15000;
const MIN_WITHDRAW = 4000;

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('main');
  const [showRecharge, setShowRecharge] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const [giftCode, setGiftCode] = useState('');
  const [giftMsg, setGiftMsg] = useState('');
  const [giftLoading, setGiftLoading] = useState(false);

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
        <div className="text-[#6B7A8F]">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in">
      <div className="px-2 mb-5">
        <h1 className="text-3xl font-bold text-[#0A2540]">Robots Invest</h1>
        <p className="text-[#6B7A8F] text-sm mt-1">
          {me?.name} · {me?.phone}
        </p>
      </div>

      {/* Balance card */}
      <div className="rounded-3xl p-5 bg-gradient-to-br from-[#0A2540] to-[#061829] mb-4">
        <div className="text-xs text-white/70 mb-1">Robots Invest Balance</div>
        <div className="text-3xl font-bold text-white mb-4">
          UGX {me?.balance?.toLocaleString() ?? 0}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowRecharge(true)}
            className="bg-[#00D9FF] text-[#0A2540] font-bold py-2.5 rounded-2xl text-sm active:scale-[0.98] transition"
          >
            Recharge
          </button>
          <button
            onClick={() => setShowWithdraw(true)}
            className="bg-white/10 border border-white/20 text-white font-semibold py-2.5 rounded-2xl text-sm active:scale-[0.98] transition"
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* Deposit / Withdraw details */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Link href="/deposits" className="card p-3 text-left block">
          <div className="text-[10px] text-[#6B7A8F] mb-1">Deposit details</div>
          <div className="text-xs font-semibold text-[#0A2540]">View history →</div>
        </Link>
        <Link href="/withdrawals" className="card p-3 text-left block">
          <div className="text-[10px] text-[#6B7A8F] mb-1">Withdraw details</div>
          <div className="text-xs font-semibold text-[#0A2540]">View history →</div>
        </Link>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {([
          { k: 'main', label: 'Telegram' },
          { k: 'giftcard', label: 'Gift Cards' },
        ] as const).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as Tab)}
            className="py-2.5 rounded-2xl text-xs font-semibold transition border"
            style={{
              background: tab === t.k ? '#0A2540' : '#FFFFFF',
              color: tab === t.k ? '#00D9FF' : '#6B7A8F',
              borderColor: tab === t.k ? '#0A2540' : '#E1E7EF',
            }}
          >
            {t.label}
          </button>
        ))}
        <Link
          href="/rewards"
          className="py-2.5 rounded-2xl text-xs font-semibold transition border text-center flex items-center justify-center"
          style={{
            background: '#00D9FF',
            color: '#0A2540',
            borderColor: '#00D9FF',
          }}
        >
          Rewards 🎁
        </Link>
      </div>

      {tab === 'main' && (
        <a
          href="https://t.me/+XXU8Ig4lhRQyY2U0"
          target="_blank"
          rel="noopener noreferrer"
          className="card p-4 flex items-center gap-3 mb-4 active:scale-[0.99] transition"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#229ED9] flex items-center justify-center text-white text-2xl">
            ✈️
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[#0A2540]">Join Telegram</div>
            <div className="text-xs text-[#6B7A8F] mt-0.5">Get updates & support</div>
          </div>
          <div className="text-[#6B7A8F]">→</div>
        </a>
      )}

      {tab === 'giftcard' && (
        <div className="card p-4 mb-4">
          <div className="font-semibold text-[#0A2540] mb-1">Redeem Gift Card</div>
          <p className="text-xs text-[#6B7A8F] mb-3">
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
              <div className="text-sm text-[#0A2540] bg-[#F5F7FA] rounded-xl px-3 py-2 border border-[#E1E7EF]">
                {giftMsg}
              </div>
            )}
            <button type="submit" className="btn-primary" disabled={giftLoading}>
              {giftLoading ? 'Redeeming…' : 'Redeem'}
            </button>
          </form>
        </div>
      )}

      <button
        onClick={logout}
        className="w-full border border-[#E1E7EF] text-[#E11D48] font-semibold py-3 rounded-2xl active:scale-[0.98] transition bg-white"
      >
        Log out
      </button>

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
    </main>
  );
}

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-lg font-bold text-[#0A2540]">Recharge</div>
            <div className="text-xs text-[#6B7A8F]">Deposit via Mobile Money</div>
          </div>
          <button onClick={onClose} className="text-[#6B7A8F] text-xl">×</button>
        </div>

        {!sent ? (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-[10px] text-[#6B7A8F] font-bold mb-1">
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
              <div className="text-[10px] text-[#6B7A8F] mt-1">
                Minimum: UGX {MIN_DEPOSIT.toLocaleString()}
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#6B7A8F] font-bold mb-1">
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
              <div className="text-[10px] text-[#6B7A8F] mt-1">
                The PIN prompt will be sent to this number.
              </div>
            </div>

            {msg && (
              <div className="text-sm text-[#E11D48] bg-[#FFF1F3] rounded-xl px-3 py-2 border border-[#E11D48]/30">
                {msg}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending…' : 'Send payment request'}
            </button>
          </form>
        ) : (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">📱</div>
            <div className="font-semibold text-[#0A2540] mb-1">
              Check your phone
            </div>
            <div className="text-sm text-[#6B7A8F] mb-4">
              Enter your mobile money PIN to complete the payment of UGX{' '}
              {Number(amount).toLocaleString()}.
            </div>
            <div className="text-xs text-[#6B7A8F]">
              Waiting for confirmation… ({pollCount * 3}s)
            </div>
            <button
              onClick={onClose}
              className="mt-6 text-xs text-[#6B7A8F] underline"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-lg font-bold text-[#0A2540]">Withdraw</div>
            <div className="text-xs text-[#6B7A8F]">
              Balance: UGX {balance.toLocaleString()}
            </div>
          </div>
          <button onClick={onClose} className="text-[#6B7A8F] text-xl">×</button>
        </div>

        {!done ? (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-[10px] text-[#6B7A8F] font-bold mb-1">
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
              <div className="text-[10px] text-[#6B7A8F] mt-1">
                Minimum: UGX {MIN_WITHDRAW.toLocaleString()}
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#6B7A8F] font-bold mb-1">
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
              <label className="block text-[10px] text-[#6B7A8F] font-bold mb-1">
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
              <div className="bg-[#F5F7FA] border border-[#E1E7EF] rounded-2xl p-3 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-[#6B7A8F]">You request</span>
                  <span className="font-semibold text-[#0A2540]">
                    UGX {numAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#6B7A8F]">Fee (15%)</span>
                  <span className="font-semibold text-[#E11D48]">
                    -UGX {fee.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#E1E7EF] pt-1 mt-1">
                  <span className="text-[#6B7A8F]">You receive</span>
                  <span className="font-bold text-[#00B8DB]">
                    UGX {net.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {msg && (
              <div className="text-sm text-[#E11D48] bg-[#FFF1F3] rounded-xl px-3 py-2 border border-[#E11D48]/30">
                {msg}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting…' : 'Request withdrawal'}
            </button>

            <p className="text-[10px] text-[#6B7A8F] text-center">
              Your balance will be deducted immediately. Withdrawals are processed
              after admin review.
            </p>
          </form>
        ) : (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">✅</div>
            <div className="font-semibold text-[#0A2540] mb-1">
              Request submitted
            </div>
            <div className="text-sm text-[#6B7A8F] mb-4">
              You'll receive UGX {net.toLocaleString()} once approved.
            </div>
            <button
              onClick={onSuccess}
              className="mt-2 text-xs text-[#6B7A8F] underline"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
      }
