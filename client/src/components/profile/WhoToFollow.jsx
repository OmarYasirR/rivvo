import React, { useEffect, useState } from 'react';
import { IoPeopleOutline } from 'react-icons/io5';
import userService from '../../services/userService';
import UserRow from './UserRow';
import { useLanguage } from '../../context/LanguageContext';

// "Who to follow" suggestions card (renders nothing when there is nobody to suggest)
const WhoToFollow = ({ limit = 5 }) => {
  const { t } = useLanguage();
  const [people, setPeople] = useState(null);

  useEffect(() => {
    let active = true;
    userService.suggestions().then((d) => active && setPeople(d)).catch(() => active && setPeople([]));
    return () => { active = false; };
  }, []);

  if (!people || people.length === 0) return null;

  return (
    <section className="who-to-follow">
      <h3><IoPeopleOutline size={20} /> {t('whoToFollow')}</h3>
      <ul>
        {people.slice(0, limit).map((p) => (
          <UserRow key={p._id} person={p} />
        ))}
      </ul>
    </section>
  );
};

export default WhoToFollow;
