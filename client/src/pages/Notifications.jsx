import React from 'react';
import NotificationList from '../components/notifications/NotificationList';
import { useLanguage } from '../context/LanguageContext';

const Notifications = () => {
  const { t } = useLanguage();
  return (
    <div className="notifications-page">
      <h2>{t('notifications')}</h2>
      <NotificationList />
    </div>
  );
};

export default Notifications;
