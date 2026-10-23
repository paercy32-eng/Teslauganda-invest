import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import WelcomeModal from "@/components/WelcomeModal";
import { RegisterSW } from "@/components/RegisterSW";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Saiken Pumps - Invest in Agriculture",
  description: "Rent agricultural pumps, earn daily.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Saiken Pumps",
  },
  icons: {
    icon: "/file_000000006c64821183673ffaa0837764.png",
    apple: "/file_000000006c64821183673ffaa0837764.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen`}>
        <RegisterSW />
        <div className="max-w-md mx-auto min-h-screen relative">
          {children}
          <BottomNav />
          <WelcomeModal />
        </div>
      </body>
    </html>
  );
}
