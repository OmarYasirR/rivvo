import React, { useEffect, useState } from 'react';
import userService from '../../services/userService';
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';
import UserRow from './UserRow';
import { useLanguage } from '../../context/LanguageContext';

// Modal listing a profile's followers or following. type: 'followers' | 'following'
const FollowList = ({ username, type, onClose, onChanged }) => {
  const { t } = useLanguage();
  const [people, setPeople] = useState(null);

  useEffect(() => {
    let active = true;
    setPeople(null);
    userService.connections(username, type).then((d) => active && setPeople(d)).catch(() => active && setPeople([]));
    return () => { active = false; };
  }, [username, type]);

  return (
    <Modal open onClose={onClose} title={t(type)}>
      <div className="follow-list">
        {people === null && <Spinner />}
        {people && people.length === 0 && (
          <p className="empty-text">{type === 'followers' ? t('noFollowers') : t('noFollowing')}</p>
        )}
        {people && people.length > 0 && (
          <ul>
            {people.map((p) => (
              <UserRow key={p._id} person={p} onNavigate={onClose} onFollowChange={onChanged} />
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
};

export default FollowList;
