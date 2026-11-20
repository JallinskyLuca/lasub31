'use strict';

// Editor local. No transmite información ni modifica archivos del sitio.
(() => {
  const original = window.SUB31_DATA;
  const summary = document.querySelector('#summary');
  if (!original || !Array.isArray(original.partidos) || !original.partidos.length) {
    summary.textContent = 'No se pudo cargar el fixture. Abrí este editor junto al archivo club-data.js de la web.';
    return;
  }
  const base = JSON.stringify(original);
  const storageKey = 'sub31-fixture-draft-v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  let matches = clone(original.partidos);
  let selected = 0;
  const picker = document.querySelector('#match-picker');
  const form = document.querySelector('#match-form');
  const scores = document.querySelector('#scores');
  const status = document.querySelector('#draft-status');
  const feedback = document.querySelector('#feedback');
  let restored = false;
  try {
    const draft = JSON.parse(localStorage.getItem(storageKey));
    // Un archivo actualizado siempre tiene prioridad sobre un borrador anterior.
    if (draft?.base === base && Array.isArray(draft.partidos) && draft.partidos.length === matches.length && draft.partidos.every(match => match && typeof match === 'object')) {
      matches = draft.partidos;
      restored = true;
    }
  } catch { /* El editor también funciona si el navegador no admite almacenamiento local. */ }

  function matchLabel(match, index) {
    return `Fecha ${match.jornada || index + 1} · ${match.rival || 'Rival a completar'}${match.estado === 'jugado' ? ' · Jugado' : ''}`;
  }
  function updateSummary() {
    const played = matches.filter(match => match.estado === 'jugado').length;
    const pending = matches.length - played;
    summary.textContent = `${matches.length} partidos · ${played} ${played === 1 ? 'jugado' : 'jugados'} · ${pending} ${pending === 1 ? 'pendiente' : 'pendientes'}`;
  }
  function updatePicker() {
    picker.replaceChildren();
    matches.forEach((match, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = matchLabel(match, index);
      picker.append(option);
    });
    picker.value = String(selected);
    updateSummary();
  }
  function updateScoreFields() {
    const played = form.elements.estado.value === 'jugado';
    scores.hidden = !played;
    ['golesSub31', 'golesRival'].forEach(name => {
      form.elements[name].disabled = !played;
      form.elements[name].required = played;
    });
  }
  function renderMatch() {
    const match = matches[selected];
    document.querySelector('#match-title').textContent = `Fecha ${match.jornada || selected + 1}`;
    ['rival', 'estado', 'fecha', 'hora', 'cancha', 'golesSub31', 'golesRival'].forEach(name => {
      form.elements[name].value = match[name] ?? '';
      form.elements[name].setCustomValidity('');
    });
    form.elements.sub31Primero.value = String(match.sub31Primero !== false);
    updateScoreFields();
    picker.value = String(selected);
  }
  function saveDraft() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ base, partidos: matches }));
      status.textContent = 'Borrador guardado en este navegador. Todavía no está publicado.';
    } catch {
      status.textContent = 'Este navegador no pudo guardar el borrador. Descargá la actualización antes de cerrar esta página.';
    }
  }
  function readMatch() {
    const match = matches[selected];
    ['rival', 'estado', 'fecha', 'hora', 'cancha'].forEach(name => { match[name] = form.elements[name].value; });
    match.sub31Primero = form.elements.sub31Primero.value === 'true';
    ['golesSub31', 'golesRival'].forEach(name => {
      const value = form.elements[name].value;
      // No convertir un campo vacío en cero ni confundirlo con un empate.
      if (value === '') delete match[name];
      else match[name] = Number(value);
    });
    updateScoreFields();
    updatePicker();
    saveDraft();
  }
  form.addEventListener('input', event => {
    event.target.setCustomValidity('');
    feedback.textContent = '';
    readMatch();
  });
  form.addEventListener('change', readMatch);
  form.addEventListener('submit', event => event.preventDefault());
  picker.addEventListener('change', () => {
    selected = Number(picker.value);
    renderMatch();
    feedback.textContent = '';
  });

  function findError() {
    for (let index = 0; index < matches.length; index++) {
      const match = matches[index];
      if (!String(match.rival || '').trim()) return { index, field: 'rival', message: 'Completá el nombre del rival.' };
      if (!['a-confirmar', 'programado', 'jugado'].includes(match.estado)) return { index, field: 'estado', message: 'Elegí el estado del partido.' };
      if (match.estado === 'jugado') {
        for (const field of ['golesSub31', 'golesRival']) {
          if (!Number.isSafeInteger(match[field]) || match[field] < 0) return { index, field, message: 'Completá el resultado con números enteros, de cero en adelante.' };
        }
      }
    }
    return null;
  }
  document.querySelector('#download').addEventListener('click', () => {
    if (!form.reportValidity()) return;
    readMatch();
    const error = findError();
    if (error) {
      selected = error.index;
      renderMatch();
      feedback.textContent = `Fecha ${matches[selected].jornada || selected + 1}: ${error.message}`;
      form.elements[error.field].setCustomValidity(error.message);
      form.elements[error.field].reportValidity();
      return;
    }
    const data = clone(original);
    data.partidos = matches.map(match => {
      const normalized = { ...match, rival: match.rival.trim(), cancha: String(match.cancha || '').trim() };
      if (normalized.estado !== 'jugado') { delete normalized.golesSub31; delete normalized.golesRival; }
      return normalized;
    });
    const content = "'use strict';\n\n// Datos de La Sub 31. Editables con editar-fixture.html.\n// Fechas: AAAA-MM-DD. Horarios de Argentina.\nwindow.SUB31_DATA = " + JSON.stringify(data, null, 2) + ';\n';
    const url = URL.createObjectURL(new Blob([content], { type: 'text/javascript;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'club-data.js';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    feedback.textContent = 'Archivo generado. Reemplazá club-data.js en la carpeta de la web. Si el navegador agregó un número al nombre, quitáselo antes de subirlo.';
  });
  document.querySelector('#restore').addEventListener('click', () => {
    matches = clone(original.partidos);
    selected = 0;
    updatePicker();
    renderMatch();
    saveDraft();
    feedback.textContent = 'Se recuperaron los datos del archivo club-data.js. La web no fue modificada.';
  });
  updatePicker();
  renderMatch();
  if (restored) status.textContent = 'Se recuperó tu borrador de este navegador. Todavía no está publicado.';
  document.querySelector('#editor').hidden = false;
})();
