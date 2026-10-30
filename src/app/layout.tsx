import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "kazagecirdim.com — Kazadan sonra ne yapmalı?", template: "%s · kazagecirdim.com" },
  description:
    "Trafik, ev ve iş kazasından sonra adım adım rehber; işverenler için kaza müdahale ve ramak kala bildirim platformu.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
