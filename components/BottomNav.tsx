'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type IconProps = { active: boolean };

function HomeIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V10.5z"
        stroke={active ? '#7C9070' : '#9AA89A'}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={active ? '#E3E8DE' : 'none'}
      />
    </svg>
  );
}

function CarIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 17h14M5 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm14 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"
        stroke={active ? '#7C9070' : '#9AA89A'}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M3 15V11l2-5h14l2 5v4"
        stroke={active ? '#7C9070' : '#9AA89A'}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={active ? '#E3E8DE' : 'none'}
      />
    </svg>
  );
}

function TeamIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle
        cx="9"
        cy="8"
        r="3.2"
        stroke={active ? '#7C9070' : '#9AA89A'}
        strokeWidth="1.8"
        fill={active ? '#E3E8DE' : 'none'}
      />
      <circle
        cx="17"
        cy="9"
        r="2.4"
        stroke={active ? '#7C9070' : '#9AA89A'}
        strokeWidth="1.8"
        fill={active ? '#E3E8DE' : 'none'}
      />
      <path
        d="M2.5 19c.7-3.2 3.3-5 6.5-5s5.8 1.8 6.5 5M15 14.2c2.7.2 4.7 1.7 5.4 4.3"
        stroke={active ? '#7C9070' : '#9AA89A'}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProfileIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke={active ? '#7C9070' : '#9AA89A'}
        strokeWidth="1.8"
        fill={active ? '#E3E8DE' : 'none'}
      />
      <path
        d="M4.5 20c.9-3.6 3.9-5.5 7.5-5.5s6.6 1.9 7.5 5.5"
        stroke={active ? '#7C9070' : '#9AA89A'}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const tabs = [
  { href: '/', label: 'Home', Icon: HomeIcon },
  { href: '/my-tesla', label: 'My Tesla', Icon: CarIcon },
  { href: '/team', label: 'Team', Icon: TeamIcon },
  { href: '/profile', label: 'Profile', Icon: ProfileIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E3E8DE]">
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
                className="text-[11px] font-medium"
                style={{ color: active ? '#7C9070' : '#9AA89A' }}
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
