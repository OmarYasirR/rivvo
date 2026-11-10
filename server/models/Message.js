const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, default: '' },
    attachment: { type: String, default: '' },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', MessageSchema);