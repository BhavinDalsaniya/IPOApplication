import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IPO Tracker - Indian IPO Application Platform",
  description: "Track and manage Indian IPO applications, listings, and subscriptions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
