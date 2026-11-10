import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { IoCreateOutline, IoSearchOutline } from 'react-icons/io5';
import Avatar from '../common/Avatar';
import Skeleton from '../common/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSocketContext } from '../../context/SocketContext';
import { formatDate } from '../../utils/formatDate';
import { displayName, otherOf, previewOf } from '../../utils/chat';

// Left pane: my conversations (online dot, last message, time, unread badge). onSelect(id) opens one.
const ChatList = ({ onSelect, onNew }) => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const socket = useSocketContext();
  const { conversations, activeConversationId, status } = useSelector((s) => s.chat);
  const [filter, setFilter] = useState('');

  const q = filter.trim().toLowerCase();
  const shown = conversations.filter((c) => {
    const p = otherOf(c);
    return !q || (p?.username || '').toLowerCase().includes(q) || (p?.fullName || '').toLowerCase().includes(q);
  });
  const online = (p) => (socket?.isOnline ? socket.isOnline(p?._id, p?.isOnline) : Boolean(p?.isOnline));

  return (
    <aside className="chat-list-pane">
      <div className="chat-list-header">
        <h2>{t('messages')}</h2>
        <button type="button" className="icon-btn" onClick={onNew} aria-label={t('newMessage')}>
          <IoCreateOutline size={22} />
        </button>
      </div>

      <label className="chat-search">
        <IoSearchOutline size={18} />
        <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t('searchPlaceholder')} />
      </label>

      {status === 'loading' && conversations.length === 0 && (
        <div className="chat-skeletons">{[...Array(4)].map((_, i) => <Skeleton key={i} height={56} />)}</div>
      )}
      {status !== 'loading' && shown.length === 0 && (
        <p className="empty-text">{filter ? t('noResults') : t('noConversations')}</p>
      )}

      <ul className="chat-list">
        {shown.map((c) => {
          const p = otherOf(c);
          const unread = c.unreadCount > 0;
          return (
            <li key={c._id} className={c._id === activeConversationId ? 'active' : ''}>
              <button type="button" className={`chat-item ${unread ? 'unread' : ''}`} onClick={() => onSelect(c._id)}>
                <Avatar src={p?.avatar} size={46} online={online(p)} />
                <div className="chat-item-body">
                  <strong>{displayName(p)}</strong>
                  <p>{previewOf(c, t, user?.id)}</p>
                </div>
                <div className="chat-item-meta">
                  {c.lastMessage?.createdAt && <span className="chat-time">{formatDate(c.lastMessage.createdAt, lang)}</span>}
                  {unread && <span className="unread-badge">{c.unreadCount > 99 ? '99+' : c.unreadCount}</span>}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default ChatList;
