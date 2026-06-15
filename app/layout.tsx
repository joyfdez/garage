import type { Metadata } from "next";
import { Inter, Space_Grotesk, Archivo } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
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

// Primary display font — variable, loaded once, covers weights 600-800
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["600", "700", "800"],
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
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${archivo.variable}`}>
      <body className="bg-paper text-ink font-sans antialiased">
        <main className="min-h-dvh pb-16 md:pb-0">{children}</main>
        <BottomNav />
        <Toaster
          position="bottom-center"
          offset={80}
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
