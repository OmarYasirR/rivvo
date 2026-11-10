import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail } from '../../utils/validators';
import Button from '../../components/common/Button';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(email)) return setError(t('errInvalidEmail'));

    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.message || t('errSomethingWrong'));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-page">
        <LanguageSwitcher />
        <h1>{t('checkEmail')}</h1>
        <p>{t('resetSentTo', { email })}</p>
        <Link to="/login">{t('backToLogin')}</Link>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <LanguageSwitcher />
      <h1>{t('resetYourPassword')}</h1>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder={t('email')} value={email} onChange={(e) => setEmail(e.target.value)} />
        {error && <p className="error">{error}</p>}
        <Button type="submit" disabled={loading}>{loading ? t('sending') : t('sendResetLink')}</Button>
      </form>
      <p><Link to="/login">{t('backToLogin')}</Link></p>
    </div>
  );
};

export default ForgotPassword;
