import type { Metadata, Viewport } from "next";
import "./globals.css";

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
  themeColor: "#07090d"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
