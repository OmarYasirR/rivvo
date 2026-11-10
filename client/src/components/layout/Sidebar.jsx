import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  IoHome, IoHomeOutline, IoSearch, IoSearchOutline, IoMail, IoMailOutline, IoNotifications, IoNotificationsOutline,
  IoBookmark, IoBookmarkOutline, IoSettings, IoSettingsOutline,
} from 'react-icons/io5';
import { useSelector } from 'react-redux';
import { useLanguage } from '../../context/LanguageContext';
import { selectTotalUnread } from '../../store/chatSlice';

// [path, translation key, icon when active, icon when inactive]
const links = [
  ['/', 'home', IoHome, IoHomeOutline],
  ['/explore', 'explore', IoSearch, IoSearchOutline],
  ['/messages', 'messages', IoMail, IoMailOutline],
  ['/notifications', 'notifications', IoNotifications, IoNotificationsOutline],
  ['/saved', 'savedPosts', IoBookmark, IoBookmarkOutline],
  ['/settings', 'settings', IoSettings, IoSettingsOutline],
];

const Sidebar = () => {
  const { t } = useLanguage();
  const unread = useSelector(selectTotalUnread);
  return (
    <nav className="sidebar">
      {links.map(([to, key, Active, Idle]) => (
        <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
          {({ isActive }) => (
            <>
              {isActive ? <Active size={22} /> : <Idle size={22} />}
              <span>{t(key)}</span>
              {key === 'messages' && unread > 0 && <span className="nav-badge">{unread > 99 ? '99+' : unread}</span>}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default Sidebar;
