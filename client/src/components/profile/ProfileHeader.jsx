import React from 'react';
import { Link } from 'react-router-dom';
import { IoCreateOutline } from 'react-icons/io5';
import Avatar from '../common/Avatar';
import FollowButton from './FollowButton';
import MessageButton from '../chat/MessageButton';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

// onFollowChange(isFollowing, serverResponse): lets the profile page update its counts
const ProfileHeader = ({ profile, onFollowChange }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isOwn = user?.username === profile.username;

  return (
    <div className="profile-header">
      <Avatar src={profile.avatar} size={96} />
      <div>
        <h2>{profile.fullName || profile.username}</h2>
        <p>@{profile.username}</p>
        <p>{profile.bio}</p>
        <div className="profile-actions">
          {isOwn ? (
            <Link to="/settings" className="follow-btn is-following">
              <IoCreateOutline size={18} /> <span>{t('editProfile')}</span>
            </Link>
          ) : (
            <>
              <FollowButton
                targetId={profile._id}
                initiallyFollowing={profile.isFollowing}
                onChange={onFollowChange}
              />
              <MessageButton userId={profile._id} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
