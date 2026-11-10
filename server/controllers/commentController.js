const Comment = require('../models/Comment');

// Manage comments

// @desc    Get all comments
// @route   GET /api/comments
exports.getAll = async (req, res, next) => {
  try {
    const items = await Comment.find();
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// @desc    Get single comment
// @route   GET /api/comments/:id
exports.getById = async (req, res, next) => {
  try {
    const item = await Comment.findById(req.params.id);
    if (!item) return res.status(404).json({ message: req.t('commentNotFound') });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

// @desc    Create comment
// @route   POST /api/comments
exports.create = async (req, res, next) => {
  try {
    const item = await Comment.create({ ...req.body, user: req.user?.id });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
exports.update = async (req, res, next) => {
  try {
    const item = await Comment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
exports.remove = async (req, res, next) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: req.t('commentRemoved') });
  } catch (err) {
    next(err);
  }
};
