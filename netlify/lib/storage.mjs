import { getStore } from '@netlify/blobs';
import { readFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { HttpError, requireSession } from './security.mjs';

export const contentStore = () => getStore({ name: 'sub31-content', consistency: 'strong' });
export const authStore = () => getStore({ name: 'sub31-auth', consistency: 'strong' });
export const sessionKey = token => 'sessions/' + createHash('sha256').update(token).digest('hex');
export async function requireAdmin(req, cfg, store = authStore()) {
  const token = requireSession(req, cfg);
  const session = await store.get(sessionKey(token), { type: 'json' });
  if (!session || session.expires <= Date.now()) throw new HttpError(401, 'Ingresá nuevamente al panel.');
  return token;
}
export async function initialContent() {
  return JSON.parse(await readFile('netlify/generated/initial.json', 'utf8'));
}
export async function readContent(store = contentStore()) {
  const entry = await store.getWithMetadata('current', { type: 'json' });
  return entry ? { content: entry.data, version: entry.etag } : { content: await initialContent(), version: 'initial' };
}
export async function saveContent(store, current, content, expectedVersion) {
  if (current.version !== expectedVersion) throw new HttpError(409, 'Hay una versión más reciente. Recargá el panel antes de guardar.');
  // Las últimas diez versiones viajan en el mismo objeto: un único guardado atómico.
  const { history: ignored, ...previous } = current.content;
  const next = { ...content, updatedAt: new Date().toISOString(), revision: randomUUID(), history: [previous, ...(current.content.history || [])].slice(0, 10) };
  const result = await store.setJSON('current', next, current.version === 'initial' ? { onlyIfNew: true } : { onlyIfMatch: current.version });
  if (!result.modified) throw new HttpError(409, 'Otra pestaña guardó cambios. Recargá antes de volver a guardar.');
  return { content: next, version: result.etag };
}
export function publicContent(content) {
  return { partidos: content.partidos, tabla: content.tabla, updatedAt: content.updatedAt };
}
