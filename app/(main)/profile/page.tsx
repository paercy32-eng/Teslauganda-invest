'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SafranLogo from '@/components/SafranLogo';

type Me = {
  id: string;
  name: string;
  phone: string;
  balance: number;
  total_deposited?: number;
  total_withdrawn?: number;
};

// Community Links
const TELEGRAM_LINK = 'https://t.me/+GM_Fo41-HFsxNTc0';
const WHATSAPP_LINK = 'https://whatsapp.com/channel/0029Vb9OlFtKrWR36rpMst0O';

// Customer Service Links
const CS_TELEGRAM_LINK = 'https://t.me/aaaaa56590';
const CS_WHATSAPP_LINK = 'https://wa.me/256705371032'; 

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Bound Account State
  const [boundPhone, setBoundPhone] = useState('');
  const [boundName, setBoundName] = useState('');

  // Modal States
  const [showGiftCard, setShowGiftCard] = useState(false);
  const [showCustomerService, setShowCustomerService] = useState(false);
  const [showBindAccount, setShowBindAccount] = useState(false);

  // Gift Card State
  const [giftCode, setGiftCode] = useState('');
  const [giftMsg, setGiftMsg] = useState('');
  const [giftLoading, setGiftLoading] = useState(false);

  // Check-in State
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinMsg, setCheckinMsg] = useState('');

  // Bind Account Form State
  const [bindPhone, setBindPhone] = useState('');
  const [bindName, setBindName] = useState('');
  const [bindLoading, setBindLoading] = useState(false);
  const [bindMsg, setBindMsg] = useState('');

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

  async function loadBoundAccount() {
    try {
      const res = await fetch('/api/user/bind-account?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.boundPhone) setBoundPhone(data.boundPhone);
        if (data.boundName) setBoundName(data.boundName);
      }
    } catch {}
  }

  async function loadCheckinStatus() {
    try {
      const res = await fetch('/api/checkin?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCanCheckIn(data.canCheckIn === true);
      }
    } catch {}
  }

  useEffect(() => {
    loadMe();
    loadBoundAccount();
    loadCheckinStatus();
  }, [router]);

  async function handleCheckIn() {
    setCheckinLoading(true);
    setCheckinMsg('');
    try {
      const res = await fetch('/api/checkin', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setCheckinMsg(data.error || 'Check-in failed.');
      } else {
        setCheckinMsg(data.message || 'You earned UGX 200!');
        setCanCheckIn(false);
        await loadMe();
      }
    } catch {
      setCheckinMsg('Something went wrong.');
    } finally {
      setCheckinLoading(false);
      setTimeout(() => setCheckinMsg(''), 4000);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  async function redeemGift(e: React.FormEvent) {
    e.preventDefault();
    setGiftMsg('');
    setGiftLoading(true);
    try {
      const res = await fetch('/api/giftcard/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: giftCode }),
      });
      const data = await res.json();
      if (!res.ok) setGiftMsg(data.error || 'Failed to redeem.');
      else {
        setGiftMsg(`You received UGX ${data.amount.toLocaleString()}`);
        setGiftCode('');
        await loadMe();
      }
    } catch {
      setGiftMsg('Something went wrong.');
    } finally {
      setGiftLoading(false);
    }
  }

  async function handleBindAccount(e: React.FormEvent) {
    e.preventDefault();
    setBindLoading(true);
    setBindMsg('');
    
    try {
      const res = await fetch('/api/user/bind-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: bindPhone,
          fullName: bindName,
        }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setBindMsg(data.error || 'Failed to bind account.');
      } else {
        setBindMsg('Account bound successfully!');
        setBoundPhone(bindPhone);
        setBoundName(bindName);
        
        setTimeout(() => {
          setBindLoading(false);
          setShowBindAccount(false);
          setBindMsg('');
          setBindPhone('');
          setBindName('');
        }, 1500);
        return;
      }
    } catch {
      setBindMsg('Something went wrong.');
    }
    
    setBindLoading(false);
  }

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
      <div className="flex items-center justify-between px-2 mb-5">
        <SafranLogo size={32} textColor="#0F172A" accentColor="#10B981" />
        <div className="text-right">
          <div className="text-[11px] text-slate-500">Signed in</div>
          <div className="text-sm font-semibold text-slate-900">{me?.name}</div>
        </div>
      </div>

      {/* Balance & Stats Card */}
      <div className="bg-white rounded-3xl p-5 mb-5 shadow-sm border border-slate-200">
        <div className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Available Balance</div>
        <div className="text-4xl font-black text-slate-900 mb-5">
          UGX {me?.balance?.toLocaleString() ?? 0}
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
            <div className="text-[10px] text-emerald-700 font-bold uppercase mb-0.5">Total Deposited</div>
            <div className="text-sm font-bold text-emerald-800">
              UGX {(me?.total_deposited ?? 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <div className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Total Withdrawn</div>
            <div className="text-sm font-bold text-slate-700">
              UGX {(me?.total_withdrawn ?? 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Check-in */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="font-bold text-slate-900 text-sm">Daily Check-in</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Earn UGX 200 every day
            </div>
          </div>
          <button
            onClick={handleCheckIn}
            disabled={!canCheckIn || checkinLoading}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold active:scale-[0.98] transition ${
              canCheckIn
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {checkinLoading ? '...' : canCheckIn ? 'Check In' : 'Claimed'}
          </button>
        </div>
        {checkinMsg && (
          <div className="mt-3 text-xs text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-200">
            {checkinMsg}
          </div>
        )}
      </div>

      {/* Quick Actions List */}
      <div className="space-y-3 mb-6">
        <Link href="/history" className="block w-full bg-white border border-slate-200 rounded-2xl p-4 active:scale-[0.98] transition shadow-sm">
          <div className="text-sm font-bold text-slate-900">Transaction History</div>
          <div className="text-[11px] text-slate-500 mt-1">View deposits, income & withdrawals</div>
        </Link>

        <button
          onClick={() => setShowBindAccount(true)}
          className="block w-full text-left bg-white border border-slate-200 rounded-2xl p-4 active:scale-[0.98] transition shadow-sm"
        >
          <div className="text-sm font-bold text-slate-900">Bind Account</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {boundPhone ? `Bound to ${boundPhone}` : 'Secure your withdrawals'}
          </div>
        </button>

        <button
          onClick={() => setShowGiftCard(true)}
          className="block w-full text-left bg-white border border-slate-200 rounded-2xl p-4 active:scale-[0.98] transition shadow-sm"
        >
          <div className="text-sm font-bold text-slate-900">Gift Cards</div>
          <div className="text-[11px] text-slate-500 mt-1">Redeem a code</div>
        </button>

        <Link href="/rewards" className="block w-full bg-white border border-slate-200 rounded-2xl p-4 active:scale-[0.98] transition shadow-sm">
          <div className="text-sm font-bold text-slate-900">Rewards</div>
          <div className="text-[11px] text-slate-500 mt-1">Team milestones</div>
        </Link>
      </div>

      {/* Support & Community */}
      <h2 className="text-sm font-bold text-slate-900 mb-3 px-1">Support & Community</h2>
      <div className="space-y-3 mb-6">
        
        {/* Customer Service Button */}
        <button
          onClick={() => setShowCustomerService(true)}
          className="block w-full text-left bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.99] transition shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-slate-900 text-sm">Customer Service</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Contact support via WhatsApp or Telegram</div>
          </div>
          <div className="text-slate-400">→</div>
        </button>

        {/* Telegram Card */}
        <a
          href={TELEGRAM_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.99] transition shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-[#229ED9] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.17c-.05-.05-.14-.03-.19-.02-.11.03-1.83 1.17-5.19 3.43-.49.34-.94.5-1.34.49-.45 0-1.31-.25-1.95-.46-.66-.21-1.19-.33-1.15-.69.02-.19.33-.39.93-.6 3.63-1.58 6.05-2.63 7.26-3.13 3.47-1.45 4.19-1.7 4.66-1.7.1 0 .33.03.45.15.1.1.13.24.12.36z"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-slate-900 text-sm">Join Telegram</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Get updates & support</div>
          </div>
          <div className="text-slate-400">→</div>
        </a>

        {/* WhatsApp Card */}
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.99] transition shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.74 21.4 10.37 21.82 12.04 21.82C17.5 21.82 21.95 17.37 21.95 11.91C21.95 6.45 17.5 2 12.04 2M12.04 20.15C10.49 20.15 8.97 19.73 7.64 18.95L7.26 18.73L4.11 19.55L4.95 16.48L4.7 16.08C3.84 14.69 3.39 13.33 3.39 11.91C3.39 7.14 7.27 3.26 12.04 3.26C16.81 3.26 20.69 7.14 20.69 11.91C20.69 16.68 16.81 20.56 12.04 20.56M16.62 14.5C16.38 14.38 15.19 13.79 14.96 13.7C14.73 13.61 14.57 13.56 14.4 13.8C14.24 14.04 13.82 14.54 13.68 14.7C13.54 14.86 13.4 14.88 13.16 14.76C12.92 14.64 12.09 14.36 11.11 13.48C10.34 12.8 9.83 11.95 9.69 11.71C9.55 11.47 9.67 11.34 9.79 11.22C9.9 11.11 10.03 10.94 10.15 10.8C10.27 10.66 10.31 10.56 10.38 10.42C10.45 10.28 10.41 10.16 10.35 10.04C10.29 9.92 9.81 8.73 9.6 8.25C9.4 7.79 9.2 7.85 9.05 7.84C8.91 7.83 8.75 7.83 8.59 7.83C8.43 7.83 8.17 7.89 7.95 8.13C7.73 8.37 7.1 8.97 7.1 10.16C7.1 11.35 7.98 12.5 8.1 12.66C8.22 12.82 9.69 15.07 11.79 16.03C12.26 16.23 12.62 16.36 12.9 16.45C13.36 16.6 13.78 16.58 14.11 16.52C14.48 16.45 15.46 15.88 15.67 15.33C15.88 14.78 15.88 14.3 15.81 14.2C15.74 14.1 15.58 14.04 15.34 13.92L16.62 14.5Z"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-slate-900 text-sm">Join WhatsApp Channel</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Follow the SAFRANFRANCE channel</div>
          </div>
          <div className="text-slate-400">→</div>
        </a>
      </div>

      <button
        onClick={logout}
        className="w-full border border-red-200 text-red-600 font-semibold py-3 rounded-2xl active:scale-[0.98] transition bg-white shadow-sm"
      >
        Log out
      </button>

      {/* Modals */}
      {showGiftCard && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowGiftCard(false)}>
          <div className="w-full max-w-md bg-white rounded-t-3xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-lg font-bold text-slate-900">Redeem Gift Card</div>
                <div className="text-xs text-slate-500">Enter code from admin</div>
              </div>
              <button onClick={() => setShowGiftCard(false)} className="text-slate-400 text-xl">×</button>
            </div>
            <form onSubmit={redeemGift} className="space-y-3">
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="GIFT CODE"
                value={giftCode}
                onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                required
              />
              {giftMsg && (
                <div className="text-sm text-slate-700 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
                  {giftMsg}
                </div>
              )}
              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl active:scale-[0.98] transition disabled:opacity-50" disabled={giftLoading}>
                {giftLoading ? 'Redeeming…' : 'Redeem'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Customer Service Modal */}
      {showCustomerService && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowCustomerService(false)}>
          <div className="w-full max-w-md bg-white rounded-t-3xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-lg font-bold text-slate-900">Customer Service</div>
                <div className="text-xs text-slate-500">We are here to help</div>
              </div>
              <button onClick={() => setShowCustomerService(false)} className="text-slate-400 text-xl">×</button>
            </div>
            
            <div className="space-y-3">
              <a
                href={CS_WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl active:scale-[0.98] transition"
              >
                <div className="w-10 h-10 rounded-lg bg-[#25D366] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.74 21.4 10.37 21.82 12.04 21.82C17.5 21.82 21.95 17.37 21.95 11.91C21.95 6.45 17.5 2 12.04 2M12.04 20.15C10.49 20.15 8.97 19.73 7.64 18.95L7.26 18.73L4.11 19.55L4.95 16.48L4.7 16.08C3.84 14.69 3.39 13.33 3.39 11.91C3.39 7.14 7.27 3.26 12.04 3.26C16.81 3.26 20.69 7.14 20.69 11.91C20.69 16.68 16.81 20.56 12.04 20.56M16.62 14.5C16.38 14.38 15.19 13.79 14.96 13.7C14.73 13.61 14.57 13.56 14.4 13.8C14.24 14.04 13.82 14.54 13.68 14.7C13.54 14.86 13.4 14.88 13.16 14.76C12.92 14.64 12.09 14.36 11.11 13.48C10.34 12.8 9.83 11.95 9.69 11.71C9.55 11.47 9.67 11.34 9.79 11.22C9.9 11.11 10.03 10.94 10.15 10.8C10.27 10.66 10.31 10.56 10.38 10.42C10.45 10.28 10.41 10.16 10.35 10.04C10.29 9.92 9.81 8.73 9.6 8.25C9.4 7.79 9.2 7.85 9.05 7.84C8.91 7.83 8.75 7.83 8.59 7.83C8.43 7.83 8.17 7.89 7.95 8.13C7.73 8.37 7.1 8.97 7.1 10.16C7.1 11.35 7.98 12.5 8.1 12.66C8.22 12.82 9.69 15.07 11.79 16.03C12.26 16.23 12.62 16.36 12.9 16.45C13.36 16.6 13.78 16.58 14.11 16.52C14.48 16.45 15.46 15.88 15.67 15.33C15.88 14.78 15.88 14.3 15.81 14.2C15.74 14.1 15.58 14.04 15.34 13.92L16.62 14.5Z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-900 text-sm">Chat on WhatsApp</div>
                  <div className="text-[10px] text-slate-500">+256 705 371 032</div>
                </div>
                <div className="text-slate-400">→</div>
              </a>

              <a
                href={CS_TELEGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl active:scale-[0.98] transition"
              >
                <div className="w-10 h-10 rounded-lg bg-[#229ED9] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.17c-.05-.05-.14-.03-.19-.02-.11.03-1.83 1.17-5.19 3.43-.49.34-.94.5-1.34.49-.45 0-1.31-.25-1.95-.46-.66-.21-1.19-.33-1.15-.69.02-.19.33-.39.93-.6 3.63-1.58 6.05-2.63 7.26-3.13 3.47-1.45 4.19-1.7 4.66-1.7.1 0 .33.03.45.15.1.1.13.24.12.36z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-900 text-sm">Chat on Telegram</div>
                  <div className="text-[10px] text-slate-500">t.me/aaaaa56590</div>
                </div>
                <div className="text-slate-400">→</div>
              </a>
            </div>
            
            <button
              onClick={() => setShowCustomerService(false)}
              className="w-full mt-5 border border-slate-200 text-slate-600 font-semibold py-3 rounded-xl active:scale-[0.98] transition bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Bind Account Modal */}
      {showBindAccount && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowBindAccount(false)}>
          <div className="w-full max-w-md bg-white rounded-t-3xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-lg font-bold text-slate-900">Bind Account</div>
                <div className="text-xs text-slate-500">Secure your withdrawals</div>
              </div>
              <button onClick={() => setShowBindAccount(false)} className="text-slate-400 text-xl">×</button>
            </div>
            
            <form onSubmit={handleBindAccount} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">
                  MOBILE MONEY NUMBER
                </label>
                <input
                  type="tel"
                  value={bindPhone}
                  onChange={(e) => setBindPhone(e.target.value)}
                  placeholder="0700123456"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">
                  FULL REGISTERED NAME
                </label>
                <input
                  type="text"
                  value={bindName}
                  onChange={(e) => setBindName(e.target.value)}
                  placeholder="As registered on mobile money"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {bindMsg && (
                <div className="text-xs text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-200">
                  {bindMsg}
                </div>
              )}

              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl active:scale-[0.98] transition disabled:opacity-50" disabled={bindLoading}>
                {bindLoading ? 'Saving…' : 'Bind Account'}
              </button>
            </form>
            
            <button
              onClick={() => setShowBindAccount(false)}
              className="w-full mt-3 border border-slate-200 text-slate-600 font-semibold py-3 rounded-xl active:scale-[0.98] transition bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
                 }
