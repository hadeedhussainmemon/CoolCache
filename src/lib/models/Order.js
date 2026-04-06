import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: Number,
  title: String,
  price: Number,
  quantity: Number,
  image: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
  id: { type: String, index: { unique: true, sparse: true } },
  requestId: { type: String, index: true },
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  shippingAddress: String,
  city: String,
  postalCode: String,
  items: [orderItemSchema],
  subtotal: Number,
  shippingCost: Number,
  giftWrap: { type: Boolean, default: false },
  giftWrapCost: { type: Number, default: 0 },
  giftMessage: String,
  total: Number,
  couponCode: { type: String, default: null },
  discountAmount: { type: Number, default: 0 },
  notes: String,
  status: { type: String, default: 'pending' },
  paymentMethod: { type: String, default: 'COD' },
  paymentStatus: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { autoIndex: false });

orderSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;
