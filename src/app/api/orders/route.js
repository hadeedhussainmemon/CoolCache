import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/db';
import Order from '../../../lib/models/Order';
import Product from '../../../lib/models/Product';
import Coupon from '../../../lib/models/Coupon';
import AdminSettings from '../../../lib/models/AdminSettings';
import { sendOrderConfirmation, sendAdminNewOrderAlert, sendLowStockAlert } from '../../../lib/services/emailService';
import { sendPushToAllAdmins } from '../../../lib/services/pushService';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const generateOrderId = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);

// GET /api/orders (Admin Only)
export async function GET(req) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    } catch (e) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');

    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
    const products = await Product.find({}, 'id image').lean();
    const productMap = new Map(products.map(p => [p.id, p.image]));

    const tagged = orders.map(o => {
      if (o.items && Array.isArray(o.items)) {
        o.items = o.items.map(item => ({
          ...item,
          image: productMap.get(item.productId) || item.image
        }));
      }
      return { ...o, _source: 'db' };
    });

    return NextResponse.json(tagged);
  } catch (error) {
    console.error('API Orders GET error:', error);
    return NextResponse.json({ message: 'Error fetching orders', error: error.message }, { status: 500 });
  }
}

// POST /api/orders (Place Order)
export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const {
      customerName, customerEmail, customerPhone, shippingAddress, city, postalCode,
      items, subtotal, shippingCost, giftWrap, giftWrapCost, giftMessage, total,
      notes, requestId, couponCode
    } = body;

    if (!customerName || !customerPhone || !shippingAddress || !city || !items || items.length === 0) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const orderData = {
      customerName, customerEmail: customerEmail || '', customerPhone, shippingAddress, city,
      postalCode: postalCode || '', items, subtotal: subtotal || 0, shippingCost: shippingCost || 0,
      giftWrap: !!giftWrap, giftWrapCost: giftWrapCost || 0, giftMessage: giftMessage || '',
      total: total || subtotal || 0, notes: notes || '', couponCode: null, discountAmount: 0
    };

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon && coupon.isActive && (!coupon.expiryDate || new Date() < coupon.expiryDate)) {
        if (!(coupon.minOrderAmount > 0 && orderData.subtotal < coupon.minOrderAmount)) {
          let discount = coupon.discountType === 'percentage' ? (orderData.subtotal * coupon.discountValue) / 100 : coupon.discountValue;
          discount = Math.min(discount, orderData.subtotal);
          orderData.discountAmount = discount;
          orderData.couponCode = coupon.code;
          orderData.total = Math.max(0, orderData.total - discount);
          coupon.usedCount += 1;
          await coupon.save();
        }
      }
    }

    const enrichedItems = await Promise.all(orderData.items.map(async (item) => {
      const product = await Product.findOne({ id: item.productId });
      return product ? { ...item, image: product.image } : item;
    }));
    orderData.items = enrichedItems;

    if (requestId) {
      const existing = await Order.findOne({ requestId }).lean();
      if (existing) return NextResponse.json({ message: 'Order already exists', order: { ...existing, _source: 'db' } });
    }

    const newId = generateOrderId();
    const created = await Order.create({ id: newId, requestId, ...orderData });
    const plain = created.toObject();

    // Async Notifications
    (async () => {
      try {
        const settings = await AdminSettings.findOne() || {};
        const lowStockItems = [];
        for (const item of items) {
          const product = await Product.findOne({ id: item.productId });
          if (product) {
            product.stock = Math.max(0, product.stock - item.quantity);
            await product.save();
            if (product.stock < 3) lowStockItems.push({ title: product.title, stock: product.stock });
          }
        }

        if (lowStockItems.length > 0 && settings.enableEmailNotifications && settings.notificationEmails?.length > 0) {
          await sendLowStockAlert(lowStockItems, settings.notificationEmails);
        }
        await sendOrderConfirmation(plain);
        if (settings.enableEmailNotifications && settings.notificationEmails?.length > 0) {
          await sendAdminNewOrderAlert(plain, settings.notificationEmails);
        }
        if (settings.enablePushNotifications) {
          await sendPushToAllAdmins({
            title: `New Order: Rs. ${plain.total.toLocaleString()}`,
            body: `Order #${plain.id} from ${plain.customerName}`,
            url: '/admin/dashboard'
          });
        }
      } catch (e) { console.error('Notification error:', e); }
    })();

    return NextResponse.json({ message: 'Order placed successfully', order: { ...plain, _source: 'db' } }, { status: 201 });
  } catch (error) {
    console.error('API Orders POST error:', error);
    return NextResponse.json({ message: 'Error creating order', error: error.message }, { status: 500 });
  }
}
