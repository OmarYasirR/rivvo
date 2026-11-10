import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { IoCheckmark, IoClose } from 'react-icons/io5';
import { updatePost } from '../../store/postSlice';
import { useLanguage } from '../../context/LanguageContext';
import Spinner from '../common/Spinner';

const MAX = 2200;

// Inline caption editor shown in place of the caption while editing
const PostEditor = ({ post, onCancel, onSaved }) => {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const [caption, setCaption] = useState(post.caption || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const hasImages = (post.images || []).length > 0;
  const unchanged = caption.trim() === (post.caption || '').trim();
  const empty = !caption.trim() && !hasImages;

  const submit = async (e) => {
    e.preventDefault();
    if (saving || unchanged || empty) return;
    setSaving(true);
    setError('');
    try {
      await dispatch(updatePost({ id: post._id, caption: caption.trim() })).unwrap();
      onSaved();
    } catch (err) {
      setError(err?.message || t('errSomethingWrong'));
      setSaving(false);
    }
  };

  return (
    <form className="post-editor" onSubmit={submit} onKeyDown={(e) => e.key === 'Escape' && onCancel()}>
      <textarea
        autoFocus
        value={caption}
        maxLength={MAX}
        placeholder={t('editCaption')}
        onChange={(e) => setCaption(e.target.value)}
        aria-label={t('edit')}
      />
      {error && <p className="error">{error}</p>}
      <div className="post-editor-footer">
        <span className="char-count">{caption.length}/{MAX}</span>
        <div className="editor-actions">
          <button type="button" className="editor-btn" onClick={onCancel} disabled={saving}>
            <IoClose size={18} /> {t('cancel')}
          </button>
          <button type="submit" className="editor-btn primary" disabled={saving || unchanged || empty}>
            {saving ? <Spinner size={16} /> : <IoCheckmark size={18} />} {saving ? t('saving') : t('saveChanges')}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PostEditor;
