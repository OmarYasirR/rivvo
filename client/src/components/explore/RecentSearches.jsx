import React from 'react';
import { IoClose, IoTimeOutline } from 'react-icons/io5';
import { useLanguage } from '../../context/LanguageContext';

// Chips for the last searches: click to search again, x to forget one, "Clear all" to forget everything
const RecentSearches = ({ items, onPick, onRemove, onClear }) => {
  const { t } = useLanguage();
  if (!items || items.length === 0) return null;
  return (
    <section className="explore-section">
      <div className="explore-section-row">
        <h3 className="explore-section-title"><IoTimeOutline size={18} /> {t('recentSearches')}</h3>
        <button type="button" className="link-btn" onClick={onClear}>{t('clearAll')}</button>
      </div>
      <div className="tag-chips">
        {items.map((term) => (
          <span key={term} className="tag-chip recent">
            <button type="button" onClick={() => onPick(term)}>{term}</button>
            <button type="button" className="chip-x" onClick={() => onRemove(term)} aria-label={`${t('delete')} ${term}`}><IoClose size={14} /></button>
          </span>
        ))}
      </div>
    </section>
  );
};

export default RecentSearches;
