import { settings, sameOrigin, body, verifyPassword, sessionToken, cookie, json, failure, HttpError, SESSION_SECONDS } from '../lib/security.mjs';
import { authStore, sessionKey } from '../lib/storage.mjs';

export function createLogin({ getAuthStore = authStore, getSettings = settings } = {}) {
return async function login(req) {
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido.');
    const cfg = getSettings();
    sameOrigin(req, cfg);
    const { password } = await body(req, 1024);
    // Límite global persistente adicional al límite de IP de la plataforma.
    const store = getAuthStore();
    const key = 'login-window';
    const now = Date.now();
    let reserved = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      const entry = await store.getWithMetadata(key, { type: 'json' });
      const counter = entry && entry.data.until > now ? entry.data : { count: 0, until: now + 15 * 60 * 1000 };
      if (counter.count >= 30) throw new HttpError(429, 'Demasiados intentos. Esperá 15 minutos.');
      const result = await store.setJSON(key, { count: counter.count + 1, until: counter.until }, entry ? { onlyIfMatch: entry.etag } : { onlyIfNew: true });
      if (result.modified) { reserved = true; break; }
    }
    if (!reserved) throw new HttpError(429, 'Esperá unos minutos antes de volver a intentar.');
    if (!await verifyPassword(password, cfg)) throw new HttpError(401, 'La contraseña no es correcta.');
    const token = sessionToken(cfg);
    await store.setJSON(sessionKey(token), { expires: now + SESSION_SECONDS * 1000 });
    // Limpieza de sesiones expiradas, sin registrar ni devolver sus tokens.
    const { blobs } = await store.list({ prefix: 'sessions/' });
    for (const blob of blobs) {
      const session = await store.get(blob.key, { type: 'json' });
      if (session?.expires <= now) await store.delete(blob.key);
    }
    return json({ ok: true }, 200, { 'Set-Cookie': cookie(token) });
  } catch (error) { return failure(error); }
};
}
export default createLogin();
export const config = { path: '/api/sub31/login', rateLimit: { windowLimit: 5, windowSize: 180, aggregateBy: ['ip', 'domain'], action: 'rate_limit' } };
