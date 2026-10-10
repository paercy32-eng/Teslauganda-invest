import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Safran — Invest in Aerospace',
  description: 'Invest in aerospace components. Earn daily.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0F0F12] text-[#F5F2ED]">
        <div className="mx-auto max-w-md min-h-screen relative">
          {children}
        </div>
      </body>
    </html>
  );
}
