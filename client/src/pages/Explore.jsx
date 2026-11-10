import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IoCloseCircle, IoFlameOutline, IoSearchOutline, IoTimeOutline } from 'react-icons/io5';
import ExploreGrid from '../components/explore/ExploreGrid';
import PeopleResults from '../components/explore/PeopleResults';
import RecentSearches from '../components/explore/RecentSearches';
import TrendingTags from '../components/explore/TrendingTags';
import WhoToFollow from '../components/profile/WhoToFollow';
import useDebounce from '../hooks/useDebounce';
import { useLanguage } from '../context/LanguageContext';
import { parseSearchInput, searchToValue } from '../utils/exploreQuery';
import { addRecent, clearRecent, loadRecent, removeRecent } from '../utils/recentSearches';

// Explore. State lives in the URL so links are shareable:
//   /explore                      browse (trending tags, people to follow, popular posts)
//   /explore?tag=vibes            posts with #vibes          (hashtags in captions link here)
//   /explore?q=sunset&tab=posts   search: People | Posts tabs
const Explore = () => {
  const { t } = useLanguage();
  const [params, setParams] = useSearchParams();
  const tag = params.get('tag') || '';
  const q = params.get('q') || '';
  const sort = params.get('sort') === 'latest' ? 'latest' : 'popular';
  const tab = params.get('tab') === 'posts' ? 'posts' : 'people';
  const urlValue = tag ? `#${tag}` : q;

  const [input, setInput] = useState(urlValue);
  const [recent, setRecent] = useState(() => loadRecent());
  const debounced = useDebounce(input, 350);

  const setUrl = (changes) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
      return next;
    }, { replace: true });

  const applyParsed = (parsed) =>
    setUrl({ tag: parsed.type === 'tag' ? parsed.value : '', q: parsed.type === 'text' ? parsed.value : '' });

  // typing (debounced) -> URL
  useEffect(() => {
    const parsed = parseSearchInput(debounced);
    if (searchToValue(parsed) !== urlValue) applyParsed(parsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // URL changed from outside (a hashtag was clicked, back button) -> text box
  useEffect(() => {
    if (searchToValue(parseSearchInput(input)) !== urlValue) setInput(urlValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlValue]);

  const search = (raw) => {
    const parsed = parseSearchInput(raw);
    setInput(raw);
    applyParsed(parsed);
    if (parsed.type !== 'empty') setRecent(addRecent(searchToValue(parsed)));
  };

  const mode = tag ? 'tag' : q ? 'search' : 'browse';

  const SortToggle = () => (
    <div className="sort-toggle" role="group">
      <button type="button" aria-pressed={sort === 'popular'} onClick={() => setUrl({ sort: '' })}>
        <IoFlameOutline size={16} /> {t('popular')}
      </button>
      <button type="button" aria-pressed={sort === 'latest'} onClick={() => setUrl({ sort: 'latest' })}>
        <IoTimeOutline size={16} /> {t('latest')}
      </button>
    </div>
  );

  return (
    <div className="explore-page">
      <h2>{t('explore')}</h2>

      <form className="search-box" role="search" onSubmit={(e) => { e.preventDefault(); search(input); }}>
        <IoSearchOutline size={20} />
        <input type="search" value={input} placeholder={t('searchExplore')} onChange={(e) => setInput(e.target.value)} />
        {input && (
          <button type="button" className="icon-btn" aria-label={t('clear')} onClick={() => setInput('')}>
            <IoCloseCircle size={18} />
          </button>
        )}
      </form>

      {mode === 'browse' && (
        <>
          {!input && (
            <RecentSearches
              items={recent}
              onPick={search}
              onRemove={(term) => setRecent(removeRecent(term))}
              onClear={() => setRecent(clearRecent())}
            />
          )}
          <TrendingTags onPick={(tg) => search(`#${tg}`)} />
          <WhoToFollow />
          <SortToggle />
          <ExploreGrid query={{ sort }} />
        </>
      )}

      {mode === 'tag' && (
        <>
          <div className="tag-header"><h3>#{tag}</h3></div>
          <SortToggle />
          <ExploreGrid query={{ tag, sort }} />
        </>
      )}

      {mode === 'search' && (
        <>
          <div className="feed-tabs" role="tablist">
            {[['people', t('people')], ['posts', t('posts')]].map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? 'active' : ''}
                onClick={() => setUrl({ tab: key === 'people' ? '' : key })}>
                {label}
              </button>
            ))}
          </div>
          {tab === 'people' ? (
            <PeopleResults q={q} />
          ) : (
            <>
              <SortToggle />
              <ExploreGrid query={{ q, sort }} />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Explore;
