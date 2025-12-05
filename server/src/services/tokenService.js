const jwt = require('jsonwebtoken');
const dayjs = require('dayjs');

const ACCESS_TTL = parseInt(process.env.ACCESS_TOKEN_TTL || '180', 10);
const REFRESH_TTL = parseInt(process.env.REFRESH_TOKEN_TTL || '604800', 10);

if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets not set in env');
}

const signAccessToken = (userId) => {
  const payload = {
    sub: String(userId),
    typ: 'access',
  };
  const options = { expiresIn: `${ACCESS_TTL}s` };
  const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, options);
  return { token, expiresIn: ACCESS_TTL };
};

const signRefreshToken = (userId, jti) => {
  const payload = {
    sub: String(userId),
    jti,
    typ: 'refresh',
  };
  const options = { expiresIn: `${REFRESH_TTL}s` };
  const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, options);
  const expiresAt = dayjs().add(REFRESH_TTL, 'second').toDate();
  return { token, expiresAt };
};

const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_ACCESS_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  ACCESS_TTL,
  REFRESH_TTL,
};
