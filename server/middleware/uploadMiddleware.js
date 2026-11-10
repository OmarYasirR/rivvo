const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) return cb(null, true);
    const err = new Error('Only image files are allowed');
    err.code = 'ONLY_IMAGES';
    cb(err);
  },
});

module.exports = upload;
