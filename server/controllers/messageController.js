const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const CONV_POPULATE = [
  {
    path: 'participants',
    match: { _id: { $ne: null } }, // placeholder, filtered per-user below
    select: 'username avatar fullName isOnline lastSeen',
  },
  { path: 'lastMessage', select: 'sender text attachment deleted createdAt' },
];

// @desc Get conversations for current user
// @route GET /api/messages/conversations
exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id })
      .populate({
        path: 'participants',
        match: { _id: { $ne: req.user.id } }, // only the other person
        select: 'username avatar fullName isOnline lastSeen',
      })
      .populate({ path: 'lastMessage', select: 'sender text attachment deleted createdAt' })
      .sort('-updatedAt');

    const withUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: req.user.id },
          readBy: { $ne: req.user.id },
          deleted: { $ne: true },
        });
        return { ...conv.toObject(), unreadCount };
      })
    );

    res.json(withUnread);
  } catch (err) {
    next(err);
  }
};

// @desc Start (or fetch existing) 1:1 conversation
// @route POST /api/messages/conversations
exports.startConversation = async (req, res, next) => {
  try {
    const { userId } = req.body;
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, userId], $size: 2 },
    });
    if (!conversation) {
      conversation = await Conversation.create({ participants: [req.user.id, userId] });
    }

    const populated = await Conversation.findById(conversation._id)
      .populate({
        path: 'participants',
        match: { _id: { $ne: req.user.id } },
        select: 'username avatar fullName isOnline lastSeen',
      })
      .populate({ path: 'lastMessage', select: 'sender text attachment deleted createdAt' });

    res.status(201).json({ ...populated.toObject(), unreadCount: 0 });
  } catch (err) {
    next(err);
  }
};

// @desc Get messages (paginated). Response: { messages (oldest first), hasMore }
// @route GET /api/messages/:conversationId?before=ISO&limit=30
exports.getMessages = async (req, res, next) => {
  try {
    const { before } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);

    const query = { conversation: req.params.conversationId, deleted: { $ne: true } };
    if (before) query.createdAt = { $lt: new Date(before) };

    // fetch newest-first so `before` paging walks backwards in time, then reverse for the UI
    const rows = await Message.find(query).sort({ createdAt: -1 }).limit(limit + 1);
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    res.json({ messages: page.reverse(), hasMore });
  } catch (err) {
    next(err);
  }
};

// @desc Send a message (REST — matches what the frontend actually calls)
// @route POST /api/messages/:conversationId
exports.sendMessage = async (req, res, next) => {
  try {
    const message = await Message.create({
      conversation: req.params.conversationId,
      sender: req.user.id,
      text: req.body.text || '',
      attachment: req.body.attachment || '',
      readBy: [req.user.id],
    });
    await Conversation.findByIdAndUpdate(req.params.conversationId, { lastMessage: message._id });

    // emit to every participant so the recipient gets it live (image included)
    const conv = await Conversation.findById(req.params.conversationId).select('participants');
    const io = req.app.get('io');
    conv?.participants.forEach((pId) => {
      io?.to(`user:${pId}`).emit('message:receive', message.toObject());
    });

    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
};

// @desc Mark a conversation as read
// @route PUT /api/messages/:conversationId/read
exports.markRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: req.user.id }, readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id } }
    );

    // tell the other side their messages are now "seen"
    const conv = await Conversation.findById(conversationId).select('participants');
    const io = req.app.get('io');
    conv?.participants.forEach((pId) => {
      if (String(pId) !== String(req.user.id)) {
        io?.to(`user:${pId}`).emit('message:read', { conversationId, userId: req.user.id });
      }
    });

    res.json({ conversationId });
  } catch (err) {
    next(err);
  }
};

// @desc Delete a message (soft delete, visible to everyone)
// @route DELETE /api/messages/item/:messageId
exports.deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: req.t('postNotFound') });
    if (String(message.sender) !== String(req.user.id)) {
      return res.status(403).json({ message: req.t('notAuthorized') });
    }

    message.deleted = true;
    message.text = '';
    message.attachment = '';
    await message.save();

    const payload = { conversationId: String(message.conversation), messageId: String(message._id) };
    const conv = await Conversation.findById(message.conversation).select('participants');
    const io = req.app.get('io');
    conv?.participants.forEach((pId) => io?.to(`user:${pId}`).emit('message:deleted', payload));

    res.json({ id: String(message._id), conversationId: String(message.conversation) });
  } catch (err) {
    next(err);
  }
};