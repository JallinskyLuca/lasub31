'use strict';
if (location.protocol !== 'file:') {
  fetch('/api/sub31/content', { credentials: 'omit', signal: AbortSignal.timeout(8000) })
    .then(response => { if (!response.ok) throw new Error(); return response.json(); })
    .then(data => {
      if (!Array.isArray(data.partidos) || !data.tabla) throw new Error();
      clubData.partidos = data.partidos;
      const active = document.querySelector('[data-fixture-filter][aria-pressed="true"]');
      renderFixture(active?.dataset.fixtureFilter || 'proximos');
      const table = data.tabla;
      const block = document.querySelector('#posiciones');
      if (table.titulo) block.querySelector('h3').textContent = table.titulo;
      const image = table.imagen;
      if (image === '/assets/Tablas.jpeg' || /^\/api\/sub31\/image\/[a-f0-9-]{36}$/.test(image)) {
        block.querySelectorAll('a').forEach(link => { link.href = image; });
        const photo = block.querySelector('img'); photo.src = image;
        photo.alt = 'Tabla de posiciones compartida por La Sub 31.';
        photo.removeAttribute('width'); photo.removeAttribute('height');
      }
      block.querySelector('.standings-copy > p:not([class])').textContent = table.resumen || '';
      block.querySelector('.standings-lead strong').textContent = table.puesto || '';
      block.querySelector('.standings-lead span').textContent = table.detalle || '';
      block.querySelector('.standings-lead').hidden = !table.puesto && !table.detalle;
      const status = document.querySelector('#fixture-live-status');
      status.textContent = data.updatedAt ? 'Actualizado: ' + new Date(data.updatedAt).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'short', timeStyle: 'short' }) : '';
    })
    .catch(() => { document.querySelector('#fixture-live-status').textContent = 'No pudimos consultar las últimas novedades. Se muestra la versión de respaldo.'; });
}
