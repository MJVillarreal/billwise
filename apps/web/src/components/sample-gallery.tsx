'use client';

import { ArrowRight, Info } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/i18n/language-provider';
import { formatMoney } from '@/lib/format';
import type { Sample } from '@/lib/samples';

export function SampleGallery({ samples }: { samples: Sample[] }) {
  const { t, language } = useLanguage();

  return (
    <div className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
          {t.gallery.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{t.gallery.title}</h1>
        <p className="mt-3 max-w-2xl text-muted">{t.gallery.subtitle}</p>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {samples.map((sample, index) => (
            <li key={sample.id}>
              <Link
                href={`/demo/${sample.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
              >
                <div className="relative h-44 overflow-hidden border-b border-slate-100 bg-slate-100">
                  <Image
                    src={`/samples/${sample.thumbnail}`}
                    alt=""
                    width={480}
                    height={679}
                    className="absolute inset-x-0 top-0 h-auto w-full transition duration-300 group-hover:scale-[1.03]"
                  />
                  <span className="absolute left-3 top-3 flex size-8 items-center justify-center rounded-md bg-navy text-sm font-bold text-white">
                    {sample.letter}
                  </span>
                  <span className="absolute right-3 top-3 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-muted">
                    #{index + 1}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-sm font-semibold">{sample.printed.issuer.name}</p>
                  <p className="mt-2 flex-1 text-sm text-muted">{sample.scenario[language]}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted">
                      {t.gallery.total}{' '}
                      <span className="font-semibold text-navy">
                        {formatMoney(sample.printed.total, t.locale)}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-brand group-hover:text-brand-dark">
                      {t.gallery.open}
                      <ArrowRight className="size-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-8 flex items-start gap-2 text-sm text-muted">
          <Info className="mt-0.5 size-4 shrink-0" />
          {t.gallery.batchNote}
        </p>
      </div>
    </div>
  );
}
