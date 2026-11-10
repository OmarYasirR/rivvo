import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { readNotification } from '../../store/notificationSlice';
import Avatar from '../common/Avatar';
import { formatDate } from '../../utils/formatDate';
import { useLanguage } from '../../context/LanguageContext';

const NotificationItem = ({ notification }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const text = t(`notif_${notification.type}`);

  const target = (() => {
    switch (notification.type) {
      case 'like':
      case 'comment': {
        const id =
          notification.post && typeof notification.post === 'object'
            ? notification.post._id
            : notification.post;
        return id ? `/post/${id}` : null;
      }
      case 'follow':
        return notification.sender?.username
          ? `/profile/${notification.sender.username}`
          : null;
      case 'message':
        return '/messages';
      default:
        return null;
    }
  })();

  const handleClick = () => {
    if (!notification.read) dispatch(readNotification(notification._id));
    if (target) navigate(target);
  };

  return (
    <li
      className={`notification-item ${notification.read ? '' : 'unread'}`}
      onClick={handleClick}
      role={target ? 'button' : undefined}
      tabIndex={target ? 0 : undefined}
      onKeyDown={
        target
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
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