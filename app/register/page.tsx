'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SafranLogo from '@/components/SafranLogo';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Prefill referral code from URL (?ref=XXXXX)
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
          phone,
          password,
          confirmPassword,
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
        <div className="bg-[#1A1A1F] border border-[#2A2823] rounded-3xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} name="register-form" autoComplete="on" className="space-y-4">
            {/* Phone Number */}
            <div>
              <label htmlFor="register-phone" className="block text-[10px] text-[#8A8580] font-bold mb-2 tracking-wider uppercase">
                Phone Number
              </label>
              <input
                id="register-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full bg-[#15151A] border border-[#2A2823] rounded-xl px-4 py-3.5 text-[#F5F2ED] placeholder-[#4A4843] focus:outline-none focus:border-[#C8833A] transition"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="register-password" className="block text-[10px] text-[#8A8580] font-bold mb-2 tracking-wider uppercase">
                Password
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-[#15151A] border border-[#2A2823] rounded-xl px-4 py-3.5 text-[#F5F2ED] placeholder-[#4A4843] focus:outline-none focus:border-[#C8833A] transition pr-12"
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="register-confirm-password" className="block text-[10px] text-[#8A8580] font-bold mb-2 tracking-wider uppercase">
                Confirm Password
              </label>
              <input
                id="register-confirm-password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="w-full bg-[#15151A] border border-[#2A2823] rounded-xl px-4 py-3.5 text-[#F5F2ED] placeholder-[#4A4843] focus:outline-none focus:border-[#C8833A] transition"
                required
              />
            </div>

            {/* Referral Code */}
            <div>
              <label htmlFor="register-referral" className="block text-[10px] text-[#8A8580] font-bold mb-2 tracking-wider uppercase">
                Referral Code <span className="text-[#4A4843] lowercase font-normal">(optional)</span>
              </label>
              <input
                id="register-referral"
                name="referralCode"
                type="text"
                autoComplete="off"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Enter referral code"
                className="w-full bg-[#15151A] border border-[#2A2823] rounded-xl px-4 py-3.5 text-[#F5F2ED] placeholder-[#4A4843] focus:outline-none focus:border-[#C8833A] transition"
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

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#131317]">
        <div className="w-8 h-8 rounded-full border-2 border-[#C8833A] border-t-transparent animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
