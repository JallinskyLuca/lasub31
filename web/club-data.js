'use strict';

// Datos reales del club. Completá los campos cuando estén confirmados.
// Para agregar fotos, guardá los archivos en assets/ y sumalos a equipo.fotos.
window.SUB31_DATA = {
  equipo: {
    fotos: [
      { archivo: 'assets/equipo/equipo-01.jpg', descripcion: 'El grupo de La Sub 31 reunido en la cancha, bajo las luces, después de jugar.', pie: 'El grupo, junto después del partido.' },
      { archivo: 'assets/equipo/equipo-02.jpg', descripcion: 'Jugadores y cuerpo técnico de La Sub 31 posando en la cancha antes del partido.', pie: 'Jugadores y cuerpo técnico, un mismo equipo.' },
      { archivo: 'assets/equipo/equipo-03.jpg', descripcion: 'El equipo de La Sub 31 formado en la cancha con la camiseta negra y detalles dorados.', pie: 'Nuestros colores, nuestra identidad.' }
    ]
  },
  torneo: {
    nombre: 'Super League Oficial',
    descripcion: 'La Sub 31 participa en Super League Oficial, una competencia con jornadas los sábados y domingos. Seguí nuestro recorrido y el fixture 2026. Las novedades del torneo están en su cuenta oficial.',
    temporada: '2026',
    jornadas: 'Sábados y domingos',
    organizador: '',
    categoria: '',
    formato: '',
    enlace: 'https://www.instagram.com/superleagueoficial/'
  },
  // Cada partido admite estas propiedades:
  // rival: nombre real del rival.
  // fecha: 'AAAA-MM-DD' (puede quedar vacía si todavía no está confirmada).
  // hora: 'HH:mm', en horario de Argentina.
  // cancha: nombre y ubicación de la cancha.
  // instancia: jornada, fecha o fase del torneo.
  // jornada: número de fecha del fixture.
  // sub31Primero: respeta el orden de los equipos en la placa original.
  // estado: 'programado', 'a-confirmar' o 'jugado'.
  // golesSub31 y golesRival: números, solo para partidos ya jugados.
  // goleadores: resumen de los autores de los goles informados por el club.
  // Fuente: resultados y fixture 2026 aportados por el club. Horarios y canchas pendientes.
  partidos: [
    { jornada: 1, rival: 'Tuxon FC', sub31Primero: false, fecha: '', hora: '', cancha: 'La Maderera, Ramos Mejía', estado: 'jugado', golesSub31: 3, golesRival: 1, goleadores: 'Theo Navarro, Santino Navarro y Luca Pernice' },
    { jornada: 2, rival: 'Paralympiacos FC', sub31Primero: false, fecha: '', hora: '', cancha: 'La Maderera, Ramos Mejía', estado: 'jugado', golesSub31: 5, golesRival: 1, goleadores: 'Theo Navarro (2) y Santino Navarro (3)' },
    { jornada: 3, rival: 'Real Potrero', sub31Primero: true, fecha: '', hora: '', cancha: 'La Maderera, Ramos Mejía', estado: 'jugado', golesSub31: 6, golesRival: 2, goleadores: 'Franco Jallinsky, Theo Navarro (2), Santino Navarro (2) y Luca Pernice' },
    { jornada: 4, rival: 'Ritmo y Sustancia FC', sub31Primero: false, fecha: '', hora: '', cancha: 'La Maderera, Ramos Mejía', estado: 'jugado', golesSub31: 5, golesRival: 3, goleadores: 'Franco Jallinsky, Santino Navarro (3) y Luca Pernice' },
    { jornada: 5, rival: 'Moldavita', sub31Primero: false, fecha: '', hora: '', cancha: 'La Maderera, Ramos Mejía', estado: 'jugado', golesSub31: 5, golesRival: 2, goleadores: 'Franco Jallinsky, Theo Navarro y Santino Navarro (3)' },
    { jornada: 6, rival: 'Realcoholicos', sub31Primero: false, fecha: '', hora: '', cancha: 'La Maderera, Ramos Mejía', estado: 'jugado', golesSub31: 4, golesRival: 3, goleadores: 'Lucas Data, Santino Navarro y Luca Pernice (2)' },
    { jornada: 7, rival: 'Otto FC', sub31Primero: true, fecha: '', hora: '', cancha: 'La Maderera, Ramos Mejía', estado: 'jugado', golesSub31: 6, golesRival: 1, goleadores: 'Emiliano Recanatti (2), Franco Jallinsky (2) y Theo Navarro' },
    { jornada: 8, rival: 'Ciudadela FC', sub31Primero: false, fecha: '2026-11-28', hora: '', cancha: 'La Maderera, Ramos Mejía', estado: 'programado' },
    { jornada: 9, rival: 'La Anlloneta', sub31Primero: true, fecha: '2026-12-05', hora: '', cancha: 'La Maderera, Ramos Mejía', estado: 'programado' },
    { jornada: 10, rival: 'El Maleanteo', sub31Primero: true, fecha: '2026-12-12', hora: '', cancha: 'La Maderera, Ramos Mejía', estado: 'programado' },
    { jornada: 11, rival: 'La Selección', sub31Primero: true, fecha: '2026-12-19', hora: '', cancha: 'La Maderera, Ramos Mejía', estado: 'programado' }
  ]
};
