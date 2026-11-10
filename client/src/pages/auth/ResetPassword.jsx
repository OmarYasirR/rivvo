import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { isStrongPassword } from '../../utils/validators';
import Button from '../../components/common/Button';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isStrongPassword(password)) return setError(t('errPasswordShort'));
    if (password !== confirm) return setError(t('errPasswordMatch'));

    setLoading(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      if (data.token) {
        localStorage.setItem('rivvo_token', data.token);
      }
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err?.response?.data?.message || t('errResetInvalid'));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="auth-page">
        <h1>{t('passwordUpdated')}</h1>
        <p>{t('redirectingLogin')}</p>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <LanguageSwitcher />
      <h1>{t('setNewPassword')}</h1>
      <form onSubmit={handleSubmit}>
        <input type="password" placeholder={t('newPassword')} value={password} onChange={(e) => setPassword(e.target.value)} />
        <input type="password" placeholder={t('confirmPassword')} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {error && <p className="error">{error}</p>}
        <Button type="submit" disabled={loading}>{loading ? t('saving') : t('resetPassword')}</Button>
      </form>
      <p><Link to="/login">{t('backToLogin')}</Link></p>
    </div>
  );
};

export default ResetPassword;
