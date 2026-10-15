'use client';

import { createContext, type ReactNode, useContext, useEffect, useSyncExternalStore } from 'react';
import { type Language, type Messages, messages } from './messages';

const STORAGE_KEY = 'billwise.language';
const CHANGE_EVENT = 'billwise:language';

function readLanguage(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'es';
  } catch {
    return 'es';
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function setLanguage(language: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {}
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

interface LanguageContextValue {
  language: Language;
  t: Messages;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(subscribe, readLanguage, () => 'es' as const);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext value={{ language, t: messages[language], setLanguage }}>
      {children}
    </LanguageContext>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
