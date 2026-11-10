const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    media: { type: String, required: true },
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    expiresAt: { type: Date, default: () => Date.now() + 24 * 60 * 60 * 1000 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Story', StorySchema);
