export function formatOrderConfirmationMessage(order) {
  if (!order) return '';
  const customerName = order.customerName || 'Customer';
  const totalQuantity = (order.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0);
  const paymentMethod = (order.paymentMethod || order.paymentStatus === 'paid') ? (order.paymentStatus === 'paid' ? 'Prepaid' : (order.paymentMethod || 'Cash on Delivery')) : 'Cash on Delivery';
  const address = [order.shippingAddress, order.city, order.postalCode].filter(Boolean).join(', ');

  const city = (order.city || '').toLowerCase();
  let eta = '3–7 days';
  if (city.includes('karachi')) eta = '2–4 days';
  else if (city.includes('lahore') || city.includes('islamabad') || city.includes('rawalpindi')) eta = '3–6 days';

  const trackUrl = `https://www.coolcache.app/track-order/${order.id}`;

  const itemsList = (order.items || []).map(i => `• ${i.title} (x${i.quantity})`).join('\n');

  return `📦 CoolCache — Order Confirmation Required

Hello ${customerName},
Thank you for placing an order with CoolCache! Before we proceed, please confirm the details below:

📝 Order Summary

${itemsList}
• Quantity: ${totalQuantity}
• Total Amount: ${order.total} PKR
• Payment Method: ${paymentMethod}

📍 Delivery Details

• Delivery Address: ${address}
• Estimated Delivery: ${eta}
• Track (after confirmation): ${trackUrl}

To process your order, please reply with:
"Yes, I confirm my order."

If you need any changes or have questions, feel free to message us anytime.

Thank you for choosing CoolCache!
We appreciate your quick response.`.trim();
}

export function formatOrderThankYouMessage(order) {
  if (!order) return '';
  const customerName = order.customerName || 'Customer';
  const firstName = customerName.split(' ')[0];
  const trackUrl = `https://www.coolcache.app/track-order/${order.id}`;

  return `✨ CoolCache — Order Confirmed

Hi ${firstName},
Your order (#${order.id}) is now confirmed and moving to processing. You can track status here: ${trackUrl}

We'll notify you when it's shipped.

Need help? Just reply to this message.

Thank you for shopping with CoolCache!`.trim();
}
