import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
export const COOKIE = '__Host-sub31-session';
export const SESSION_SECONDS = 3600;
export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function settings(env = process.env) {
  const origin = env.ADMIN_ORIGIN;
  if (!origin || new URL(origin).origin !== origin || !origin.startsWith('https://') ||
      !/^[a-f0-9]{64}$/.test(env.ADMIN_SESSION_SECRET || '') ||
      !/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(env.ADMIN_PASSWORD_HASH || '')) {
    throw new HttpError(503, 'El panel todavía no está configurado.');
  }
  return { origin, secret: env.ADMIN_SESSION_SECRET, hash: env.ADMIN_PASSWORD_HASH };
}
export function sameOrigin(req, cfg) {
  if (new URL(req.url).origin !== cfg.origin || req.headers.get('origin') !== cfg.origin ||
      (req.headers.get('sec-fetch-site') && req.headers.get('sec-fetch-site') !== 'same-origin')) {
    throw new HttpError(403, 'Solicitud no permitida.');
  }
}
export function signature(value, cfg) {
  return createHmac('sha256', cfg.secret).update(cfg.hash).update('\0').update(value).digest('base64url');
}
export async function passwordHash(password, salt = randomBytes(16).toString('hex')) {
  const key = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt:${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password, cfg) {
  if (typeof password !== 'string' || password.length < 16 || password.length > 256) return false;
  const [, salt, expected] = cfg.hash.split(':');
  const actual = (await passwordHash(password, salt)).split(':')[2];
  return timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}
export function sessionToken(cfg, now = Date.now()) {
  const value = Buffer.from(JSON.stringify({ exp: Math.floor(now / 1000) + SESSION_SECONDS, nonce: randomBytes(24).toString('hex') })).toString('base64url');
  return value + '.' + signature(value, cfg);
}
export function requireSession(req, cfg, now = Date.now()) {
  if (new URL(req.url).origin !== cfg.origin) throw new HttpError(403, 'Solicitud no permitida.');
  const token = (req.headers.get('cookie') || '').split(';').map(v => v.trim()).find(v => v.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1) || '';
  try {
    if (token.length > 600) throw new Error();
    const [value, mac, extra] = token.split('.');
    const expected = signature(value, cfg);
    if (extra || !mac || mac.length !== expected.length || !timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) throw new Error();
    const payload = JSON.parse(Buffer.from(value, 'base64url').toString());
    const seconds = Math.floor(now / 1000);
    if (!Number.isInteger(payload.exp) || payload.exp <= seconds || payload.exp > seconds + SESSION_SECONDS || !/^[a-f0-9]{48}$/.test(payload.nonce)) throw new Error();
    return token;
  } catch { throw new HttpError(401, 'Ingresá nuevamente al panel.'); }
}
export function csrfToken(session, cfg) { return signature('csrf:' + session, cfg); }
export function requireWrite(req, cfg) {
  sameOrigin(req, cfg);
  const token = requireSession(req, cfg);
  const received = req.headers.get('x-sub31-csrf') || '';
  const expected = csrfToken(token, cfg);
  if (received.length !== expected.length || !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) throw new HttpError(403, 'Solicitud no permitida.');
}
export function cookie(value, age = SESSION_SECONDS) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
}
export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', ...headers } });
}
export async function body(req, limit) {
  if (req.headers.get('content-type')?.split(';')[0] !== 'application/json') throw new HttpError(415, 'Formato no permitido.');
  if (Number(req.headers.get('content-length')) > limit) throw new HttpError(413, 'El archivo o formulario es demasiado grande.');
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, 'Faltan datos.');
  let length = 0;
  const chunks = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > limit) { await reader.cancel(); throw new HttpError(413, 'El archivo o formulario es demasiado grande.'); }
    chunks.push(Buffer.from(value));
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new HttpError(400, 'Los datos no son válidos.'); }
}
export function failure(error) {
  // No devolver stack traces, credenciales ni mensajes del proveedor.
  return json({ error: error instanceof HttpError ? error.message : 'No se pudo completar la operación. Intentá nuevamente.' }, error instanceof HttpError ? error.status : 500);
}
