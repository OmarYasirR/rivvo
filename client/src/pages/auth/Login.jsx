import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail } from '../../utils/validators';
import Button from '../../components/common/Button';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

const Login = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(form.email)) return setError(t('errInvalidEmail'));
    if (!form.password) return setError(t('errPasswordRequired'));

    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || t('errLoginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <LanguageSwitcher />
      <h1>Rivvo</h1>
      <p className="tagline">{t('tagline')}</p>
      <form onSubmit={handleSubmit}>
        <input name="email" type="email" placeholder={t('email')} value={form.email} onChange={handleChange} />
        <input name="password" type="password" placeholder={t('password')} value={form.password} onChange={handleChange} />
        {error && <p className="error">{error}</p>}
        <Button type="submit" disabled={loading}>{loading ? t('loggingIn') : t('login')}</Button>
      </form>
      <p><Link to="/forgot-password">{t('forgotPasswordLink')}</Link></p>
      <p>{t('newHere')} <Link to="/register">{t('createAccountLink')}</Link></p>
    </div>
  );
};

export default Login;
