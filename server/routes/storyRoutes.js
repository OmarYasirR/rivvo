const express = require('express');
const router = express.Router();
const { getActive, create, markViewed } = require('../controllers/storyController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getActive);
router.post('/', protect, create);
router.post('/:id/view', protect, markViewed);

module.exports = router;
