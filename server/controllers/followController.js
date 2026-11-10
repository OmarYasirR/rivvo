const User = require('../models/User');

// @desc Follow a user
// @route POST /api/follow/:id
exports.followUser = async (req, res, next) => {
  try {
    if (String(req.user.id) === String(req.params.id)) {
      return res.status(400).json({ message: req.t('notAuthorized') });
    }
    const target = await User.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { followers: req.user.id } },
      { new: true }
    );
    if (!target) return res.status(404).json({ message: req.t('userNotFound') });
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { following: req.params.id } });
    res.json({ following: true, followersCount: target.followers.length });
  } catch (err) { next(err); }
};

// @desc Unfollow a user
// @route DELETE /api/follow/:id
exports.unfollowUser = async (req, res, next) => {
  try {
    const target = await User.findByIdAndUpdate(
      req.params.id,
      { $pull: { followers: req.user.id } },
      { new: true }
    );
    if (!target) return res.status(404).json({ message: req.t('userNotFound') });
    await User.findByIdAndUpdate(req.user.id, { $pull: { following: req.params.id } });
    res.json({ following: false, followersCount: target.followers.length });
  } catch (err) { next(err); }
};
