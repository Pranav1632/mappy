const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const Marker = require('../models/Marker');

// GET /map/markers?lat=&lng=&radius= (radius in kilometers)
router.get('/markers', authMiddleware, async (req, res, next) => {
  try {
    const { lat, lng, radius, page = 1, limit = 20 } = req.query;
    if (lat && lng) {
      const meters = (parseFloat(radius) || 2) * 1000;
      const markers = await Marker.find({
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: meters,
          },
        },
      }).limit(parseInt(limit, 10));
      return res.json({ markers });
    }
    // fallback: paginated
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const markers = await Marker.find().skip(skip).limit(parseInt(limit, 10));
    res.json({ markers });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
