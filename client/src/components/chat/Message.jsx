import React from 'react';
import { IoAlertCircleOutline, IoBanOutline, IoCheckmark, IoCheckmarkDone, IoRefreshOutline, IoTimeOutline, IoTrashOutline } from 'react-icons/io5';
import { useLanguage } from '../../context/LanguageContext';
import { formatTime } from '../../utils/formatTime';

// One chat bubble. mine: sent by me; seen: the other person has read it.
const Message = ({ message, mine = false, seen = false, onDelete, onRetry }) => {
  const { t, lang } = useLanguage();
  const status = message.failed ? 'failed' : message.pending ? 'pending' : seen ? 'seen' : 'sent';
  const StatusIcon = { failed: IoAlertCircleOutline, pending: IoTimeOutline, seen: IoCheckmarkDone, sent: IoCheckmark }[status];

  return (
    <div className={`message ${mine ? 'mine' : 'theirs'} ${message.deleted ? 'is-deleted' : ''} ${message.failed ? 'is-failed' : ''}`}>
      {message.deleted ? (
        <em className="message-deleted"><IoBanOutline size={15} /> {t('messageDeleted')}</em>
      ) : (
        <>
          {message.attachment && (
            <a className="message-image" href={message.attachment} target="_blank" rel="noopener noreferrer">
              <img src={message.attachment} alt={t('photo')} loading="lazy" />
            </a>
          )}
          {message.text && <span className="message-text">{message.text}</span>}
        </>
      )}

      <span className="message-meta">
        <time dateTime={message.createdAt}>{formatTime(message.createdAt, lang)}</time>
        {mine && !message.deleted && (
          <span className={`message-status ${status}`} aria-label={status}><StatusIcon size={15} /></span>
        )}
      </span>

      {mine && !message.deleted && !message.pending && !message.failed && onDelete && (
        <button type="button" className="message-delete" aria-label={t('delete')} onClick={() => onDelete(message)}>
          <IoTrashOutline size={15} />
        </button>
      )}
      {message.failed && onRetry && (
        <button type="button" className="message-retry" onClick={() => onRetry(message)}>
          <IoRefreshOutline size={14} /> {t('retry')}
        </button>
      )}
    </div>
  );
};

export default Message;
