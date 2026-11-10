import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import userService from '../services/userService';
import { getErrorMessage } from '../utils/errorMessage';
import uploadService from '../services/uploadService';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

const Settings = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const [form, setForm] = useState({ fullName: user?.fullName || '', bio: user?.bio || '', avatar: user?.avatar || '' });
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const fileInputRef = useRef(null);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError('');
    setUploadingAvatar(true);
    try {
      const { url } = await uploadService.uploadImage(file, 'rivvo/avatars');
      setForm((f) => ({ ...f, avatar: url }));
    } catch (err) {
      setAvatarError(getErrorMessage(err, t('errUploadFailed')));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await userService.updateProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-page">
      <h2>{t('settings')}</h2>
      <form onSubmit={handleSave}>
        <div className="avatar-upload" onClick={() => fileInputRef.current?.click()}>
          {uploadingAvatar ? <Spinner /> : <Avatar src={form.avatar} size={72} />}
          <span>{t('changePhoto')}</span>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} hidden />
        </div>

        {avatarError && <p className="error">{avatarError}</p>}

        <label>{t('fullName')}</label>
        <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <label>{t('bio')}</label>
        <textarea maxLength={150} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        <Button type="submit" disabled={uploadingAvatar}>{t('saveChanges')}</Button>
        {saved && <span> {t('saved')}</span>}
      </form>

      <div className="settings-row">
        <span>{t('language')}:</span> <LanguageSwitcher />
      </div>

      <div className="settings-row">
        <span>{t('theme')}: {t(theme)}</span>
        <Button variant="secondary" onClick={toggleTheme}>{t('toggleTheme')}</Button>
      </div>

      <Button variant="secondary" onClick={logout}>{t('logout')}</Button>
    </div>
  );
};

export default Settings;
