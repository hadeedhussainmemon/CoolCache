const AdminSettings = require('../models/AdminSettings');
const Subscription = require('../models/Subscription');

// Helper to get settings or create default
const getSettingsDoc = async () => {
    let settings = await AdminSettings.findOne();
    if (!settings) {
        settings = await AdminSettings.create({});
    }
    return settings;
};

exports.getSettings = async (req, res) => {
    try {
        const settings = await getSettingsDoc();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const updates = req.body;
        const settings = await AdminSettings.findOneAndUpdate({}, updates, { new: true, upsert: true });
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.subscribePush = async (req, res) => {
    try {
        const subscription = req.body;
        // Save subscription to DB
        // Check duplicate
        const exists = await Subscription.findOne({ endpoint: subscription.endpoint });
        if (!exists) {
            await Subscription.create(subscription);
            res.status(201).json({ message: 'Subscribed successfully' });
        } else {
            res.status(200).json({ message: 'Already subscribed' });
        }
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ message: 'Failed to subscribe' });
    }
};

exports.getPublicVapidKey = (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};
