import React from 'react';
import { Link } from 'react-router-dom';
import { tokenizeCaption } from '../../utils/caption';

// Caption text where #hashtags open Explore for that tag and @mentions open the profile
const Caption = ({ text }) => (
  <>
    {tokenizeCaption(text).map((tok, i) => {
      if (tok.type === 'tag') {
        return <Link key={i} className="hashtag" to={`/explore?tag=${encodeURIComponent(tok.value)}`}>{tok.raw}</Link>;
      }
      if (tok.type === 'mention') {
        return <Link key={i} className="mention" to={`/profile/${tok.value}`}>{tok.raw}</Link>;
      }
      return <React.Fragment key={i}>{tok.value}</React.Fragment>;
    })}
  </>
);

export default Caption;
