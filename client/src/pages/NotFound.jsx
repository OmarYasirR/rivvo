import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const NotFound = () => {
  const { t } = useLanguage();
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>{t('notFoundText')}</p>
      <Link to="/">{t('backToRivvo')}</Link>
    </div>
  );
};

export default NotFound;
