'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SafranLogo from '@/components/SafranLogo';

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
        body: JSON.stringify({ phone, password }),
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
    <main className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-[#0F0F12]">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-[#C8833A] rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-72 h-72 bg-[#E0A44C] rounded-full mix-blend-screen filter blur-[100px] opacity-10"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="mb-8 px-2">
          <SafranLogo size={40} textColor="#F5F2ED" accentColor="#1A1A1F" />
          <h1 className="text-3xl font-bold text-[#F5F2ED] mt-6 mb-2">Welcome back</h1>
          <p className="text-[#8A8580] text-sm">Log in to continue to your dashboard.</p>
        </div>

        {/* Form Card */}
        <div className="card p-6 bg-[#1A1A1F]/80 backdrop-blur-xl border border-[#2A2823] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Phone Number */}
            <div>
              <label className="block text-[10px] text-[#8A8580] font-bold mb-2 tracking-wider uppercase">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full bg-[#15151A] border border-[#2A2823] rounded-xl px-4 py-3.5 text-[#F5F2ED] placeholder-[#4A4843] focus:outline-none focus:border-[#C8833A] transition"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] text-[#8A8580] font-bold mb-2 tracking-wider uppercase">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-[#15151A] border border-[#2A2823] rounded-xl px-4 py-3.5 text-[#F5F2ED] placeholder-[#4A4843] focus:outline-none focus:border-[#C8833A] transition pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8580] text-sm font-semibold"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-[#FF8A8A] bg-[#2A1416] rounded-xl px-4 py-3 border border-[#E5484D]/40">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#C8833A] to-[#E0A44C] text-white font-bold py-3.5 rounded-xl active:scale-[0.98] transition shadow-lg shadow-[#C8833A]/20"
            >
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#8A8580]">
            Don't have an account?{' '}
            <Link href="/register" className="text-[#E0A44C] font-bold hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
