import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import userService from '../services/userService';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileStats from '../components/profile/ProfileStats';
import ProfilePosts from '../components/profile/ProfilePosts';
import FollowList from '../components/profile/FollowList';
import Spinner from '../components/common/Spinner';
import { useLanguage } from '../context/LanguageContext';

const Profile = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listType, setListType] = useState(null); // 'followers' | 'following' | null
  const { t } = useLanguage();

  useEffect(() => {
    setLoading(true);
    setListType(null);
    userService.getProfile(username)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [username]);

  // follow/unfollow on the header: update the counts straight from the server's numbers
  const handleFollowChange = useCallback((isFollowing, res) => {
    setProfile((p) => (p ? { ...p, isFollowing, followersCount: res?.followersCount ?? p.followersCount } : p));
  }, []);

  // follow/unfollow inside the list: refresh counts quietly (no spinner)
  const refreshProfile = useCallback(() => {
    userService.getProfile(username).then(setProfile).catch(() => {});
  }, [username]);

  if (loading) return <Spinner centered className="full-page" />;
  if (!profile) return <p>{t('userNotFound')}</p>;

  return (
    <div className="profile-page">
      <ProfileHeader profile={profile} onFollowChange={handleFollowChange} />
      <ProfileStats profile={profile} onSelect={setListType} />
      <ProfilePosts posts={profile.posts} />
      {listType && (
        <FollowList
          username={profile.username}
          type={listType}
          onClose={() => setListType(null)}
          onChanged={refreshProfile}
        />
      )}
    </div>
  );
};

export default Profile;
