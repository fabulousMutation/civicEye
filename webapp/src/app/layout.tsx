import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import MobileNav from "@/components/MobileNav";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "CivicEye — AI-Powered Civic Reporting",
  description: "Report civic issues with a photo. AI classifies, maps, and routes your report to the right authority. Be the eye of your city.",
  keywords: ["civic reporting", "AI", "pothole", "infrastructure", "city", "report issue"],
  openGraph: {
    title: "CivicEye — Be the Eye of Your City",
    description: "Snap a photo. AI classifies it. Your city responds.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CivicEye" />
      </head>
      <body className="antialiased">
        <Nav />
        <div className="pt-14 sm:pb-0 pb-20">
          {children}
        </div>
        {user && <MobileNav />}
      </body>
    </html>
  );
}
