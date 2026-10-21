'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';

type Me = {
  id: string;
  name: string;
  phone: string;
  balance: number;
};

type Product = {
  id: string;
  name: string;
  price: number;
  cycle_days: number;
  daily_return: number;
};

const MIN_DEPOSIT = 15000;
const MIN_WITHDRAW = 5000;

// Update these with your actual links
const TELEGRAM_LINK = 'https://t.me/+GM_Fo41-HFsxNTc0';
const CS_WHATSAPP_LINK = 'https://wa.me/256705371032';

export default function HomePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  // Modal States
  const [showRecharge, setShowRecharge] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

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
    async function load() {
      const meRes = await fetch('/api/me?t=' + Date.now(), { cache: 'no-store' });
      if (meRes.status === 401) {
        router.replace('/login');
        return;
      }
      const meData = await meRes.json();
      setMe(meData.user);

      const prodRes = await fetch('/api/products?t=' + Date.now(), { cache: 'no-store' });
      const prodData = await prodRes.json();
      setProducts(prodData.products ?? []);

      setLoading(false);
    }
    load();
  }, [router]);

  function handleRent(product: Product) {
    setFeedback(null);
    setSelected(product);
  }

  async function confirmRent(product: Product) {
    const res = await fetch('/api/rentals/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id }),
    });
    const data = await res.json();

    if (!res.ok) {
      setFeedback({ ok: false, msg: data.error || 'Failed to invest.' });
      return;
    }

    setFeedback({
      ok: true,
      msg: `🎉 You invested in ${product.name}! Daily return: UGX ${Number(product.daily_return).toLocaleString()}`,
    });
    await loadMe();
    setTimeout(() => {
      setSelected(null);
      setFeedback(null);
    }, 2500);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-emerald-600 font-semibold">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 bg-slate-50 animate-fade-in pb-24">
      
      {/* Header with New Logo */}
      <div className="flex items-center justify-between mb-5 px-2">
        <div className="flex items-center gap-2">
          {/* NEW PROFESSIONAL LOGO */}
          <div className="relative flex items-center justify-center w-10 h-10 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-600/30 overflow-hidden">
            {/* Abstract Gear/Pump SVG */}
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="currentColor"/>
              <circle cx="12" cy="12" r="4" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-tight tracking-tight">SAIKEN</h1>
            <p className="text-[10px] text-emerald-600 font-bold tracking-widest uppercase">Pumps</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-500 font-medium">Welcome back</div>
          <div className="text-sm font-bold text-slate-900">{me?.name}</div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 mb-4 shadow-sm">
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Available Balance</div>
        <div className="text-4xl font-black text-slate-900 mb-1">
          UGX {me?.balance?.toLocaleString() ?? 0}
        </div>
      </div>

      {/* 4 Circular Action Icons */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        
        {/* Deposit */}
        <button onClick={() => setShowRecharge(true)} className="flex flex-col items-center gap-2 active:scale-95 transition">
          <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
            <span className="text-[10px] font-bold">UGX</span>
          </div>
          <span className="text-xs font-semibold text-slate-700">Deposit</span>
        </button>

        {/* Withdraw */}
        <button onClick={() => setShowWithdraw(true)} className="flex flex-col items-center gap-2 active:scale-95 transition">
          <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
              <path d="M15 15h3" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-slate-700">Withdraw</span>
        </button>

        {/* Customer Service */}
        <a href={CS_WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 active:scale-95 transition">
          <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-slate-700">Service</span>
        </a>

        {/* Group / Telegram */}
        <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 active:scale-95 transition">
          <div className="w-14 h-14 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-slate-700">Group</span>
        </a>

      </div>

      {/* Products List */}
      <h2 className="text-lg font-bold mb-4 px-2 text-slate-900">Investment Plans</h2>

      <div className="space-y-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onRent={handleRent} />
        ))}
      </div>

      {/* Recharge (Deposit) Modal */}
      {showRecharge && (
        <RechargeModal
          onClose={() => setShowRecharge(false)}
          onSuccess={async () => {
            await loadMe();
            setShowRecharge(false);
          }}
        />
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <WithdrawModal
          balance={me?.balance ?? 0}
          onClose={() => setShowWithdraw(false)}
          onSuccess={async () => {
            await loadMe();
            setShowWithdraw(false);
          }}
          onRequestBind={() => {
            setShowWithdraw(false);
            router.push('/profile'); // Send them to profile to bind account
          }}
        />
      )}

      {/* Purchase Modal */}
      {selected && (
        <RentModal
          product={selected}
          balance={me?.balance ?? 0}
          feedback={feedback}
          onClose={() => {
            setSelected(null);
            setFeedback(null);
          }}
          onConfirm={confirmRent}
        />
      )}
    </main>
  );
}

// ============================================================
// RENT (INVEST) MODAL
// ============================================================
function RentModal({
  product,
  balance,
  feedback,
  onClose,
  onConfirm,
}: {
  product: Product;
  balance: number;
  feedback: { ok: boolean; msg: string } | null;
  onClose: () => void;
  onConfirm: (p: Product) => void;
}) {
  const [loading, setLoading] = useState(false);

  const price = Number(product.price);
  const daily = Number(product.daily_return);
  const total = daily * product.cycle_days;
  const shortfall = price - balance;

  async function go() {
    setLoading(true);
    await onConfirm(product);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-3xl p-5 max-h-[90vh] overflow-y-auto animate-fade-in shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-lg font-bold text-gray-900">Confirm Investment</div>
            <div className="text-xs text-green-600 font-bold">{product.name}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 text-xl">×</button>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs mb-4 space-y-2">
          <Row label="Price" value={`UGX ${price.toLocaleString()}`} />
          <Row label="Daily return" value={`UGX ${daily.toLocaleString()}`} highlight />
          <Row label="Duration" value={`${product.cycle_days} days`} />
          <Row label="Total return" value={`UGX ${total.toLocaleString()}`} bold />
          <Row label="Your balance" value={`UGX ${balance.toLocaleString()}`} />
        </div>

        {shortfall > 0 && !feedback && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-3 py-2 text-xs text-red-600 mb-3">
            You need UGX {shortfall.toLocaleString()} more. Deposit to your balance.
          </div>
        )}

        {feedback && (
          <div className={`rounded-2xl px-3 py-2 text-sm mb-3 border ${feedback.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
            {feedback.msg}
          </div>
        )}

        {!feedback?.ok && (
          <button onClick={go} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl active:scale-[0.98] transition shadow-md shadow-green-600/20 disabled:opacity-50" disabled={loading}>
            {loading ? 'Processing…' : `Invest UGX ${price.toLocaleString()}`}
          </button>
        )}

        <p className="text-[10px] text-gray-400 text-center mt-3">Daily returns are credited every 24 hours.</p>
      </div>
    </div>
  );
}

function Row({ label, value, highlight, bold }: { label: string; value: string; highlight?: boolean; bold?: boolean; }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`${bold ? 'font-bold' : 'font-semibold'} ${highlight ? 'text-green-600' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  );
}

// ============================================================
// RECHARGE (DEPOSIT) MODAL
// ============================================================
function RechargeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void; }) {
  const [amount, setAmount] = useState('15000');
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
    if (!/^\+?\d{9,15}$/.test(phone.trim())) {
      setMsg('Enter a valid phone number.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/deposits/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error || 'Failed to send payment request.');
      else {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-t-3xl p-5 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-lg font-bold text-gray-900">Deposit</div>
            <div className="text-xs text-gray-500">Pay via Mobile Money</div>
          </div>
          <button onClick={onClose} className="text-gray-400 text-xl">×</button>
        </div>

        {!sent ? (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-[10px] text-gray-500 font-bold mb-1">AMOUNT (UGX)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500" min={MIN_DEPOSIT} required />
              <div className="text-[10px] text-gray-500 mt-1">Minimum: UGX {MIN_DEPOSIT.toLocaleString()}</div>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 font-bold mb-1">MOBILE MONEY NUMBER</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0700123456" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
            </div>
            {msg && <div className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 border border-red-200">{msg}</div>}
            <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl active:scale-[0.98] transition disabled:opacity-50" disabled={loading}>
              {loading ? 'Sending…' : 'Send payment request'}
            </button>
          </form>
        ) : (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">📱</div>
            <div className="font-semibold text-gray-900 mb-1">Check your phone</div>
            <div className="text-sm text-gray-500 mb-4">Enter your PIN to complete UGX {Number(amount).toLocaleString()}.</div>
            <div className="text-xs text-orange-500 font-semibold mb-2">Status: Reviewing</div>
            <div className="text-[10px] text-gray-400">Waiting for confirmation… ({pollCount * 3}s)</div>
            <button onClick={onClose} className="mt-6 text-xs text-gray-400 underline">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// WITHDRAW MODAL
// ============================================================
function WithdrawModal({ balance, onClose, onSuccess, onRequestBind }: { balance: number; onClose: () => void; onSuccess: () => void; onRequestBind: () => void; }) {
  const [amount, setAmount] = useState(String(MIN_WITHDRAW));
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  const numAmount = Number(amount) || 0;
  const fee = Math.round(numAmount * 0.15);
  const net = Math.round(numAmount * 0.85);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    if (numAmount < MIN_WITHDRAW) return setMsg(`Minimum withdrawal is UGX ${MIN_WITHDRAW.toLocaleString()}`);
    if (numAmount > balance) return setMsg('Amount exceeds your balance');

    setLoading(true);
    try {
      const res = await fetch('/api/withdrawals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount }), // Phone/Name are pulled from the bound account on the backend
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error || 'Failed to submit request.');
      else setDone(true);
    } catch {
      setMsg('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-lg font-bold text-gray-900">Withdraw</div>
            <div className="text-xs text-gray-500">Balance: UGX {balance.toLocaleString()}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 text-xl">×</button>
        </div>

        {!done ? (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-[10px] text-gray-500 font-bold mb-1">AMOUNT (UGX)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500" min={MIN_WITHDRAW} required />
            </div>

            {numAmount >= MIN_WITHDRAW && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs">
                <div className="flex justify-between mb-1"><span className="text-gray-500">You request</span><span className="font-semibold text-gray-900">UGX {numAmount.toLocaleString()}</span></div>
                <div className="flex justify-between mb-1"><span className="text-gray-500">Fee (15%)</span><span className="font-semibold text-red-500">-UGX {fee.toLocaleString()}</span></div>
                <div className="flex justify-between border-t border-gray-200 pt-1 mt-1"><span className="text-gray-500">You receive</span><span className="font-bold text-green-600">UGX {net.toLocaleString()}</span></div>
              </div>
            )}

            {msg && <div className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 border border-red-200">{msg}</div>}

            <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl active:scale-[0.98] transition disabled:opacity-50" disabled={loading}>
              {loading ? 'Submitting…' : 'Request withdrawal'}
            </button>
            
            <p className="text-[10px] text-gray-400 text-center">Withdrawals go to your bound mobile money account.</p>
          </form>
        ) : (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">✅</div>
            <div className="font-semibold text-gray-900 mb-1">Request submitted</div>
            <div className="text-xs text-orange-500 font-semibold mb-2">Status: Reviewing</div>
            <div className="text-sm text-gray-500 mb-4">You'll receive UGX {net.toLocaleString()} once approved.</div>
            <button onClick={onSuccess} className="mt-2 text-xs text-gray-500 underline">Close</button>
          </div>
        )}
      </div>
    </div>
  );
            }
