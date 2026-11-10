import React from 'react';
import { useDispatch } from 'react-redux';
import { readNotification } from '../../store/notificationSlice';
import Avatar from '../common/Avatar';
import { formatDate } from '../../utils/formatDate';
import { useLanguage } from '../../context/LanguageContext';

const NotificationItem = ({ notification }) => {
  const dispatch = useDispatch();
  const { t, lang } = useLanguage();
  const text = t(`notif_${notification.type}`);

  return (
    <li
      className={`notification-item ${notification.read ? '' : 'unread'}`}
      onClick={() => !notification.read && dispatch(readNotification(notification._id))}
    >
      <Avatar src={notification.sender?.avatar} size={40} />
      <p>
        <strong>{notification.sender?.username}</strong> {text}
      </p>
      <span>{formatDate(notification.createdAt, lang)}</span>
    </li>
  );
};

export default NotificationItem;
