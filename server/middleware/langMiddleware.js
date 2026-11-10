const { pickLang, translate } = require('../i18n/messages');

// Reads Accept-Language (en | ar), exposes req.lang and req.t(key, vars)
module.exports = function langMiddleware(req, res, next) {
  req.lang = pickLang(req.headers['accept-language']);
  req.t = (key, vars) => translate(req.lang, key, vars);
  next();
};
