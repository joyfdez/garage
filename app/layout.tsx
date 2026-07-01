import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, Archivo } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { SwRegister } from "@/components/SwRegister";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["600", "700", "800"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1A3A2E",
};

export const metadata: Metadata = {
  title: "Garage — The home for people who build cars",
  description: "Track the life of every car.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Garage",
  },
  openGraph: {
    title: "Garage",
    description: "The home for people who build cars.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${archivo.variable}`}>
      <body className="bg-paper text-ink font-sans antialiased">
        {/* Solid frosted cover exactly over the iOS status-bar / notch */}
        <div
          aria-hidden="true"
          className="fixed inset-x-0 top-0 z-[97] pointer-events-none"
          style={{
            height: "env(safe-area-inset-top, 0px)",
            background: "rgba(251, 250, 247, 0.92)",
            backdropFilter: "blur(20px) saturate(160%)",
            WebkitBackdropFilter: "blur(20px) saturate(160%)",
          }}
        />
        {/* Gradient fade below the status bar — soft Instagram-style fade so
            scrolling content doesn't hard-clip at the status-bar edge */}
        <div
          aria-hidden="true"
          className="fixed inset-x-0 z-[55] pointer-events-none"
          style={{
            top: "env(safe-area-inset-top, 0px)",
            height: "3rem",
            background:
              "linear-gradient(to bottom, rgba(251,250,247,0.80) 0%, transparent 100%)",
          }}
        />
        <main className="min-h-dvh pb-nav md:pb-0">{children}</main>
        <BottomNav />
        <SwRegister />
        <InstallPrompt />
        <Toaster
          position="bottom-center"
          offset="calc(4.5rem + env(safe-area-inset-bottom, 0px))"
          toastOptions={{
            style: {
              background: "#FBFAF7",
              border: "1px solid rgba(17,17,17,0.08)",
              borderRadius: "16px",
              color: "#111111",
              fontSize: "0.875rem",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
            },
          }}
        />
      </body>
    </html>
  );
}
