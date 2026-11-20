import { contentStore, readContent, publicContent } from '../lib/storage.mjs';
import { json, failure, HttpError } from '../lib/security.mjs';

export default async function content(req) {
  try {
    if (req.method !== 'GET') throw new HttpError(405, 'Método no permitido.');
    const current = await readContent(contentStore());
    return json(publicContent(current.content), 200, { 'Cache-Control': 'public, max-age=0, must-revalidate', 'Netlify-CDN-Cache-Control': 'public, max-age=15' });
  } catch (error) { return failure(error); }
}
export const config = { path: '/api/sub31/content' };
