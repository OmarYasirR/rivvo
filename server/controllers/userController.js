const User = require('../models/User');
const Post = require('../models/Post');

// @desc Get a user's public profile + posts
// @route GET /api/users/:username
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-password');
    if (!user) return res.status(404).json({ message: req.t('userNotFound') });

    const posts = await Post.find({ user: user._id }).sort('-createdAt');
    const isFollowing = req.user ? user.followers.includes(req.user.id) : false;

    res.json({
      ...user.toObject(),
      posts,
      postCount: posts.length,
      isFollowing,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Update own profile
// @route PUT /api/users/me
exports.updateProfile = async (req, res, next) => {
  try {
    const { fullName, bio, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, bio, avatar },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// @desc Search users by username
// @route GET /api/users/search?q=
exports.search = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const users = await User.find({ username: new RegExp(q, 'i') })
      .select('username avatar fullName')
      .limit(20);
    res.json(users);
  } catch (err) {
    next(err);
  }
};

// @desc People I'm not following, excluding myself — sorted by followers count
// @route GET /api/users/suggestions
exports.suggestions = async (req, res, next) => {
  try {
    const me = await User.findById(req.user.id).select('following');
    const exclude = [...(me?.following || []), req.user.id];
    const users = await User.find({ _id: { $nin: exclude } })
      .select('username avatar fullName followers')
      .limit(30)
      .lean();

    users.sort((a, b) => (b.followers?.length || 0) - (a.followers?.length || 0));

    res.json(users.slice(0, 10).map((u) => ({
      _id: u._id,
      username: u.username,
      avatar: u.avatar,
      fullName: u.fullName,
      isFollowing: false,
    })));
  } catch (err) { next(err); }
};

// @desc A profile's followers or following
// @route GET /api/users/:username/connections?type=followers|following
exports.connections = async (req, res, next) => {
  try {
    const type = req.query.type === 'following' ? 'following' : 'followers';
    const target = await User.findOne({ username: req.params.username }).select(type);
    if (!target) return res.status(404).json({ message: req.t('userNotFound') });

    const ids = target[type] || [];
    const users = await User.find({ _id: { $in: ids } }).select('username avatar fullName');

    const me = await User.findById(req.user.id).select('following');
    const mine = new Set((me?.following || []).map(String));

    res.json(users.map((u) => ({
      _id: u._id,
      username: u.username,
      avatar: u.avatar,
      fullName: u.fullName,
      isFollowing: mine.has(String(u._id)),
    })));
  } catch (err) { next(err); }
};