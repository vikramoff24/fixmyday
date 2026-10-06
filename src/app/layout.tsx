import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import { AppProviders } from "@/components/providers/app-providers";
import { isClerkEnabled } from "@/config/features";
import { siteConfig } from "@/config/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: `${siteConfig.name} — AI day planner`, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#141518" },
    { media: "(prefers-color-scheme: light)", color: "#fbfaf8" },
  ],
};

const clerkAppearance = {
  variables: {
    colorPrimary: "#f0b44c",
    colorText: "#efeff2",
    colorBackground: "#1d1e22",
    colorInputBackground: "#25262b",
    colorInputText: "#efeff2",
    borderRadius: "0.5rem",
    fontFamily: "var(--font-geist-sans)",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const page = (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );

  return isClerkEnabled ? <ClerkProvider appearance={clerkAppearance}>{page}</ClerkProvider> : page;
}
