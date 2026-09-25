import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tesla — Electric Vehicle Rentals',
  description: 'Rent a Tesla. Earn daily.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F7F8F5] text-[#1F2A1B]">
        <div className="mx-auto max-w-md min-h-screen relative">
          {children}
        </div>
      </body>
    </html>
  );
}
