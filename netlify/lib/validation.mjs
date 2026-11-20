import { HttpError } from './security.mjs';

function text(value, max, required = false) {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f<>]/.test(value) || (required && !value.trim())) throw new HttpError(400, 'Revisá los textos del formulario.');
  return value.trim();
}
export function validateContent(input) {
  if (!input || !Array.isArray(input.partidos) || input.partidos.length < 1 || input.partidos.length > 60 || !input.tabla) throw new HttpError(400, 'El fixture no es válido.');
  const seen = new Set();
  const partidos = input.partidos.map(match => {
    if (!match || !Number.isInteger(match.jornada) || match.jornada < 1 || match.jornada > 60 || seen.has(match.jornada) || typeof match.sub31Primero !== 'boolean' || !['jugado', 'a-confirmar', 'programado'].includes(match.estado)) throw new HttpError(400, 'Revisá la fecha y el estado del partido.');
    seen.add(match.jornada);
    const fecha = text(match.fecha, 10);
    const hora = text(match.hora, 5);
    if (fecha && (!/^20\d{2}-\d{2}-\d{2}$/.test(fecha) || !Number.isFinite(Date.parse(fecha)) || new Date(fecha).toISOString().slice(0, 10) !== fecha)) throw new HttpError(400, 'La fecha no es válida.');
    if (hora && !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) throw new HttpError(400, 'El horario no es válido.');
    const clean = { jornada: match.jornada, rival: text(match.rival, 100, true), sub31Primero: match.sub31Primero, estado: match.estado, fecha, hora, cancha: text(match.cancha, 180, true) };
    if (match.instancia) clean.instancia = text(match.instancia, 100);
    if (match.estado === 'jugado') {
      for (const field of ['golesSub31', 'golesRival']) {
        if (!Number.isInteger(match[field]) || match[field] < 0 || match[field] > 99) throw new HttpError(400, 'Los goles deben ser números enteros entre 0 y 99.');
        clean[field] = match[field];
      }
      clean.goleadores = text(match.goleadores || '', 700);
    }
    return clean;
  });
  const tabla = { titulo: text(input.tabla.titulo, 100, true), resumen: text(input.tabla.resumen, 500), puesto: text(input.tabla.puesto, 12), detalle: text(input.tabla.detalle, 80) };
  return { partidos, tabla };
}
