import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail, isValidUsername, isStrongPassword } from '../../utils/validators';
import Button from '../../components/common/Button';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

const Register = () => {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isValidUsername(form.username)) return setError(t('errUsername'));
    if (!isValidEmail(form.email)) return setError(t('errInvalidEmail'));
    if (!isStrongPassword(form.password)) return setError(t('errPasswordShort'));

    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || t('errRegisterFailed'));
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
        <input name="username" placeholder={t('username')} value={form.username} onChange={handleChange} />
        <input name="email" type="email" placeholder={t('email')} value={form.email} onChange={handleChange} />
        <input name="password" type="password" placeholder={t('password')} value={form.password} onChange={handleChange} />
        {error && <p className="error">{error}</p>}
        <Button type="submit" disabled={loading}>{loading ? t('registering') : t('register')}</Button>
      </form>
      <p>{t('haveAccount')} <Link to="/login">{t('loginLink')}</Link></p>
    </div>
  );
};

export default Register;
