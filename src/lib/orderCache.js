// In-memory fallback cache for when MongoDB is unavailable
// This is NOT persistent across serverless function cold starts on Vercel
// but helps during a single instance's lifetime and hot-reloads.

let cached = global.orderCache;

if (!cached) {
  cached = global.orderCache = {
    orders: [],
    nextId: 1
  };
}

const cacheOperations = {
  getAllOrders: (filter = {}) => {
    let result = [...cached.orders];
    
    if (filter.status) {
      result = result.filter(o => o.status === filter.status);
    }
    if (filter.paymentStatus) {
      result = result.filter(o => o.paymentStatus === filter.paymentStatus);
    }
    
    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getOrderById: (id) => {
    return cached.orders.find(o => String(o.id) === String(id));
  },

  createOrder: (orderData) => {
    const newOrder = {
      id: String(cached.nextId++),
      ...orderData,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    cached.orders.push(newOrder);
    return newOrder;
  },

  upsertOrder: (order) => {
    if (!order || typeof order.id === 'undefined') return null;
    const idx = cached.orders.findIndex(o => String(o.id) === String(order.id));
    const merged = {
      ...cached.orders[idx] || {},
      ...order,
      createdAt: order.createdAt ? new Date(order.createdAt) : (cached.orders[idx]?.createdAt || new Date()),
      updatedAt: new Date()
    };
    if (idx === -1) {
      cached.orders.push(merged);
    } else {
      cached.orders[idx] = merged;
    }
    
    const numeric = Number.parseInt(order.id);
    if (!Number.isNaN(numeric)) {
      cached.nextId = Math.max(cached.nextId, numeric + 1);
    }
    return merged;
  },

  updateOrderStatus: (id, status) => {
    const index = cached.orders.findIndex(o => String(o.id) === String(id));
    if (index === -1) return null;
    
    cached.orders[index] = {
      ...cached.orders[index],
      status,
      updatedAt: new Date()
    };
    
    return cached.orders[index];
  },

  updatePaymentStatus: (id, paymentStatus) => {
    const index = cached.orders.findIndex(o => String(o.id) === String(id));
    if (index === -1) return null;
    
    cached.orders[index] = {
      ...cached.orders[index],
      paymentStatus,
      updatedAt: new Date()
    };
    
    return cached.orders[index];
  },

  deleteOrder: (id) => {
    const index = cached.orders.findIndex(o => String(o.id) === String(id));
    if (index === -1) return false;
    
    cached.orders.splice(index, 1);
    return true;
  },

  getStats: () => {
    const total = cached.orders.length;
    const pending = cached.orders.filter(o => o.status === 'pending').length;
    const confirmed = cached.orders.filter(o => o.status === 'confirmed').length;
    const processing = cached.orders.filter(o => o.status === 'processing').length;
    const shipped = cached.orders.filter(o => o.status === 'shipped').length;
    const delivered = cached.orders.filter(o => o.status === 'delivered').length;
    const cancelled = cached.orders.filter(o => o.status === 'cancelled').length;
    
    const totalRevenue = cached.orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, order) => sum + (order.total || 0), 0);
    
    const paidOrders = cached.orders.filter(o => o.paymentStatus === 'paid').length;
    
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

  syncFromDB: async (Order) => {
    try {
      const dbOrders = await Order.find({}).lean();
      cached.orders = dbOrders;
      
      const numericIds = cached.orders.map(o => Number.parseInt(o.id)).filter(n => !Number.isNaN(n));
      if (numericIds.length) {
        cached.nextId = Math.max(...numericIds) + 1;
      } else {
        cached.nextId = 1;
      }
      
      console.log(`✅ Order cache synced: ${cached.orders.length} orders loaded from DB`);
      return true;
    } catch (error) {
      console.error('Failed to sync order cache from DB:', error.message);
      return false;
    }
  },

  clear: () => {
    cached.orders = [];
    cached.nextId = 1;
  },

  getSize: () => cached.orders.length
};

export default cacheOperations;
export { cacheOperations };
