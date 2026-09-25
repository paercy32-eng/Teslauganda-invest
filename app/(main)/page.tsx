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

  useEffect(() => {
    async function load() {
      const meRes = await fetch('/api/me');
      if (meRes.status === 401) {
        router.replace('/login');
        return;
      }
      const meData = await meRes.json();
      setMe(meData.user);

      const prodRes = await fetch('/api/products');
      const prodData = await prodRes.json();
      setProducts(prodData.products ?? []);

      setLoading(false);
    }
    load();
  }, [router]);

  function handleRent(product: Product) {
    alert(`Rent flow for ${product.name} — coming next.`);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-[#8A8A8A]">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 px-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#E31937] flex items-center justify-center text-white font-bold">
            T
          </div>
          <span className="text-xl font-bold">Tesla</span>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-[#8A8A8A]">Welcome back</div>
          <div className="text-sm font-semibold">{me?.name}</div>
        </div>
      </div>

      {/* Balance card */}
      <div className="rounded-3xl p-5 bg-gradient-to-br from-[#E31937] to-[#8A0F22] mb-4">
        <div className="text-xs text-white/80 mb-1">Account Balance</div>
        <div className="text-3xl font-bold text-white mb-4">
          UGX {me?.balance?.toLocaleString() ?? 0}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="bg-white text-[#0A0A0A] font-semibold py-2.5 rounded-2xl text-sm active:scale-[0.98] transition">
            Recharge
          </button>
          <button className="bg-black/30 text-white font-semibold py-2.5 rounded-2xl text-sm active:scale-[0.98] transition">
            Withdraw
          </button>
        </div>
      </div>

      {/* Deposit / Withdraw details */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button className="card p-3 text-left">
          <div className="text-[10px] text-[#8A8A8A] mb-1">Deposit details</div>
          <div className="text-xs font-semibold">View history →</div>
        </button>
        <button className="card p-3 text-left">
          <div className="text-[10px] text-[#8A8A8A] mb-1">Withdraw details</div>
          <div className="text-xs font-semibold">View history →</div>
        </button>
      </div>

      {/* Products */}
      <h2 className="text-2xl font-bold mb-1 px-2">Products</h2>
      <p className="text-[#8A8A8A] text-sm mb-4 px-2">
        100-day cycle. Daily profit credited after 24 hours.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onRent={handleRent} />
        ))}
      </div>
    </main>
  );
}
