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
      <main className="min-h-screen flex items-center justify-center bg-[#111827]">
        <div className="text-gray-400">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 bg-[#111827] animate-fade-in pb-24">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#EA580C] flex items-center justify-center text-white font-bold shadow-lg shadow-[#EA580C]/20">
            S
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white leading-tight">SAIKEN</h1>
            <p className="text-[10px] text-[#EA580C] font-bold tracking-wider">PUMPS</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gray-400">Welcome back</div>
          <div className="text-sm font-semibold text-white">{me?.name}</div>
        </div>
      </div>

      {/* Balance Display */}
      <div className="bg-[#1F2937] border border-[#374151] rounded-2xl p-4 mb-6 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Available Balance</div>
          <div className="text-2xl font-bold text-white">UGX {me?.balance?.toLocaleString() ?? 0}</div>
        </div>
      </div>

      {/* Products List */}
      <h2 className="text-lg font-bold mb-4 px-2 text-white">Investment Plans</h2>

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#1F2937] border border-[#374151] rounded-3xl p-5 max-h-[90vh] overflow-y-auto animate-fade-in shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-lg font-bold text-white">Confirm Investment</div>
            <div className="text-xs text-[#EA580C] font-bold">{product.name}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 text-xl">×</button>
        </div>

        <div className="bg-[#111827] border border-[#374151] rounded-2xl p-4 text-xs mb-4 space-y-2">
          <Row label="Price" value={`UGX ${price.toLocaleString()}`} />
          <Row label="Daily return" value={`UGX ${daily.toLocaleString()}`} highlight />
          <Row label="Duration" value={`${product.cycle_days} days`} />
          <Row label="Total return" value={`UGX ${total.toLocaleString()}`} bold />
          <Row label="Your balance" value={`UGX ${balance.toLocaleString()}`} />
        </div>

        {shortfall > 0 && !feedback && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl px-3 py-2 text-xs text-red-400 mb-3">
            You need UGX {shortfall.toLocaleString()} more. Recharge your balance.
          </div>
        )}

        {feedback && (
          <div
            className={`rounded-2xl px-3 py-2 text-sm mb-3 border ${
              feedback.ok
                ? 'bg-green-900/20 border-green-500/30 text-green-400'
                : 'bg-red-900/20 border-red-500/30 text-red-400'
            }`}
          >
            {feedback.msg}
          </div>
        )}

        {!feedback?.ok && (
          <button
            onClick={go}
            className="w-full bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold py-3.5 rounded-xl active:scale-[0.98] transition shadow-lg shadow-[#EA580C]/20 disabled:opacity-50"
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
      <span className="text-gray-400">{label}</span>
      <span
        className={`${bold ? 'font-bold' : 'font-semibold'} ${
          highlight ? 'text-[#EA580C]' : 'text-white'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
