import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { formatDate } from '../../utils/formatDate';
import { useLanguage } from '../../context/LanguageContext';

// `menu` is an optional node (the owner's edit/delete menu)
const PostHeader = ({ post, menu }) => {
  const { t, lang } = useLanguage();
  return (
    <div className="post-header">
      <Link to={`/profile/${post.user?.username}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar src={post.user?.avatar} size={36} />
        <span>{post.user?.username}</span>
      </Link>
      <div className="post-header-meta">
        <Link to={`/post/${post._id}`} className="post-time">{formatDate(post.createdAt, lang)}</Link>
        {post.edited && <span className="post-edited">· {t('edited')}</span>}
        {menu}
      </div>
    </div>
  );
};

export default PostHeader;
