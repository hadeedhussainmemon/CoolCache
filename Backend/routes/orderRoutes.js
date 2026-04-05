const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const {
  getAllOrders,
  getOrder,
  getOrdersByCustomer,
  placeOrder,
  updateStatus,
  updatePayment,
  removeOrder,
  getStats
} = require('../controllers/orderController');

// Load environment variables
dotenv.config();

const router = express.Router();

// Use same JWT_SECRET constant as adminRoutes
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided. Admin access required.' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// CRITICAL: Specific routes MUST come before parameterized ':id' routes
// Express matches routes in order, so /stats/summary must be before /:id

// Admin-only routes (protected) - MUST BE FIRST
router.get('/stats/summary', verifyAdminToken, getStats); // Get order statistics
router.get('/', verifyAdminToken, getAllOrders); // Get all orders (admin only)
router.patch('/:id/status', verifyAdminToken, updateStatus); // Update order status
router.patch('/:id/payment', verifyAdminToken, updatePayment); // Update payment status
router.delete('/:id', verifyAdminToken, removeOrder); // Delete order

// Customer-facing: get orders by phone or email
router.get('/customer/:contact', getOrdersByCustomer);

// Public routes - AFTER specific routes
router.post('/', placeOrder); // Place new order (customers)
router.get('/:id', getOrder); // Get single order (for customer confirmation page) - MUST BE LAST

module.exports = router;
