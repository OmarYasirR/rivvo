const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendMail } = require('../config/mail');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// @desc Register new user
// @route POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ message: req.t('userExists') });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed });
    const token = signToken(user._id);
    res.status(201).json({ token, user: { id: user._id, username: user.username, avatar: user.avatar } });
  } catch (err) {
    next(err);
  }
};

// @desc Login user
// @route POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: req.t('invalidCredentials') });
    }
    const token = signToken(user._id);
    res.json({ token, user: { id: user._id, username: user.username, avatar: user.avatar } });
  } catch (err) {
    next(err);
  }
};

// @desc Logout user
// @route POST /api/auth/logout
exports.logout = async (req, res) => {
  res.json({ message: req.t('loggedOut') });
};

// @desc Request a password reset link
// @route POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    // Always respond 200 so we don't leak which emails are registered
    if (!user) return res.json({ message: req.t('resetSentGeneric') });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

    try {
      await sendMail({
        to: user.email,
        subject: req.t('emailSubject'),
        html: `<div dir="${req.lang === 'ar' ? 'rtl' : 'ltr'}" style="font-family: Tajawal, Arial, sans-serif">
               <p>${req.t('emailHi', { name: user.username })}</p>
               <p>${req.t('emailBody')}</p>
               <p><a href="${resetUrl}">${resetUrl}</a></p>
               <p>${req.t('emailIgnore')}</p></div>`,
      });
    } catch (mailErr) {
      // Roll back the token if the email genuinely couldn't send, so the user can retry
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return next(mailErr);
    }

    res.json({ message: req.t('resetSentGeneric') });
  } catch (err) {
    next(err);
  }
};

// @desc Reset password using a valid reset token
// @route POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) return res.status(400).json({ message: req.t('resetInvalid') });

    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = signToken(user._id);
    res.json({ message: req.t('passwordReset'), token });
  } catch (err) {
    next(err);
  }
};
