import React from 'react';
import { formatNumber } from '../../utils/formatNumber';
import { useLanguage } from '../../context/LanguageContext';

const Stat = ({ value, label, onClick }) => {
  const body = (
    <>
      <strong>{value}</strong>
      <span>{label}</span>
    </>
  );
  return onClick ? (
    <button type="button" className="stat clickable" onClick={onClick}>{body}</button>
  ) : (
    <div className="stat">{body}</div>
  );
};

// onSelect('followers' | 'following') opens the list
const ProfileStats = ({ profile, onSelect }) => {
  const { t, lang } = useLanguage();
  const followers = profile.followersCount ?? profile.followers?.length ?? 0;
  const following = profile.followingCount ?? profile.following?.length ?? 0;
  return (
    <div className="profile-stats">
      <Stat value={formatNumber(profile.postCount || 0, lang)} label={t('posts')} />
      <Stat value={formatNumber(followers, lang)} label={t('followers')} onClick={onSelect && (() => onSelect('followers'))} />
      <Stat value={formatNumber(following, lang)} label={t('following')} onClick={onSelect && (() => onSelect('following'))} />
    </div>
  );
};

export default ProfileStats;
