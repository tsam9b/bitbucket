const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../data/items.json');

// Cache for stats
let statsCache = null;
let lastModified = null;

// GET /api/stats
router.get('/', (req, res, next) => {
  fs.stat(DATA_PATH, (err, stats) => {
    if (err) return next(err);

    // Check if cache is valid
    if (statsCache && lastModified && stats.mtime <= lastModified) {
      return res.json(statsCache);
    }

    // Read and calculate
    fs.readFile(DATA_PATH, (err, raw) => {
      if (err) return next(err);

      const items = JSON.parse(raw);
      const calculatedStats = {
        total: items.length,
        averagePrice: items.reduce((acc, cur) => acc + cur.price, 0) / items.length
      };

      // Update cache
      statsCache = calculatedStats;
      lastModified = stats.mtime;

      res.json(calculatedStats);
    });
  });
});

module.exports = router;