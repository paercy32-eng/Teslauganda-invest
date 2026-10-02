'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type GiftCard = {
  id: string;
  code: string;
  total_value: number;
  claimed_value: number;
  expires_at: string;
  is_active: boolean;
  created_at: string;
};

export default function AdminGiftcardsPage() {
  const router = useRouter();
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [totalValue, setTotalValue] = useState('5000');
  const [expiryMinutes, setExpiryMinutes] = useState('5');
  const [msg, setMsg] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/giftcards');
    if (res.status === 401) {
      router.replace('/admin/login');
      return;
    }
    const data = await res.json();
    setCards(data.giftcards ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [router]);

  async function create() {
    setCreating(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/giftcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalValue: Number(totalValue),
          expiryMinutes: Number(expiryMinutes),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || 'Failed');
      } else {
        setMsg(`✓ Created: ${data.giftcard.code}`);
        load();
      }
    } catch {
      setMsg('Something went wrong');
    } finally {
      setCreating(false);
    }
  }

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4 px-2">
        <Link href="/admin" className="text-[#6B7A8F] text-xl">←</Link>
        <h1 className="text-xl font-bold text-[#0A2540]">Gift Codes</h1>
      </div>

      <div className="card p-4 mb-4 mx-2">
        <div className="font-semibold text-[#0A2540] mb-3">Generate new code</div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="block text-[10px] text-[#6B7A8F] mb-1">
              TOTAL VALUE (UGX)
            </label>
            <input
              type="number"
              className="input-light"
              value={totalValue}
              onChange={(e) => setTotalValue(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] text-[#6B7A8F] mb-1">
              EXPIRY (MINUTES)
            </label>
            <input
              type="number"
              className="input-light"
              value={expiryMinutes}
              onChange={(e) => setExpiryMinutes(e.target.value)}
            />
          </div>
        </div>
        <button onClick={create} disabled={creating} className="btn-primary">
          {creating ? 'Creating…' : 'Create code'}
        </button>
        {msg && (
          <div className="text-sm text-[#0A2540] bg-[#F5F7FA] rounded-xl px-3 py-2 border border-[#E1E7EF] mt-3">
            {msg}
          </div>
        )}
      </div>

      <h2 className="text-sm font-bold text-[#0A2540] mb-2 px-2">Recent codes</h2>
      {loading ? (
        <div className="text-center text-[#6B7A8F] py-8">Loading…</div>
      ) : cards.length === 0 ? (
        <div className="text-center text-[#6B7A8F] py-8">No codes yet.</div>
      ) : (
        <div className="space-y-2">
          {cards.map((c) => {
            const remaining = Number(c.total_value) - Number(c.claimed_value);
            const expired = new Date(c.expires_at) < new Date();
            const dead = !c.is_active || expired || remaining <= 0;
            return (
              <div key={c.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono font-bold text-[#0A2540] text-base">
                      {c.code}
                    </div>
                    <div className="text-[10px] text-[#6B7A8F] mt-1">
                      Total: UGX {Number(c.total_value).toLocaleString()} · Claimed: UGX {Number(c.claimed_value).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[#6B7A8F] mt-1">
                      Expires: {new Date(c.expires_at).toLocaleString()}
                    </div>
                    {dead && (
                      <div className="text-[10px] text-[#E11D48] font-bold mt-1 uppercase">
                        Expired / Used
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => copyCode(c.code, c.id)}
                    className="px-3 py-2 rounded-xl text-[11px] font-bold bg-[#00D9FF] text-[#0A2540] active:scale-[0.97]"
                  >
                    {copiedId === c.id ? '✓' : 'COPY'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
