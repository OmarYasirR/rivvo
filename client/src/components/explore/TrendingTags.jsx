import React, { useEffect, useState } from 'react';
import { IoTrendingUpOutline } from 'react-icons/io5';
import postService from '../../services/postService';
import { useLanguage } from '../../context/LanguageContext';

// Most-used hashtags of the last 7 days. onPick(tag) opens that tag.
const TrendingTags = ({ onPick }) => {
  const { t } = useLanguage();
  const [tags, setTags] = useState(null);

  useEffect(() => {
    let active = true;
    postService.trendingTags().then((d) => active && setTags(d)).catch(() => active && setTags([]));
    return () => { active = false; };
  }, []);

  if (!tags || tags.length === 0) return null;

  return (
    <section className="explore-section">
      <h3 className="explore-section-title"><IoTrendingUpOutline size={18} /> {t('trending')}</h3>
      <div className="tag-chips">
        {tags.map(({ tag, count }) => (
          <button key={tag} type="button" className="tag-chip" onClick={() => onPick(tag)}>
            #{tag} <small>{count}</small>
          </button>
        ))}
      </div>
    </section>
  );
};

export default TrendingTags;
