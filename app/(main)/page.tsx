'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import SafranLogo from '@/components/SafranLogo';

type Me = {
  id: string;
  name: string;
  phone: string;
  balance: number;
};

type Product = {
  id: string;
  name: string;
  subtitle: string | null;
  price: number;
  daily_profit: number;
  duration_days: number;
  image_url: string | null;
  tag: string | null;
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
      msg: `🎉 You invested in ${product.name}! Daily return: UGX ${Number(product.daily_profit).toLocaleString()}`,
    });
    await loadMe();
    setTimeout(() => {
      setSelected(null);
      setFeedback(null);
    }, 2500);
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
      <div className="flex items-center justify-between mb-6 px-2">
        <SafranLogo
          size={36}
          textColor="#F5F2ED"
          accentColor="#1A1A1F"
        />
        <div className="text-right">
          <div className="text-[11px] text-[#8A8580]">Welcome back</div>
          <div className="text-sm font-semibold text-[#F5F2ED]">{me?.name}</div>
        </div>
      </div>

      {/* Products */}
      <h2 className="text-2xl font-bold mb-4 px-2 text-[#F5F2ED]">Products</h2>

      <div className="grid grid-cols-2 gap-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onRent={handleRent} />
        ))}
      </div>

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
  const daily = Number(product.daily_profit);
  const total = daily * product.duration_days;
  const shortfall = price - balance;

  async function go() {
    setLoading(true);
    await onConfirm(product);
    setLoading(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#1A1A1F] rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-lg font-bold text-[#F5F2ED]">Confirm investment</div>
            <div className="text-xs text-[#8A8580]">{product.name}</div>
          </div>
          <button onClick={onClose} className="text-[#8A8580] text-xl">×</button>
        </div>

        <div className="bg-[#15151A] border border-[#2A2823] rounded-2xl p-3 text-xs mb-4 space-y-1.5">
          <Row label="Price" value={`UGX ${price.toLocaleString()}`} />
          <Row label="Daily return" value={`UGX ${daily.toLocaleString()}`} highlight />
          <Row label="Duration" value={`${product.duration_days} days`} />
          <Row label="Total return" value={`UGX ${total.toLocaleString()}`} bold />
          <Row label="Your balance" value={`UGX ${balance.toLocaleString()}`} />
        </div>

        {shortfall > 0 && !feedback && (
          <div className="bg-[#2A1416] border border-[#E5484D]/40 rounded-2xl px-3 py-2 text-xs text-[#FF8A8A] mb-3">
            You need UGX {shortfall.toLocaleString()} more. Recharge your balance
            (and note that your first investment requires approved deposits to
            cover the full price).
          </div>
        )}

        {feedback && (
          <div
            className={`rounded-2xl px-3 py-2 text-sm mb-3 border ${
              feedback.ok
                ? 'bg-[#0F2A1A] border-[#4ADE80]/40 text-[#8AE6A8]'
                : 'bg-[#2A1416] border-[#E5484D]/40 text-[#FF8A8A]'
            }`}
          >
            {feedback.msg}
          </div>
        )}

        {!feedback?.ok && (
          <button onClick={go} className="btn-primary" disabled={loading}>
            {loading ? 'Processing…' : `Invest UGX ${price.toLocaleString()}`}
          </button>
        )}

        <p className="text-[10px] text-[#8A8580] text-center mt-3">
          Daily returns are credited every 24 hours after purchase.
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
      <span className="text-[#8A8580]">{label}</span>
      <span
        className={`${bold ? 'font-bold' : 'font-semibold'} ${
          highlight ? 'text-[#E0A44C]' : 'text-[#F5F2ED]'
        }`}
      >
        {value}
      </span>
    </div>
  );
              }
