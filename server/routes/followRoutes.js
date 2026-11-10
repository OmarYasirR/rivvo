const express = require('express');
const router = express.Router();
const { followUser, unfollowUser } = require('../controllers/followController');
const { protect } = require('../middleware/authMiddleware');

router.post('/:id', protect, followUser);
router.delete('/:id', protect, unfollowUser);

module.exports = router;
