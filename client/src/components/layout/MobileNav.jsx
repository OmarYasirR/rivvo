import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  IoHome, IoHomeOutline,
  IoSearch, IoSearchOutline,
  IoMail, IoMailOutline,
  IoNotifications, IoNotificationsOutline,
  IoPerson, IoPersonOutline,
  IoSettings, IoSettingsOutline,
} from 'react-icons/io5';
import { useSelector } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import { selectTotalUnread } from '../../store/chatSlice';

const MobileNav = () => {
  const { user } = useAuth();
  const unread = useSelector(selectTotalUnread);

  // [path, icon when active, icon when inactive]
  const links = [
    ['/', IoHome, IoHomeOutline],
    ['/explore', IoSearch, IoSearchOutline],
    ['/messages', IoMail, IoMailOutline],
    ['/notifications', IoNotifications, IoNotificationsOutline],
    [`/profile/${user?.username}`, IoPerson, IoPersonOutline],
    ['/settings', IoSettings, IoSettingsOutline],
  ];

  return (
    <nav className="mobile-nav">
      {links.map(([to, Active, Idle]) => (
        <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
          {({ isActive }) => (
            <span className="icon-wrap">
              {isActive ? <Active size={22} /> : <Idle size={22} />}
              {to === '/messages' && unread > 0 && (
                <span className="nav-badge">{unread > 99 ? '99+' : unread}</span>
              )}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileNav;