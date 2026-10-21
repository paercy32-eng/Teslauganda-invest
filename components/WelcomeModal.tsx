'use client';

import { useEffect, useState } from 'react';

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if the user has already seen the popup
    const hasSeen = localStorage.getItem('hasSeenWelcomeModal');
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  function handleClose() {
    // Save to localStorage so it doesn't show again
    localStorage.setItem('hasSeenWelcomeModal', 'true');
    setIsOpen(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      
      {/* Popup Container with Your Background Image */}
      <div 
        className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-white/40"
        style={{
          // Using your exact image file
          backgroundImage: "url('/1792618456855.jpg')", 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Transparent Overlay (bg-white/85 keeps it slightly transparent so the image shows through) */}
        <div className="absolute inset-0 bg-white/85 backdrop-blur-md" />

        {/* Close Button (Red X) */}
        <button 
          onClick={handleClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition active:scale-95"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Content */}
        <div className="relative z-10 p-6 flex flex-col items-center">
          
          <h2 className="text-xl font-black text-slate-900 mb-4 text-center mt-2 drop-shadow-sm">
            Welcome to Saiken Pumps
          </h2>

          {/* Rules Box */}
          <div className="w-full border border-emerald-600 rounded-xl overflow-hidden mb-5 bg-white/60">
            <div className="p-3 text-center text-sm font-bold text-emerald-800 border-b border-emerald-600">
              Minimum deposit: UGX 20,000
            </div>
            <div className="p-3 text-center text-sm font-bold text-emerald-800 border-b border-emerald-600">
              Minimum withdraw: UGX 6,000
            </div>
            <div className="p-3 text-center text-sm font-bold text-emerald-800 border-b border-emerald-600">
              Withdraw fee: 16%
            </div>
            <div className="p-3 text-center text-sm font-bold text-emerald-800">
              Withdraw hours: 07:00 - 17:00
            </div>
          </div>

          {/* Security Warning */}
          <p className="text-xs text-slate-800 text-center font-bold leading-relaxed mb-6 px-1">
            Official customer service will <span className="text-red-600">never</span> proactively ask for your password or screenshots of your deposits; please remain vigilant.
          </p>

          {/* Telegram Button */}
          <a 
            href="https://t.me/+GM_Fo41-HFsxNTc0" // Replace with your actual Telegram link if different
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-md shadow-emerald-600/30"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
            </svg>
            Join Group
          </a>

        </div>
      </div>
    </div>
  );
}
