import sharp from 'sharp';
import { HttpError } from './security.mjs';

export async function cleanImage(base64) {
  if (typeof base64 !== 'string' || base64.length > 2800000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) throw new HttpError(400, 'Elegí una imagen JPG, PNG o WebP de hasta 2 MB.');
  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length || buffer.length > 2 * 1024 * 1024) throw new HttpError(413, 'La imagen supera los 2 MB.');
  try {
    const image = sharp(buffer, { limitInputPixels: 16000000, animated: false, failOn: 'warning' });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format) || metadata.pages > 1 || !metadata.width || !metadata.height || metadata.width > 8000 || metadata.height > 8000) throw new Error();
    // Decodificar y recodificar elimina metadatos y contenido ajeno a los píxeles.
    return await image.rotate().resize({ width: 2400, height: 4000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 90 }).toBuffer();
  } catch { throw new HttpError(400, 'La imagen no es válida. Usá JPG, PNG o WebP sin animación.'); }
}
