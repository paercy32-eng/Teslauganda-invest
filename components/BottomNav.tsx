'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type IconProps = { active: boolean };

// Updated to match the Emerald/Green theme
const ACTIVE = '#10B981'; 
const INACTIVE = '#94A3B8'; 

function HomeIcon({ active }: IconProps) {
  const color = active ? ACTIVE : INACTIVE;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V10.5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={active ? '#ECFDF5' : 'none'}
      />
    </svg>
  );
}

function OrderIcon({ active }: IconProps) {
  const color = active ? ACTIVE : INACTIVE;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 8l-9-5-9 5v8l9 5 9-5V8z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={active ? '#ECFDF5' : 'none'}
      />
      <path 
        d="M3 8l9 5 9-5M12 21v-8" 
        stroke={color} 
        strokeWidth="1.8" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}

function TeamIcon({ active }: IconProps) {
  const color = active ? ACTIVE : INACTIVE;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle
        cx="9"
        cy="8"
        r="3.2"
        stroke={color}
        strokeWidth="1.8"
        fill={active ? '#ECFDF5' : 'none'}
      />
      <circle
        cx="17"
        cy="9"
        r="2.4"
        stroke={color}
        strokeWidth="1.8"
        fill={active ? '#ECFDF5' : 'none'}
      />
      <path
        d="M2.5 19c.7-3.2 3.3-5 6.5-5s5.8 1.8 6.5 5M15 14.2c2.7.2 4.7 1.7 5.4 4.3"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProfileIcon({ active }: IconProps) {
  const color = active ? ACTIVE : INACTIVE;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke={color}
        strokeWidth="1.8"
        fill={active ? '#ECFDF5' : 'none'}
      />
      <path
        d="M4.5 20c.9-3.6 3.9-5.5 7.5-5.5s6.6 1.9 7.5 5.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const tabs = [
  { href: '/', label: 'Home', Icon: HomeIcon },
  { href: '/my-tesla', label: 'Orders', Icon: OrderIcon }, 
  { href: '/team', label: 'Team', Icon: TeamIcon },
  { href: '/profile', label: 'Profile', Icon: ProfileIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  // 🛑 HIDE NAV ON LOGIN AND REGISTER PAGES
  if (pathname === '/login' || pathname === '/register' || pathname === '/admin/login') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="mx-auto max-w-md grid grid-cols-4">
        {tabs.map((t) => {
          const active = pathname === t.href;
          const Icon = t.Icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="flex flex-col items-center justify-center py-3 gap-1 transition"
            >
              <Icon active={active} />
              <span
                className="text-[11px] font-semibold"
                style={{ color: active ? ACTIVE : INACTIVE }}
              >
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
