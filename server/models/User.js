const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    fullName: { type: String, default: '' },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 150 },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
