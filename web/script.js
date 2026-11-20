'use strict';

// Menú móvil: cierre con Escape, navegación y recorrido de foco dentro del diálogo.
const menu = document.querySelector('#mobile-menu');
const menuToggle = document.querySelector('.menu-toggle');
const menuClose = document.querySelector('.menu-close');
const main = document.querySelector('main');
const header = document.querySelector('.site-header');
const footer = document.querySelector('.site-footer');
let savedFocus = null;

function closeMenu({ restoreFocus = true } = {}) {
  menu.hidden = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
  main.inert = header.inert = footer.inert = false;
  if (restoreFocus && savedFocus) savedFocus.focus({ preventScroll: true });
}

menuToggle.addEventListener('click', () => {
  savedFocus = document.activeElement;
  menu.hidden = false;
  menuToggle.setAttribute('aria-expanded', 'true');
  document.body.classList.add('menu-open');
  main.inert = header.inert = footer.inert = true;
  menuClose.focus({ preventScroll: true });
});
menuClose.addEventListener('click', () => closeMenu());
menu.addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); closeMenu(); }
  if (event.key !== 'Tab') return;
  const focusables = [...menu.querySelectorAll('a[href], button')];
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  closeMenu({ restoreFocus: false });
  const destination = document.querySelector(link.getAttribute('href'));
  if (destination) {
    destination.setAttribute('tabindex', '-1');
    destination.focus({ preventScroll: true });
  }
}));
window.matchMedia('(min-width: 1101px)').addEventListener('change', event => {
  if (event.matches && !menu.hidden) closeMenu();
});

// Cada conjunto comparte la misma estructura de vistas para intercambiarlas sin cambiar el alto.
const kits = {
  negra: {
    name: 'negra',
    detail: 'La franja blanca en V, los detalles dorados y el escudo sobre una base negra. Una camiseta con carácter.',
    views: {
      frente: { label: 'Frente', src: 'assets/camisetas/negra-frente.jpg', alt: 'Camiseta negra de La Sub 31, vista de frente.' },
      dorso: { label: 'Dorso', src: 'assets/camisetas/negra-dorso.jpg', alt: 'Camiseta negra de La Sub 31, vista de dorso.' },
      short: { label: 'Short', src: 'assets/camisetas/negra-short.jpg', alt: 'Short negro de La Sub 31 con el escudo y detalles dorados.' },
      conjunto: { label: 'Conjunto', src: 'assets/camisetas/negra-conjunto.jpg', alt: 'Conjunto negro de La Sub 31: camiseta de frente y de dorso, short y detalles.' }
    }
  },
  blanca: {
    name: 'blanca',
    detail: 'Una base blanca con la franja en V, terminaciones doradas y nuestro escudo. La misma identidad, otra expresión.',
    views: {
      frente: { label: 'Frente', src: 'assets/camisetas/blanca-frente.jpg', alt: 'Camiseta blanca de La Sub 31, vista de frente.' },
      dorso: { label: 'Dorso', src: 'assets/camisetas/blanca-dorso.jpg', alt: 'Camiseta blanca de La Sub 31, vista de dorso.' },
      short: { label: 'Short', src: 'assets/camisetas/blanca-short.jpg', alt: 'Short blanco de La Sub 31 con el escudo y detalles dorados.' },
      conjunto: { label: 'Conjunto', src: 'assets/camisetas/blanca-conjunto.jpg', alt: 'Conjunto blanco de La Sub 31: camiseta de frente y de dorso, short y detalles.' }
    }
  }
};
const kitTabs = [...document.querySelectorAll('.kit-tab')];
const sideButtons = [...document.querySelectorAll('[data-side]')];
const kitImage = document.querySelector('#kit-image');
const kitPanel = document.querySelector('#kit-panel');
const kitStage = document.querySelector('.kit-stage');
let selectedKit = 'negra';
let selectedSide = 'frente';
let imageVersion = 0;

function updateKit() {
  const kit = kits[selectedKit];
  const view = kit.views[selectedSide];
  kitTabs.forEach(tab => {
    const selected = tab.dataset.kit === selectedKit;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  sideButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.side === selectedSide)));
  kitPanel.setAttribute('aria-labelledby', 'tab-' + selectedKit);
  document.querySelector('#kit-detail').textContent = kit.detail;
  const version = ++imageVersion;
  const nextImage = new Image();
  kitStage.classList.add('is-changing');
  kitPanel.setAttribute('aria-busy', 'true');
  nextImage.onload = () => {
    if (version !== imageVersion) return;
    kitImage.src = nextImage.src;
    kitImage.alt = view.alt;
    document.querySelector('#kit-caption').textContent = view.label + ' · Camiseta ' + kit.name;
    document.querySelector('#kit-announcement').textContent = view.alt;
    kitStage.classList.remove('is-changing');
    kitPanel.removeAttribute('aria-busy');
  };
  nextImage.onerror = () => {
    if (version !== imageVersion) return;
    kitStage.classList.remove('is-changing');
    kitPanel.removeAttribute('aria-busy');
    document.querySelector('#kit-announcement').textContent = 'No se pudo cargar la vista. Volvé a seleccionar la camiseta para intentarlo de nuevo.';
  };
  nextImage.src = view.src;
}
kitTabs.forEach(tab => tab.addEventListener('click', () => { selectedKit = tab.dataset.kit; updateKit(); }));
document.querySelector('.kit-tabs').addEventListener('keydown', event => {
  if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const index = kitTabs.findIndex(tab => tab.dataset.kit === selectedKit);
  const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? kitTabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + kitTabs.length) % kitTabs.length;
  selectedKit = kitTabs[nextIndex].dataset.kit;
  kitTabs[nextIndex].focus();
  updateKit();
});
sideButtons.forEach(button => button.addEventListener('click', () => { selectedSide = button.dataset.side; updateKit(); }));

// Progreso de lectura; la navegación destaca la sección que se está viendo.
const progress = document.querySelector('.scroll-progress');
let pendingScroll = false;
function updateProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = 'scaleX(' + (scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0) + ')';
  pendingScroll = false;
}
window.addEventListener('scroll', () => {
  if (!pendingScroll) { pendingScroll = true; requestAnimationFrame(updateProgress); }
}, { passive: true });
window.addEventListener('resize', updateProgress);
updateProgress();
if ('IntersectionObserver' in window) {
  const navigation = [...document.querySelectorAll('.desktop-nav a')];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navigation.forEach(link => {
        if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });
  document.querySelectorAll('main > section[id]').forEach(section => observer.observe(section));
}
document.querySelector('#year').textContent = new Intl.DateTimeFormat('es-AR', { year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());

// Equipo, torneo y fixture se completan con los datos confirmados de club-data.js.
const clubData = window.SUB31_DATA || { equipo: {}, torneo: {}, partidos: [] };
// Carrusel manual: el deslizamiento es nativo, sin bloquear el scroll vertical.
const teamPhotos = clubData.equipo?.fotos || [];
const teamViewport = document.querySelector('#team-viewport');
if (teamPhotos.length) {
  const dots = document.querySelector('.team-dots');
  const slides = [];
  let activePhoto = 0;
  let scrollTimer;
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  teamViewport.replaceChildren();
  teamPhotos.forEach((photo, index) => {
    const slide = document.createElement('div');
    slide.className = 'team-slide';
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'diapositiva');
    slide.setAttribute('aria-label', `${index + 1} de ${teamPhotos.length}`);
    const image = document.createElement('img');
    image.src = photo.archivo;
    image.alt = photo.descripcion || 'El equipo de La Sub 31';
    image.loading = 'lazy';
    image.decoding = 'async';
    slide.append(image);
    slides.push(slide);
    teamViewport.append(slide);
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'team-dot';
    dot.setAttribute('aria-label', `Ver foto ${index + 1}`);
    dot.setAttribute('aria-controls', 'team-viewport');
    dot.addEventListener('click', () => goToPhoto(index));
    dots.append(dot);
  });
  function updatePhoto(index, announce = true) {
    const changed = activePhoto !== index;
    activePhoto = index;
    document.querySelector('#team-caption').textContent = teamPhotos[index].pie || 'La Sub 31, dentro de la cancha.';
    document.querySelector('#team-original').href = teamPhotos[index].archivo;
    document.querySelector('#team-counter').textContent = `${String(index + 1).padStart(2, '0')} / ${String(teamPhotos.length).padStart(2, '0')}`;
    [...dots.children].forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === index)));
    slides.forEach((slide, i) => slide.setAttribute('aria-hidden', String(i !== index)));
    if (announce && changed) document.querySelector('#team-status').textContent = `Foto ${index + 1} de ${teamPhotos.length}. ${teamPhotos[index].pie || ''}`;
  }
  function goToPhoto(index) {
    const next = (index + teamPhotos.length) % teamPhotos.length;
    updatePhoto(next);
    teamViewport.scrollTo({ left: next * teamViewport.clientWidth, behavior: motionPreference.matches ? 'instant' : 'smooth' });
  }
  function syncScroll() {
    updatePhoto(Math.max(0, Math.min(teamPhotos.length - 1, Math.round(teamViewport.scrollLeft / teamViewport.clientWidth))));
  }
  teamViewport.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(syncScroll, 150);
  }, { passive: true });
  document.querySelector('#team-prev').addEventListener('click', () => goToPhoto(activePhoto - 1));
  document.querySelector('#team-next').addEventListener('click', () => goToPhoto(activePhoto + 1));
  document.querySelector('.team-gallery').addEventListener('keydown', event => {
    const destinations = { ArrowLeft: activePhoto - 1, ArrowRight: activePhoto + 1, Home: 0, End: teamPhotos.length - 1 };
    if (!(event.key in destinations) || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    goToPhoto(destinations[event.key]);
  });
  if ('ResizeObserver' in window) new ResizeObserver(() => {
    teamViewport.scrollTo({ left: activePhoto * teamViewport.clientWidth, behavior: 'instant' });
  }).observe(teamViewport);
  document.querySelector('.team-controls').hidden = teamPhotos.length < 2;
  updatePhoto(0, false);
}

const tournament = clubData.torneo || {};
if (tournament.nombre) {
  document.querySelector('#tournament-name').textContent = tournament.nombre;
  document.querySelector('#tournament-pending').hidden = true;
  if (tournament.descripcion) document.querySelector('#tournament-description').textContent = tournament.descripcion;
  const facts = document.querySelector('#tournament-facts');
  [['Temporada', tournament.temporada], ['Jornadas', tournament.jornadas], ['Fixture', clubData.partidos?.length ? clubData.partidos.length + ' fechas publicadas' : ''], ['Organiza', tournament.organizador], ['Categoría', tournament.categoria], ['Formato', tournament.formato]].forEach(([label, value]) => {
    if (!value) return;
    const row = document.createElement('div');
    row.className = 'tournament-fact';
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value;
    row.append(term, description);
    facts.append(row);
  });
  facts.hidden = !facts.children.length;
  if (/^https?:\/\//i.test(tournament.enlace || '')) {
    const tournamentLink = document.querySelector('#tournament-link');
    tournamentLink.href = tournament.enlace;
    tournamentLink.hidden = false;
  }
}

const fixtureList = document.querySelector('#fixture-list');
const fixtureFilters = [...document.querySelectorAll('[data-fixture-filter]')];
function fixtureText(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}
function renderFixture(filter) {
  fixtureFilters.forEach(button => {
    const played = button.dataset.fixtureFilter === 'jugados';
    const count = (clubData.partidos || []).filter(match => (match.estado === 'jugado') === played).length;
    button.textContent = (played ? 'Jugados' : 'Próximos') + ' (' + count + ')';
    button.setAttribute('aria-pressed', String(button.dataset.fixtureFilter === filter));
  });
  const matches = (clubData.partidos || []).filter(match => (match.estado === 'jugado') === (filter === 'jugados'));
  matches.sort((a, b) => {
    const first = a.fecha || '9999-12-31';
    const second = b.fecha || '9999-12-31';
    const byDate = filter === 'jugados' ? second.localeCompare(first) : first.localeCompare(second);
    return byDate || (filter === 'jugados' ? (b.jornada || 0) - (a.jornada || 0) : (a.jornada || 0) - (b.jornada || 0));
  });
  fixtureList.replaceChildren();
  if (!matches.length) {
    const empty = fixtureText('div', 'fixture-empty', '');
    empty.append(fixtureText('p', '', filter === 'jugados' ? 'No hay resultados publicados.' : 'No hay próximos partidos publicados.'));
    empty.append(fixtureText('span', '', filter === 'jugados' ? 'Los resultados aparecerán aquí después de cada encuentro.' : 'Las fechas, horarios y canchas aparecerán aquí cuando estén confirmados.'));
    fixtureList.append(empty);
    return;
  }
  matches.forEach(match => {
    const row = fixtureText('article', 'match-row' + (match.estado === 'jugado' ? ' is-played' : ''), '');
    const dateBlock = fixtureText('div', 'match-date', '');
    const date = /^\d{4}-\d{2}-\d{2}$/.test(match.fecha || '') ? new Date(match.fecha + 'T12:00:00-03:00') : null;
    if (date && !Number.isNaN(date.getTime())) {
      const options = { timeZone: 'America/Argentina/Buenos_Aires' };
      dateBlock.append(fixtureText('strong', '', new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', ...options }).format(date)));
      dateBlock.append(fixtureText('span', '', new Intl.DateTimeFormat('es-AR', { weekday: 'long', year: 'numeric', ...options }).format(date)));
    } else if (match.jornada) {
      dateBlock.append(fixtureText('span', '', 'Fecha'));
      dateBlock.append(fixtureText('strong', '', String(match.jornada).padStart(2, '0')));
    } else dateBlock.append(fixtureText('span', '', 'Día a confirmar'));
    const opponent = fixtureText('div', 'match-opponent', '');
    const rival = match.rival || 'Rival a confirmar';
    opponent.append(fixtureText('h4', '', match.sub31Primero === false ? rival + ' vs. La Sub 31' : 'La Sub 31 vs. ' + rival));
    if (date && match.jornada) opponent.append(fixtureText('p', '', 'Fecha ' + match.jornada));
    if (match.instancia) opponent.append(fixtureText('p', '', match.instancia));
    if (match.estado === 'jugado' && match.goleadores) opponent.append(fixtureText('p', 'match-scorers', 'Goles: ' + match.goleadores));
    const place = fixtureText('div', 'match-place', '');
    if (match.estado === 'jugado') {
      place.append(fixtureText('strong', '', 'Sede del partido'));
      place.append(fixtureText('p', '', match.cancha || 'Cancha a confirmar'));
    } else {
      place.append(fixtureText('strong', '', match.hora ? match.hora + ' h' : match.fecha ? 'Horario a confirmar' : 'Día y horario a confirmar'));
      place.append(fixtureText('p', '', match.cancha || 'Cancha a confirmar'));
    }
    const scored = match.estado === 'jugado' && Number.isInteger(match.golesSub31) && Number.isInteger(match.golesRival);
    const score = match.sub31Primero === false ? match.golesRival + ' – ' + match.golesSub31 : match.golesSub31 + ' – ' + match.golesRival;
    const status = fixtureText(scored ? 'strong' : 'span', scored ? 'match-result' : 'match-status', scored ? score : match.estado === 'jugado' ? 'Jugado' : match.estado === 'a-confirmar' ? 'A confirmar' : 'Programado');
    if (scored) status.setAttribute('aria-label', 'Resultado: La Sub 31 ' + match.golesSub31 + ', ' + (match.rival || 'rival') + ' ' + match.golesRival);
    row.append(dateBlock, opponent, place, status);
    fixtureList.append(row);
  });
}
fixtureFilters.forEach(button => button.addEventListener('click', () => renderFixture(button.dataset.fixtureFilter)));
renderFixture('proximos');

// Aparición progresiva: mejora opcional, una sola vez por sección.
// El contenido permanece visible sin JS, sin IntersectionObserver o con movimiento reducido.
const revealMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !revealMotion.matches) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) revealSection(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });

  function revealSection(section, animate = true) {
    if (!section.classList.contains('section-reveal-pending')) return;
    section.classList.remove('section-reveal-pending');
    revealObserver.unobserve(section);
    if (animate && !revealMotion.matches) {
      section.classList.add('section-revealing');
      // Se limpian las animaciones para que no interfieran con los controles internos.
      setTimeout(() => section.classList.remove('section-revealing'), 800);
    }
  }

  document.querySelectorAll('main > section[id]:not(#inicio)').forEach(section => {
    // No ocultar contenido ya visible, visitado o abierto por un enlace directo.
    if (section.getBoundingClientRect().top < window.innerHeight * .92 || '#' + section.id === window.location.hash) return;
    section.classList.add('section-reveal-pending');
    revealObserver.observe(section);
  });

  main.addEventListener('focusin', event => {
    const section = event.target.closest('section.section-reveal-pending');
    if (section) revealSection(section, false);
  });
  revealMotion.addEventListener('change', event => {
    if (!event.matches) return;
    document.querySelectorAll('.section-reveal-pending').forEach(section => revealSection(section, false));
    document.querySelectorAll('.section-revealing').forEach(section => section.classList.remove('section-revealing'));
    revealObserver.disconnect();
  });
}
