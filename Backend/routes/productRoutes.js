const express = require('express');
const ProductController = require('../controllers/productController');
const upload = require('../middleware/uploadMiddleware');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const router = express.Router();
const productController = new ProductController();

// Use same JWT_SECRET constant as adminRoutes
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

// Public routes (order matters: more specific first)
router.get('/', productController.getAllProducts);
router.get('/categories', productController.getCategories);
router.get('/trending-searches', productController.getTrendingSearches);
router.get('/category/:category', productController.getProductsByCategory);
router.get('/:id', productController.getProductById);

// Admin routes (protected)
router.post('/', verifyToken, upload.single('image'), productController.addProduct);
router.patch('/:id', verifyToken, upload.single('image'), productController.updateProduct);
router.delete('/:id', verifyToken, productController.deleteProduct);

module.exports = router;