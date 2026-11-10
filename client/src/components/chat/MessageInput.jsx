import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { IoClose, IoImageOutline, IoSend } from 'react-icons/io5';
import { sendMessage } from '../../store/chatSlice';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSocketContext } from '../../context/SocketContext';
import uploadService from '../../services/uploadService';
import { getErrorMessage } from '../../utils/errorMessage';
import Spinner from '../common/Spinner';

const MAX_LEN = 2000;

// Composer: Enter sends, Shift+Enter = new line, attach an image, "typing…" signal to the other person.
// Render it with key={conversationId} so its state resets when the conversation changes.
const MessageInput = ({ conversationId, onSent }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { socket } = useSocketContext() || {};
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState(null); // { url }
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const areaRef = useRef(null);
  const lastTyping = useRef(0);
  const idleTimer = useRef(null);

  const signal = (starting) => socket?.emit(starting ? 'typing:start' : 'typing:stop', { conversationId });
  useEffect(() => () => clearTimeout(idleTimer.current), []);

  const grow = () => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  const onChange = (e) => {
    setText(e.target.value);
    grow();
    const now = Date.now();
    if (now - lastTyping.current > 2500) {
      signal(true);
      lastTyping.current = now;
    }
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      signal(false);
      lastTyping.current = 0;
    }, 2000);
  };

  const canSend = !uploading && (text.trim() || attachment);

  const send = () => {
    if (!canSend) return;
    dispatch(sendMessage({
      conversationId,
      text: text.trim(),
      attachment: attachment?.url || '',
      tempId: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      myId: user.id,
    }));
    setText('');
    setAttachment(null);
    setError('');
    clearTimeout(idleTimer.current);
    signal(false);
    lastTyping.current = 0;
    requestAnimationFrame(grow);
    onSent?.();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent?.isComposing) {
      e.preventDefault(); // Enter sends; IME composition (Arabic/CJK keyboards) is left alone
      send();
    }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const { url } = await uploadService.uploadImage(file, 'rivvo/messages');
      setAttachment({ url });
    } catch (err) {
      setError(getErrorMessage(err, t('errUploadFailed')));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="message-composer">
      {(attachment || uploading || error) && (
        <div className="attachment-row">
          {uploading && <Spinner size={18} />}
          {attachment && (
            <span className="attachment-chip">
              <img src={attachment.url} alt="" />
              <button type="button" onClick={() => setAttachment(null)} aria-label={t('removeImage')}><IoClose size={16} /></button>
            </span>
          )}
          {error && <span className="error">{error}</span>}
        </div>
      )}
      <form className="message-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <button type="button" className="attach-btn" onClick={() => fileRef.current?.click()} disabled={uploading} aria-label={t('attachImage')}>
          <IoImageOutline size={22} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
        <textarea
          ref={areaRef}
          rows={1}
          value={text}
          maxLength={MAX_LEN}
          placeholder={t('messagePlaceholder')}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
        <button type="submit" className="send-btn" disabled={!canSend} aria-label={t('send')}>
          <IoSend size={20} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
