const express = require('express');
const router = express.Router();
const {
  getProfile, updateProfile, search, suggestions, connections,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/suggestions', protect, suggestions);
router.get('/search', protect, search);
router.put('/me', protect, updateProfile);

router.get('/:username/connections', protect, connections);

router.get('/:username', protect, getProfile);

module.exports = router;