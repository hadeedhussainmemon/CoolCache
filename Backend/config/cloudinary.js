const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Cloudinary config missing! Check CLOUDINARY_CLOUD_NAME, _API_KEY, _API_SECRET in .env');
} else {
    console.log('✅ Cloudinary configured');
}

module.exports = cloudinary;
