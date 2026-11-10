import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IoArrowBack } from 'react-icons/io5';
import { fetchPost } from '../store/postSlice';
import PostCard from '../components/post/PostCard';
import Spinner from '../components/common/Spinner';
import { useLanguage } from '../context/LanguageContext';

// A single post at /post/:id (this is the link that "Share" produces)
const PostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const { items, status } = useSelector((s) => s.post);
  const post = items.find((p) => p._id === id);

  useEffect(() => {
    dispatch(fetchPost(id));
  }, [dispatch, id]);

  if (!post) {
    if (status === 'loading' || status === 'idle') return <Spinner centered className="full-page" />;
    return (
      <div className="empty-state">
        <p>{t('postMissing')}</p>
        <Link to="/">{t('backToRivvo')}</Link>
      </div>
    );
  }

  return (
    <div className="post-page">
      <button type="button" className="back-link" onClick={() => navigate(-1)}>
        <IoArrowBack size={20} /> {t('back')}
      </button>
      <PostCard post={post} defaultShowComments onDeleted={() => navigate('/', { replace: true })} />
    </div>
  );
};

export default PostPage;
