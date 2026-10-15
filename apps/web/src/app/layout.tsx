import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { SiteFooter, SiteHeader } from '@/components/site-header';
import { LanguageProvider } from '@/i18n/language-provider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Billwise',
  description: 'Smarter invoice processing.',
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white text-navy">
        <LanguageProvider>
          <SiteHeader />
          <main className="flex flex-1 flex-col">{children}</main>
          <SiteFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
