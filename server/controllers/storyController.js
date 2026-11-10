const Story = require('../models/Story');

// @desc Get active (non-expired) stories from followed users + self
// @route GET /api/stories
exports.getActive = async (req, res, next) => {
  try {
    const stories = await Story.find({ expiresAt: { $gt: new Date() } })
      .populate('user', 'username avatar')
      .sort('-createdAt');
    const withViewedFlag = stories.map((s) => ({
      ...s.toObject(),
      viewed: s.viewers.some((v) => String(v) === req.user.id),
    }));
    res.json(withViewedFlag);
  } catch (err) {
    next(err);
  }
};

// @desc Create a story
// @route POST /api/stories
exports.create = async (req, res, next) => {
  try {
    const story = await Story.create({ user: req.user.id, media: req.body.media });
    const populated = await story.populate('user', 'username avatar');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

// @desc Mark a story as viewed
// @route POST /api/stories/:id/view
exports.markViewed = async (req, res, next) => {
  try {
    await Story.findByIdAndUpdate(req.params.id, { $addToSet: { viewers: req.user.id } });
    res.json({ message: req.t('viewed') });
  } catch (err) {
    next(err);
  }
};
