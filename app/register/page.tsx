'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
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

      <h1 className="text-3xl font-bold mb-2">Create account</h1>
      <p className="text-[#8A8A8A] mb-8">Start renting. Start earning.</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[#8A8A8A] mb-2">Full Name</label>
          <input
            type="text"
            className="input-dark"
            placeholder="John Doe"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm text-[#8A8A8A] mb-2">Phone Number</label>
          <input
            type="tel"
            className="input-dark"
            placeholder="0700123456"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm text-[#8A8A8A] mb-2">Password</label>
          <input
            type="password"
            className="input-dark"
            placeholder="At least 6 characters"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm text-[#8A8A8A] mb-2">Confirm Password</label>
          <input
            type="password"
            className="input-dark"
            placeholder="Repeat password"
            value={form.confirmPassword}
            onChange={(e) => update('confirmPassword', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm text-[#8A8A8A] mb-2">
            Referral Code <span className="text-[#5A5A5A]">(optional)</span>
          </label>
          <input
            type="text"
            className="input-dark uppercase"
            placeholder="TSLA-XXXXX"
            value={form.referralCode}
            onChange={(e) => update('referralCode', e.target.value.toUpperCase())}
          />
        </div>

        {error && (
          <div className="bg-[#2A1416] border border-[#E31937] rounded-2xl px-4 py-3 text-sm text-[#FF7A8A]">
            {error}
          </div>
        )}

        <button type="submit" className="btn-red mt-2" disabled={loading}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-[#8A8A8A] mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-[#E31937] font-semibold">
          Log in
        </Link>
      </p>
    </main>
  );
}
