import React from 'react';
import { Link } from 'react-router-dom';
import { IoChatbubble, IoCopyOutline, IoHeart } from 'react-icons/io5';
import { useLanguage } from '../../context/LanguageContext';
import { formatNumber } from '../../utils/formatNumber';

// One square in the Explore grid: first image (or the caption for text posts), hover shows likes/comments
const ExploreTile = ({ post }) => {
  const { lang } = useLanguage();
  return (
    <Link to={`/post/${post._id}`} className="explore-tile">
      {post.images?.[0] ? <img src={post.images[0]} alt="" loading="lazy" /> : <span className="tile-text">{post.caption}</span>}
      {post.images?.length > 1 && <IoCopyOutline className="tile-multi" size={18} />}
      <span className="tile-overlay">
        <span><IoHeart size={16} /> {formatNumber(post.likesCount || 0, lang)}</span>
        <span><IoChatbubble size={16} /> {formatNumber(post.commentsCount || 0, lang)}</span>
      </span>
    </Link>
  );
};

export default ExploreTile;
