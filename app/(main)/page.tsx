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
        <div className="text-[#6B7A62]">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#7C9070] flex items-center justify-center text-white font-bold">
            T
          </div>
          <span className="text-xl font-bold text-[#1F2A1B]">Tesla</span>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-[#6B7A62]">Welcome back</div>
          <div className="text-sm font-semibold text-[#1F2A1B]">{me?.name}</div>
        </div>
      </div>

      {/* Products */}
      <h2 className="text-2xl font-bold mb-4 px-2 text-[#1F2A1B]">Products</h2>

      <div className="grid grid-cols-2 gap-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onRent={handleRent} />
        ))}
      </div>
    </main>
  );
}
