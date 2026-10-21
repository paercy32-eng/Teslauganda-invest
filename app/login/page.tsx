'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: `+256${phone.replace(/^0+/, '')}`,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please check your credentials.');
      } else {
        router.replace('/');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center px-4 py-8 overflow-hidden bg-[#111827]">
      {/* Background decorative steel/slate pattern */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #374151 0%, transparent 70%)' }}></div>

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 px-2 text-center">
          {/* Industrial Gear Icon representing Pumps */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-[#EA580C] flex items-center justify-center shadow-lg shadow-[#EA580C]/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">China Saiken Pumps</h1>
          <p className="text-gray-400 text-sm">Sign in to your industrial dashboard.</p>
        </div>

        <div className="bg-[#1F2937] border border-[#374151] rounded-3xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] text-gray-400 font-bold mb-2 tracking-wider uppercase">Phone Number</label>
              <div className="flex items-center bg-[#111827] border border-[#374151] rounded-xl focus-within:border-[#EA580C] transition overflow-hidden">
                <span className="pl-4 pr-2 text-white text-sm font-bold select-none border-r border-[#374151]">
                  +256
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').replace(/^0+/, ''))}
                  placeholder="700123456"
                  className="w-full bg-transparent px-3 py-3.5 text-white placeholder-gray-500 focus:outline-none text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 font-bold mb-2 tracking-wider uppercase">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-[#111827] border border-[#374151] rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#EA580C] transition pr-12 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold hover:text-white"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-900/20 rounded-xl px-4 py-3 border border-red-500/30">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold py-3.5 rounded-xl active:scale-[0.98] transition text-sm mt-2 shadow-lg shadow-[#EA580C]/20"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link href="/register" className="text-[#EA580C] font-bold hover:underline">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
