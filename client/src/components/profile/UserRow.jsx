import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import FollowButton from './FollowButton';
import { useAuth } from '../../context/AuthContext';

// One person in a list (suggestions, search results, followers/following)
const UserRow = ({ person, onFollowChange, onNavigate }) => {
  const { user } = useAuth();
  const isMe = String(person._id) === String(user?.id);

  return (
    <li className="user-row">
      <Link to={`/profile/${person.username}`} className="user-row-info" onClick={onNavigate}>
        <Avatar src={person.avatar} size={44} />
        <div>
          <strong>{person.fullName || person.username}</strong>
          <span>@{person.username}</span>
        </div>
      </Link>
      {!isMe && (
        <FollowButton
          size="sm"
          targetId={person._id}
          initiallyFollowing={Boolean(person.isFollowing)}
          onChange={onFollowChange}
        />
      )}
    </li>
  );
};

export default UserRow;
