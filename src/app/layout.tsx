import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "ADNAN SMM Panel",
  description:
    "Professional SMM panel for Instagram, TikTok, YouTube, Facebook, Telegram and more. Cheapest prices, fastest delivery, 24/7 support.",
  keywords: [
    "SMM Panel",
    "Social Media Marketing",
    "Instagram",
    "TikTok",
    "YouTube",
    "Facebook",
    "Followers",
    "Likes",
    "Views",
    "ADNAN SMM",
  ],
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-white text-slate-900" style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
