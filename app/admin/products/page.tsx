'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Product = {
  id: string;
  name: string;
  subtitle: string | null;
  price: number;
  daily_profit: number;
  duration_days: number;
  image_url: string | null;
  tag: string | null;
  is_active: boolean;
  sort_order: number;
};

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/products');
    if (res.status === 401) {
      router.replace('/admin/login');
      return;
    }
    const data = await res.json();
    setProducts(data.products ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [router]);

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4 px-2">
        <Link href="/admin" className="text-[#6B7A8F] text-xl">←</Link>
        <h1 className="text-xl font-bold text-[#0A2540]">Products</h1>
      </div>

      {loading ? (
        <div className="text-center text-[#6B7A8F] py-8">Loading…</div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => setEditing(p)}
              className="card p-4 w-full text-left active:scale-[0.99] transition flex gap-3 items-center"
            >
              <div className="w-14 h-14 rounded-xl bg-[#F5F7FA] border border-[#E1E7EF] flex items-center justify-center overflow-hidden flex-shrink-0">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🤖</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#0A2540] truncate">{p.name}</span>
                  {!p.is_active && (
                    <span className="text-[9px] bg-[#FFF1F3] text-[#E11D48] font-bold px-2 py-0.5 rounded-full">
                      INACTIVE
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#6B7A8F] mt-1">
                  UGX {Number(p.price).toLocaleString()} · +{Number(p.daily_profit).toLocaleString()}/day · {p.duration_days}d
                </div>
              </div>
              <div className="text-[#6B7A8F]">→</div>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          product={editing}
          onClose={() => setEditing(null)}
          onRefresh={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </main>
  );
}

function EditModal({
  product,
  onClose,
  onRefresh,
}: {
  product: Product;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [name, setName] = useState(product.name);
  const [subtitle, setSubtitle] = useState(product.subtitle ?? '');
  const [price, setPrice] = useState(String(product.price));
  const [dailyProfit, setDailyProfit] = useState(String(product.daily_profit));
  const [durationDays, setDurationDays] = useState(String(product.duration_days));
  const [isActive, setIsActive] = useState(product.is_active);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [imageUrl, setImageUrl] = useState(product.image_url);

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('productId', product.id);
      const res = await fetch('/api/admin/products/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || 'Upload failed');
      } else {
        setImageUrl(data.url);
        setMsg('✓ Image uploaded');
      }
    } catch {
      setMsg('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          name,
          subtitle,
          price: Number(price),
          daily_profit: Number(dailyProfit),
          duration_days: Number(durationDays),
          is_active: isActive,
          image_url: imageUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || 'Save failed');
      } else {
        setMsg('✓ Saved');
        setTimeout(onRefresh, 700);
      }
    } catch {
      setMsg('Something went wrong');
    } finally {
      setSaving(false);
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
            <div className="text-lg font-bold text-[#0A2540]">{product.name}</div>
            <div className="text-xs text-[#6B7A8F]">Edit product</div>
          </div>
          <button onClick={onClose} className="text-[#6B7A8F] text-xl">×</button>
        </div>

        <div className="mb-4">
          <div className="text-xs font-bold text-[#6B7A8F] mb-2">IMAGE</div>
          <div className="flex gap-3 items-center">
            <div className="w-20 h-20 rounded-xl bg-[#F5F7FA] border border-[#E1E7EF] flex items-center justify-center overflow-hidden">
              {imageUrl ? (
                <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">🤖</span>
              )}
            </div>
            <label className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={uploadImage}
                className="hidden"
                disabled={uploading}
              />
              <div className="bg-[#0A2540] text-white font-semibold py-3 rounded-2xl text-sm text-center active:scale-[0.98] cursor-pointer">
                {uploading ? 'Uploading…' : 'Upload image'}
              </div>
            </label>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <Field label="NAME" value={name} onChange={setName} />
          <Field label="SUBTITLE" value={subtitle} onChange={setSubtitle} />
          <Field label="PRICE (UGX)" value={price} onChange={setPrice} type="number" />
          <Field label="DAILY PROFIT (UGX)" value={dailyProfit} onChange={setDailyProfit} type="number" />
          <Field label="DURATION (DAYS)" value={durationDays} onChange={setDurationDays} type="number" />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-[#0A2540]">Active</span>
          <button
            onClick={() => setIsActive(!isActive)}
            className="w-12 h-7 rounded-full relative transition"
            style={{ background: isActive ? '#00D9FF' : '#E1E7EF' }}
          >
            <span
              className="absolute top-1 w-5 h-5 bg-white rounded-full transition-all"
              style={{ left: isActive ? '26px' : '4px' }}
            />
          </button>
        </div>

        {msg && (
          <div className="text-sm text-[#0A2540] bg-[#F5F7FA] rounded-xl px-3 py-2 border border-[#E1E7EF] mb-3">
            {msg}
          </div>
        )}

        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] text-[#6B7A8F] font-bold mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-light"
      />
    </div>
  );
}
