import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hypertape",
  description: "The live probability tape for Hyperliquid outcome markets."
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
