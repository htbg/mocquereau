// src/renderer/i18n/index.ts
//
// Configuração do i18next para o renderer. Idiomas suportados: pt-BR (canônico),
// EN, IT, ES, DE, PL, JA. Persistência via electron-conf no main (IPC já existe
// em MocquereauAPI: window.mocquereau.getLanguage / setLanguage). Detecção do
// idioma do SO no primeiro launch via languagedetector + fallback pt-BR.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ptBR from './locales/pt-BR.json';
import en from './locales/en.json';
import it from './locales/it.json';
import es from './locales/es.json';
import de from './locales/de.json';
import pl from './locales/pl.json';
import ja from './locales/ja.json';

export const SUPPORTED_LANGS = ['pt-BR', 'en', 'it', 'es', 'de', 'pl', 'ja'] as const;
export type SupportedLang = typeof SUPPORTED_LANGS[number];

export const LANG_META: Record<SupportedLang, { label: string; flag: string }> = {
  'pt-BR': { label: 'Português', flag: '🇧🇷' },
  en:      { label: 'English',   flag: '🇺🇸' },
  it:      { label: 'Italiano',  flag: '🇮🇹' },
  es:      { label: 'Español',   flag: '🇪🇸' },
  de:      { label: 'Deutsch',   flag: '🇩🇪' },
  pl:      { label: 'Polski',    flag: '🇵🇱' },
  ja:      { label: '日本語',     flag: '🇯🇵' },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': { app: ptBR },
      en:      { app: en },
      it:      { app: it },
      es:      { app: es },
      de:      { app: de },
      pl:      { app: pl },
      ja:      { app: ja },
    },
    fallbackLng: 'pt-BR',
    defaultNS: 'app',
    supportedLngs: SUPPORTED_LANGS as unknown as string[],
    nonExplicitSupportedLngs: true,
    keySeparator: false,
    nsSeparator: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ['mocquereauStore', 'navigator'],
      caches: [],
    },
  });

// Hidrata do electron-conf no boot e persiste em mudanças.
async function syncWithElectronConf(): Promise<void> {
  try {
    const stored = await window.mocquereau?.getLanguage?.();
    if (stored && SUPPORTED_LANGS.includes(stored as SupportedLang)) {
      await i18n.changeLanguage(stored);
    }
  } catch { /* main não disponível em testes */ }
  i18n.on('languageChanged', (lng) => {
    window.mocquereau?.setLanguage?.(lng).catch(() => undefined);
  });
}
void syncWithElectronConf();

export default i18n;
