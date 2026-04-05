const path = require('path');
const fs = require('fs/promises');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '../public/images');

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const res = path.resolve(dir, entry.name);
    return entry.isDirectory() ? await walk(res) : res;
  }));
  return files.flat();
}

async function compress(file) {
  const ext = path.extname(file).toLowerCase();
  const basename = file.slice(0, -ext.length);
  try {
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      // create avif and webp variants
      const avifFile = `${basename}.avif`;
      const webpFile = `${basename}.webp`;
      await sharp(file).avif({ quality: 60 }).toFile(avifFile);
      await sharp(file).webp({ quality: 75 }).toFile(webpFile);
      console.log('[compress] generated', path.relative(ROOT, avifFile), path.relative(ROOT, webpFile));
    } else if (ext === '.avif') {
      // Re-encode (optional) to ensure consistent quality
      const tmp = `${basename}.avif.tmp`;
      await sharp(file).avif({ quality: 60 }).toFile(tmp);
      await fs.rename(tmp, file);
      console.log('[compress] re-encoded', path.relative(ROOT, file));
    } else if (ext === '.webp') {
      const tmp = `${basename}.webp.tmp`;
      await sharp(file).webp({ quality: 75 }).toFile(tmp);
      await fs.rename(tmp, file);
      console.log('[compress] re-encoded', path.relative(ROOT, file));
    }
  } catch (err) {
    console.warn('[compress] error', err.message, 'for file', file);
  }
}

async function main() {
  try {
    console.log('starting compression in', ROOT);
    const all = await walk(ROOT);
    const images = all.filter(p => ['.png', '.jpg', '.jpeg', '.webp', '.avif'].includes(path.extname(p).toLowerCase()));
    for (const img of images) {
      await compress(img);
    }
    console.log('done');
  } catch (err) {
    console.error('error compressing images', err);
    process.exit(1);
  }
}

main();
