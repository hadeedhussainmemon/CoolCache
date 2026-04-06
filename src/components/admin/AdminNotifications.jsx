import React, { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Save, Plus, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// API Base URL - Consistent with other Admin components
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

// Helper for generic API calls
const apiCall = async (endpoint, method = 'GET', body = null) => {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('adminToken') : ''}`
    };

    // Construct full URL if API_BASE_URL is present, otherwise use relative
    const baseUrl = API_BASE_URL ? `${API_BASE_URL}/api/notifications` : '/api/notifications';

    const res = await fetch(`${baseUrl}/${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

const AdminNotifications = () => {
    const [settings, setSettings] = useState({
        enableEmailNotifications: true,
        enablePushNotifications: true,
        notificationEmails: []
    });
    const [newEmail, setNewEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [pushStatus, setPushStatus] = useState('unknown'); // 'subscribed', 'unsubscribed', 'denied'

    useEffect(() => {
        fetchSettings();
        checkPushStatus();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await apiCall('settings');
            setSettings(data);
        } catch (error) {
            console.error('Failed to load settings:', error);
            toast.error('Failed to load notification settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await apiCall('settings', 'PUT', settings);
            toast.success('Settings saved successfully');
        } catch (error) {
            toast.error('Failed to save settings');
        }
    };

    const toggleSetting = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const addEmail = () => {
        if (!newEmail) return;
        if (!newEmail.includes('@')) return toast.error('Invalid email');
        if (settings.notificationEmails.includes(newEmail)) return toast.error('Email already added');

        setSettings(prev => ({
            ...prev,
            notificationEmails: [...prev.notificationEmails, newEmail]
        }));
        setNewEmail('');
    };

    const removeEmail = (email) => {
        setSettings(prev => ({
            ...prev,
            notificationEmails: prev.notificationEmails.filter(e => e !== email)
        }));
    };

    // --- PUSH NOTIFICATION LOGIC ---

    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const checkPushStatus = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setPushStatus('unsupported');
            return;
        }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) setPushStatus('subscribed');
        else if (Notification.permission === 'denied') setPushStatus('denied');
        else setPushStatus('unsubscribed');
    };

    const subscribeToPush = async () => {
        try {
            if (pushStatus === 'denied') {
                return toast.error('Notifications blocked. Please enable them in browser settings.');
            }

            const reg = await navigator.serviceWorker.ready;

            // Get VAPID key
            const { publicKey } = await apiCall('vapid-key');

            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });

            // Send to backend
            await apiCall('subscribe', 'POST', sub);

            toast.success('This device is now subscribed to Order Alerts!');
            setPushStatus('subscribed');
        } catch (error) {
            console.error('Push subscription failed:', error);
            toast.error('Failed to subscribe to push notifications');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading settings...</div>;

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Notification Settings</h2>
                    <p className="text-slate-500">Manage how you receive alerts for new orders.</p>
                </div>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors"
                >
                    <Save size={18} />
                    Save Changes
                </button>
            </div>

            {/* Email Settings */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Mail size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Email Notifications</h3>
                            <p className="text-sm text-slate-500">Receive an email whenever a new order is placed.</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.enableEmailNotifications}
                            onChange={() => toggleSetting('enableEmailNotifications')}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {settings.enableEmailNotifications && (
                    <div className="ml-16 space-y-4">
                        <label className="block text-sm font-medium text-slate-700">Recipient Emails</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addEmail()}
                                placeholder="Enter email address"
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button
                                onClick={addEmail}
                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {settings.notificationEmails.map(email => (
                                <span key={email} className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                                    {email}
                                    <button onClick={() => removeEmail(email)} className="hover:text-blue-900"><X size={14} /></button>
                                </span>
                            ))}
                            {settings.notificationEmails.length === 0 && (
                                <span className="text-sm text-slate-400 italic">No emails added yet.</span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Push Settings */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                            <Smartphone size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Push Notifications</h3>
                            <p className="text-sm text-slate-500">Receive instant alerts on this device.</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.enablePushNotifications}
                            onChange={() => toggleSetting('enablePushNotifications')}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>

                <div className="ml-16">
                    {pushStatus === 'subscribed' ? (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg border border-green-100">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="font-medium">This device is subscribed to alerts.</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pushStatus === 'denied' && (
                                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg text-sm">
                                    <AlertCircle size={16} />
                                    <span>Notifications are blocked. Reset browser permissions to enable.</span>
                                </div>
                            )}
                            <button
                                onClick={subscribeToPush}
                                disabled={!settings.enablePushNotifications || pushStatus === 'denied' || pushStatus === 'unsupported'}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${settings.enablePushNotifications && pushStatus !== 'denied'
                                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                Subscribe This Device
                            </button>
                            <p className="text-xs text-slate-500 mt-2">
                                Note: You need to subscribe on every device (Laptop, Phone) where you want to receive alerts.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminNotifications;
