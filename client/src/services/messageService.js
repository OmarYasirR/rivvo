import api from './api';

const messageService = {
  getConversations: () => api.get('/messages/conversations').then((r) => r.data),
  startConversation: (userId) => api.post('/messages/conversations', { userId }).then((r) => r.data),
  unreadCount: () => api.get('/messages/unread-count').then((r) => r.data),
  // -> { messages (oldest first), hasMore }; pass `before` (ISO date) to load older ones
  getMessages: (conversationId, { before, limit } = {}) => {
    const params = {};
    if (before) params.before = before;
    if (limit) params.limit = limit;
    return api.get(`/messages/${conversationId}`, { params }).then((r) => r.data);
  },
  sendMessage: (conversationId, { text, attachment }) =>
    api.post(`/messages/${conversationId}`, { text, attachment }).then((r) => r.data),
  markRead: (conversationId) => api.put(`/messages/${conversationId}/read`).then((r) => r.data),
  deleteMessage: (messageId) => api.delete(`/messages/item/${messageId}`).then((r) => r.data),
};

export default messageService;
