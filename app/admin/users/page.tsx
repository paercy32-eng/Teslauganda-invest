'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type AdminUser = {
  id: string;
  name: string;
  phone: string;
  balance: number;
  total_deposited: number;
  total_invested: number;
  total_withdrawn: number;
  is_banned: boolean;
  banned_reason: string | null;
  referral_code: string;
  created_at: string;
  valid_invites: number;
  active_rentals: number;
};

type Product = {
  id: string;
  name: string;
  price: number;
  daily_profit: number;
  duration_days: number;
  image_url: string | null;
  is_active: boolean;
};

type ReferralUser = {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  isValid: boolean;
};

type ReferralData = {
  level1: ReferralUser[];
  level2: ReferralUser[];
  level3: ReferralUser[];
  totals: {
    level1: number;
    level2: number;
    level3: number;
    all: number;
    valid: number;
  };
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [showGrantPicker, setShowGrantPicker] = useState(false);

  async function loadUsers(search = '') {
    setLoading(true);
    const url = search
      ? `/api/admin/users?q=${encodeURIComponent(search)}&t=${Date.now()}`
      : `/api/admin/users?t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.status === 401) {
      router.replace('/admin/login');
      return;
    }
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }

  async function loadProducts() {
    const res = await fetch(`/api/admin/products?t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return;
    const data = await res.json();
    setProducts(data.products ?? []);
  }

  useEffect(() => {
    loadUsers();
    loadProducts();
  }, [router]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    loadUsers(query);
  }

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in bg-gray-50 text-gray-900">
      <div className="flex items-center gap-3 mb-4 px-2">
        <Link href="/admin" className="text-gray-500 text-xl">←</Link>
        <h1 className="text-xl font-bold text-gray-900">Users</h1>
      </div>

      <form onSubmit={onSearch} className="mb-4 px-2 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or phone"
          className="input-light flex-1"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-gray-900 text-white font-semibold text-sm"
        >
          Search
        </button>
      </form>

      {loading ? (
        <div className="text-center text-gray-500 py-8">Loading…</div>
      ) : users.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No users found.</div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelected(u)}
              className="bg-white border border-gray-200 rounded-2xl p-4 w-full text-left active:scale-[0.99] transition shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 truncate">
                      {u.name}
                    </span>
                    {u.is_banned && (
                      <span className="text-[9px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                        BANNED
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{u.phone}</div>
                  <div className="text-[10px] text-gray-500 mt-2">
                    Balance:{' '}
                    <span className="text-gray-900 font-semibold">
                      UGX {Number(u.balance).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    Valid invites: {u.valid_invites} · Active rentals: {u.active_rentals}
                  </div>
                </div>
                <div className="text-gray-400">→</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && !showGrantPicker && (
        <UserDetailModal
          user={selected}
          onClose={() => setSelected(null)}
          onRefresh={() => {
            setSelected(null);
            loadUsers(query);
          }}
          onOpenGrantPicker={() => setShowGrantPicker(true)}
        />
      )}

      {selected && showGrantPicker && (
        <GrantRobotPicker
          user={selected}
          products={products}
          onClose={() => setShowGrantPicker(false)}
          onGranted={() => {
            setShowGrantPicker(false);
            setSelected(null);
            loadUsers(query);
          }}
        />
      )}
    </main>
  );
}

function UserDetailModal({
  user,
  onClose,
  onRefresh,
  onOpenGrantPicker,
}: {
  user: AdminUser;
  onClose: () => void;
  onRefresh: () => void;
  onOpenGrantPicker: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const [referrals, setReferrals] = useState<ReferralData | null>(null);
  const [refLoading, setRefLoading] = useState(true);
  const [refTab, setRefTab] = useState<1 | 2 | 3>(1);
  const [showReferrals, setShowReferrals] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/admin/users/referrals?userId=${user.id}&t=${Date.now()}`,
          { cache: 'no-store' }
        );
        if (res.ok) {
          const data = await res.json();
          setReferrals(data);
        }
      } catch {}
      setRefLoading(false);
    }
    load();
  }, [user.id]);

  async function call(endpoint: string, body: Record<string, unknown>) {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || 'Failed');
      } else {
        setMsg('✓ Done');
        setTimeout(onRefresh, 700);
      }
    } catch {
      setMsg('Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  const currentLevel =
    refTab === 1 ? referrals?.level1 :
    refTab === 2 ? referrals?.level2 :
    referrals?.level3;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-5 max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-lg font-bold text-gray-900">{user.name}</div>
            <div className="text-xs text-gray-500">{user.phone}</div>
          </div>
          <button onClick={onClose} className="text-gray-500 text-xl">×</button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <SmallStat label="Balance" value={`UGX ${Number(user.balance).toLocaleString()}`} />
          <SmallStat label="Deposited" value={`UGX ${Number(user.total_deposited).toLocaleString()}`} />
          <SmallStat label="Invested" value={`UGX ${Number(user.total_invested).toLocaleString()}`} />
          <SmallStat label="Withdrawn" value={`UGX ${Number(user.total_withdrawn).toLocaleString()}`} />
          <SmallStat label="Valid Invites" value={user.valid_invites.toString()} />
          <SmallStat label="Active Rentals" value={user.active_rentals.toString()} />
        </div>

        {/* Referral Stats Section */}
        <div className="mb-4">
          <button
            onClick={() => setShowReferrals(!showReferrals)}
            className="w-full flex items-center justify-between bg-gray-900 text-white font-semibold py-3 px-4 rounded-2xl text-sm"
          >
            <span>Referral Stats</span>
            <span className="text-xs">{showReferrals ? '▲' : '▼'}</span>
          </button>

          {showReferrals && (
            <div className="mt-2 bg-gray-50 border border-gray-200 rounded-2xl p-3">
              {refLoading ? (
                <div className="text-center text-gray-500 py-4 text-sm">Loading…</div>
              ) : !referrals ? (
                <div className="text-center text-gray-500 py-4 text-sm">No data</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <SmallStat label="Total Referrals" value={referrals.totals.all.toString()} />
                    <SmallStat label="Valid Referrals" value={referrals.totals.valid.toString()} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {([1, 2, 3] as const).map((lvl) => {
                      const count =
                        lvl === 1 ? referrals.totals.level1 :
                        lvl === 2 ? referrals.totals.level2 :
                        referrals.totals.level3;
                      const isActive = refTab === lvl;
                      return (
                        <button
                          key={lvl}
                          onClick={() => setRefTab(lvl)}
                          className={`py-2 rounded-xl text-[11px] font-bold transition border ${
                            isActive
                              ? 'bg-gray-900 text-white border-gray-900'
                              : 'bg-white text-gray-600 border-gray-200'
                          }`}
                        >
                          L{lvl} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {!currentLevel || currentLevel.length === 0 ? (
                    <div className="text-center text-gray-500 py-4 text-xs">
                      No referrals at Level {refTab}.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {currentLevel.map((r) => (
                        <div
                          key={r.id}
                          className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-gray-900 truncate">
                              {r.name}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {r.phone}
                            </div>
                            <div className="text-[9px] text-gray-400 mt-0.5">
                              Joined {new Date(r.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              r.isValid
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {r.isValid ? 'Valid' : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="text-xs font-bold text-gray-500 mb-2">ADJUST BALANCE</div>
          <input
            type="number"
            className="input-light mb-2"
            placeholder="Amount (use - for subtract)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            type="text"
            className="input-light mb-2"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button
            disabled={busy || !amount}
            onClick={() =>
              call('/api/admin/users/adjust-balance', {
                userId: user.id,
                amount: Number(amount),
                reason,
              })
            }
            className="w-full bg-gray-900 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-50"
          >
            Apply adjustment
          </button>
        </div>

        <div className="mb-4">
          <div className="text-xs font-bold text-gray-500 mb-2">ROBOT ACCESS</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={busy}
              onClick={onOpenGrantPicker}
              className="bg-gray-900 text-white font-semibold py-3 rounded-2xl text-sm"
            >
              Grant Robot
            </button>
            <button
              disabled={busy}
              onClick={() =>
                call('/api/admin/users/remove-tesla', { userId: user.id })
              }
              className="bg-white border border-gray-200 text-red-600 font-semibold py-3 rounded-2xl text-sm"
            >
              Remove Robot
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs font-bold text-gray-500 mb-2">ACCOUNT STATUS</div>
          <button
            disabled={busy}
            onClick={() =>
              call('/api/admin/users/ban', {
                userId: user.id,
                ban: !user.is_banned,
                reason,
              })
            }
            className={`w-full font-semibold py-3 rounded-2xl text-sm ${
              user.is_banned
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {user.is_banned ? 'Unban account' : 'Ban account'}
          </button>
        </div>

        {msg && (
          <div className="text-sm text-center text-gray-900 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}

function GrantRobotPicker({
  user,
  products,
  onClose,
  onGranted,
}: {
  user: AdminUser;
  products: Product[];
  onClose: () => void;
  onGranted: () => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  async function grant(productId: string, productName: string) {
    setBusyId(productId);
    setMsg('');
    try {
      const res = await fetch('/api/admin/users/grant-tesla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || 'Failed to grant');
        setBusyId(null);
      } else {
        setMsg(`✓ Granted ${productName}`);
        setTimeout(onGranted, 700);
      }
    } catch {
      setMsg('Something went wrong');
      setBusyId(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-lg font-bold text-gray-900">Select Robot</div>
            <div className="text-xs text-gray-500">Grant to {user.name}</div>
          </div>
          <button onClick={onClose} className="text-gray-500 text-xl">×</button>
        </div>

        {products.length === 0 ? (
          <div className="text-center text-gray-500 py-8">Loading robots…</div>
        ) : (
          <div className="space-y-2">
            {products
              .filter((p) => p.is_active)
              .map((p) => (
                <button
                  key={p.id}
                  disabled={busyId !== null}
                  onClick={() => grant(p.id, p.name)}
                  className="bg-white border border-gray-200 rounded-2xl p-3 w-full text-left flex items-center gap-3 active:scale-[0.99] transition disabled:opacity-50"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🤖</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Worth UGX {Number(p.price).toLocaleString()} · +
                      {Number(p.daily_profit).toLocaleString()}/day · {p.duration_days}d
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm">
                    {busyId === p.id ? '…' : '→'}
                  </div>
                </button>
              ))}
          </div>
        )}

        {msg && (
          <div className="text-sm text-center text-gray-900 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 mt-3">
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-3 bg-white border border-gray-200">
      <div className="text-[9px] text-gray-500 font-semibold mb-1">
        {label.toUpperCase()}
      </div>
      <div className="text-xs font-bold text-gray-900">{value}</div>
    </div>
  );
          }
