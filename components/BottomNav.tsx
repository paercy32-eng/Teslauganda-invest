'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/my-tesla', label: 'My Tesla', icon: '🚗' },
  { href: '/team', label: 'Team', icon: '👥' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A] border-t border-[#2A2A2A]">
      <div className="mx-auto max-w-md grid grid-cols-4">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center justify-center py-3 gap-1 transition ${
                active ? 'text-[#E31937]' : 'text-[#8A8A8A]'
              }`}
            >
              <span className="text-xl leading-none">{t.icon}</span>
              <span className="text-[11px] font-medium">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
