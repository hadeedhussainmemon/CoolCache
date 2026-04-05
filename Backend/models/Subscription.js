const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    endpoint: {
        type: String,
        required: true,
        unique: true
    },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
