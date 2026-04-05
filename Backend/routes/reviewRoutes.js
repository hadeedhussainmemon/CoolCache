const express = require('express');
const ReviewController = require('../controllers/reviewController');

const router = express.Router();
const reviewController = new ReviewController();

// Public routes
router.post('/', (req, res) => reviewController.submitReview(req, res));
router.get('/', (req, res) => reviewController.getApprovedReviews(req, res));

// Simple test route to verify routing and CORS
router.get('/test', (req, res) => {
  res.json({ ok: true, message: 'Reviews route is reachable' });
});

module.exports = router;