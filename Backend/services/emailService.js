const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Connection verification removed to prevent startup blocking/timeouts
// The transporter will verify connection lazily when sending emails

exports.sendOrderConfirmation = async (order) => {
    try {
        if (!order.email) return;

        const mailOptions = {
            from: `"CoolCache" <${process.env.EMAIL_USER}>`,
            to: order.email,
            subject: `Order Confirmation - #${order.id}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4f46e5;">Thank you for your order!</h2>
                    <p>Hi ${order.firstName},</p>
                    <p>We have received your order <strong>#${order.id}</strong> and are getting it ready.</p>
                    
                    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3>Order Summary</h3>
                        <p><strong>Total:</strong> Rs. ${order.total.toLocaleString()}</p>
                        <p><strong>Payment Method:</strong> Cash on Delivery</p>
                    </div>

                    <p>We will notify you once your order is shipped!</p>
                    <br/>
                    <p>Best Regards,<br/>Team CoolCache</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Order Confirmation sent to ${order.email}`);
    } catch (error) {
        console.error('Failed to send order confirmation email:', error);
    }
};

exports.sendAdminNewOrderAlert = async (order, recipients) => {
    try {
        if (!recipients || recipients.length === 0) return;

        const mailOptions = {
            from: `"CoolCache Bot" <${process.env.EMAIL_USER}>`,
            to: recipients, // Array of strings is supported by nodemailer
            subject: `🔔 New Order Received - #${order.id}`,
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2 style="color: #10b981;">New Order #${order.id}</h2>
                    <p><strong>Customer:</strong> ${order.firstName} ${order.lastName}</p>
                    <p><strong>City:</strong> ${order.city}</p>
                    <p><strong>Total:</strong> Rs. ${order.total.toLocaleString()}</p>
                    <p><strong>Items:</strong> ${order.items?.length || 0}</p>
                    
                    <a href="https://www.coolcache.app/admin/orders" style="display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Order</a>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Admin Alert sent to ${recipients.length} recipients`);
    } catch (error) {
        console.error('Failed to send admin alert email:', error);
    }
};

exports.sendOrderStatusUpdate = async (order) => {
    try {
        if (!order.email) return;

        let subject = `Order Update - #${order.id}`;
        let message = `Your order status has been updated to: <strong>${order.status}</strong>`;

        if (order.status === 'shipped') {
            message = `Good news! Your order <strong>#${order.id}</strong> has been shipped and is on its way.`;
        } else if (order.status === 'delivered') {
            message = `Your order <strong>#${order.id}</strong> has been delivered. Thank you for shopping with us!`;
        } else if (order.status === 'cancelled') {
            message = `Your order <strong>#${order.id}</strong> has been cancelled.`;
        }

        const mailOptions = {
            from: `"CoolCache" <${process.env.EMAIL_USER}>`,
            to: order.email,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4f46e5;">Order Update</h2>
                    <p>Hi ${order.firstName},</p>
                    <p>${message}</p>
                    <br/>
                    <p>Best Regards,<br/>Team CoolCache</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Order Status Update sent to ${order.email}`);
    } catch (error) {
        console.error('Failed to send status update email:', error);
    }
};

exports.sendLowStockAlert = async (products, recipients) => {
    try {
        if (!recipients || recipients.length === 0 || products.length === 0) return;

        const productRows = products.map(p =>
            `<tr><td style="padding:8px; border-bottom:1px solid #ddd;">${p.title}</td><td style="padding:8px; border-bottom:1px solid #ddd; color:red; font-weight:bold;">${p.stock} remaining</td></tr>`
        ).join('');

        const mailOptions = {
            from: `"CoolCache Bot" <${process.env.EMAIL_USER}>`,
            to: recipients,
            subject: `⚠️ Low Stock Alert - ${products.length} Items`,
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2 style="color: #dc2626;">Low Stock Alert</h2>
                    <p>The following items satisfy the low stock threshold (< 3):</p>
                    
                    <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
                        <thead>
                            <tr style="background:#f3f4f6; text-align:left;">
                                <th style="padding:10px;">Product</th>
                                <th style="padding:10px;">Stock</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productRows}
                        </tbody>
                    </table>
                    
                    <a href="https://www.coolcache.app/admin/products" style="display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Manage Inventory</a>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Low Stock Alert sent for ${products.length} items`);
    } catch (error) {
        console.error('Failed to send low stock alert:', error);
    }
};
