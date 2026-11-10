const rateLimit = require('express-rate-limit');

module.exports = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  handler: (req, res) => res.status(429).json({ message: req.t('tooMany') }),
});
