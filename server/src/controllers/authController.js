// src/controllers/authController.js
const Joi = require('joi');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const generateJti = require('../utils/generateJti');
const { sendVerification, checkVerification } = require('../services/twilioService');
const tokenService = require('../services/tokenService');

// Joi schemas
const phoneSchema = Joi.object({
  phone: Joi.string().required(),
  channel: Joi.string().valid('sms', 'whatsapp').optional(),
});

const verifySchema = Joi.object({
  phone: Joi.string().required(),
  code: Joi.string().required(),
  deviceInfo: Joi.object().optional(),
  channel: Joi.string().valid('sms', 'whatsapp').optional(),
});

// request OTP (supports channel)
exports.requestOtp = async (req, res, next) => {
  try {
    const { error, value } = phoneSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const channel = (value.channel || 'sms').toLowerCase();
    await sendVerification(value.phone, channel);
    return res.json({ ok: true, message: `OTP sent via ${channel}` });
  } catch (err) {
    next(err);
  }
};

// verify OTP, create user, issue tokens
exports.verifyOtp = async (req, res, next) => {
  try {
    const { error, value } = verifySchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const channel = (value.channel || 'sms').toLowerCase();

    const check = await checkVerification(value.phone, value.code, channel);
    if (!check || check.status !== 'approved') {
      return res.status(400).json({ error: 'Invalid code' });
    }

    // find or create user
    let user = await User.findOne({ phone: value.phone });
    if (!user) user = await User.create({ phone: value.phone });

    // create refresh token jti and DB record
    const jti = generateJti();
    const { token: refreshToken, expiresAt } = tokenService.signRefreshToken(user._id, jti);

    // save refresh token document
    const rtDoc = new RefreshToken({
      userId: user._id,
      jti,
      expiresAt,
      deviceInfo: value.deviceInfo || {},
      ip: req.ip,
    });
    await rtDoc.save();

    // issue access token
    const { token: accessToken, expiresIn } = tokenService.signAccessToken(user._id);

    // set refresh cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresAt ? new Date(expiresAt).getTime() - Date.now() : undefined,
      path: '/',
    };
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.json({ accessToken, expiresIn });
  } catch (err) {
    next(err);
  }
};

// refresh token endpoint (basic rotation - consider atomic upgrade)
exports.refreshToken = async (req, res, next) => {
  try {
    const incoming = req.cookies.refreshToken || req.body.refreshToken;
    if (!incoming) return res.status(401).json({ error: 'No refresh token' });

    const payload = tokenService.verifyRefreshToken(incoming);
    const jti = payload.jti;
    const userId = payload.sub;

    // atomic findOneAndUpdate is recommended. This is a simple check for now:
    const tokenDoc = await RefreshToken.findOne({ jti, userId, revoked: false, expiresAt: { $gt: new Date() } });
    if (!tokenDoc) {
      await RefreshToken.updateMany({ userId }, { revoked: true });
      return res.status(401).json({ error: 'Refresh token invalid or revoked' });
    }

    tokenDoc.revoked = true;
    tokenDoc.lastUsedAt = new Date();
    await tokenDoc.save();

    const newJti = generateJti();
    const { token: newRefreshToken, expiresAt } = tokenService.signRefreshToken(userId, newJti);
    const newRt = new RefreshToken({
      userId,
      jti: newJti,
      expiresAt,
      ip: req.ip,
      deviceInfo: {},
    });
    await newRt.save();

    const { token: newAccessToken, expiresIn } = tokenService.signAccessToken(userId);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresAt ? new Date(expiresAt).getTime() - Date.now() : undefined,
      path: '/',
    };
    res.cookie('refreshToken', newRefreshToken, cookieOptions);

    return res.json({ accessToken: newAccessToken, expiresIn });
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    next(err);
  }
};

// logout
exports.logout = async (req, res, next) => {
  try {
    const incoming = req.cookies.refreshToken || req.body.refreshToken;
    if (incoming) {
      try {
        const payload = tokenService.verifyRefreshToken(incoming);
        const jti = payload.jti;
        await RefreshToken.findOneAndUpdate({ jti }, { revoked: true });
      } catch (e) {
        // ignore verification errors on logout
      }
    }
    res.clearCookie('refreshToken', { path: '/' });
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
