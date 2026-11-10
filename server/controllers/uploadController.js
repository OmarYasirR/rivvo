const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');

const ALLOWED_FOLDERS = ['rivvo/posts', 'rivvo/stories', 'rivvo/avatars', 'rivvo/messages'];

// @desc Upload an image (post/story media or avatar) to Cloudinary
// @route POST /api/upload
// @field form field name: "image"
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: req.t('noFile') });

    if (!cloudinary.isConfigured()) {
      console.error(
        '[upload] Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env and restart the server.'
      );
      return res.status(503).json({ message: req.t('uploadNotConfigured') });
    }

    const folder = ALLOWED_FOLDERS.includes(req.body.folder) ? req.body.folder : 'rivvo/posts';

    const streamUpload = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => {
          if (result) resolve(result);
          else reject(error || new Error('Empty response from Cloudinary'));
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

    let result;
    try {
      result = await streamUpload();
    } catch (cloudErr) {
      console.error('[upload] Cloudinary error:', cloudErr && cloudErr.message ? cloudErr.message : cloudErr);
      const body = { message: req.t('uploadFailed') };
      if (process.env.NODE_ENV !== 'production') body.detail = cloudErr && cloudErr.message;
      return res.status(502).json(body);
    }

    res.status(201).json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    next(err);
  }
};
