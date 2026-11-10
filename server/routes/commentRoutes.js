const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getAll)
  .post(protect, create);

router.route('/:id')
  .get(protect, getById)
  .put(protect, update)
  .delete(protect, remove);

module.exports = router;
