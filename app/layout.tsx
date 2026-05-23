import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Hypertape",
  description: "The live probability tape for Hyperliquid outcome markets.",
  manifest: "/assets/site.webmanifest",
  icons: {
    icon: [
      { url: "/assets/favicon.ico", sizes: "any" },
      { url: "/assets/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/assets/favicon-32x32.png", type: "image/png", sizes: "32x32" }
    ],
    apple: "/assets/apple-touch-icon.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#04060C"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark font-sans", geist.variable)}>
      <body>{children}</body>
    </html>
  );
}
