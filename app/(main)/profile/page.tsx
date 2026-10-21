'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Me = {
  id: string;
  name: string;
  phone: string;
  balance: number;
  total_deposited?: number;
  total_withdrawn?: number;
};

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Background Carousel State
  const [bgIndex, setBgIndex] = useState(0);
  
  // YOUR ACTUAL IMAGES FROM THE PUBLIC FOLDER
  const bgImages = [
    '/1792617346732.jpg', 
    '/1792617375235.jpg', 
    '/1792617408682.jpg', 
    '/1792617441023.jpg'
  ];

  // Bound Account State
  const [boundPhone, setBoundPhone] = useState('');
  const [boundName, setBoundName] = useState('');

  // Modal States
  const [showGiftCard, setShowGiftCard] = useState(false);
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

    // Carousel Timer: Changes image every 4 seconds
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % bgImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [router, bgImages.length]);

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
      {/* Header with New Logo */}
      <div className="flex items-center justify-between px-2 mb-5">
        <div className="flex items-center gap-2">
          {/* SAIKEN PUMPS LOGO */}
          <div className="relative flex items-center justify-center w-10 h-10 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-600/30 overflow-hidden">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="currentColor"/>
              <circle cx="12" cy="12" r="4" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-tight tracking-tight">SAIKEN</h1>
            <p className="text-[10px] text-emerald-600 font-bold tracking-widest uppercase">Pumps</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-slate-500 font-medium">Signed in</div>
          <div className="text-sm font-semibold text-slate-900">{me?.name}</div>
        </div>
      </div>

      {/* Balance & Stats Card (With Background Carousel) */}
      <div className="relative rounded-3xl mb-5 shadow-sm border border-slate-200 overflow-hidden bg-slate-900">
        
        {/* Background Images Carousel */}
        {bgImages.map((img, index) => (
          <div
            key={img}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              index === bgIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url('${img}')` }}
          />
        ))}
        
        {/* Dark Overlay for Readability */}
        <div className="absolute inset-0 bg-slate-900/60" />

        {/* Card Content (Transparent Background) */}
        <div className="relative z-10 p-5">
          <div className="text-xs text-white/80 font-semibold mb-1 uppercase tracking-wider">Balance</div>
          <div className="text-4xl font-black text-white mb-5 drop-shadow-md">
            UGX {me?.balance?.toLocaleString() ?? 0}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3">
              <div className="text-[10px] text-emerald-300 font-bold uppercase mb-0.5">Total Deposited</div>
              <div className="text-sm font-bold text-white">
                UGX {(me?.total_deposited ?? 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3">
              <div className="text-[10px] text-slate-300 font-bold uppercase mb-0.5">Total Withdrawn</div>
              <div className="text-sm font-bold text-white">
                UGX {(me?.total_withdrawn ?? 0).toLocaleString()}
              </div>
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
