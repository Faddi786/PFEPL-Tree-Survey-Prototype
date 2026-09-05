import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import kn from "./locales/kn.json";
import ta from "./locales/ta.json";
import ml from "./locales/ml.json";
import te from "./locales/te.json";
import mr from "./locales/mr.json";
import hi from "./locales/hi.json";
import ur from "./locales/ur.json";
import fr from "./locales/fr.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", labelKey: "language.en" },
  { code: "kn", labelKey: "language.kn" },
  { code: "ta", labelKey: "language.ta" },
  { code: "ml", labelKey: "language.ml" },
  { code: "te", labelKey: "language.te" },
  { code: "mr", labelKey: "language.mr" },
  { code: "hi", labelKey: "language.hi" },
  { code: "ur", labelKey: "language.ur" },
  { code: "fr", labelKey: "language.fr" },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]["code"];

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    kn: { translation: kn },
    ta: { translation: ta },
    ml: { translation: ml },
    te: { translation: te },
    mr: { translation: mr },
    hi: { translation: hi },
    ur: { translation: ur },
    fr: { translation: fr },
  },
  lng: "en",
  fallbackLng: "en",
  supportedLngs: SUPPORTED_LANGUAGES.map((lang) => lang.code),
  load: "languageOnly",
  interpolation: { escapeValue: false },
});

/** Menu/dropdown labels always render in English regardless of the active locale. */
export function tMenu(key: string | string[], options?: Record<string, unknown>): string {
  return i18n.t(key, { ...options, lng: "en" });
}

export default i18n;
