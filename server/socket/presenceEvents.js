const User = require('../models/User');

module.exports = function registerPresenceEvents(io, socket) {
  User.findByIdAndUpdate(socket.userId, { isOnline: true }).exec();
  socket.broadcast.emit('user:online', { userId: socket.userId });

  socket.on('disconnect', async () => {
    await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen: new Date() });
    socket.broadcast.emit('user:offline', { userId: socket.userId });
  });
};
