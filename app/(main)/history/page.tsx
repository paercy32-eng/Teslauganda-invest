'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Transaction = {
  id: string;
  type: string;
  amount: number;
  status: string;
  meta: any;
  created_at: string;
};

type Filter = 'all' | 'deposits' | 'income' | 'withdrawals';

export default function HistoryPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/transactions/history?t=' + Date.now(), {
        cache: 'no-store',
      });
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      const data = await res.json();
      setTransactions(data.transactions ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  function typeLabel(type: string): string {
    const map: Record<string, string> = {
      welcome: 'Welcome Bonus',
      daily_checkin: 'Daily Check-in',
      deposit: 'Deposit',
      withdrawal: 'Withdrawal',
      withdrawal_request: 'Withdrawal Request',
      withdrawal_refund: 'Withdrawal Refund',
      rental_earning: 'Investment Earning',
      rental: 'Investment',
      giftcard: 'Gift Card',
      referral: 'Referral Bonus',
      reward: 'Team Reward',
    };
    return map[type] || type.replace(/_/g, ' ');
  }

  function typeStyle(type: string): { bg: string; icon: string } {
    // Updated to light theme colors
    if (['deposit', 'welcome', 'daily_checkin', 'giftcard', 'referral', 'reward', 'rental_earning'].includes(type)) {
      return { bg: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: '+' };
    }
    if (['withdrawal', 'withdrawal_request'].includes(type)) {
      return { bg: 'bg-red-50 text-red-600 border-red-200', icon: '−' };
    }
    if (type === 'withdrawal_refund') {
      return { bg: 'bg-blue-50 text-blue-600 border-blue-200', icon: '+' };
    }
    return { bg: 'bg-slate-100 text-slate-500 border-slate-200', icon: '' };
  }

  function isCredit(type: string): boolean {
    return ['deposit', 'welcome', 'daily_checkin', 'giftcard', 'referral', 'reward', 'rental_earning', 'withdrawal_refund'].includes(type);
  }

  function matchesFilter(t: Transaction): boolean {
    if (filter === 'all') return true;
    if (filter === 'deposits') return t.type === 'deposit';
    if (filter === 'income') return ['daily_checkin', 'welcome', 'giftcard', 'referral', 'reward', 'rental_earning'].includes(t.type);
    if (filter === 'withdrawals') return t.type.startsWith('withdrawal');
    return true;
  }

  const filtered = transactions.filter(matchesFilter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <svg className="animate-spin h-8 w-8 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 animate-fade-in pb-24 bg-slate-50">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 px-2">
        <Link href="/profile" className="text-slate-400 text-xl active:scale-95 transition">←</Link>
        <h1 className="text-xl font-bold text-slate-900">Transaction History</h1>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-4 gap-2 mb-5 px-1">
        {([
          { k: 'all', label: 'All' },
          { k: 'deposits', label: 'Deposits' },
          { k: 'income', label: 'Income' },
          { k: 'withdrawals', label: 'Withdraw' },
        ] as const).map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k as Filter)}
            className={`py-2 rounded-xl text-[11px] font-bold transition border ${
              filter === f.k
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </div>
          <div className="text-slate-500 text-sm font-semibold mb-1">No transactions yet</div>
          <div className="text-slate-400 text-xs">
            {filter === 'all' ? 'Your activity will appear here.' : `No ${filter} found.`}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const style = typeStyle(t.type);
            const credit = isCredit(t.type);
            return (
              <div
                key={t.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm"
              >
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold ${style.bg}`}>
                  {credit ? '↓' : '↑'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {typeLabel(t.type)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {new Date(t.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${credit ? 'text-emerald-600' : 'text-red-600'}`}>
                    {credit ? '+' : '−'}UGX {Number(t.amount).toLocaleString()}
                  </div>
                  <div className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">
                    {t.status}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
