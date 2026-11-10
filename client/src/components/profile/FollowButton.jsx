import React, { useEffect, useState } from 'react';
import { IoPersonAddOutline, IoCheckmark } from 'react-icons/io5';
import userService from '../../services/userService';
import { useLanguage } from '../../context/LanguageContext';

// Follow / unfollow toggle. Flips instantly and rolls back if the request fails.
// onChange(isFollowing, serverResponse) lets the parent update counts.
const FollowButton = ({ targetId, initiallyFollowing = false, onChange, size }) => {
  const { t } = useLanguage();
  const [following, setFollowing] = useState(initiallyFollowing);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFollowing(initiallyFollowing);
  }, [initiallyFollowing, targetId]);

  const toggle = async () => {
    if (loading) return;
    const next = !following;
    setFollowing(next);
    setLoading(true);
    setFailed(false);
    try {
      const res = next ? await userService.follow(targetId) : await userService.unfollow(targetId);
      onChange?.(res?.following ?? next, res);
    } catch {
      setFollowing(!next);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={`follow-btn ${following ? 'is-following' : ''} ${size === 'sm' ? 'sm' : ''} ${failed ? 'failed' : ''}`}
      aria-pressed={following}
      onClick={toggle}
      disabled={loading}
    >
      {following ? <IoCheckmark size={size === 'sm' ? 15 : 18} /> : <IoPersonAddOutline size={size === 'sm' ? 15 : 18} />}
      <span>{following ? t('following') : t('follow')}</span>
    </button>
  );
};

export default FollowButton;
