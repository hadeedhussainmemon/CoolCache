const Coupon = require('../models/Coupon');

class CouponController {
    // Create a new coupon
    async createCoupon(req, res) {
        try {
            const { code, discountType, discountValue, minOrderAmount, expiryDate, usageLimit } = req.body;

            // Basic validation
            if (!code || !discountType || !discountValue || !expiryDate) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            // Check for existing code
            const existing = await Coupon.findOne({ code: code.toUpperCase() });
            if (existing) {
                return res.status(400).json({ message: 'Coupon code already exists' });
            }

            const coupon = new Coupon({
                code: code.toUpperCase(),
                discountType,
                discountValue: Number(discountValue),
                minOrderAmount: Number(minOrderAmount || 0),
                expiryDate: new Date(expiryDate),
                usageLimit: usageLimit ? Number(usageLimit) : null
            });

            await coupon.save();
            res.status(201).json(coupon);
        } catch (error) {
            console.error('createCoupon error:', error);
            res.status(500).json({ message: 'Error creating coupon', error: error.message });
        }
    }

    // Get all coupons (Admin)
    async getAllCoupons(req, res) {
        try {
            const coupons = await Coupon.find().sort({ createdAt: -1 });
            res.json(coupons);
        } catch (error) {
            console.error('getAllCoupons error:', error);
            res.status(500).json({ message: 'Error fetching coupons', error: error.message });
        }
    }

    // Delete coupon
    async deleteCoupon(req, res) {
        try {
            const { id } = req.params;
            await Coupon.findByIdAndDelete(id);
            res.json({ message: 'Coupon deleted successfully' });
        } catch (error) {
            console.error('deleteCoupon error:', error);
            res.status(500).json({ message: 'Error deleting coupon', error: error.message });
        }
    }

    // Validate coupon (Public)
    async validateCoupon(req, res) {
        try {
            const { code, cartTotal } = req.body; // cartTotal expected from frontend to check minOrderAmount

            if (!code) {
                return res.status(400).json({ message: 'Coupon code is required' });
            }

            const coupon = await Coupon.findOne({ code: code.toUpperCase() });

            if (!coupon) {
                return res.status(404).json({ message: 'Invalid coupon code' });
            }

            if (!coupon.isValid()) {
                return res.status(400).json({ message: 'Coupon is expired or inactive' });
            }

            if (cartTotal !== undefined && coupon.minOrderAmount > 0 && cartTotal < coupon.minOrderAmount) {
                return res.status(400).json({
                    message: `Minimum order amount of ${coupon.minOrderAmount} PKR required`
                });
            }

            // Calculate discount amount for preview
            let discountAmount = 0;
            if (coupon.discountType === 'percentage') {
                discountAmount = (cartTotal * coupon.discountValue) / 100;
            } else {
                discountAmount = coupon.discountValue;
            }

            // Ensure discount doesn't exceed total (mostly for fixed)
            if (discountAmount > cartTotal) discountAmount = cartTotal;

            res.json({
                valid: true,
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue, // % or fixed amount
                calculatedDiscount: discountAmount
            });

        } catch (error) {
            console.error('validateCoupon error:', error);
            res.status(500).json({ message: 'Error validating coupon', error: error.message });
        }
    }
}

module.exports = new CouponController();
