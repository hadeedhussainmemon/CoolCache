const express = require('express');
const couponController = require('../controllers/couponController');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const router = express.Router();

// Use same JWT_SECRET constant as adminRoutes/productRoutes
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify admin token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Public route to validate coupon
router.post('/validate', couponController.validateCoupon);

// Admin routes (Protected)
router.post('/', verifyToken, couponController.createCoupon);
router.get('/', verifyToken, couponController.getAllCoupons);
router.delete('/:id', verifyToken, couponController.deleteCoupon);

module.exports = router;
