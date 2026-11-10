import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import postService from '../../services/postService';
import { addComment } from '../../store/postSlice';
import Avatar from '../common/Avatar';
import { useLanguage } from '../../context/LanguageContext';

const CommentSection = ({ post }) => {
  const dispatch = useDispatch();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const comment = await postService.addComment(post._id, text.trim());
      dispatch(addComment({ postId: post._id, comment }));
      setText('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comment-section">
      <ul>
        {(post.comments || []).map((c) => (
          <li key={c._id || c.text}>
            <Avatar src={c.user?.avatar} size={24} />
            <strong>{c.user?.username}</strong> {c.text}
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('addComment')}
        />
        <button type="submit" disabled={submitting || !text.trim()}>{t('post')}</button>
      </form>
    </div>
  );
};

export default CommentSection;
