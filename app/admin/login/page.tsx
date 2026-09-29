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
    <main className="min-h-screen px-6 py-10 animate-fade-in flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-8 justify-center">
        <div className="w-10 h-10 rounded-xl bg-[#1F2A1B] flex items-center justify-center text-white font-bold text-xl">
          A
        </div>
        <span className="text-2xl font-bold text-[#1F2A1B]">Robots Invest Admin</span>
      </div>

      <h1 className="text-2xl font-bold mb-2 text-center text-[#1F2A1B]">
        Admin Access
      </h1>
      <p className="text-[#6B7A62] mb-8 text-center text-sm">
        Restricted area
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[#6B7A62] mb-2">Username</label>
          <input
            type="text"
            className="input-light"
            placeholder="admin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm text-[#6B7A62] mb-2">Password</label>
          <input
            type="password"
            className="input-light"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="bg-[#FDF3F3] border border-[#E5B5B5] rounded-2xl px-4 py-3 text-sm text-[#A13A3A]">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-[#1F2A1B] text-white font-semibold py-3 rounded-2xl active:scale-[0.98] transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </main>
  );
}
