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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    const phoneValue = String(formData.get('phone') || phone || '').trim();
    const passwordValue = String(formData.get('password') || password || '');

    if (!phoneValue || !passwordValue) {
      setError('Please enter both phone and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneValue, password: passwordValue }),
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
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#0A2540] flex items-center justify-center text-[#00D9FF] font-bold text-xl">
          R
        </div>
        <span className="text-2xl font-bold text-[#0A2540]">Robots Invest</span>
      </div>

      <h1 className="text-3xl font-bold mb-2 text-[#0A2540]">Welcome back</h1>
      <p className="text-[#6B7A8F] mb-8">Log in to continue.</p>

      <form onSubmit={onSubmit} className="space-y-4" autoComplete="off">
        <div>
          <label className="block text-sm text-[#6B7A8F] mb-2">Phone Number</label>
          <input
            type="tel"
            name="phone"
            className="input-light"
            placeholder="0700123456"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="off"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-[#6B7A8F] mb-2">Password</label>
          <input
            type="password"
            name="password"
            className="input-light"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        {error && (
          <div className="bg-[#FFF1F3] border border-[#E11D48]/30 rounded-2xl px-4 py-3 text-sm text-[#E11D48]">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary mt-2" disabled={loading}>
          {loading ? 'Logging in…' : 'Log In'}
        </button>
      </form>

      <p className="text-center text-[#6B7A8F] mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-[#00B8DB] font-semibold">
          Sign up
        </Link>
      </p>
    </main>
  );
}
