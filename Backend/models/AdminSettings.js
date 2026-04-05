const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema({
    notificationEmails: {
        type: [String],
        default: [] // List of emails to receive actionable alerts
    },
    enableEmailNotifications: {
        type: Boolean,
        default: true
    },
    enablePushNotifications: {
        type: Boolean,
        default: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Use a singleton pattern conceptually - we'll likely only have one document
module.exports = mongoose.model('AdminSettings', adminSettingsSchema);
