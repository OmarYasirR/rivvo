const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

module.exports = function registerChatEvents(io, socket) {
  const emitToOthers = async (conversationId, event, payload) => {
    const conv = await Conversation.findById(conversationId).select('participants');
    if (!conv) return;
    conv.participants.forEach((pId) => {
      if (String(pId) !== String(socket.userId)) io.to(`user:${pId}`).emit(event, payload);
    });
  };

  socket.on('message:send', async ({ conversationId, text, attachment }) => {
    try {
      const message = await Message.create({
        conversation: conversationId,
        sender: socket.userId,
        text: text || '',
        attachment: attachment || '',
        readBy: [socket.userId],
      });
      await Conversation.findByIdAndUpdate(conversationId, { lastMessage: message._id });

      const conv = await Conversation.findById(conversationId).select('participants');
      conv?.participants.forEach((pId) => io.to(`user:${pId}`).emit('message:receive', message.toObject()));
    } catch (err) {
      socket.emit('message:error', { conversationId, message: 'Failed to send' });
    }
  });

  socket.on('typing:start', ({ conversationId }) =>
    emitToOthers(conversationId, 'typing:start', { conversationId, userId: socket.userId })
  );
  socket.on('typing:stop', ({ conversationId }) =>
    emitToOthers(conversationId, 'typing:stop', { conversationId, userId: socket.userId })
  );
};