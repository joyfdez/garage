import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";

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

export const metadata: Metadata = {
  title: "Garage — The home for people who build cars",
  description: "Track the life of every car.",
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
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-background text-ink font-sans antialiased">
        <main className="min-h-dvh pb-16 md:pb-0">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
