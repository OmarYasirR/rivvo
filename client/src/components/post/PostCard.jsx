import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';   // <-- add
import { useDispatch } from 'react-redux';
import PostHeader from './PostHeader';
import PostActions from './PostActions';
import CommentSection from './CommentSection';
import PostMenu from './PostMenu';
import PostEditor from './PostEditor';
import Caption from './Caption';
import ConfirmModal from '../common/ConfirmModal';
import { deletePost } from '../../store/postSlice';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const PostCard = ({ post, onDeleted, defaultShowComments = false }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [showComments, setShowComments] = useState(defaultShowComments);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const isOwner = Boolean(user) && String(post.user?._id || post.user) === String(user.id);
  const onPostPage = location.pathname === `/post/${post._id}`;   // don't self-link

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await dispatch(deletePost(post._id)).unwrap();
      onDeleted?.();
    } catch (err) {
      setDeleteError(err?.message || t('errSomethingWrong'));
      setDeleting(false);
    }
  };

  return (
    <article className="post-card">
      <PostHeader
        post={post}
        menu={isOwner ? <PostMenu onEdit={() => setEditing(true)} onDelete={() => setConfirming(true)} /> : null}
      />

      {editing ? (
        <PostEditor post={post} onCancel={() => setEditing(false)} onSaved={() => setEditing(false)} />
      ) : (
        post.caption && <p className="post-caption"><Caption text={post.caption} /></p>
      )}

      {post.images?.length > 0 && (
        <div className="post-images">
          {post.images.map((src) =>
            onPostPage ? (
              <img key={src} src={src} alt="" />
            ) : (
              <Link key={src} to={`/post/${post._id}`} className="post-image-link" aria-label={t('openPost')}>
                <img src={src} alt="" />
              </Link>
            )
          )}
        </div>
      )}

      <PostActions post={post} onCommentClick={() => setShowComments((s) => !s)} />
      {showComments && <CommentSection post={post} />}

      <ConfirmModal
        open={confirming}
        title={t('deletePostTitle')}
        message={t('deletePostText')}
        confirmLabel={deleting ? t('deleting') : t('delete')}
        busy={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onClose={() => { setConfirming(false); setDeleteError(''); }}
      />
    </article>
  );
};

export default PostCard;