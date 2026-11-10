const levels = ['info', 'warn', 'error'];

const logger = {};
levels.forEach((level) => {
  logger[level] = (...args) => console[level === 'info' ? 'log' : level](`[${level.toUpperCase()}]`, ...args);
});

module.exports = logger;
