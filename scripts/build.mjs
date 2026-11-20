import { readFile, mkdir, writeFile } from 'node:fs/promises';
import vm from 'node:vm';

// Solo ejecuta el archivo local del club durante el build, nunca entradas de la API.
const sandbox = { window: {} };
vm.runInNewContext(await readFile('web/club-data.js', 'utf8'), sandbox, { timeout: 1000 });
const html = await readFile('web/index.html', 'utf8');
const title = html.match(/class="standings-copy"[\s\S]*?<h3>([\s\S]*?)<\/h3>/)?.[1].replace(/<br\s*\/?>/g, ' ').replace(/<[^>]*>/g, '') || 'Tabla de posiciones';
await mkdir('netlify/generated', { recursive: true });
await writeFile('netlify/generated/initial.json', JSON.stringify({
  partidos: sandbox.window.SUB31_DATA.partidos,
  tabla: { titulo: title, imagen: '/assets/Tablas.jpeg', resumen: 'La Sub 31 lidera la tabla con 21 puntos después de siete partidos. Siete jugados, siete ganados.', puesto: '1.º', detalle: '21 puntos · 7 PJ' },
  updatedAt: null,
}));
console.log('Datos iniciales preparados para Netlify.');
