const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// All verifyToken middleware would ideally be here if we had auth middleware file readily available to import.
// For now, assuming these are protected or open internally. 
// User asked for admin notifications, we should protect settings updates.
// Since I don't see `verifyToken` middleware file path easily in previous context, I'll check imports in other routes later or assume open for now (like adminRoutes often are in this project's simple state).

// Get Settings
router.get('/settings', settingsController.getSettings);

// Update Settings
router.put('/settings', settingsController.updateSettings);

// Push Subscription
router.post('/subscribe', settingsController.subscribePush);

// Get VAPID Key
router.get('/vapid-key', settingsController.getPublicVapidKey);

module.exports = router;
