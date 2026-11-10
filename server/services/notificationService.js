const Notification = require('../models/Notification');

// Create + emit a notification (call from other controllers)
async function createNotification({ io, recipient, sender, type, post }) {
  if (String(recipient) === String(sender)) return null;
  const notification = await Notification.create({ recipient, sender, type, post });
  const populated = await notification.populate('sender', 'username avatar');
  io?.to(`user:${recipient}`).emit('notification:new', populated);
  return populated;
}

module.exports = { createNotification };
