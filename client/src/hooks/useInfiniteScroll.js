import { useEffect, useRef, useCallback } from 'react';

// Trigger onLoadMore() when the sentinel element scrolls into view
export default function useInfiniteScroll(onLoadMore, hasMore) {
  const observerRef = useRef(null);

  const sentinelRef = useCallback((node) => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) onLoadMore();
    });
    if (node) observerRef.current.observe(node);
  }, [onLoadMore, hasMore]);

  return sentinelRef;
}
