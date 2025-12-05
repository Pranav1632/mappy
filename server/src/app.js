const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const logger = require('./config/logger');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const mapRoutes = require('./routes/mapRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(morgan('dev'));

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));

// routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/map', mapRoutes);

// health
app.get('/health', (req, res) => res.json({ ok: true }));

// error handler (should be last)
app.use(errorHandler);

module.exports = app;
