const express = require('express');
const router = express.Router();
const { uploadImage } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, upload.single('image'), uploadImage);

module.exports = router;
