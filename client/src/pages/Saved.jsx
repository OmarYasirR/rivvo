import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { IoBookmark, IoBookmarkOutline } from 'react-icons/io5';
import { fetchFeed, setFeedType } from '../store/postSlice';
import PostList from '../components/post/PostList';
import { useLanguage } from '../context/LanguageContext';

const Saved = () => {
  const dispatch = useDispatch();
  const { t } = useLanguage();

  useEffect(() => {
    dispatch(setFeedType('saved'));
    dispatch(fetchFeed(1));
  }, [dispatch]);

  return (
    <div className="saved-page">
      <h2><IoBookmark size={22} /> {t('savedPosts')}</h2>
      <PostList
        empty={
          <div className="empty-state">
            <IoBookmarkOutline size={40} />
            <p>{t('noSavedPosts')}</p>
          </div>
        }
      />
    </div>
  );
};

export default Saved;
