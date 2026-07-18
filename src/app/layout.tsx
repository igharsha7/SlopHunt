import type { Metadata } from "next";
import { Archivo, Space_Mono } from "next/font/google";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";

import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "SlopHunt — Product Hunt for slop",
    template: "%s — SlopHunt",
  },
  description:
    "Submit your repo. Get roasted. Get ranked. An AI agent crawls your GitHub, scores the slop, and puts it on a public leaderboard you did not ask for.",
  openGraph: {
    title: "SlopHunt — Product Hunt for slop",
    description: "Submit your repo. Get roasted. Get ranked.",
    url: APP_URL,
    siteName: "SlopHunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SlopHunt — Product Hunt for slop",
    description: "Submit your repo. Get roasted. Get ranked.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${spaceMono.variable} h-full`}
    >
      <body className="grain flex min-h-full flex-col bg-void font-mono text-bone">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:border-2 focus:border-toxic focus:bg-void focus:px-4 focus:py-2 focus:text-sm focus:uppercase"
        >
          Skip to content
        </a>
        <SiteNav />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
