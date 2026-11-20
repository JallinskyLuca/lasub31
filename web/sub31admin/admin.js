'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const matchForm = $('#match-form'), tableForm = $('#table-form');
  let data, csrf, selected = 0, dirty = false, busy = false, image = '', previewURL;
  function message(text, error = false) { $('#feedback').textContent = text; $('#feedback').dataset.error = String(error); }
  function changed() { dirty = true; $('#dirty-state').textContent = 'Hay cambios sin publicar.'; }
  function setBusy(value) {
    busy = value;
    for (const el of document.querySelectorAll('button, input, select, textarea')) el.disabled = value;
    if (!value && data) { scoreFields(); $('#history').disabled = !data.history.length; }
  }
  async function api(path, method = 'GET', payload) {
    const response = await fetch('/api/sub31/' + path, { method, credentials: 'same-origin', cache: 'no-store', headers: { ...(payload ? { 'Content-Type': 'application/json' } : {}), ...(method !== 'GET' && csrf ? { 'X-Sub31-CSRF': csrf } : {}) }, ...(payload ? { body: JSON.stringify(payload) } : {}) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && path !== 'login') { $('#editor').hidden = true; $('#login').hidden = false; csrf = ''; }
      throw new Error(result.error || (response.status === 429 ? 'Demasiados intentos. Esperá 15 minutos.' : 'No se pudo conectar con el panel.'));
    }
    return result;
  }
  function option(value, label) { const el = document.createElement('option'); el.value = value; el.textContent = label; return el; }
  function scoreFields() {
    const played = matchForm.elements.estado.value === 'jugado';
    $('#scores').hidden = !played;
    for (const name of ['golesSub31', 'golesRival', 'goleadores']) { matchForm.elements[name].disabled = !played; matchForm.elements[name].required = played && name !== 'goleadores'; }
  }
  function renderMatch() {
    const match = data.partidos[selected];
    for (const name of ['rival', 'estado', 'fecha', 'hora', 'cancha', 'golesSub31', 'golesRival', 'goleadores']) matchForm.elements[name].value = match[name] ?? '';
    matchForm.elements.sub31Primero.value = String(match.sub31Primero);
    scoreFields();
  }
  function readMatch() {
    const match = data.partidos[selected];
    for (const name of ['rival', 'estado', 'fecha', 'hora', 'cancha', 'goleadores']) match[name] = matchForm.elements[name].value;
    match.sub31Primero = matchForm.elements.sub31Primero.value === 'true';
    for (const name of ['golesSub31', 'golesRival']) {
      if (matchForm.elements[name].value === '') delete match[name];
      else match[name] = Number(matchForm.elements[name].value);
    }
    scoreFields();
  }
  function resetImage() {
    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = undefined; image = ''; $('#image-file').value = ''; $('#discard-image').hidden = true;
    $('#table-preview').src = data.tabla.imagen;
  }
  async function load() {
    const loaded = await api('admin');
    data = loaded; csrf = loaded.csrf;
    selected = Math.min(selected, data.partidos.length - 1);
    $('#match-picker').replaceChildren(...data.partidos.map((m, i) => option(i, `Fecha ${m.jornada} · ${m.rival}`)));
    $('#match-picker').value = String(selected);
    renderMatch();
    for (const name of ['titulo', 'resumen', 'puesto', 'detalle']) tableForm.elements[name].value = data.tabla[name] || '';
    resetImage();
    const format = date => date ? new Date(date).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) : 'Versión inicial';
    $('#updated').textContent = data.updatedAt ? 'Último guardado: ' + format(data.updatedAt) : 'Todavía no guardaste cambios desde el panel.';
    $('#history').replaceChildren(...data.history.map(item => option(item.index, format(item.date))));
    $('#restore').hidden = !data.history.length;
    $('#history').disabled = !data.history.length;
    dirty = false; $('#dirty-state').textContent = 'Sin cambios pendientes.';
    $('#login').hidden = true; $('#editor').hidden = false;
  }
  $('#login-form').addEventListener('submit', async event => {
    event.preventDefault(); if (busy) return; setBusy(true);
    try {
      await api('login', 'POST', { password: event.target.elements.password.value });
      event.target.elements.password.value = '';
      await load(); message('Sesión iniciada.');
    } catch (error) { message(error.message, true); }
    finally { setBusy(false); }
  });
  $('#match-picker').addEventListener('change', () => { readMatch(); selected = Number($('#match-picker').value); renderMatch(); });
  matchForm.addEventListener('input', () => { readMatch(); changed(); });
  matchForm.addEventListener('change', () => { readMatch(); changed(); });
  matchForm.addEventListener('submit', event => event.preventDefault());
  tableForm.addEventListener('submit', event => event.preventDefault());
  tableForm.addEventListener('input', changed);
  $('#image-file').addEventListener('change', async () => {
    const file = $('#image-file').files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) { resetImage(); message('Elegí un JPG, PNG o WebP de hasta 2 MB.', true); return; }
    setBusy(true);
    try {
      image = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(file); });
      if (previewURL) URL.revokeObjectURL(previewURL);
      previewURL = URL.createObjectURL(file); $('#table-preview').src = previewURL; $('#discard-image').hidden = false; changed(); message('Foto lista para guardar.');
    } catch { resetImage(); message('No se pudo leer la foto.', true); }
    finally { setBusy(false); }
  });
  $('#discard-image').addEventListener('click', resetImage);
  $('#save').addEventListener('click', async () => {
    if (busy || !matchForm.reportValidity() || !tableForm.reportValidity()) return;
    readMatch();
    for (let i = 0; i < data.partidos.length; i++) {
      const m = data.partidos[i];
      if (!m.rival.trim() || !m.cancha.trim() || (m.estado === 'jugado' && (!Number.isInteger(m.golesSub31) || !Number.isInteger(m.golesRival)))) {
        selected = i; $('#match-picker').value = String(i); renderMatch(); message('Completá los datos de la fecha ' + m.jornada + '.', true); matchForm.reportValidity(); return;
      }
    }
    const tabla = Object.fromEntries(['titulo', 'resumen', 'puesto', 'detalle'].map(name => [name, tableForm.elements[name].value]));
    setBusy(true);
    try {
      const saved = await api('admin', 'POST', { action: 'save', version: data.version, partidos: data.partidos, tabla, ...(image ? { image } : {}) });
      data.version = saved.version; dirty = false;
      await load(); message('Cambios publicados. La web los mostrará al recargar, con una demora de hasta 15 segundos.');
    } catch (error) { message(error.message, true); }
    finally { setBusy(false); }
  });
  $('#restore').addEventListener('click', async () => {
    if (busy || !confirm('¿Recuperar esta versión del fixture y la foto? Los cambios actuales quedarán en el historial.')) return;
    setBusy(true);
    try { await api('admin', 'POST', { action: 'restore', index: Number($('#history').value), version: data.version }); await load(); message('Versión recuperada y publicada.'); }
    catch (error) { message(error.message, true); }
    finally { setBusy(false); }
  });
  $('#logout').addEventListener('click', async () => {
    if (busy || (dirty && !confirm('Tenés cambios pendientes. ¿Cerrar sesión sin publicarlos?'))) return;
    setBusy(true);
    try { await api('admin', 'DELETE'); data = undefined; dirty = false; csrf = ''; $('#editor').hidden = true; $('#login').hidden = false; message('Sesión cerrada.'); }
    catch (error) { message(error.message, true); }
    finally { setBusy(false); }
  });
  $('#export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ partidos: data.partidos, tabla: data.tabla, updatedAt: data.updatedAt }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'sub31-fixture.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  load().then(() => message('Panel listo.')).catch(error => { $('#login').hidden = false; message(error.message, true); });
})();
