import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { fetchFeed, setFeedType } from '../store/postSlice';
import CreatePost from '../components/post/CreatePost';
import PostList from '../components/post/PostList';
import StoryBar from '../components/story/StoryBar';
import WhoToFollow from '../components/profile/WhoToFollow';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const [tab, setTab] = useState('all'); // 'all' | 'following'

  useEffect(() => {
    dispatch(setFeedType(tab));
    dispatch(fetchFeed(1));
  }, [dispatch, tab]);

  const tabs = [['all', t('forYou')], ['following', t('following')]];

  return (
    <div className="home-page">
      <StoryBar />
      <CreatePost />

      <div className="feed-tabs" role="tablist">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? 'active' : ''}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <PostList
        empty={
          tab === 'following' ? (
            <div className="empty-state">
              <p>{t('noFollowingPosts')}</p>
              <WhoToFollow />
            </div>
          ) : null
        }
      />
    </div>
  );
};

export default Home;
