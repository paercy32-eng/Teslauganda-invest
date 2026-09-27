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

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<AdminUser | null>(null);

  async function loadUsers(search = '') {
    setLoading(true);
    const url = search ? `/api/admin/users?q=${encodeURIComponent(search)}` : '/api/admin/users';
    const res = await fetch(url);
    if (res.status === 401) {
      router.replace('/admin/login');
      return;
    }
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, [router]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    loadUsers(query);
  }

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 px-2">
        <Link href="/admin" className="text-[#6B7A62]">←</Link>
        <h1 className="text-xl font-bold text-[#1F2A1B]">Users</h1>
      </div>

      {/* Search */}
      <form onSubmit={onSearch} className="mb-4 px-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or phone"
          className="input-light"
        />
      </form>

      {loading ? (
        <div className="text-center text-[#6B7A62] py-8">Loading…</div>
      ) : users.length === 0 ? (
        <div className="text-center text-[#6B7A62] py-8">No users found.</div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelected(u)}
              className="card p-4 w-full text-left active:scale-[0.99] transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1F2A1B] truncate">
                      {u.name}
                    </span>
                    {u.is_banned && (
                      <span className="text-[9px] bg-[#FDF3F3] text-[#A13A3A] font-bold px-2 py-0.5 rounded-full">
                        BANNED
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#6B7A62] mt-0.5">{u.phone}</div>
                  <div className="text-[10px] text-[#6B7A62] mt-2">
                    Balance:{' '}
                    <span className="text-[#1F2A1B] font-semibold">
                      UGX {Number(u.balance).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#6B7A62] mt-1">
                    Valid invites: {u.valid_invites} · Active rentals: {u.active_rentals}
                  </div>
                </div>
                <div className="text-[#6B7A62]">→</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <UserDetailModal
          user={selected}
          onClose={() => setSelected(null)}
          onRefresh={() => {
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
}: {
  user: AdminUser;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

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
            <div className="text-lg font-bold text-[#1F2A1B]">{user.name}</div>
            <div className="text-xs text-[#6B7A62]">{user.phone}</div>
          </div>
          <button onClick={onClose} className="text-[#6B7A62] text-xl">×</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <SmallStat label="Balance" value={`UGX ${Number(user.balance).toLocaleString()}`} />
          <SmallStat label="Deposited" value={`UGX ${Number(user.total_deposited).toLocaleString()}`} />
          <SmallStat label="Invested" value={`UGX ${Number(user.total_invested).toLocaleString()}`} />
          <SmallStat label="Withdrawn" value={`UGX ${Number(user.total_withdrawn).toLocaleString()}`} />
          <SmallStat label="Valid Invites" value={user.valid_invites.toString()} />
          <SmallStat label="Active Rentals" value={user.active_rentals.toString()} />
        </div>

        {/* Adjust balance */}
        <div className="mb-4">
          <div className="text-xs font-bold text-[#6B7A62] mb-2">ADJUST BALANCE</div>
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
            className="btn-primary"
          >
            Apply adjustment
          </button>
        </div>

        {/* Grant / Remove Tesla */}
        <div className="mb-4">
          <div className="text-xs font-bold text-[#6B7A62] mb-2">TESLA ACCESS</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={busy}
              onClick={() =>
                call('/api/admin/users/grant-tesla', { userId: user.id })
              }
              className="bg-[#7C9070] text-white font-semibold py-3 rounded-2xl text-sm"
            >
              Grant Tesla
            </button>
            <button
              disabled={busy}
              onClick={() =>
                call('/api/admin/users/remove-tesla', { userId: user.id })
              }
              className="bg-white border border-[#E3E8DE] text-[#A13A3A] font-semibold py-3 rounded-2xl text-sm"
            >
              Remove Tesla
            </button>
          </div>
        </div>

        {/* Ban / Unban */}
        <div className="mb-4">
          <div className="text-xs font-bold text-[#6B7A62] mb-2">ACCOUNT STATUS</div>
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
                ? 'bg-[#7C9070] text-white'
                : 'bg-[#A13A3A] text-white'
            }`}
          >
            {user.is_banned ? 'Unban account' : 'Ban account'}
          </button>
        </div>

        {msg && (
          <div className="text-sm text-center text-[#1F2A1B] bg-[#F7F8F5] rounded-xl px-3 py-2 border border-[#E3E8DE]">
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-3 bg-[#F7F8F5] border border-[#E3E8DE]">
      <div className="text-[9px] text-[#6B7A62] font-semibold mb-1">
        {label.toUpperCase()}
      </div>
      <div className="text-xs font-bold text-[#1F2A1B]">{value}</div>
    </div>
  );
          }
