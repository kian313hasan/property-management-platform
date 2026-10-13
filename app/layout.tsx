import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import { I18nProvider } from "@/i18n/provider";
import { getI18n } from "@/i18n/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Covers Arabic and Persian script; Latin text keeps using Geist (see --font-sans in globals.css).
const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: "Property Management Platform",
  description: "Professional multi-tenant property management platform.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The document language and direction follow the resolved locale (cookie, then Accept-Language).
  const { locale, dir } = await getI18n();

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
