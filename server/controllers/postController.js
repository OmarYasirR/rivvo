const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { createNotification } = require('../services/notificationService');



const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const withIsSaved = (post, userId) => {
  const { savedBy, ...rest } = post;
  return { ...rest, isSaved: (savedBy || []).some((id) => String(id) === String(userId)) };
};

// @desc Get feed (paginated)
// @route GET /api/posts
exports.getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const posts = await Post.find()
      .populate('user', 'username avatar fullName')
      .populate({ path: 'comments', populate: { path: 'user', select: 'username avatar' } })
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    res.json(posts.map((p) => withIsSaved(p, req.user.id)));
  } catch (err) { next(err); }
};

// @desc Get single post
// @route GET /api/posts/:id
exports.getById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'username avatar fullName')
      .populate({ path: 'comments', populate: { path: 'user', select: 'username avatar' } })
      .lean();
    if (!post) return res.status(404).json({ message: req.t('postNotFound') });
    res.json(withIsSaved(post, req.user.id));
  } catch (err) { next(err); }
};

// @desc Create post
// @route POST /api/posts
exports.create = async (req, res, next) => {
  try {
    const post = await Post.create({ user: req.user.id, caption: req.body.caption, images: req.body.images || [] });
    const populated = await post.populate('user', 'username avatar');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

// @desc Update post
// @route PUT /api/posts/:id
exports.update = async (req, res, next) => {
  try {
    const post = await Post.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true });
    res.json(post);
  } catch (err) {
    next(err);
  }
};

// @desc Delete post
// @route DELETE /api/posts/:id
exports.remove = async (req, res, next) => {
  try {
    await Post.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: req.t('postRemoved') });
  } catch (err) {
    next(err);
  }
};

// @desc Like a post
// @route POST /api/posts/:id/like
exports.like = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { likes: req.user.id } },
      { new: true }
    );
    const io = req.app.get('io');
    await createNotification({ io, recipient: post.user, sender: req.user.id, type: 'like', post: post._id });
    res.json({ likes: post.likes });
  } catch (err) {
    next(err);
  }
};

// @desc Unlike a post
// @route DELETE /api/posts/:id/like
exports.unlike = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $pull: { likes: req.user.id } },
      { new: true }
    );
    res.json({ likes: post.likes });
  } catch (err) {
    next(err);
  }
};

// @desc Add a comment
// @route POST /api/posts/:id/comments
exports.addComment = async (req, res, next) => {
  try {
    const comment = await Comment.create({ post: req.params.id, user: req.user.id, text: req.body.text });
    const post = await Post.findByIdAndUpdate(req.params.id, { $push: { comments: comment._id } }, { new: true });
    const populated = await comment.populate('user', 'username avatar');
    const io = req.app.get('io');
    await createNotification({ io, recipient: post.user, sender: req.user.id, type: 'comment', post: post._id });
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

// @desc Get comments for a post
// @route GET /api/posts/:id/comments
exports.getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.id }).populate('user', 'username avatar').sort('createdAt');
    res.json(comments);
  } catch (err) {
    next(err);
  }
};


// @desc Explore grid: search, hashtag filter, popularity / recency sort
// @route GET /api/posts/explore?q=&tag=&sort=popular|latest&page=
exports.explore = async (req, res, next) => {
  try {
    const { q, tag, sort } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 12;

    const match = {};
    const captionFilters = [];
    if (tag) captionFilters.push({ caption: { $regex: `#${escapeRegex(tag)}(?![\\w])`, $options: 'i' } });
    if (q) captionFilters.push({ caption: { $regex: escapeRegex(q), $options: 'i' } });
    if (captionFilters.length === 1) Object.assign(match, captionFilters[0]);
    else if (captionFilters.length > 1) match.$and = captionFilters;

    const sortStage = sort === 'latest'
      ? { createdAt: -1 }
      : { _score: -1, createdAt: -1 };

    const pipeline = [
      { $match: match },
      {
        $addFields: {
          _score: {
            $add: [
              { $size: { $ifNull: ['$likes', []] } },
              { $multiply: [{ $size: { $ifNull: ['$comments', []] } }, 2] },
            ],
          },
        },
      },
      { $sort: sortStage },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { 'user.password': 0, 'user.resetPasswordToken': 0, 'user.resetPasswordExpire': 0 } },
    ];

    const rows = await Post.aggregate(pipeline);
    res.json(rows.map((r) => withIsSaved(r, req.user.id)));
  } catch (err) { next(err); }
};

// @desc Top hashtags of the last 7 days (extracted from captions)
// @route GET /api/posts/tags/trending
exports.trendingTags = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const posts = await Post.find({ createdAt: { $gte: since } })
      .select('caption')
      .limit(500)
      .lean();

    const RE = /#([\p{L}\p{N}_]{1,50})(?![\p{L}\p{N}_])/gu;
    const counts = new Map();
    for (const p of posts) {
      if (!p.caption) continue;
      for (const m of p.caption.matchAll(RE)) {
        const tag = m[1].toLowerCase();
        if (/^\d+$/.test(tag)) continue;    // "#2024" isn't a tag
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }

    const rows = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    res.json(rows);
  } catch (err) { next(err); }
};

// @desc My saved posts (paginated)
// @route GET /api/posts/saved
exports.getSaved = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const posts = await Post.find({ savedBy: req.user.id })
      .populate('user', 'username avatar fullName')
      .populate({ path: 'comments', populate: { path: 'user', select: 'username avatar' } })
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    res.json(posts.map(({ savedBy, ...rest }) => ({ ...rest, isSaved: true })));
  } catch (err) { next(err); }
};

// @desc Save / unsave a post
// @route POST | DELETE /api/posts/:id/save
exports.save = async (req, res, next) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, { $addToSet: { savedBy: req.user.id } });
    res.json({ saved: true });
  } catch (err) { next(err); }
};

exports.unsave = async (req, res, next) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, { $pull: { savedBy: req.user.id } });
    res.json({ saved: false });
  } catch (err) { next(err); }
};
