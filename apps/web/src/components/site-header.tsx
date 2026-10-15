'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/i18n/language-provider';
import { Logo } from './logo';

export function SiteHeader() {
  const { t, language, setLanguage } = useLanguage();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" aria-label="Billwise">
          <Logo compact />
        </Link>
        <nav className="flex items-center gap-0.5 text-sm sm:gap-3">
          {[
            { href: '/demo', label: t.nav.samples },
            { href: '/demo/invoices', label: t.nav.invoices },
            { href: '/demo/dashboard', label: t.nav.dashboard },
          ].map((link) => {
            const active =
              link.href === '/demo'
                ? pathname === '/demo' || /^\/demo\/invoice-/.test(pathname)
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-md px-1.5 py-1.5 font-medium sm:px-2 ${active ? 'text-brand' : 'text-slate-600 hover:text-navy'}`}
              >
                {link.label}
              </Link>
            );
          })}
          <div
            className="ml-1 flex rounded-lg border border-slate-200 p-0.5 text-xs font-semibold"
            role="group"
            aria-label="Language"
          >
            {(['es', 'en'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setLanguage(option)}
                aria-pressed={language === option}
                className={`rounded-md px-2 py-1 uppercase transition ${
                  language === option ? 'bg-navy text-white' : 'text-slate-500 hover:text-navy'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-slate-200 py-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-sm text-muted sm:flex-row">
        <p>{t.footer}</p>
        <a
          href="https://github.com/MJVillarreal/billwise"
          className="font-medium text-slate-600 hover:text-navy"
          target="_blank"
          rel="noreferrer"
        >
          {t.nav.github}
        </a>
      </div>
    </footer>
  );
}
