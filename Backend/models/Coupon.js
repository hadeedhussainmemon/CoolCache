const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    minOrderAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    expiryDate: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number,
        default: null // null means unlimited
    },
    usedCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Check if coupon is valid
couponSchema.methods.isValid = function () {
    if (!this.isActive) return false;
    if (this.expiryDate && new Date() > this.expiryDate) return false;
    if (this.usageLimit !== null && this.usedCount >= this.usageLimit) return false;
    return true;
};

module.exports = mongoose.model('Coupon', couponSchema);
