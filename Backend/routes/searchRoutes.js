const express = require('express');
const router = express.Router();
const { logSearch, getTrending, logEvent } = require('../utils/searchAnalytics');

router.post('/log', (req, res) => {
  try {
    const term = (req.body && (req.body.term || req.body.q)) || '';
    logSearch(term);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

router.post('/event', (req, res) => {
  try {
    const { type, payload } = req.body || {};
    logEvent(type, payload);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

router.get('/trending', (req, res) => {
  try {
    const days = Number(req.query.days || 7);
    const limit = Number(req.query.limit || 8);
    const terms = getTrending(days, limit);
    res.set('Cache-Control', 'no-store');
    res.json({ terms });
  } catch (e) {
    res.status(500).json({ terms: [] });
  }
});

module.exports = router;
