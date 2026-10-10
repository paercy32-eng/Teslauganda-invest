'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SafranLogo from '@/components/SafranLogo';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setForm((f) => ({ ...f, referralCode: ref.toUpperCase() }));
    }
  }, [searchParams]);

  function update(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    const name = String(fd.get('name') || form.name || '').trim();
    const phone = String(fd.get('phone') || form.phone || '').trim();
    const password = String(fd.get('password') || form.password || '');
    const confirmPassword = String(
      fd.get('confirmPassword') || form.confirmPassword || ''
    );
    const referralCode = String(
      fd.get('referralCode') || form.referralCode || ''
    ).trim();

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password, confirmPassword, referralCode }),
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
      <div className="mb-8">
        <SafranLogo
          size={44}
          textColor="#F5F2ED"
          accentColor="#1A1A1F"
        />
      </div>

      <h1 className="text-3xl font-bold mb-2 text-[#F5F2ED]">Create account</h1>
      <p className="text-[#8A8580] mb-8">Start investing. Start earning.</p>

      <form onSubmit={onSubmit} className="space-y-4" autoComplete="off">
        <div>
          <label className="block text-sm text-[#8A8580] mb-2">Full Name</label>
          <input
            type="text"
            name="name"
            className="input-light"
            placeholder="John Doe"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            autoComplete="off"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-[#8A8580] mb-2">Phone Number</label>
          <input
            type="tel"
            name="phone"
            className="input-light"
            placeholder="0700123456"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
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
            placeholder="At least 6 characters"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-[#8A8580] mb-2">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            className="input-light"
            placeholder="Repeat password"
            value={form.confirmPassword}
            onChange={(e) => update('confirmPassword', e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-[#8A8580] mb-2">
            Referral Code <span className="text-[#5A5750]">(optional)</span>
          </label>
          <input
            type="text"
            name="referralCode"
            className="input-light uppercase"
            placeholder="SAFRAN-XXXXX"
            value={form.referralCode}
            onChange={(e) => update('referralCode', e.target.value.toUpperCase())}
            autoComplete="off"
          />
        </div>

        {error && (
          <div className="bg-[#2A1416] border border-[#E5484D]/40 rounded-2xl px-4 py-3 text-sm text-[#FF8A8A]">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary mt-2" disabled={loading}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-[#8A8580] mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-[#E0A44C] font-semibold">
          Log in
        </Link>
      </p>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-[#8A8580]">Loading…</div>
        </main>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
