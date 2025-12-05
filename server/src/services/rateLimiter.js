const { RateLimiterMemory } = require('rate-limiter-flexible');

// In production, use RateLimiterRedis
const opts = {
  points: 5,
  duration: 60,
};

const limiter = new RateLimiterMemory(opts);

const rateLimiterMiddleware = (points = 1) => async (req, res, next) => {
  try {
    await limiter.consume(req.ip, points);
    next();
  } catch (rejRes) {
    res.status(429).json({ error: 'Too many requests' });
  }
};

module.exports = { rateLimiterMiddleware };
