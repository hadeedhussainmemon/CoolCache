// Runtime configuration - works for both coolcache.app and www.coolcache.app
// Auto-detect if running on localhost for development
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

window.__APP_CONFIG__ = {
  API_BASE_URL: isLocalhost ? 'http://localhost:5000' : 'https://coolcache.onrender.com',
  API_PRODUCTS: '/api/products',
  IMAGE_BASE_URL: isLocalhost ? 'http://localhost:5000/images' : 'https://coolcache.onrender.com/images',
  WHATSAPP_NUMBER: '923121842124',
  INSTAGRAM_USERNAME: 'coolcache.app',
  CONTACT_EMAIL: 'coolcache.app@gmail.com'
};
