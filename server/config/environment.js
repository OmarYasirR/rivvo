const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Works no matter where the server is started from (repo root, server/, npm workspace, Docker).
// server/.env wins over the repo-root .env; real environment variables win over both.
[path.resolve(__dirname, '../.env'), path.resolve(__dirname, '../../.env')].forEach((file) => {
  if (fs.existsSync(file)) dotenv.config({ path: file });
});

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
};
