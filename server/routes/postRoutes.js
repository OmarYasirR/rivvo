const express = require('express');
const router = express.Router();
const {
  getAll, getById, create, update, remove, like, unlike, addComment, getComments,
  explore, trendingTags, getSaved, save, unsave,
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

// Literal paths first — they'd otherwise be captured by /:id
router.get('/explore', protect, explore);
router.get('/tags/trending', protect, trendingTags);
router.get('/saved', protect, getSaved);

router.route('/')
  .get(protect, getAll)
  .post(protect, create);

router.post('/:id/like', protect, like);
router.delete('/:id/like', protect, unlike);
router.post('/:id/save', protect, save);
router.delete('/:id/save', protect, unsave);
router.post('/:id/comments', protect, addComment);
router.get('/:id/comments', protect, getComments);

router.route('/:id')
  .get(protect, getById)
  .put(protect, update)
  .delete(protect, remove);

module.exports = router;