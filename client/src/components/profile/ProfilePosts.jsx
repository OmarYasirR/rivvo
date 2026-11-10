import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

// Grid of a user's posts; each tile opens the post. Text-only posts show their caption.
const ProfilePosts = ({ posts = [] }) => {
  const { t } = useLanguage();
  if (posts.length === 0) return <p className="empty-text">{t('noPostsYet')}</p>;
  return (
    <div className="profile-posts-grid">
      {posts.map((post) => (
        <Link key={post._id} to={`/post/${post._id}`} className="profile-post-thumb">
          {post.images?.[0] ? <img src={post.images[0]} alt="" /> : <span className="thumb-text">{post.caption}</span>}
        </Link>
      ))}
    </div>
  );
};

export default ProfilePosts;
