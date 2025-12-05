// src/services/twilioService.js
const Twilio = require('twilio');
const logger = require('../config/logger');

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const VERIFY_SID = process.env.TWILIO_VERIFY_SERVICE_SID;
const TEST_MODE = process.env.TWILIO_TEST_MODE === 'true';

if (!TEST_MODE && (!ACCOUNT_SID || !AUTH_TOKEN)) {
  logger.warn('Twilio ACCOUNT_SID or AUTH_TOKEN not set — Twilio calls will fail unless TWILIO_TEST_MODE=true');
}

const client = (!TEST_MODE && ACCOUNT_SID && AUTH_TOKEN) ? new Twilio(ACCOUNT_SID, AUTH_TOKEN) : null;

// simple in-memory map for test-mode checks
const _testStore = new Map();

/**
 * Normalize channel and phone for Twilio Verify.
 * For WhatsApp, Twilio expects the 'to' param to be a normal E.164 number and channel 'whatsapp'.
 * For other usage (sending via messages API) you'd prefix with 'whatsapp:', but Verify expects plain number + channel 'whatsapp'.
 */

/**
 * sendVerification(phone, channel = 'sms')
 * channel: 'sms' | 'whatsapp'
 */
const sendVerification = async (phone, channel = 'sms') => {
  if (TEST_MODE) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    _testStore.set(`${phone}:${channel}`, code);
    logger.info(`[Twilio TEST_MODE] Pretending to send code ${code} to ${phone} via ${channel}`);
    return { sid: 'TEST_SID', status: 'pending', channel, code };
  }

  if (!client) throw new Error('Twilio client not configured (check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN)');
  if (!VERIFY_SID) throw new Error('TWILIO_VERIFY_SERVICE_SID not set in env');

  // validate channel
  const ch = String(channel || 'sms').toLowerCase();
  if (!['sms', 'whatsapp'].includes(ch)) {
    throw new Error('Unsupported channel. Use "sms" or "whatsapp".');
  }

  try {
    // Twilio Verify: pass the channel (sms or whatsapp)
    const res = await client.verify
      .services(VERIFY_SID)
      .verifications.create({
        to: phone,
        channel: ch,
      });

    logger.info(`Twilio verification created: ${res.sid} status=${res.status} channel=${ch}`);
    return res;
  } catch (err) {
    logger.error('Twilio sendVerification error', { message: err.message, code: err.code, more: err });
    if (err.status === 404) {
      throw new Error(`Twilio Verify service not found. Check TWILIO_VERIFY_SERVICE_SID and that it belongs to account ${ACCOUNT_SID}`);
    }
    // return a friendlier message
    throw new Error(`Twilio sendVerification failed: ${err.message}`);
  }
};

/**
 * checkVerification(phone, code, channel = 'sms')
 * For TEST_MODE we validate against the stored (phone:channel) key
 */
const checkVerification = async (phone, code, channel = 'sms') => {
  if (TEST_MODE) {
    const expected = _testStore.get(`${phone}:${channel}`);
    const ok = expected && expected === String(code);
    logger.info(`[Twilio TEST_MODE] checking ${code} for ${phone} via ${channel} => ${ok}`);
    // single-use semantics in test mode
    _testStore.delete(`${phone}:${channel}`);
    return { status: ok ? 'approved' : 'pending' };
  }

  if (!client) throw new Error('Twilio client not configured (check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN)');
  if (!VERIFY_SID) throw new Error('TWILIO_VERIFY_SERVICE_SID not set in env');

  try {
    // Twilio Verify verificationChecks supports 'to' and 'code'
    const res = await client.verify
      .services(VERIFY_SID)
      .verificationChecks.create({
        to: phone,
        code,
      });
    logger.info(`Twilio verification check result: ${res.status}`);
    return res;
  } catch (err) {
    logger.error('Twilio checkVerification error', { message: err.message, code: err.code, more: err });
    if (err.status === 404) {
      throw new Error(`Twilio Verify service not found (404). Check TWILIO_VERIFY_SERVICE_SID and account credentials.`);
    }
    throw new Error(`Twilio checkVerification failed: ${err.message}`);
  }
};

module.exports = { sendVerification, checkVerification };
