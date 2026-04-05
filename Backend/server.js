const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { connectToDatabase } = require('./utils/db');
const orderCache = require('./utils/orderCache');
const Order = require('./models/Order');
const productRoutes = require('./routes/productRoutes');
const searchRoutes = require('./routes/searchRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const shareRoutes = require('./routes/shareRoutes');
const sitemapController = require('./controllers/sitemapController');
// review routes removed per request: reviews are kept on Instagram highlights

// Load environment variables
dotenv.config();

// Deployment timestamp: 2025-11-12 19:26
const app = express();
const PORT = process.env.PORT || 5000;

// Security & Performance Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images to be loaded from other origins/same origin correctly
}));
app.use(compression()); // Compress all responses

// Rate limiting: 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Connect to MongoDB (cached connection will be reused)
if (process.env.MONGODB_URI) {
  connectToDatabase(process.env.MONGODB_URI)
    .then(async () => {
      console.log('✅ MongoDB connected successfully');
      // Sync cache from database
      await orderCache.syncFromDB(Order);
    })
    .catch(err => {
      console.error('❌ MongoDB connection failed:', err.message);
      console.warn('⚠️ Server running in CACHE-ONLY mode');
    });
}

// CORS: whitelist specific origins for security
const allowedOrigins = [
  'https://www.coolcache.app',
  'https://coolcache.app',
  'https://coolcache.vercel.app',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:5173', 'http://localhost:3000'] : [])
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Add no-cache headers for API responses to prevent stale data
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Configure static file serving with proper MIME types for modern image formats
const serveStatic = express.static(path.join(__dirname, 'public/images'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.avif')) {
      res.setHeader('Content-Type', 'image/avif');
    } else if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
    // Add cache headers for images (1 year for immutable assets)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
});

// Serve static files
app.use('/images', serveStatic);
app.use('/products', express.static(path.join(__dirname, 'public/images/products'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.avif')) {
      res.setHeader('Content-Type', 'image/avif');
    } else if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

// Health check route
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const orderCache = require('./utils/orderCache');

  const dbConnected = mongoose.connection.readyState === 1;

  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: {
      mongodb: dbConnected ? 'connected' : 'disconnected',
      cache: {
        enabled: true,
        orders: orderCache.getSize()
      }
    },
    routes: {
      products: '/api/products',
      productAlias: '/api/product',
      admin: '/api/admin',
      orders: '/api/orders'
    }
  });
});

// Optional health check for deployment platforms
app.get('/api/health/db', (req, res) => {
  const mongoose = require('mongoose');
  const orderCache = require('./utils/orderCache');

  const dbConnected = mongoose.connection.readyState === 1;

  res.json({
    status: dbConnected ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    mongodb: {
      connected: dbConnected,
      note: dbConnected ? 'Database operational' : 'Using cache fallback'
    },
    cache: {
      orders: orderCache.getSize(),
      note: 'In-memory fallback active'
    }
  });
});

// Use routes
const couponRoutes = require('./routes/couponRoutes');

// ... imports remain the same

// ...

// Use routes
app.use('/api/products', productRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/share', shareRoutes);
app.get('/sitemap.xml', sitemapController.getSitemap); // Dynamic sitemap
// review routes intentionally not mounted (reviews are shown via Instagram highlights)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Simple keep-alive ping endpoint
app.get('/api/ping', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

// Optional: Redirect old numeric product paths to their canonical slug - helps SEO and legacy links
app.get('/product/:id', async (req, res) => {
  try {
    const idParam = req.params.id;
    const Product = require('./models/Product');

    if (/^\d+$/.test(idParam)) {
      const id = parseInt(idParam, 10);
      const p = await Product.findOne({ id });
      if (p) {
        const slug = p.slug || `${String(p.title || '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}-${p.id}`;
        return res.redirect(301, `/product/${slug}`);
      }
    }
    // If not found, let other routes handle or reply 404
    res.status(404).send('Not found');
  } catch (err) {
    console.error('Redirect error:', err);
    res.status(500).send('Error');
  }
});

// Not found middleware
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Export for Vercel
module.exports = app;

// Global Error Handlers to prevent crash loops
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  // In production, we should exit, but for debugging we might want to stay alive or exit cleanly
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥');
  console.error(err.name, err.message);
  // server.close(() => { process.exit(1); });
});

// Start server locally
if (!process.env.VERCEL) {
  console.log('🚀 Starting CoolCache Server v1.1 - Email Fix Applied');
  const server = app.listen(PORT, () => console.log(`✨ Server running on http://localhost:${PORT}`));

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
      console.log('💥 Process terminated!');
    });
  });
}