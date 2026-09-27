import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';

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

        <Script id="eruda-init" strategy="afterInteractive">
          {`
            (function(){
              var s = document.createElement('script');
              s.src = 'https://cdn.jsdelivr.net/npm/eruda';
              s.onload = function(){ window.eruda.init(); };
              document.body.appendChild(s);
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
