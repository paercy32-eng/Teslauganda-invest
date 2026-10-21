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
    <main className="min-h-screen relative flex items-center justify-center px-4 py-8 overflow-hidden bg-black">
      
      {/* Scrolling Background Images */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/60 z-10"></div> {/* Dark overlay */}
        <div className="h-full w-full overflow-hidden">
          <div className="animate-scroll flex flex-col">
            {/* We duplicate the images to make a seamless loop */}
            <img src="/file_0000000031108211a2d7b8e6c7d17fec.png" alt="Pump" className="w-full object-cover" />
            <img src="/file_000000007f4082118410b67dd9594dba.png" alt="Pump" className="w-full object-cover" />
            <img src="/file_00000000d28c8211a81b50ef302ccca8.png" alt="Pump" className="w-full object-cover" />
            
            <img src="/file_0000000031108211a2d7b8e6c7d17fec.png" alt="Pump" className="w-full object-cover" />
            <img src="/file_000000007f4082118410b67dd9594dba.png" alt="Pump" className="w-full object-cover" />
            <img src="/file_00000000d28c8211a81b50ef302ccca8.png" alt="Pump" className="w-full object-cover" />
          </div>
        </div>
      </div>

      <div className="w-full max-w-md relative z-20">
        <div className="mb-8 px-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight drop-shadow-md">China Saiken Pumps</h1>
          <p className="text-gray-200 text-sm drop-shadow-md">Sign in to your industrial dashboard.</p>
        </div>

        {/* Transparent Glass Form */}
        <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] text-gray-300 font-bold mb-2 tracking-wider uppercase">Phone Number</label>
              <div className="flex items-center bg-black/50 border border-white/20 rounded-xl focus-within:border-green-400 transition overflow-hidden">
                <span className="pl-4 pr-2 text-white text-sm font-bold select-none border-r border-white/20">
                  +256
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').replace(/^0+/, ''))}
                  placeholder="700123456"
                  className="w-full bg-transparent px-3 py-3.5 text-white placeholder-gray-400 focus:outline-none text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-300 font-bold mb-2 tracking-wider uppercase">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition pr-12 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs font-semibold hover:text-white"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-300 bg-red-900/50 rounded-xl px-4 py-3 border border-red-500/50">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl active:scale-[0.98] transition text-sm mt-2 shadow-lg shadow-green-500/30"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-200">
            Don't have an account?{' '}
            <Link href="/register" className="text-green-400 font-bold hover:underline">
              Create one
            </Link>
          </div>
        </div>
      </div>

      {/* Custom CSS for the scrolling animation */}
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </main>
  );
}
