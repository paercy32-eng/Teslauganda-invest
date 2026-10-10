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

type Tab = 'main' | 'giftcard';

const MIN_DEPOSIT = 15000;
const MIN_WITHDRAW = 4000;

const NETWORKS: Record<
  'mtn' | 'airtel',
  { label: string; merchantCode: string; merchantName: string; dial: string; color: string }
> = {
  mtn: {
    label: 'MTN',
    merchantCode: '7182484',
    merchantName: 'Essentials Limited',
    dial: '*185*9#',
    color: '#FFCC00',
  },
  airtel: {
    label: 'Airtel',
    merchantCode: '44867602',
    merchantName: 'Nabirye Flavia',
    dial: '*165*3#',
    color: '#E31937',
  },
};

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
    <main className="min-h-screen px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-5">
        <SafranLogo size={32} textColor="#F5F2ED" accentColor="#1A1A1F" />
        <div className="text-right">
          <div className="text-[11px] text-[#8A8580]">Signed in</div>
          <div className="text-sm font-semibold text-[#F5F2ED]">{me?.name}</div>
        </div>
      </div>

      {/* Balance card */}
      <div className="rounded-3xl p-5 bg-gradient-to-br from-[#C8833A] to-[#8A5A28] mb-4">
        <div className="text-xs text-white/80 mb-1">Account Balance</div>
        <div className="text-3xl font-bold text-white mb-4">
          UGX {me?.balance?.toLocaleString() ?? 0}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowRecharge(true)}
            className="bg-[#F5F2ED] text-[#1A1A1F] font-bold py-2.5 rounded-2xl text-sm active:scale-[0.98] transition"
          >
            Recharge
          </button>
          <button
            onClick={() => setShowWithdraw(true)}
            className="bg-black/25 border border-white/20 text-white font-semibold py-2.5 rounded-2xl text-sm active:scale-[0.98] transition"
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* Deposit / Withdraw details */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Link href="/deposits" className="card p-3 text-left block">
          <div className="text-[10px] text-[#8A8580] mb-1">Deposit details</div>
          <div className="text-xs font-semibold text-[#F5F2ED]">View history →</div>
        </Link>
        <Link href="/withdrawals" className="card p-3 text-left block">
          <div className="text-[10px] text-[#8A8580] mb-1">Withdraw details</div>
          <div className="text-xs font-semibold text-[#F5F2ED]">View history →</div>
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
              background: tab === t.k ? '#C8833A' : '#1A1A1F',
              color: tab === t.k ? '#FFFFFF' : '#8A8580',
              borderColor: tab === t.k ? '#C8833A' : '#2A2823',
            }}
          >
            {t.label}
          </button>
        ))}
        <Link
          href="/rewards"
          className="py-2.5 rounded-2xl text-xs font-semibold transition border text-center flex items-center justify-center"
          style={{
            background: '#E0A44C',
            color: '#1A1A1F',
            borderColor: '#E0A44C',
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
            <div className="font-semibold text-[#F5F2ED]">Join Telegram</div>
            <div className="text-xs text-[#8A8580] mt-0.5">Get updates & support</div>
          </div>
          <div className="text-[#8A8580]">→</div>
        </a>
      )}

      {tab === 'giftcard' && (
        <div className="card p-4 mb-4">
          <div className="font-semibold text-[#F5F2ED] mb-1">Redeem Gift Card</div>
          <p className="text-xs text-[#8A8580] mb-3">
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
              <div className="text-sm text-[#F5F2ED] bg-[#15151A] rounded-xl px-3 py-2 border border-[#2A2823]">
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
        className="w-full border border-[#2A2823] text-[#E5484D] font-semibold py-3 rounded-2xl active:scale-[0.98] transition bg-[#1A1A1F]"
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

// ============================================================
// MULTI-STEP RECHARGE MODAL
// ============================================================
type RechargeStep = 'amount' | 'network' | 'details' | 'done';

function RechargeModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<RechargeStep>('amount');
  const [amount, setAmount] = useState(String(MIN_DEPOSIT));
  const [phone, setPhone] = useState('');
  const [network, setNetwork] = useState<'mtn' | 'airtel' | ''>('');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);

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

  function goToNetwork(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount)) {
      setMsg('Enter a valid amount.');
      return;
    }
    if (numAmount < MIN_DEPOSIT) {
      setMsg(`Minimum deposit is UGX ${MIN_DEPOSIT.toLocaleString()}.`);
      return;
    }

    const cleanPhone = phone.trim();
    if (!/^\+?\d{9,15}$/.test(cleanPhone)) {
      setMsg('Enter a valid phone number.');
      return;
    }

    setStep('network');
  }

  function chooseNetwork(n: 'mtn' | 'airtel') {
    setNetwork(n);
    setStep('details');
  }

  function copyDial(dial: string) {
    navigator.clipboard.writeText(dial);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');

    if (!transactionId.trim() || transactionId.trim().length < 4) {
      setMsg('Enter the transaction ID from your payment SMS.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/deposits/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          phone: phone.trim(),
          paymentMethod: network,
          transactionId: transactionId.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || 'Failed to submit deposit.');
      } else {
        setStep('done');
        onSuccess();
      }
    } catch {
      setMsg('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  const netInfo = network ? NETWORKS[network] : null;

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
            <div className="text-xs text-[#8A8580]">
              Step{' '}
              {step === 'amount' ? '1' : step === 'network' ? '2' : step === 'details' ? '3' : '✓'}{' '}
              of 3
            </div>
          </div>
          <button onClick={onClose} className="text-[#8A8580] text-xl">×</button>
        </div>

        {/* STEP 1 */}
        {step === 'amount' && (
          <form onSubmit={goToNetwork} className="space-y-4">
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
                The number you'll use to pay.
              </div>
            </div>

            {msg && (
              <div className="text-sm text-[#FF8A8A] bg-[#2A1416] rounded-xl px-3 py-2 border border-[#E5484D]/40">
                {msg}
              </div>
            )}

            <button type="submit" className="btn-primary">
              Continue
            </button>
          </form>
        )}

        {/* STEP 2 */}
        {step === 'network' && (
          <div className="space-y-3">
            <div className="text-sm text-[#8A8580] mb-2">
              Choose the network you're paying with:
            </div>

            <button
              onClick={() => chooseNetwork('mtn')}
              className="w-full text-left rounded-2xl p-4 border border-[#2A2823] bg-[#15151A] active:scale-[0.99] transition flex items-center gap-3"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs"
                style={{ background: NETWORKS.mtn.color }}
              >
                MTN
              </div>
              <div className="flex-1">
                <div className="font-bold text-[#F5F2ED]">MTN Mobile Money</div>
                <div className="text-xs text-[#8A8580]">Pay using MTN MoMo</div>
              </div>
              <div className="text-[#8A8580]">→</div>
            </button>

            <button
              onClick={() => chooseNetwork('airtel')}
              className="w-full text-left rounded-2xl p-4 border border-[#2A2823] bg-[#15151A] active:scale-[0.99] transition flex items-center gap-3"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs"
                style={{ background: NETWORKS.airtel.color }}
              >
                A
              </div>
              <div className="flex-1">
                <div className="font-bold text-[#F5F2ED]">Airtel Money</div>
                <div className="text-xs text-[#8A8580]">Pay using Airtel Money</div>
              </div>
              <div className="text-[#8A8580]">→</div>
            </button>

            <button
              onClick={() => setStep('amount')}
              className="w-full text-center text-xs text-[#8A8580] underline mt-2"
            >
              ← Back
            </button>
          </div>
        )}

        {/* STEP 3 */}
        {step === 'details' && netInfo && (
          <form onSubmit={submit} className="space-y-4">
            <div className="rounded-2xl p-4 bg-[#15151A] border border-[#2A2823]">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                  style={{ background: netInfo.color }}
                >
                  {network === 'mtn' ? 'MTN' : 'A'}
                </div>
                <div className="font-bold text-[#F5F2ED]">
                  {netInfo.label} Payment Details
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8A8580]">Merchant Code</span>
                  <span className="font-bold text-[#F5F2ED] font-mono">
                    {netInfo.merchantCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A8580]">Merchant Name</span>
                  <span className="font-semibold text-[#F5F2ED]">
                    {netInfo.merchantName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8A8580]">Dial</span>
                  <button
                    type="button"
                    onClick={() => copyDial(netInfo.dial)}
                    className="font-bold text-[#E0A44C] underline"
                  >
                    {copied ? '✓ Copied' : netInfo.dial}
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A8580]">Amount</span>
                  <span className="font-bold text-[#F5F2ED]">
                    UGX {Number(amount).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#2A2823] text-[10px] text-[#8A8580] leading-relaxed">
                Dial the code, choose <strong>Pay to Merchant</strong>, enter
                the merchant code <strong>{netInfo.merchantCode}</strong>, and
                pay <strong>UGX {Number(amount).toLocaleString()}</strong>.
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#8A8580] font-bold mb-1">
                TRANSACTION ID
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                placeholder="e.g. 15637858815"
                className="input-light uppercase"
                required
              />
              <div className="mt-2 text-[11px] text-[#FF8A8A] font-semibold bg-[#2A1416] border border-[#E5484D]/40 rounded-xl px-3 py-2 leading-tight">
                ⚠️ Enter the transaction ID EXACTLY as it appears in your
                payment SMS. Wrong transaction IDs may lead to loss of funds.
              </div>
            </div>

            {msg && (
              <div className="text-sm text-[#FF8A8A] bg-[#2A1416] rounded-xl px-3 py-2 border border-[#E5484D]/40">
                {msg}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit deposit'}
            </button>

            <p className="text-[10px] text-[#8A8580] text-center">
              Wait 5–10 minutes for approval.
            </p>

            <button
              type="button"
              onClick={() => setStep('network')}
              className="w-full text-center text-xs text-[#8A8580] underline"
            >
              ← Change network
            </button>
          </form>
        )}

        {/* STEP 4 */}
        {step === 'done' && (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">✅</div>
            <div className="font-semibold text-[#F5F2ED] mb-1">
              Deposit submitted
            </div>
            <div className="text-sm text-[#8A8580] mb-4">
              Your deposit of UGX {Number(amount).toLocaleString()} is being
              verified.
            </div>
            <div className="text-xs text-[#4ADE80] font-semibold mb-4">
              Wait 5–10 minutes for approval.
            </div>
            <button
              onClick={onClose}
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
            <div className="text-5xl mb-3">✅</div>
            <div className="font-semibold text-[#F5F2ED] mb-1">
              Request submitted
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
