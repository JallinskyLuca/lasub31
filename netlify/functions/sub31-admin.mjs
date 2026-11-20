import { randomUUID } from 'node:crypto';
import { settings, requireWrite, sameOrigin, csrfToken, cookie, json, failure, HttpError, body } from '../lib/security.mjs';
import { contentStore, authStore, sessionKey, requireAdmin, readContent, saveContent, publicContent } from '../lib/storage.mjs';
import { validateContent } from '../lib/validation.mjs';
import { cleanImage } from '../lib/image.mjs';

export function createAdmin({ getContentStore = contentStore, getAuthStore = authStore, getSettings = settings } = {}) {
return async function admin(req) {
  try {
    if (!['GET', 'POST', 'DELETE'].includes(req.method)) throw new HttpError(405, 'Método no permitido.');
    const cfg = getSettings();
    const token = await requireAdmin(req, cfg, getAuthStore());
    if (req.method !== 'GET') { sameOrigin(req, cfg); requireWrite(req, cfg); }
    if (req.method === 'DELETE') {
      await getAuthStore().delete(sessionKey(token));
      return json({ ok: true }, 200, { 'Set-Cookie': cookie('', 0) });
    }
    const store = getContentStore();
    const current = await readContent(store);
    if (req.method === 'GET') return json({ ...publicContent(current.content), version: current.version, csrf: csrfToken(token, cfg), history: (current.content.history || []).map((item, index) => ({ index, date: item.updatedAt })) });
    const input = await body(req, 3000000);
    if (typeof input.version !== 'string' || input.version.length > 200) throw new HttpError(400, 'Falta la versión del contenido.');
    if (current.version !== input.version) throw new HttpError(409, 'Hay cambios más recientes. Recargá el panel.');
    let content, uploadedKey;
    if (input.action === 'restore') {
      if (!Number.isInteger(input.index) || input.index < 0 || input.index >= (current.content.history || []).length) throw new HttpError(400, 'La copia elegida no existe.');
      const { history, ...previous } = current.content.history[input.index];
      content = previous;
    } else if (input.action === 'save') {
      content = validateContent(input);
      content.tabla.imagen = current.content.tabla.imagen;
      if (input.image) {
        const cleaned = await cleanImage(input.image);
        const id = randomUUID();
        uploadedKey = 'images/' + id;
        await store.set(uploadedKey, cleaned);
        content.tabla.imagen = '/api/sub31/image/' + id;
      }
    } else throw new HttpError(400, 'Acción no permitida.');
    let saved;
    try { saved = await saveContent(store, current, content, input.version); }
    catch (error) {
      if (uploadedKey && error instanceof HttpError && error.status === 409) await store.delete(uploadedKey).catch(() => {});
      throw error;
    }
    // Solo se eliminan imágenes de este panel que ya no pertenecen a la versión actual ni a sus diez copias.
    const used = new Set([saved.content, ...saved.content.history].map(item => item.tabla.imagen));
    const obsolete = [current.content, ...(current.content.history || [])].map(item => item.tabla.imagen).filter(path => path.startsWith('/api/sub31/image/') && !used.has(path));
    for (const path of obsolete) await store.delete('images/' + path.split('/').pop()).catch(() => {});
    return json({ ok: true, ...publicContent(saved.content), version: saved.version });
  } catch (error) { return failure(error); }
};
}
export default createAdmin();
export const config = { path: '/api/sub31/admin', rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ['ip', 'domain'], action: 'rate_limit' } };
