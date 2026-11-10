import React, { useEffect, useState } from 'react';
import userService from '../../services/userService';
import UserRow from '../profile/UserRow';
import Spinner from '../common/Spinner';
import { useLanguage } from '../../context/LanguageContext';

// People matching the search text (username or full name), each with a Follow button
const PeopleResults = ({ q }) => {
  const { t } = useLanguage();
  const [people, setPeople] = useState(null);

  useEffect(() => {
    let active = true;
    setPeople(null);
    userService.search(q).then((d) => active && setPeople(d)).catch(() => active && setPeople([]));
    return () => { active = false; };
  }, [q]);

  if (people === null) return <Spinner centered />;
  if (people.length === 0) return <p className="empty-text">{t('noResults')}</p>;
  return (
    <ul className="people-results">
      {people.map((p) => <UserRow key={p._id} person={p} />)}
    </ul>
  );
};

export default PeopleResults;
