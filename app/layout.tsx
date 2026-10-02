import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Robots Invest — Rent Robots, Earn Daily',
  description: 'Rent robots. Earn daily.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F5F7FA] text-[#0A2540]">
        <div className="mx-auto max-w-md min-h-screen relative">
          {children}
        </div>
      </body>
    </html>
  );
}
