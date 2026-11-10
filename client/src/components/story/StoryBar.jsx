import React, { useEffect, useRef, useState } from 'react';
import storyService from '../../services/storyService';
import { getErrorMessage } from '../../utils/errorMessage';
import uploadService from '../../services/uploadService';
import { useAuth } from '../../context/AuthContext';
import StoryCard from './StoryCard';
import StoryViewer from './StoryViewer';
import Avatar from '../common/Avatar';
import Spinner from '../common/Spinner';
import { useLanguage } from '../../context/LanguageContext';

const StoryBar = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stories, setStories] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const loadStories = () => {
    storyService.getActive().then(setStories).catch(() => setStories([]));
  };

  useEffect(() => {
    loadStories();
  }, []);

  const handleAddStory = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const { url } = await uploadService.uploadImage(file, 'rivvo/stories');
      await storyService.create({ media: url });
      loadStories();
    } catch (err) {
      setError(getErrorMessage(err, t('errUploadFailed')));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="story-bar" title={error || undefined}>
      <button className="story-card add-story" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
        {uploading ? <Spinner size={24} /> : <Avatar src={user?.avatar} size={56} />}
        <span>{uploading ? t('uploading') : t('yourStory')}</span>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAddStory} hidden />
      </button>

      {stories.map((story, i) => (
        <StoryCard key={story._id} story={story} onClick={() => setActiveIndex(i)} />
      ))}

      {error && <p className="error" style={{ alignSelf: 'center', fontSize: '0.8rem' }}>{error}</p>}

      {activeIndex !== null && (
        <StoryViewer
          stories={stories}
          startIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </div>
  );
};

export default StoryBar;
