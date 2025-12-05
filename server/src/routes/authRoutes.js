const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { rateLimiterMiddleware } = require('../services/rateLimiter');

// request OTP
router.post('/request-otp', rateLimiterMiddleware(1), authController.requestOtp);

// verify OTP and issue tokens
router.post('/verify-otp', rateLimiterMiddleware(1), authController.verifyOtp);

// refresh
router.post('/refresh', authController.refreshToken);

// logout
router.post('/logout', authController.logout);

module.exports = router;
