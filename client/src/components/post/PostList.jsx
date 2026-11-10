import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeed } from '../../store/postSlice';
import PostCard from './PostCard';
import Skeleton from '../common/Skeleton';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';

// Renders the posts in the redux store with infinite scroll. `empty` is shown when a finished load returned nothing.
const PostList = ({ empty = null }) => {
  const dispatch = useDispatch();
  const { items, status, page, hasMore } = useSelector((s) => s.post);

  const loadMore = useCallback(() => {
    if (status === 'succeeded') dispatch(fetchFeed(page + 1)); // never while loading or before the first page
  }, [dispatch, page, status]);

  const sentinelRef = useInfiniteScroll(loadMore, hasMore);

  return (
    <>
      {items.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
      {status === 'loading' && [...Array(3)].map((_, i) => <Skeleton key={i} height={200} />)}
      {status === 'succeeded' && items.length === 0 && empty}
      <div ref={sentinelRef} style={{ height: 1 }} />
    </>
  );
};

export default PostList;
