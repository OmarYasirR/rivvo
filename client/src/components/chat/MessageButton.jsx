import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { openConversation } from '../../store/chatSlice';
import { useLanguage } from '../../context/LanguageContext';

// "Message" button for a profile: opens (or creates) the conversation and goes to it
const MessageButton = ({ userId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    try {
      const conv = await dispatch(openConversation(userId)).unwrap();
      navigate(`/messages?c=${conv._id}`);
    } catch {
      setBusy(false);
    }
  };

  return (
    <button type="button" className="follow-btn is-following" onClick={go} disabled={busy}>
      <IoChatbubbleEllipsesOutline size={18} /> <span>{t('message')}</span>
    </button>
  );
};

export default MessageButton;
