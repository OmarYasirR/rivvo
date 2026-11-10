import React, { useEffect, useState } from 'react';
import storyService from '../../services/storyService';

const StoryViewer = ({ stories, startIndex, onClose }) => {
  const [index, setIndex] = useState(startIndex);
  const story = stories[index];

  useEffect(() => {
    if (story) storyService.markViewed(story._id).catch(() => {});
  }, [story]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (index < stories.length - 1) setIndex(index + 1);
      else onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [index, stories.length, onClose]);

  if (!story) return null;

  return (
    <div className="story-viewer" onClick={onClose}>
      <div className="story-progress">
        {stories.map((_, i) => (
          <span key={i} className={i <= index ? 'filled' : ''} />
        ))}
      </div>
      <img src={story.media} alt="" />
      <p>{story.user?.username}</p>
    </div>
  );
};

export default StoryViewer;
