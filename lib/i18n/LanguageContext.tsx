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
import {
  getTargetLanguage,
  isLanguageOnboarded,
  markLanguageOnboarded,
  setTargetLanguage as persistLanguage,
} from './settings';

interface LanguageContextValue {
  targetLang: LanguageCode;
  ready: boolean;            // AsyncStorage-den oxuma bitib
  onboarded: boolean;        // istifadeci onboarding kecib
  setLanguage: (code: LanguageCode) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue>({
  targetLang: DEFAULT_LANGUAGE,
  ready: false,
  onboarded: false,
  setLanguage: async () => {},
  completeOnboarding: async () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [targetLang, setTargetLangState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [lang, done] = await Promise.all([
          getTargetLanguage(),
          isLanguageOnboarded(),
        ]);
        setTargetLangState(lang);
        setOnboarded(done);
      } finally {
        setReady(true);
      }
    };
    init();
  }, []);

  const setLanguage = useCallback(async (code: LanguageCode) => {
    setTargetLangState(code);
    await persistLanguage(code);
  }, []);

  const completeOnboarding = useCallback(async () => {
    setOnboarded(true);
    await markLanguageOnboarded();
  }, []);

  const value = useMemo(
    () => ({ targetLang, ready, onboarded, setLanguage, completeOnboarding }),
    [targetLang, ready, onboarded, setLanguage, completeOnboarding],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
