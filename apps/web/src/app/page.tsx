'use client';

import { ArrowRight, FileCheck2, QrCode, ScanLine, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/i18n/language-provider';

const STEP_ICONS = [ScanLine, QrCode, ShieldCheck, FileCheck2];

export default function Home() {
  const { t } = useLanguage();

  return (
    <>
      <section className="bg-navy text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              {t.landing.eyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              {t.landing.title} <span className="text-brand">{t.landing.titleAccent}</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ice/80">{t.landing.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-dark"
              >
                {t.landing.trySamples}
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center rounded-lg border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                {t.landing.howItWorks}
              </a>
            </div>
            <p className="mt-4 text-sm text-ice/60">{t.landing.privacy}</p>
            <p className="mt-2 text-sm text-ice/80">
              {t.landing.uploadPrompt}{' '}
              <Link
                href="/demo/upload"
                className="inline-flex items-center gap-1 font-semibold text-white underline decoration-brand decoration-2 underline-offset-4 hover:text-ice"
              >
                {t.landing.uploadLink}
                <ArrowRight className="size-3.5" />
              </Link>
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div
              className="absolute -inset-6 rounded-3xl bg-brand/20 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative rotate-2 overflow-hidden rounded-xl border border-white/10 bg-white shadow-2xl">
              <Image
                src="/samples/invoice-a-valid.webp"
                alt=""
                width={480}
                height={679}
                priority
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-16 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold tracking-tight">{t.landing.stepsTitle}</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.landing.steps.map((step, index) => {
              const Icon = STEP_ICONS[index];
              return (
                <li key={step.title} className="rounded-xl border border-slate-200 bg-ice/40 p-5">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-white text-brand shadow-sm">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-4 font-semibold">
                    <span className="mr-1.5 text-brand">{index + 1}.</span>
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted">{step.text}</p>
                </li>
              );
            })}
          </ol>
          <Link
            href="/demo"
            className="mt-10 inline-flex items-center gap-2 font-semibold text-brand hover:text-brand-dark"
          >
            {t.landing.trySamples}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
