import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { IoChatbubblesOutline } from 'react-icons/io5';
import { setActiveConversation } from '../store/chatSlice';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import NewMessageModal from '../components/chat/NewMessageModal';
import { useLanguage } from '../context/LanguageContext';


const Messages = () => {
  const [params, setParams] = useSearchParams();
  const active = params.get('c');
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const [newOpen, setNewOpen] = useState(false);

  useEffect(() => {
    dispatch(setActiveConversation(active));
    return () => { dispatch(setActiveConversation(null)); };
  }, [active, dispatch]);

  const open = (id) => setParams({ c: id });

  return (
    <div className={`messages-page ${active ? 'has-active' : ''}`}>
      <ChatList onSelect={open} onNew={() => setNewOpen(true)} />
      {active ? (
        <ChatWindow key={active} conversationId={active} onBack={() => setParams({})} />
      ) : (
        <section className="chat-window empty">
          <IoChatbubblesOutline size={48} />
          <p>{t('selectConversation')}</p>
        </section>
      )}
      {newOpen && <NewMessageModal onClose={() => setNewOpen(false)} onOpened={(id) => { setNewOpen(false); open(id); }} />}
    </div>
  );
};

export default Messages;
