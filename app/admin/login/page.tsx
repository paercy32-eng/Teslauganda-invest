'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setError('Something went wrong.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10 animate-fade-in flex flex-col justify-center bg-gray-50">
      <div className="flex items-center gap-2 mb-8 justify-center">
        <div className="w-10 h-10 rounded-xl bg-[#0A2540] flex items-center justify-center text-[#00D9FF] font-bold text-xl">
          A
        </div>
        <span className="text-2xl font-bold text-[#0A2540]">Safran Admin</span>
      </div>

      <h1 className="text-2xl font-bold mb-2 text-center text-[#0A2540]">
        Admin Access
      </h1>
      <p className="text-[#6B7A8F] mb-8 text-center text-sm">Restricted area</p>

      <form
        onSubmit={onSubmit}
        name="admin-login-form"
        id="admin-login-form"
        autoComplete="on"
        className="space-y-4"
      >
        <div>
          <label htmlFor="admin-username" className="block text-sm text-[#6B7A8F] mb-2">
            Username
          </label>
          <input
            id="admin-username"
            name="username"
            type="text"
            autoComplete="username"
            className="input-light"
            placeholder="admin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="admin-password" className="block text-sm text-[#6B7A8F] mb-2">
            Password
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="input-light"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="bg-[#FFF1F3] border border-[#E11D48]/30 rounded-2xl px-4 py-3 text-sm text-[#E11D48]">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary mt-2"
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </main>
  );
}
