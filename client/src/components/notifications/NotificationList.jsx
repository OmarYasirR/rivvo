import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications } from '../../store/notificationSlice';
import NotificationItem from './NotificationItem';
import Skeleton from '../common/Skeleton';
import { useLanguage } from '../../context/LanguageContext';

const NotificationList = () => {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const { items, status } = useSelector((s) => s.notification);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  if (status === 'loading') {
    return (
      <div>
        {[...Array(5)].map((_, i) => <Skeleton key={i} height={56} />)}
      </div>
    );
  }

  if (items.length === 0) return <p>{t('noNotifications')}</p>;

  return (
    <ul className="notification-list">
      {items.map((n) => (
        <NotificationItem key={n._id} notification={n} />
      ))}
    </ul>
  );
};

export default NotificationList;
