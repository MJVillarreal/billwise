'use client';

import { Building2 } from 'lucide-react';
import { useLanguage } from '@/i18n/language-provider';

export const DEMO_COMPANY = 'Restaurante La Higuera SRL';

export function DemoCompany() {
  const { t } = useLanguage();
  return (
    <p className="inline-flex items-center gap-1.5 rounded-full bg-ice px-3 py-1 text-xs text-slate-600">
      <Building2 className="size-3.5 text-brand" />
      <span>{t.demoCompany.label}:</span>
      <span className="font-semibold text-navy">{DEMO_COMPANY}</span>
      <span>({t.demoCompany.fictitious})</span>
    </p>
  );
}
