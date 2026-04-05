const express = require('express');
const ReviewController = require('../controllers/reviewController');
const jwt = require('jsonwebtoken');

const router = express.Router();
const reviewController = new ReviewController();

// Middleware to verify admin token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin routes (protected)
router.get('/reviews', verifyToken, (req, res) => reviewController.getAllReviews(req, res));
router.patch('/reviews/:id/approve', verifyToken, (req, res) => reviewController.approveReview(req, res));
router.patch('/reviews/:id/reject', verifyToken, (req, res) => reviewController.rejectReview(req, res));
router.delete('/reviews/:id', verifyToken, (req, res) => reviewController.deleteReview(req, res));

module.exports = router;
