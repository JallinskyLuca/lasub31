import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { JSDOM } from 'jsdom';
import { settings, passwordHash, verifyPassword, sessionToken, requireSession, requireWrite, csrfToken, COOKIE, body } from '../netlify/lib/security.mjs';
import { validateContent } from '../netlify/lib/validation.mjs';
import { cleanImage } from '../netlify/lib/image.mjs';
import { createLogin } from '../netlify/functions/sub31-login.mjs';
import { createAdmin } from '../netlify/functions/sub31-admin.mjs';
import { readContent, publicContent } from '../netlify/lib/storage.mjs';

const password = 'contraseña-de-prueba-larga-2026';
const cfg = settings({ ADMIN_ORIGIN: 'https://lasub31.netlify.app', ADMIN_SESSION_SECRET: 'a'.repeat(64), ADMIN_PASSWORD_HASH: await passwordHash(password) });
const seed = JSON.parse(await readFile('netlify/generated/initial.json', 'utf8'));
class MemoryStore {
  entries = new Map(); sequence = 0;
  async getWithMetadata(key) { const value = this.entries.get(key); return value ? structuredClone(value) : null; }
  async get(key) { return (await this.getWithMetadata(key))?.data ?? null; }
  async setJSON(key, data, options = {}) {
    const previous = this.entries.get(key);
    if ((options.onlyIfNew && previous) || (options.onlyIfMatch && previous?.etag !== options.onlyIfMatch)) return { modified: false };
    const etag = '"' + (++this.sequence) + '"'; this.entries.set(key, { data: structuredClone(data), etag }); return { modified: true, etag };
  }
  async set(key, data) { return this.setJSON(key, data); }
  async delete(key) { this.entries.delete(key); }
  async list({ prefix }) { return { blobs: [...this.entries.keys()].filter(key => key.startsWith(prefix)).map(key => ({ key })) }; }
}
function request(path, method = 'GET', payload, token, csrf, origin = cfg.origin) {
  return new Request(cfg.origin + '/api/sub31/' + path, { method, headers: { Origin: origin, ...(payload ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Cookie: COOKIE + '=' + token } : {}), ...(csrf ? { 'X-Sub31-CSRF': csrf } : {}) }, ...(payload ? { body: JSON.stringify(payload) } : {}) });
}
function environment() {
  const auth = new MemoryStore(), store = new MemoryStore();
  return { auth, store, login: createLogin({ getAuthStore: () => auth, getSettings: () => cfg }), admin: createAdmin({ getAuthStore: () => auth, getContentStore: () => store, getSettings: () => cfg }) };
}
async function signIn(env) {
  const response = await env.login(request('login', 'POST', { password }));
  assert.equal(response.status, 200);
  const header = response.headers.get('set-cookie');
  for (const value of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/']) assert.ok(header.includes(value));
  return header.split(';')[0].slice(COOKIE.length + 1);
}
test('configuración cerrada sin secretos y verificación de contraseña', async () => {
  assert.throws(() => settings({}), { status: 503 });
  assert.equal(await verifyPassword(password, cfg), true);
  assert.equal(await verifyPassword('otra-contraseña-larga', cfg), false);
});
test('sesión manipulada, vencida y solicitudes de otro origen rechazadas', () => {
  const now = Date.now(); const token = sessionToken(cfg, now);
  assert.equal(requireSession(request('admin', 'GET', null, token), cfg, now), token);
  assert.throws(() => requireSession(request('admin', 'GET', null, token + 'x'), cfg), { status: 401 });
  assert.throws(() => requireSession(request('admin', 'GET', null, token), cfg, now + 3600001), { status: 401 });
  assert.throws(() => requireWrite(request('admin', 'POST', {}, token, csrfToken(token, cfg), 'https://otro.example'), cfg), { status: 403 });
  assert.throws(() => requireWrite(request('admin', 'POST', {}, token), cfg), { status: 403 });
});
test('validación del fixture, texto, fechas reales y campos desconocidos', () => {
  const clean = validateContent(seed);
  assert.equal(clean.partidos.length, 11);
  for (const mutation of [m => m.golesSub31 = -1, m => m.fecha = '2026-02-30', m => m.hora = '25:00', m => m.rival = '<script>alert(1)</script>']) {
    const invalid = structuredClone(seed); mutation(invalid.partidos[0]); assert.throws(() => validateContent(invalid), { status: 400 });
  }
  const duplicate = structuredClone(seed); duplicate.partidos[1].jornada = 1; assert.throws(() => validateContent(duplicate), { status: 400 });
  const extra = structuredClone(seed); extra.secret = 'no'; extra.tabla.imagen = 'https://otro.example';
  assert.equal(validateContent(extra).tabla.imagen, undefined);
  assert.equal(validateContent(extra).secret, undefined);
});
test('imágenes falsas, SVG y sobredimensionadas rechazadas; JPG real recodificado', async () => {
  const jpeg = await readFile('web/assets/Tablas.jpeg');
  const cleaned = await cleanImage(jpeg.toString('base64'));
  const metadata = await sharp(cleaned).metadata();
  assert.equal(metadata.format, 'webp'); assert.equal(metadata.exif, undefined);
  await assert.rejects(cleanImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>').toString('base64')), { status: 400 });
  await assert.rejects(cleanImage(Buffer.from('no es una imagen').toString('base64')), { status: 400 });
  await assert.rejects(cleanImage('A'.repeat(2800004)), { status: 400 });
});
test('cuerpos grandes o sin tipo JSON rechazados antes de guardar', async () => {
  await assert.rejects(body(request('admin', 'POST', { text: 'x'.repeat(2000) }), 100), { status: 413 });
  await assert.rejects(body(new Request(cfg.origin, { method: 'POST', body: '{}' }), 100), { status: 415 });
});
test('flujo completo: login, publicar resultados/foto, conflicto, recuperar y revocar sesión', async () => {
  const env = environment();
  assert.equal((await env.admin(request('admin', 'POST', {}))).status, 401);
  assert.equal((await env.login(request('login', 'POST', { password }, null, null, 'https://otro.example'))).status, 403);
  const token = await signIn(env);
  let current = await (await env.admin(request('admin', 'GET', null, token))).json();
  const payload = { ...structuredClone(seed), action: 'save', version: current.version };
  payload.partidos[7] = { ...payload.partidos[7], estado: 'jugado', golesSub31: 2, golesRival: 0, goleadores: 'Theo Navarro (2)' };
  payload.image = (await readFile('web/assets/Tablas.jpeg')).toString('base64');
  assert.equal((await env.admin(request('admin', 'POST', payload, token))).status, 403);
  const saved = await env.admin(request('admin', 'POST', payload, token, current.csrf));
  assert.equal(saved.status, 200);
  const savedData = await saved.json();
  assert.equal(savedData.partidos[7].golesSub31, 2); assert.match(savedData.tabla.imagen, /^\/api\/sub31\/image\//);
  assert.equal(publicContent((await readContent(env.store)).content).history, undefined);
  assert.equal((await env.admin(request('admin', 'POST', payload, token, current.csrf))).status, 409);
  const restored = await env.admin(request('admin', 'POST', { action: 'restore', index: 0, version: savedData.version }, token, current.csrf));
  assert.equal(restored.status, 200); assert.equal((await restored.json()).partidos[7].estado, 'programado');
  current = await (await env.admin(request('admin', 'GET', null, token))).json();
  for (let i = 0; i < 12; i++) {
    const response = await env.admin(request('admin', 'POST', { ...seed, action: 'save', version: current.version }, token, current.csrf));
    assert.equal(response.status, 200); current.version = (await response.json()).version;
  }
  assert.equal((await readContent(env.store)).content.history.length, 10);
  assert.equal((await env.admin(request('admin', 'DELETE', null, token, current.csrf))).status, 200);
  assert.equal((await env.admin(request('admin', 'GET', null, token))).status, 401);
});
test('límite global de intentos persiste entre peticiones', async () => {
  const env = environment();
  for (let i = 0; i < 30; i++) assert.equal((await env.login(request('login', 'POST', { password: 'corta' }))).status, 401);
  assert.equal((await env.login(request('login', 'POST', { password }))).status, 429);
});
test('panel: ingreso, selección de partido y guardado desde el formulario', async () => {
  const env = environment(); let token;
  const dom = new JSDOM(await readFile('web/sub31admin/index.html', 'utf8'), { url: cfg.origin + '/sub31admin/', runScripts: 'outside-only' });
  const w = dom.window;
  w.fetch = async (path, options = {}) => {
    const req = request(path.split('/').pop(), options.method || 'GET', options.body ? JSON.parse(options.body) : null, token, options.headers?.['X-Sub31-CSRF']);
    const response = await (path.endsWith('/login') ? env.login(req) : env.admin(req));
    if (response.headers.has('set-cookie')) token = response.headers.get('set-cookie').split(';')[0].slice(COOKIE.length + 1);
    return response;
  };
  const settle = async () => { for (let i = 0; i < 30; i++) await new Promise(resolve => setTimeout(resolve, 10)); };
  w.eval(await readFile('web/sub31admin/admin.js', 'utf8')); await settle();
  assert.equal(w.document.querySelector('#login').hidden, false);
  w.document.querySelector('[name=password]').value = password;
  w.document.querySelector('#login-form').dispatchEvent(new w.Event('submit', { cancelable: true })); await settle();
  assert.equal(w.document.querySelector('#editor').hidden, false);
  const picker = w.document.querySelector('#match-picker'); picker.value = '7'; picker.dispatchEvent(new w.Event('change'));
  const form = w.document.querySelector('#match-form'); form.elements.estado.value = 'jugado'; form.elements.estado.dispatchEvent(new w.Event('change', { bubbles: true }));
  for (const [name, value] of [['golesSub31', '4'], ['golesRival', '1'], ['goleadores', 'Theo Navarro (4)']]) { form.elements[name].value = value; form.elements[name].dispatchEvent(new w.Event('input', { bubbles: true })); }
  w.document.querySelector('#save').click(); await settle();
  const saved = await readContent(env.store); assert.equal(saved.content.partidos[7].golesSub31, 4); assert.match(w.document.querySelector('#feedback').textContent, /publicados/);
  dom.window.close();
});
test('web pública: carga de novedades, filtros y textos seguros sin HTML ejecutable', async () => {
  const dom = new JSDOM(await readFile('web/index.html', 'utf8'), { url: cfg.origin, runScripts: 'outside-only' });
  const w = dom.window;
  const content = structuredClone(seed);
  content.tabla.resumen = '<img src=x onerror=alert(1)>';
  content.tabla.imagen = '/api/sub31/image/11111111-1111-4111-8111-111111111111';
  content.tabla.puesto = '2.º';
  w.clubData = {}; w.renderFixture = filter => { w.lastFilter = filter; };
  w.AbortSignal.timeout = () => undefined;
  w.fetch = async () => ({ ok: true, json: async () => content });
  w.eval(await readFile('web/live-content.js', 'utf8'));
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(w.clubData.partidos.length, 11);
  assert.equal(w.lastFilter, 'proximos');
  assert.equal(w.document.querySelector('.standings-lead strong').textContent, '2.º');
  const summary = w.document.querySelector('.standings-copy > p:not([class])');
  assert.equal(summary.textContent, content.tabla.resumen); assert.equal(summary.querySelector('img'), null);
  assert.ok(w.document.querySelector('.standings-figure img').src.endsWith(content.tabla.imagen));
  dom.window.close();
});
