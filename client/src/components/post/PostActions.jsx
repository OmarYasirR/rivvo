import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  IoHeart, IoHeartOutline, IoChatbubbleOutline, IoShareSocialOutline, IoCheckmark, IoBookmark, IoBookmarkOutline,
} from 'react-icons/io5';
import { toggleLike, toggleSave } from '../../store/postSlice';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatNumber } from '../../utils/formatNumber';
import { sharePost, postUrl } from '../../utils/share';

const PostActions = ({ post, onCommentClick }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [shareState, setShareState] = useState(null); // 'copied' | 'failed' | null
  const timer = useRef(null);
  const liked = post.likes?.includes(user?.id);
  const saved = Boolean(post.isSaved);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleShare = async () => {
    const result = await sharePost({
      url: postUrl(post._id),
      title: 'Rivvo',
      text: (post.caption || '').slice(0, 120),
    });
    if (result === 'copied' || result === 'failed') {
      setShareState(result);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setShareState(null), 2200);
    }
  };

  return (
    <div className="post-actions">
      <button
        className={liked ? 'liked' : ''}
        aria-pressed={liked}
        onClick={() => dispatch(toggleLike({ id: post._id, liked }))}
      >
        {liked ? <IoHeart size={21} /> : <IoHeartOutline size={21} />}
        <span>{formatNumber(post.likes?.length || 0, lang)}</span>
      </button>

      <button onClick={onCommentClick}>
        <IoChatbubbleOutline size={20} />
        <span>{formatNumber(post.comments?.length || 0, lang)}</span>
      </button>

      <button className={shareState === 'copied' ? 'share-done' : ''} onClick={handleShare} aria-live="polite">
        {shareState === 'copied' ? <IoCheckmark size={20} /> : <IoShareSocialOutline size={20} />}
        <span>
          {shareState === 'copied' ? t('linkCopied') : shareState === 'failed' ? t('shareFailed') : t('share')}
        </span>
      </button>

      <button
        className={`save-btn ${saved ? 'is-saved' : ''}`}
        aria-pressed={saved}
        onClick={() => dispatch(toggleSave({ id: post._id, saved }))}
      >
        {saved ? <IoBookmark size={20} /> : <IoBookmarkOutline size={20} />}
        <span>{saved ? t('unsave') : t('save')}</span>
      </button>
    </div>
  );
};

export default PostActions;
