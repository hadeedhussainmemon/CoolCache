import mongoose from 'mongoose';

const adminSettingsSchema = new mongoose.Schema({
    notificationEmails: {
        type: [String],
        default: []
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

export const AdminSettings = mongoose.models.AdminSettings || mongoose.model('AdminSettings', adminSettingsSchema);
export default AdminSettings;
