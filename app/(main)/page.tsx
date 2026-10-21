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

export default function HomePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

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
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-green-600 font-semibold">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 bg-white animate-fade-in pb-24">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white font-bold shadow-lg shadow-green-600/20">
            S
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-gray-900 leading-tight">SAIKEN</h1>
            <p className="text-[10px] text-green-600 font-bold tracking-wider">PUMPS</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gray-500">Welcome back</div>
          <div className="text-sm font-bold text-gray-900">{me?.name}</div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-sm">
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Available Balance</div>
        <div className="text-3xl font-extrabold text-gray-900 mb-4">UGX {me?.balance?.toLocaleString() ?? 0}</div>
        
        {/* Deposit / Withdraw Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/profile')}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-sm active:scale-[0.98] transition shadow-md shadow-green-600/20"
          >
            Deposit
          </button>
          <button
            onClick={() => router.push('/profile')}
            className="bg-white border border-green-600 text-green-600 font-bold py-2.5 rounded-xl text-sm active:scale-[0.98] transition"
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* Telegram Link */}
      <a
        href="https://t.me/+-sly86QRLz5mOGU0"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm active:scale-[0.99] transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm">Join Telegram</div>
            <div className="text-[10px] text-gray-500">Get updates & support</div>
          </div>
        </div>
        <div className="text-green-600 font-bold">→</div>
      </a>

      {/* Products List */}
      <h2 className="text-lg font-bold mb-4 px-2 text-gray-900">Investment Plans</h2>

      <div className="space-y-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onRent={handleRent} />
        ))}
      </div>

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-5 max-h-[90vh] overflow-y-auto animate-fade-in shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
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
          <div
            className={`rounded-2xl px-3 py-2 text-sm mb-3 border ${
              feedback.ok
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-600'
            }`}
          >
            {feedback.msg}
          </div>
        )}

        {!feedback?.ok && (
          <button
            onClick={go}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl active:scale-[0.98] transition shadow-md shadow-green-600/20 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Processing…' : `Invest UGX ${price.toLocaleString()}`}
          </button>
        )}

        <p className="text-[10px] text-gray-400 text-center mt-3">
          Daily returns are credited every 24 hours.
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
  bold,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span
        className={`${bold ? 'font-bold' : 'font-semibold'} ${
          highlight ? 'text-green-600' : 'text-gray-900'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
