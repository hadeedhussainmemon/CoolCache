const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const mongoose = require('mongoose');
const orderCache = require('../utils/orderCache');
const emailService = require('../services/emailService');
const pushService = require('../services/pushService');
const AdminSettings = require('../models/AdminSettings');

// Helper to check if MongoDB is available
const isDBAvailable = () => mongoose.connection.readyState === 1;

// Simple unique order id generator (compact, URL-safe)
const generateOrderId = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);

// Get all orders
const getAllOrders = async (req, res) => {
  try {
    const { status, paymentStatus } = req.query;
    // Enforce DB-only reads. If DB not ready, return 503 so callers know orders are temporarily unavailable.
    if (!isDBAvailable()) {
      console.error('Database unavailable - refusing to serve orders from cache');
      return res.status(503).json({ message: 'Service temporarily unavailable. Orders are only available when the database is reachable.' });
    }

    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

    // Hydrate orders with latest product images (fixes broken images on old orders)
    // We fetch all products once to avoid N+1 queries
    const products = await Product.find({}, 'id image').lean();
    const productMap = new Map(products.map(p => [p.id, p.image]));

    const tagged = orders.map(o => {
      if (o.items && Array.isArray(o.items)) {
        o.items = o.items.map(item => ({
          ...item,
          image: productMap.get(item.productId) || item.image // Use latest image if found, else keep existing
        }));
      }
      return { ...o, _source: 'db' };
    });
    return res.json(tagged);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Get single order
const getOrder = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'Invalid order ID' });
    if (!isDBAvailable()) {
      console.error('Database unavailable - cannot fetch single order');
      return res.status(503).json({ message: 'Service temporarily unavailable. Orders are only available when the database is reachable.' });
    }

    const order = await Order.findOne({ id }).lean();
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.setHeader('X-Data-Source', 'db');
    return res.json({ ...order, _source: 'db' });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

// Place a new order
const placeOrder = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      city,
      postalCode,
      items,
      subtotal,
      shippingCost,
      giftWrap,
      giftWrapCost,
      giftMessage,
      total,
      notes,

      requestId,
      couponCode
    } = req.body;

    if (!customerName || !customerPhone || !shippingAddress || !city || !items || items.length === 0) {
      return res.status(400).json({ message: 'Missing required fields: customerName, customerPhone, shippingAddress, city, and items are required' });
    }

    const orderData = {
      customerName,
      customerEmail: customerEmail || '',
      customerPhone,
      shippingAddress,
      city,
      postalCode: postalCode || '',
      items,
      subtotal: subtotal || 0,
      shippingCost: shippingCost || 0,
      giftWrap: giftWrap || false,
      giftWrapCost: giftWrapCost || 0,
      giftMessage: giftMessage || '',
      total: total || subtotal || 0,
      notes: notes || '',
      couponCode: null,
      discountAmount: 0
    };

    // Apply Coupon Logic
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon) {
        if (coupon.isValid()) {
          // Check min amount
          if (coupon.minOrderAmount > 0 && orderData.subtotal < coupon.minOrderAmount) {
            // Coupon invalid due to amount, ignore or throw?
            // For now, we'll ignore it if it doesn't match criteria silently or maybe we should return error? 
            // Ideally frontend validated it. We will just not apply it if invalid.
            console.log(`Coupon ${couponCode} invalid for order amount ${orderData.subtotal}`);
          } else {
            // Calculate Discount
            let discount = 0;
            if (coupon.discountType === 'percentage') {
              discount = (orderData.subtotal * coupon.discountValue) / 100;
            } else {
              discount = coupon.discountValue;
            }

            // Cap discount at subtotal
            if (discount > orderData.subtotal) discount = orderData.subtotal;

            orderData.discountAmount = discount;
            orderData.couponCode = coupon.code;
            orderData.total = Math.max(0, orderData.total - discount);

            // Increment use count
            coupon.usedCount += 1;
            await coupon.save();
          }
        }
      }
    }

    // Refresh item images/details from DB to ensure valid (Cloudinary) URLs
    const enrichedItems = await Promise.all(orderData.items.map(async (item) => {
      const product = await Product.findOne({ id: item.productId });
      if (product) {
        return {
          ...item,
          image: product.image, // Force update image from source of truth
        };
      }
      return item;
    }));
    orderData.items = enrichedItems;

    let newOrder;

    // Ensure orders are persisted to MongoDB only. If DB is unavailable, return 503.
    if (!isDBAvailable()) {
      console.error('Database unavailable - refusing to place order to cache');
      return res.status(503).json({ message: 'Service temporarily unavailable. Orders can only be placed when the database is available.' });
    }

    try {
      // Idempotency: if requestId provided, return the existing order
      if (requestId) {
        const existing = await Order.findOne({ requestId }).lean();
        if (existing) {
          res.setHeader('X-Data-Source', 'db');
          return res.status(200).json({ message: 'Order already exists', order: { ...existing, _source: 'db' } });
        }
      }

      // Generate a short unique string id for the order (avoids race conditions with numeric increment)
      const newId = generateOrderId();

      const created = await Order.create({ id: newId, requestId, ...orderData });
      const plain = created?.toObject ? created.toObject() : created;
      res.setHeader('X-Data-Source', 'db');
      newOrder = { ...plain, _source: 'db' };
    } catch (dbErr) {
      console.error('Error saving order to DB:', dbErr);
      return res.status(500).json({ message: 'Error creating order', error: dbErr.message });
    }

    // Trigger Notifications & Stock Management (Async)
    (async () => {
      try {
        const settings = await AdminSettings.findOne() || {};

        // 1. Stock Deduction & Low Stock Alert
        const lowStockItems = [];
        for (const item of items) {
          // Decrement stock
          const product = await Product.findOne({ id: item.productId });
          if (product) {
            // Determine new stock
            // Optionally prevent negative stock? For now, we allow it or check logic before order.
            // Assuming we just want to track it.
            product.stock = Math.max(0, product.stock - item.quantity);
            await product.save();

            // Check Threshold (< 3)
            if (product.stock < 3) {
              lowStockItems.push({ title: product.title, stock: product.stock });
            }
          }
        }

        // Send Stock Alert if needed
        if (lowStockItems.length > 0 && settings.enableEmailNotifications && settings.notificationEmails?.length > 0) {
          await emailService.sendLowStockAlert(lowStockItems, settings.notificationEmails);
        }

        // 1. Email to Customer
        await emailService.sendOrderConfirmation(created);

        // 2. Email to Admin
        if (settings.enableEmailNotifications && settings.notificationEmails?.length > 0) {
          await emailService.sendAdminNewOrderAlert(created, settings.notificationEmails);
        }

        // 3. Push to Admin
        if (settings.enablePushNotifications) {
          await pushService.sendPushToAllAdmins({
            title: `New Order: Rs. ${created.total.toLocaleString()}`,
            body: `Order #${created.id} from ${created.customerName}`,
            url: '/admin/dashboard', // Open dashboard on click
            data: { url: '/admin/dashboard' }
          });
        }
      } catch (notifyErr) {
        console.error('Notification trigger error:', notifyErr);
      }
    })();

    res.status(201).json({ message: 'Order placed successfully', order: newOrder });
  } catch (error) {
    console.error('Error in placeOrder:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

// Update order status
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });

    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'Invalid order ID' });

    // Require DB for updates
    if (!isDBAvailable()) {
      console.error('Database unavailable - refusing to update order status');
      return res.status(503).json({ message: 'Service temporarily unavailable. Order updates require the database.' });
    }

    const updatedOrder = await Order.findOneAndUpdate({ id }, { $set: { status, updatedAt: new Date() } }, { new: true, lean: true });
    if (!updatedOrder) return res.status(404).json({ message: 'Order not found' });

    // Notify Customer
    emailService.sendOrderStatusUpdate(updatedOrder).catch(err => console.error('Status email error:', err));

    // Best-effort: keep cache in sync if available
    try { orderCache.upsertOrder(updatedOrder); } catch (e) { /* ignore cache errors */ }
    res.setHeader('X-Data-Source', 'db');
    return res.json({ message: 'Order status updated successfully', order: { ...updatedOrder, _source: 'db' } });
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

// Update payment status
const updatePayment = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const validStatuses = ['pending', 'paid'];
    if (!validStatuses.includes(paymentStatus)) return res.status(400).json({ message: `Invalid payment status. Must be one of: ${validStatuses.join(', ')}` });

    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'Invalid order ID' });

    // Require DB for payment updates
    if (!isDBAvailable()) {
      console.error('Database unavailable - refusing to update payment status');
      return res.status(503).json({ message: 'Service temporarily unavailable. Payment updates require the database.' });
    }

    const updatedOrder = await Order.findOneAndUpdate({ id }, { $set: { paymentStatus, updatedAt: new Date() } }, { new: true, lean: true });
    if (!updatedOrder) return res.status(404).json({ message: 'Order not found' });
    try { orderCache.upsertOrder(updatedOrder); } catch (e) { /* ignore cache errors */ }
    res.setHeader('X-Data-Source', 'db');
    return res.json({ message: 'Payment status updated successfully', order: { ...updatedOrder, _source: 'db' } });
  } catch (error) {
    res.status(500).json({ message: 'Error updating payment status', error: error.message });
  }
};

// Delete order
const removeOrder = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'Invalid order ID' });
    if (!isDBAvailable()) {
      console.error('Database unavailable - refusing to delete order');
      return res.status(503).json({ message: 'Service temporarily unavailable. Deleting orders requires the database.' });
    }

    const result = await Order.deleteOne({ id });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Order not found' });
    try { orderCache.deleteOrder(id); } catch (e) { /* ignore cache errors */ }
    res.setHeader('X-Data-Source', 'db');
    return res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting order', error: error.message });
  }
};

// Get order statistics
const getStats = async (req, res) => {
  try {
    if (!isDBAvailable()) {
      console.error('Database unavailable - cannot compute stats');
      return res.status(503).json({ message: 'Service temporarily unavailable. Statistics require the database.' });
    }

    // 1. Basic Counts (All non-deleted orders)
    // Filter out cancelled for "Total Orders" if requested, or keep them for transparency.
    // User asked to "dont add deleted orders". We'll assume 'cancelled' = deleted/ignored.
    const countsPipeline = [
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ];
    const countsAgg = await Order.aggregate(countsPipeline);
    const counts = { total: 0, pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };

    countsAgg.forEach(row => {
      if (row._id) counts[row._id] = row.count;
      counts.total += row.count; // Total valid orders
    });

    // 2. Revenue & Profit (Strictly DELIVERED orders only)
    const financialsPipeline = [
      { $match: { status: 'delivered' } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: 'id',
          as: 'productDetails'
        }
      },
      { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          revenue: { $multiply: ['$items.price', '$items.quantity'] },
          cost: { $multiply: [{ $ifNull: ['$productDetails.purchasePrice', 0] }, '$items.quantity'] },
          orderTotal: '$total' // Keep track of full order total if needed, but here we sum item margins
        }
      },
      {
        $group: {
          _id: null,
          grossProfit: { $sum: { $subtract: ['$revenue', '$cost'] } },
          // Note: Aggregating item revenue might slightly differ from Order.total (shipping/giftwrap). 
          // Use sum of order totals for Revenue, but calculate Margin from items.
          // Better approach for Revenue: Aggregate Orders directly.
        }
      }
    ];

    // Separate Revenue Aggregation to be accurate to Order Total (inc. shipping)
    const revenuePipeline = [
      { $match: { status: 'delivered' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
    ];

    const [financials, revenueAgg] = await Promise.all([
      Order.aggregate(financialsPipeline),
      Order.aggregate(revenuePipeline)
    ]);

    const totalProfit = financials[0]?.grossProfit || 0;
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    // 3. Monthly Sales (Delivered Orders)
    const monthlyPipeline = [
      { $match: { status: 'delivered' } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue: { $sum: "$total" }
        }
      },
      { $sort: { "_id": 1 } },
      { $limit: 12 } // Last 12 months
    ];
    const monthlyAgg = await Order.aggregate(monthlyPipeline);

    // Format for Chart (e.g., "Jan", "Feb")
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlySales = monthlyAgg.map(item => {
      const [year, month] = item._id.split('-');
      return {
        name: monthNames[parseInt(month) - 1], // Simple month name. For multi-year, maybe "Jan 24"
        fullDate: item._id,
        value: item.revenue
      };
    });

    res.setHeader('X-Data-Source', 'db');
    return res.json({
      total: counts.total, // Count of all non-cancelled
      delivered: counts.delivered, // Specific count
      pending: counts.pending,
      confirmed: counts.confirmed,
      processing: counts.processing,
      shipped: counts.shipped,
      cancelled: counts.cancelled,

      totalRevenue, // Delivered orders only
      totalProfit, // Delivered orders margin
      monthlySales, // Chart data

      _source: 'db'
    });

  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
};

// Get orders by customer contact (phone or email)
const getOrdersByCustomer = async (req, res) => {
  try {
    const contact = (req.params.contact || '').trim();
    if (!contact) return res.status(400).json({ message: 'Missing customer contact' });

    if (!isDBAvailable()) {
      console.error('Database unavailable - cannot fetch customer orders');
      return res.status(503).json({ message: 'Service temporarily unavailable. Orders are only available when the database is reachable.' });
    }

    // Try to match phone or email (case-insensitive for email)
    const query = {
      $or: [
        { customerPhone: contact },
        { customerEmail: { $regex: `^${contact}$`, $options: 'i' } }
      ]
    };

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
    res.setHeader('X-Data-Source', 'db');
    return res.json(orders.map(o => ({ ...o, _source: 'db' })));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customer orders', error: error.message });
  }
};

module.exports = { getAllOrders, getOrder, placeOrder, updateStatus, updatePayment, removeOrder, getStats, getOrdersByCustomer };

