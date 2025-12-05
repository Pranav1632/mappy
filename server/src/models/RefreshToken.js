const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jti: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true, index: true },
  revoked: { type: Boolean, default: false },
  deviceInfo: { type: Object, default: {} },
  ip: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date },
});

// TTL index to let Mongo remove expired tokens automatically.
// Be careful: expireAfterSeconds only works with a Date field and removes documents
// when the field value is older than the TTL offset. Here we set expireAfterSeconds: 0
// so documents will be removed at the time equals expiresAt.
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Export the model (this must be the final line)
module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
