import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IoArrowBack } from 'react-icons/io5';
import { deleteMessage, fetchMessages, markConversationRead, sendMessage } from '../../store/chatSlice';
import Avatar from '../common/Avatar';
import ConfirmModal from '../common/ConfirmModal';
import Spinner from '../common/Spinner';
import Message from './Message';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSocketContext } from '../../context/SocketContext';
import { formatDate } from '../../utils/formatDate';
import { groupByDay } from '../../utils/formatTime';
import { displayName, isSeen, otherOf } from '../../utils/chat';

// The open conversation: header (status), day-grouped bubbles, older-message paging, composer.
const ChatWindow = ({ conversationId, onBack }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const socket = useSocketContext();
  const { conversations, messagesByConversation, hasMoreByConversation, typingUsers, status } = useSelector((s) => s.chat);

  const conv = conversations.find((c) => c._id === conversationId);
  const other = otherOf(conv);
  const messages = messagesByConversation[conversationId]; // undefined = still loading
  const hasMore = Boolean(hasMoreByConversation[conversationId]);
  const typing = Boolean(typingUsers[conversationId]);
  const online = socket?.isOnline ? socket.isOnline(other?._id, other?.isOnline) : Boolean(other?.isOnline);

  const listRef = useRef(null);
  const stick = useRef(true); // keep the view pinned to the newest message unless the reader scrolled up
  const heightBefore = useRef(0); // scroll anchor while older messages are prepended
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    stick.current = true;
    dispatch(fetchMessages({ conversationId }));
    dispatch(markConversationRead(conversationId));
  }, [conversationId, dispatch]);

  // coming back to the tab while a chat is open counts as reading it
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') dispatch(markConversationRead(conversationId));
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [conversationId, dispatch]);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (heightBefore.current) {
      el.scrollTop = el.scrollHeight - heightBefore.current; // older messages were added above: don't jump
      heightBefore.current = 0;
      setLoadingOlder(false);
    } else if (stick.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages?.length, typing]);

  const onScroll = () => {
    const el = listRef.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
  };

  const loadEarlier = () => {
    const el = listRef.current;
    if (!messages?.length || loadingOlder) return;
    heightBefore.current = el ? el.scrollHeight : 0;
    stick.current = false;
    setLoadingOlder(true);
    dispatch(fetchMessages({ conversationId, before: messages[0].createdAt })).finally(() => setLoadingOlder(false));
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteMessage({ messageId: toDelete._id })).unwrap();
    } catch {
      /* the bubble simply stays */
    }
    setDeleting(false);
    setToDelete(null);
  };

  const retry = (m) =>
    dispatch(sendMessage({ conversationId, text: m.text, attachment: m.attachment, tempId: m._id, myId: user.id }));

  if (!conv && status === 'succeeded') {
    return (
      <section className="chat-window empty">
        <p>{t('convNotFound')}</p>
        {onBack && <button type="button" className="editor-btn" onClick={onBack}>{t('back')}</button>}
      </section>
    );
  }

  const subtitle = typing ? t('typing') : online ? t('online') : other?.lastSeen ? `${t('lastSeen')} ${formatDate(other.lastSeen, lang)}` : '';

  return (
    <section className="chat-window">
      <header className="chat-header">
        {onBack && (
          <button type="button" className="icon-btn chat-back" onClick={onBack} aria-label={t('back')}>
            <IoArrowBack size={22} />
          </button>
        )}
        <Link to={`/profile/${other?.username || ''}`} className="chat-header-user">
          <Avatar src={other?.avatar} size={40} online={online} />
          <div>
            <strong>{displayName(other)}</strong>
            <span className={`chat-status ${typing || online ? 'online' : ''}`}>{subtitle}</span>
          </div>
        </Link>
      </header>

      <div className="chat-messages" ref={listRef} onScroll={onScroll}>
        {hasMore && (
          <button type="button" className="load-earlier" onClick={loadEarlier} disabled={loadingOlder}>
            {loadingOlder ? <Spinner size={16} /> : t('loadEarlier')}
          </button>
        )}
        {messages === undefined && <Spinner centered />}
        {messages && messages.length === 0 && <p className="empty-text">{t('sayHi')}</p>}

        {groupByDay(messages || [], lang).map((group) => (
          <React.Fragment key={group.key}>
            <div className="day-separator">
              <span>{group.label.kind === 'date' ? group.label.text : t(group.label.kind)}</span>
            </div>
            {group.items.map((m) => {
              const mine = String(m.sender) === String(user?.id);
              return (
                <Message key={m._id} message={m} mine={mine} seen={mine && isSeen(m, other?._id)} onDelete={setToDelete} onRetry={retry} />
              );
            })}
          </React.Fragment>
        ))}
        {typing && <TypingIndicator />}
      </div>

      <MessageInput key={conversationId} conversationId={conversationId} onSent={() => { stick.current = true; }} />

      <ConfirmModal
        open={Boolean(toDelete)}
        title={t('deleteMessageTitle')}
        message={t('deleteMessageText')}
        confirmLabel={deleting ? t('deleting') : t('delete')}
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </section>
  );
};

export default ChatWindow;
