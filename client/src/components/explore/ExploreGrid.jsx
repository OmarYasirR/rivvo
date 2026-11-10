import React, { useCallback, useEffect, useRef, useState } from 'react';
import postService from '../../services/postService';
import ExploreTile from './ExploreTile';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import { useLanguage } from '../../context/LanguageContext';

const PAGE_SIZE = 10;

// Infinite-scrolling grid of Explore posts for `query` = { q, tag, sort }. A new query starts over.
const ExploreGrid = ({ query }) => {
  const { t } = useLanguage();
  const [state, setState] = useState({ items: [], page: 0, hasMore: true, loading: true, error: false });
  const request = useRef(0);
  const key = JSON.stringify(query);

  const load = useCallback(async (page, replace) => {
    const id = ++request.current; // ignore answers that arrive after the query changed
    setState((s) => ({ ...s, loading: true, error: false }));
    try {
      const rows = await postService.explore({ ...query, page });
      if (id !== request.current) return;
      setState((s) => ({
        items: replace ? rows : [...s.items, ...rows.filter((r) => !s.items.some((i) => i._id === r._id))],
        page,
        hasMore: rows.length >= PAGE_SIZE,
        loading: false,
        error: false,
      }));
    } catch {
      if (id === request.current) setState((s) => ({ ...s, loading: false, error: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    setState({ items: [], page: 0, hasMore: true, loading: true, error: false });
    load(1, true);
  }, [load]);

  const sentinelRef = useInfiniteScroll(() => {
    if (!state.loading && !state.error) load(state.page + 1, false);
  }, state.hasMore && state.page > 0);

  return (
    <>
      <div className="explore-grid">
        {state.items.map((post) => <ExploreTile key={post._id} post={post} />)}
        {state.loading && [...Array(state.items.length ? 3 : 9)].map((_, i) => <span key={`s${i}`} className="explore-tile skeleton" />)}
      </div>
      {!state.loading && !state.error && state.items.length === 0 && <p className="empty-text">{t('noPostsFound')}</p>}
      {state.error && (
        <p className="empty-text">
          {t('errSomethingWrong')}{' '}
          <button type="button" className="editor-btn" onClick={() => load(state.page + 1 || 1, state.page === 0)}>{t('retry')}</button>
        </p>
      )}
      <div ref={sentinelRef} style={{ height: 1 }} />
    </>
  );
};

export default ExploreGrid;
