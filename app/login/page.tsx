'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
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
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10 animate-fade-in">
      {/* Brand */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#E31937] flex items-center justify-center text-white font-bold text-xl">
          T
        </div>
        <span className="text-2xl font-bold">Tesla</span>
      </div>

      <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
      <p className="text-[#8A8A8A] mb-8">Log in to continue.</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[#8A8A8A] mb-2">Phone Number</label>
          <input
            type="tel"
            className="input-dark"
            placeholder="0700123456"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm text-[#8A8A8A] mb-2">Password</label>
          <input
            type="password"
            className="input-dark"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="bg-[#2A1416] border border-[#E31937] rounded-2xl px-4 py-3 text-sm text-[#FF7A8A]">
            {error}
          </div>
        )}

        <button type="submit" className="btn-red mt-2" disabled={loading}>
          {loading ? 'Logging in…' : 'Log In'}
        </button>
      </form>

      <p className="text-center text-[#8A8A8A] mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-[#E31937] font-semibold">
          Sign up
        </Link>
      </p>
    </main>
  );
}
