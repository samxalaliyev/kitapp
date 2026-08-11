import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { DEFAULT_LANGUAGE, type LanguageCode } from './constants';
import { getUITranslation, type TranslationKey } from './translations';
import {
  getTargetLanguage,
  getUILanguage,
  isLanguageOnboarded,
  markLanguageOnboarded,
  setTargetLanguage as persistTargetLanguage,
  setUILanguage as persistUILanguage,
} from './settings';

interface LanguageContextValue {
  targetLang: LanguageCode;
  uiLang: LanguageCode;
  ready: boolean;
  onboarded: boolean;
  t: (key: TranslationKey) => string;
  setTargetLang: (code: LanguageCode) => Promise<void>;
  setUILang: (code: LanguageCode) => Promise<void>;
  setLanguage: (code: LanguageCode) => Promise<void>; // Sets BOTH target and UI language
  completeOnboarding: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue>({
  targetLang: DEFAULT_LANGUAGE,
  uiLang: DEFAULT_LANGUAGE,
  ready: false,
  onboarded: false,
  t: (key) => getUITranslation(DEFAULT_LANGUAGE, key),
  setTargetLang: async () => {},
  setUILang: async () => {},
  setLanguage: async () => {},
  completeOnboarding: async () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [targetLang, setTargetLangState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [uiLang, setUILangState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [target, ui, done] = await Promise.all([
          getTargetLanguage(),
          getUILanguage(),
          isLanguageOnboarded(),
        ]);
        setTargetLangState(target);
        setUILangState(ui);
        setOnboarded(done);
      } finally {
        setReady(true);
      }
    };
    init();
  }, []);

  const t = useCallback(
    (key: TranslationKey) => getUITranslation(uiLang, key),
    [uiLang],
  );

  const setTargetLang = useCallback(async (code: LanguageCode) => {
    setTargetLangState(code);
    await persistTargetLanguage(code);
  }, []);

  const setUILang = useCallback(async (code: LanguageCode) => {
    setUILangState(code);
    await persistUILanguage(code);
  }, []);

  const setLanguage = useCallback(async (code: LanguageCode) => {
    setTargetLangState(code);
    setUILangState(code);
    await Promise.all([
      persistTargetLanguage(code),
      persistUILanguage(code),
    ]);
  }, []);

  const completeOnboarding = useCallback(async () => {
    setOnboarded(true);
    await markLanguageOnboarded();
  }, []);

  const value = useMemo(
    () => ({
      targetLang,
      uiLang,
      ready,
      onboarded,
      t,
      setTargetLang,
      setUILang,
      setLanguage,
      completeOnboarding,
    }),
    [targetLang, uiLang, ready, onboarded, t, setTargetLang, setUILang, setLanguage, completeOnboarding],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
