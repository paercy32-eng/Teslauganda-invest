'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SafranLogo from '@/components/SafranLogo';

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
      <div className="mb-8">
        <SafranLogo
          size={44}
          textColor="#F5F2ED"
          accentColor="#1A1A1F"
        />
      </div>

      <h1 className="text-3xl font-bold mb-2 text-[#F5F2ED]">Welcome back</h1>
      <p className="text-[#8A8580] mb-8">Log in to continue.</p>

      <form onSubmit={onSubmit} className="space-y-4" autoComplete="off">
        <div>
          <label className="block text-sm text-[#8A8580] mb-2">Phone Number</label>
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
          <label className="block text-sm text-[#8A8580] mb-2">Password</label>
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
          <div className="bg-[#2A1416] border border-[#E5484D]/40 rounded-2xl px-4 py-3 text-sm text-[#FF8A8A]">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary mt-2" disabled={loading}>
          {loading ? 'Logging in…' : 'Log In'}
        </button>
      </form>

      <p className="text-center text-[#8A8580] mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-[#E0A44C] font-semibold">
          Sign up
        </Link>
      </p>
    </main>
  );
}
