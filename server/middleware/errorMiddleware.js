// Centralized error handler (localized fallbacks)
module.exports = (err, req, res, next) => {
  console.error(err.stack);
  const body = {};
  let status = err.statusCode || 500;
  if (err.code === 'LIMIT_FILE_SIZE') {
    status = 413;
    body.message = req.t('fileTooLarge');
  } else if (err.code === 'ONLY_IMAGES') {
    status = 400;
    body.message = req.t('onlyImages');
  } else if (status === 500) {
    body.message = req.t('serverError'); // never leak internals to clients
  } else {
    body.message = err.message;
  }
  // In development, include the real reason so it shows up in the browser's network tab
  if (status === 500 && process.env.NODE_ENV !== 'production') body.detail = err.message;
  res.status(status).json(body);
};
