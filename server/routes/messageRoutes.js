const express = require('express');
const router = express.Router();
const {
  getConversations, startConversation, getMessages, sendMessage, markRead, deleteMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.get('/conversations', protect, getConversations);
router.post('/conversations', protect, startConversation);
router.get('/:conversationId', protect, getMessages);
router.post('/:conversationId', protect, sendMessage);
router.put('/:conversationId/read', protect, markRead);  
router.delete('/item/:messageId', protect, deleteMessage);

module.exports = router;