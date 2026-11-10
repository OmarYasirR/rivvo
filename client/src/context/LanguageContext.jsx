import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, LANGUAGES } from '../i18n/translations';

const LanguageContext = createContext(null);

const getInitialLang = () => {
  const saved = localStorage.getItem('rivvo_lang');
  if (saved && LANGUAGES[saved]) return saved;
  return navigator.language?.startsWith('ar') ? 'ar' : 'en';
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(getInitialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = LANGUAGES[lang].dir;
    localStorage.setItem('rivvo_lang', lang);
    document.title = `Rivvo — ${translations[lang].tagline}`;
  }, [lang]);

  // t('key', { name: 'x' }) -> translated string with {name} interpolation; falls back to English, then the key
  const t = useCallback(
    (key, vars = {}) => {
      let str = translations[lang]?.[key] ?? translations.en[key] ?? key;
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, v);
      });
      return str;
    },
    [lang]
  );

  const toggleLanguage = () => setLang((l) => (l === 'en' ? 'ar' : 'en'));

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t, dir: LANGUAGES[lang].dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;
