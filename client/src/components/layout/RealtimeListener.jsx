import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSocketContext } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import {
  fetchConversations, markConversationRead, messageDeleted, messageRead, receiveMessage, resetChat, setTyping,
} from '../../store/chatSlice';
import { addNotification, fetchNotifications, resetNotifications } from '../../store/notificationSlice';
;
import { SOCKET_EVENTS } from '../../utils/constants';

// Mounted once near the app root; bridges Socket.IO events into Redux state.
const RealtimeListener = () => {
  const { socket } = useSocketContext();
  const { user } = useAuth();
  const dispatch = useDispatch();
  const activeId = useSelector((s) => s.chat?.activeConversationId);
  const conversations = useSelector((s) => s.chat?.conversations || []);
  const activeRef = useRef(activeId);
  const convsRef = useRef(conversations);
  activeRef.current = activeId;
  convsRef.current = conversations;
  const myId = user?.id;

   
  useEffect(() => {
    if (myId) {
      dispatch(fetchConversations());
      dispatch(fetchNotifications());
    } else {
      dispatch(resetChat());
      dispatch(resetNotifications());
    }
  }, [myId, dispatch]);

  useEffect(() => {
    if (!socket) return undefined;

    const onMessage = (message) => {
      const cid = String(message.conversation);
      const fromOther = String(message.sender) !== String(myId);
      const viewing = fromOther && activeRef.current === cid && document.visibilityState === 'visible' && window.location.pathname.startsWith('/messages');
      dispatch(receiveMessage({ message, myId, viewing }));
      if (viewing) dispatch(markConversationRead(cid));
      if (!convsRef.current.some((c) => c._id === cid)) dispatch(fetchConversations());
    };
    const onRead = (p) => dispatch(messageRead(p));
    const onDeleted = (p) => {
      dispatch(messageDeleted(p));
      dispatch(fetchConversations());
    };
    const onTypingStart = ({ conversationId, userId }) => dispatch(setTyping({ conversationId, userId, isTyping: true }));
    const onTypingStop = ({ conversationId, userId }) => dispatch(setTyping({ conversationId, userId, isTyping: false }));
    const onNotification = (notif) => dispatch(addNotification(notif));
    const onConnect = () => {
      dispatch(fetchConversations());
      dispatch(fetchNotifications());
    };

    socket.on(SOCKET_EVENTS.MESSAGE_RECEIVE, onMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_READ, onRead);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, onDeleted);
    socket.on(SOCKET_EVENTS.TYPING_START, onTypingStart);
    socket.on(SOCKET_EVENTS.TYPING_STOP, onTypingStop);
    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, onNotification);
    socket.on('connect', onConnect);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_RECEIVE, onMessage);
      socket.off(SOCKET_EVENTS.MESSAGE_READ, onRead);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, onDeleted);
      socket.off(SOCKET_EVENTS.TYPING_START, onTypingStart);
      socket.off(SOCKET_EVENTS.TYPING_STOP, onTypingStop);
      socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, onNotification);
      socket.off('connect', onConnect);
    };
  }, [socket, dispatch, myId]);

  return null;
};

export default RealtimeListener;
