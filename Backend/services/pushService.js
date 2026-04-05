const webpush = require('web-push');
const Subscription = require('../models/Subscription');

// Configure VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:admin@coolcache.app',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
    console.log('✅ Web Push Service is configured');
} else {
    console.warn('⚠️ Web Push Service missing VAPID keys');
}

exports.sendPushToAllAdmins = async (payload) => {
    try {
        // In a real app with User roles, we'd query: User.find({ role: 'admin' })... then Subscriptions
        // Here we assume all subscriptions in the 'Subscription' collection are admins or authorized devices 
        // (since subscription usually happens via Admin panel in this context)
        const subscriptions = await Subscription.find({});

        if (subscriptions.length === 0) return;

        const notifications = subscriptions.map(sub => {
            return webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: sub.keys
            }, JSON.stringify(payload))
                .catch(err => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // Subscription has expired or is no longer valid
                        console.log('Removing expired subscription');
                        return Subscription.findByIdAndDelete(sub._id);
                    }
                    console.error('Push send error:', err);
                });
        });

        await Promise.all(notifications);
        console.log(`🔔 Push notification sent to ${subscriptions.length} devices`);
    } catch (error) {
        console.error('Failed to send push notifications:', error);
    }
};
