// In-memory fallback cache for when MongoDB is unavailable
// This is NOT persistent - only for temporary DB outages

let orders = [];
let nextId = 1;

const cacheOperations = {
  // Get all orders from cache
  getAllOrders: (filter = {}) => {
    let result = [...orders];
    
    if (filter.status) {
      result = result.filter(o => o.status === filter.status);
    }
    if (filter.paymentStatus) {
      result = result.filter(o => o.paymentStatus === filter.paymentStatus);
    }
    
    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // Get single order by ID
  getOrderById: (id) => {
    return orders.find(o => String(o.id) === String(id));
  },

  // Create new order
  createOrder: (orderData) => {
    const newOrder = {
      id: String(nextId++),
      ...orderData,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    orders.push(newOrder);
    return newOrder;
  },

  // Upsert an order with a pre-existing ID (used when DB is primary)
  upsertOrder: (order) => {
    if (!order || typeof order.id === 'undefined') return null;
    const idx = orders.findIndex(o => String(o.id) === String(order.id));
    const merged = {
      ...orders[idx] || {},
      ...order,
      createdAt: order.createdAt ? new Date(order.createdAt) : (orders[idx]?.createdAt || new Date()),
      updatedAt: new Date()
    };
    if (idx === -1) {
      orders.push(merged);
    } else {
      orders[idx] = merged;
    }
    // Keep nextId ahead of the highest known id
    // If the order id is numeric, ensure nextId moves forward
    const numeric = Number.parseInt(order.id);
    if (!Number.isNaN(numeric)) {
      nextId = Math.max(nextId, numeric + 1);
    }
    return merged;
  },

  // Update order status
  updateOrderStatus: (id, status) => {
    const index = orders.findIndex(o => String(o.id) === String(id));
    if (index === -1) return null;
    
    orders[index] = {
      ...orders[index],
      status,
      updatedAt: new Date()
    };
    
    return orders[index];
  },

  // Update payment status
  updatePaymentStatus: (id, paymentStatus) => {
    const index = orders.findIndex(o => String(o.id) === String(id));
    if (index === -1) return null;
    
    orders[index] = {
      ...orders[index],
      paymentStatus,
      updatedAt: new Date()
    };
    
    return orders[index];
  },

  // Delete order
  deleteOrder: (id) => {
    const index = orders.findIndex(o => String(o.id) === String(id));
    if (index === -1) return false;
    
    orders.splice(index, 1);
    return true;
  },

  // Get statistics
  getStats: () => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const confirmed = orders.filter(o => o.status === 'confirmed').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const shipped = orders.filter(o => o.status === 'shipped').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    
    const totalRevenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, order) => sum + (order.total || 0), 0);
    
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid').length;
    
    return {
      total,
      pending,
      confirmed,
      processing,
      shipped,
      delivered,
      cancelled,
      totalRevenue,
      paidOrders
    };
  },

  // Sync from database (restore cache from DB when it comes back online)
  syncFromDB: async (Order) => {
    try {
      const dbOrders = await Order.find({}).lean();
      orders = dbOrders;
      
      // Set nextId based on numeric ids in DB if available
      const numericIds = orders.map(o => Number.parseInt(o.id)).filter(n => !Number.isNaN(n));
      if (numericIds.length) {
        nextId = Math.max(...numericIds) + 1;
      } else {
        nextId = 1;
      }
      
      console.log(`✅ Cache synced: ${orders.length} orders loaded from DB`);
      return true;
    } catch (error) {
      console.error('Failed to sync cache from DB:', error.message);
      return false;
    }
  },

  // Clear cache (for testing)
  clear: () => {
    orders = [];
    nextId = 1;
  },

  // Get cache size
  getSize: () => orders.length
};

module.exports = cacheOperations;
