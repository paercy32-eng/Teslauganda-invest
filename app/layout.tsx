import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import WelcomeModal from "@/components/WelcomeModal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Saiken Pumps - Invest in Agriculture",
  description: "Rent agricultural pumps, earn daily.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen`}>
        {/* Main App Content */}
        <div className="max-w-md mx-auto min-h-screen relative">
          {children}
          
          {/* Global Components */}
          <BottomNav />
          <WelcomeModal />
        </div>
      </body>
    </html>
  );
}
