import { v2 as cloudinary } from 'cloudinary';
import pkg from '@next/env';
const { loadEnvConfig } = pkg;
import path from 'path';
import fs from 'fs';

// Load env variables using Next.js built-in helper
loadEnvConfig(process.cwd());

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Error: Cloudinary credentials missing in .env');
  console.error(`Cloud Name: ${cloudName ? 'OK' : 'MISSING'}`);
  console.error(`API Key: ${apiKey ? 'OK' : 'MISSING'}`);
  console.error(`API Secret: ${apiSecret ? 'OK' : 'MISSING'}`);
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

const imagesToUpload = [
  { file: 'public/images/hero/1.png', publicId: 'hero/1' },
  { file: 'public/images/hero/2.png', publicId: 'hero/2' },
  { file: 'public/images/hero/3.png', publicId: 'hero/3' }
];

async function uploadImages() {
  console.log('Starting Cloudinary upload...');
  
  for (const img of imagesToUpload) {
    const filePath = path.resolve(img.file);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      continue;
    }
    
    try {
      console.log(`Uploading ${img.file} to public_id: ${img.publicId}...`);
      const result = await cloudinary.uploader.upload(filePath, {
        public_id: img.publicId,
        overwrite: true,
        invalidate: true,
        resource_type: 'image'
      });
      console.log(`✓ Uploaded successfully! URL: ${result.secure_url}`);
    } catch (error) {
      console.error(`✗ Failed to upload ${img.file}:`, error.message || error);
    }
  }
  
  console.log('Upload process completed.');
}

uploadImages();
