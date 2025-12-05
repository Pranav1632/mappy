// src/config/db.js
const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI not set');
  }

  try {
    // Use a sensible serverSelectionTimeout to fail fast in dev if DB isn't reachable
    await mongoose.connect(uri, {
      // don't pass deprecated "useNewUrlParser/useUnifiedTopology" options
      // you can set other options supported by your mongoose version here if needed
      serverSelectionTimeoutMS: 5000,
    });

    // optional: avoid strictQuery deprecation warnings on some mongoose versions
    if (typeof mongoose.set === 'function') {
      mongoose.set('strictQuery', false);
    }

    logger.info('MongoDB connected');
  } catch (err) {
    // improve error message and include original error for debugging
    logger.error('MongoDB connection error', {
      message: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
};

module.exports = connectDB;


// const mongoose = require('mongoose');
// const logger = require('./logger');

// const connectDB = async () => {
//   const uri = process.env.MONGODB_URI;
//   if (!uri) throw new Error('MONGODB_URI not set');
//   try {
//     await mongoose.connect(uri, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     logger.info('MongoDB connected');
//   } catch (err) {
//     logger.error('MongoDB connection error', err);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;
