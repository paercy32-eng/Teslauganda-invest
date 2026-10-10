'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SafranLogo from '@/components/SafranLogo';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 👇 THIS READS THE URL AND PREFILLS THE REFERRAL CODE
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          password,
          confirmPassword, // 👈 THIS WAS ADDED PREVIOUSLY
          referralCode: referralCode.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.');
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
    <main className="min-h-screen relative flex items-center justify-center px-4 py-10 overflow-hidden bg-[#131317]">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-80 h-80 bg-[#C8833A] rounded-full mix-blend-screen filter blur-[120px] opacity-20"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-[#E0A44C] rounded-full mix-blend-screen filter blur-[120px] opacity-10"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="mb-8 px-2 text-center">
          <div className="flex justify-center mb-4">
            <SafranLogo size={40} textColor="#F5F2ED" accentColor="#1A1A1F" />
          </div>
          <h1 className="text-3xl font-bold text-[#F5F2ED] mb-2">Create account</h1>
          <p className="text-[#8A8580] text-sm">Start investing. Start earning.</p>
        </div>

        {/* Form Card */}
        <div className="card p-6 bg-[#1C1C21]/80 backdrop-blur-xl border border-[#2A2A30] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-[10px] text-[#8A8580] font-bold mb-2 tracking-wider uppercase">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full bg-[#131317] border border-[#2A2A30] rounded-xl px-4 py-3.5 text-[#F5F2ED] placeholder-[#4A4843] focus:outline-none focus:border-[#C8833A] transition"
                required
              />
            </div>

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
                className="w-full bg-[#131317] border border-[#2A2A30] rounded-xl px-4 py-3.5 text-[#F5F2ED] placeholder-[#4A4843] focus:outline-none focus:border-[#C8833A] transition"
                required
              />
            </div>

            {/* Password Grid */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[10px] text-[#8A8580] font-bold mb-2 tracking-wider uppercase">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-[#131317] border border-[#2A2A30] rounded-xl px-4 py-3.5 text-[#F5F2ED] placeholder-[#4A4843] focus:outline-none focus:border-[#C8833A] transition pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8580] text-xs font-semibold"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[#8A8580] font-bold mb-2 tracking-wider uppercase">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full bg-[#131317] border border-[#2A2A30] rounded-xl px-4 py-3.5 text-[#F5F2ED] placeholder-[#4A4843] focus:outline-none focus:border-[#C8833A] transition"
                  required
                />
              </div>
            </div>

            {/* Referral Code */}
            <div>
              <label className="block text-[10px] text-[#8A8580] font-bold mb-2 tracking-wider uppercase">
                Referral Code <span className="text-[#4A4843] lowercase font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Enter referral code"
                className="w-full bg-[#131317] border border-[#2A2A30] rounded-xl px-4 py-3.5 text-[#F5F2ED] placeholder-[#4A4843] focus:outline-none focus:border-[#C8833A] transition"
              />
            </div>

            {error && (
              <div className="text-sm text-[#FF8A8A] bg-[#2A1416] rounded-xl px-4 py-3 border border-[#E5484D]/40">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#C8833A] to-[#E0A44C] text-white font-bold py-3.5 rounded-xl active:scale-[0.98] transition shadow-lg shadow-[#C8833A]/20 mt-2"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#8A8580]">
            Already have an account?{' '}
            <Link href="/login" className="text-[#E0A44C] font-bold hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
