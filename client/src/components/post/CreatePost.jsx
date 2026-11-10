import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { IoImageOutline, IoClose } from 'react-icons/io5';
import { createPost } from '../../store/postSlice';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/errorMessage';
import uploadService from '../../services/uploadService';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { useLanguage } from '../../context/LanguageContext';

const CreatePost = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caption.trim() && !imageFile) return;
    setError('');
    setPosting(true);
    try {
      let images = [];
      if (imageFile) {
        setUploading(true);
        const { url } = await uploadService.uploadImage(imageFile, 'rivvo/posts');
        images = [url];
      }
      await dispatch(createPost({ caption, images })).unwrap();
      setCaption('');
      clearImage();
    } catch (err) {
      setError(getErrorMessage(err, t('errUploadFailed')));
    } finally {
      setUploading(false);
      setPosting(false);
    }
  };

  return (
    <form className="create-post" onSubmit={handleSubmit}>
      <div className="create-post-row">
        <Avatar src={user?.avatar} size={40} />
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={t('whatsHappening')}
        />
      </div>

      {preview && (
        <div className="create-post-preview">
          <img src={preview} alt="preview" />
          <button type="button" onClick={clearImage} aria-label="Remove image"><IoClose size={18} /></button>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <div className="create-post-actions">
        <label className="attach-image">
          <IoImageOutline size={24} />
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} hidden />
        </label>
        <Button type="submit" disabled={posting || uploading || (!caption.trim() && !imageFile)}>
          {uploading ? <Spinner size={16} borderTopColor='#eeee' /> : posting ? t('posting') : t('post')}
        </Button>
      </div>
    </form>
  );
};

export default CreatePost;
