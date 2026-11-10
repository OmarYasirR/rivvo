import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { LANGUAGES } from '../../i18n/translations';

const LanguageSwitcher = () => {
  const { lang, setLang, t } = useLanguage();
  return (
    <select
      className="language-switcher"
      aria-label={t('language')}
      value={lang}
      onChange={(e) => setLang(e.target.value)}
    >
      {Object.entries(LANGUAGES).map(([code, { label }]) => (
        <option key={code} value={code}>{label}</option>
      ))}
    </select>
  );
};

export default LanguageSwitcher;
