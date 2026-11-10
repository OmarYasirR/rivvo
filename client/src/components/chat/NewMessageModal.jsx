import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { openConversation } from '../../store/chatSlice';
import userService from '../../services/userService';
import Avatar from '../common/Avatar';
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';
import useDebounce from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

// "New message": people you follow by default, search for anyone else. onOpened(conversationId) when picked.
const NewMessageModal = ({ onClose, onOpened }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [q, setQ] = useState('');
  const [people, setPeople] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const debounced = useDebounce(q, 300);

  useEffect(() => {
    let active = true;
    const s = debounced.trim();
    setPeople(null);
    const request = s ? userService.search(s) : userService.connections(user.username, 'following');
    request
      .then((d) => active && setPeople(d.filter((p) => String(p._id) !== String(user.id))))
      .catch(() => active && setPeople([]));
    return () => { active = false; };
  }, [debounced, user.id, user.username]);

  const pick = async (person) => {
    setError('');
    setBusyId(person._id);
    try {
      const conv = await dispatch(openConversation(person._id)).unwrap();
      onOpened(conv._id);
    } catch (err) {
      setError(err?.message || t('errSomethingWrong'));
      setBusyId(null);
    }
  };

  return (
    <Modal open onClose={onClose} title={t('newMessage')}>
      <div className="new-message">
        <input type="search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('searchPeople')} />
        {error && <p className="error">{error}</p>}
        {people === null && <Spinner />}
        {people && people.length === 0 && <p className="empty-text">{q.trim() ? t('noResults') : t('searchToMessage')}</p>}
        {people && people.length > 0 && (
          <ul className="new-message-list">
            {people.map((p) => (
              <li key={p._id}>
                <button type="button" className="chat-item" disabled={busyId === p._id} onClick={() => pick(p)}>
                  <Avatar src={p.avatar} size={40} />
                  <div className="chat-item-body">
                    <strong>{p.fullName || p.username}</strong>
                    <p>@{p.username}</p>
                  </div>
                  {busyId === p._id && <Spinner size={16} />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
};

export default NewMessageModal;
