import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoBookmarkOutline, IoNotificationsOutline } from 'react-icons/io5';
import { useSelector } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const unread = useSelector((s) => s.notification.unreadCount);

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">Rivvo</Link>
      <div className="navbar-actions">
        <LanguageSwitcher />

        <Link to="/saved" className="nav-icon-btn" aria-label={t('savedPosts')} title={t('savedPosts')}>
          <IoBookmarkOutline size={22} />
        </Link>

        <Link
          to="/notifications"
          className="nav-icon-btn"
          aria-label={unread > 0 ? `${t('notifications')} (${unread})` : t('notifications')}
          title={t('notifications')}
        >
          <IoNotificationsOutline size={22} />
          {unread > 0 && (
            <span className="badge">{unread > 99 ? '99+' : unread}</span>
          )}
        </Link>

        <Link
          to={`/profile/${user?.username || ''}`}
          className="nav-icon-btn"
          aria-label={user?.username || t('username')}
        >
          <Avatar src={user?.avatar} size={30} />
        </Link>

        <button onClick={async () => { await logout(); navigate('/login'); }}>
          {t('logout')}
        </button>
      </div>
    </header>
  );
};

export default Navbar;