import React from 'react';
import Avatar from '../common/Avatar';

const StoryCard = ({ story, onClick }) => (
  <button className="story-card" onClick={onClick}>
    <div className={`story-ring ${story.viewed ? 'viewed' : ''}`}>
      <Avatar src={story.user?.avatar} size={56} />
    </div>
    <span>{story.user?.username}</span>
  </button>
);

export default StoryCard;
