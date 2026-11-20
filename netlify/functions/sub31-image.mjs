import { contentStore } from '../lib/storage.mjs';
import { failure, HttpError } from '../lib/security.mjs';

export default async function image(req) {
  try {
    if (req.method !== 'GET') throw new HttpError(405, 'Método no permitido.');
    const id = new URL(req.url).pathname.split('/').pop();
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id)) throw new HttpError(404, 'Imagen no encontrada.');
    const data = await contentStore().get('images/' + id, { type: 'arrayBuffer' });
    if (!data) throw new HttpError(404, 'Imagen no encontrada.');
    return new Response(data, { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'" } });
  } catch (error) { return failure(error); }
}
export const config = { path: '/api/sub31/image/:id' };
