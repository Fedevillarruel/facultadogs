/**
 * FACULTADOGS — JavaScript Principal
 *
 * Funcionalidades:
 *  1. Animaciones de aparición con Intersection Observer
 *  2. Header: comportamiento al hacer scroll
 *  3. Menú mobile (hamburguesa)
 *  4. Carga diferida del video hero (performance en mobile)
 *  5. Scroll suave para anclas internas
 *  6. Marcado de sección activa en la navegación
 *  7. Animación de conteo para el puntaje de testimonios
 */

'use strict';

/* ----------------------------------------------------------------
   UTILS
   ---------------------------------------------------------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ----------------------------------------------------------------
   1. POPUP DE DEMO — Se muestra siempre al cargar (es un demo)
   ---------------------------------------------------------------- */
function initDemoPopup() {
  const overlay = $('#demo-overlay');
  const cerrarBtn = $('#demo-cerrar');
  if (!overlay || !cerrarBtn) return;

  // Enfocar el botón "Ver el demo" cuando el popup abre (accesibilidad)
  setTimeout(() => cerrarBtn.focus(), 100);

  function cerrar() {
    overlay.classList.add('cerrando');
    overlay.addEventListener('transitionend', () => {
      overlay.style.display = 'none';
    }, { once: true });
  }

  cerrarBtn.addEventListener('click', cerrar);

  // Cerrar también con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('cerrando')) {
      cerrar();
    }
  });
}

/* ----------------------------------------------------------------
   2. ANIMACIONES DE SCROLL (Intersection Observer)
   Cada elemento con clase .reveal se hace visible cuando
   entra al viewport. Se aplica una sola vez (unobserve).
   ---------------------------------------------------------------- */
function initReveal() {
  const elementos = $$('.reveal');
  if (!elementos.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  elementos.forEach((el) => observer.observe(el));
}

/* ----------------------------------------------------------------
   2. HEADER: SCROLL BEHAVIOR
   Agrega clase .scrolled al header cuando el usuario
   hizo scroll más de 50px. Usa rAF para throttle.
   ---------------------------------------------------------------- */
function initHeaderScroll() {
  const header = $('.site-header');
  if (!header) return;

  let ticking = false;

  function update() {
    header.classList.toggle('scrolled', window.scrollY > 50);
    ticking = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );

  // Estado inicial (en caso de que la página se recargue con scroll)
  update();
}

/* ----------------------------------------------------------------
   3. MENÚ MOBILE (hamburguesa)
   - Toggle aria-expanded en el botón
   - Agrega clase .abierto al nav
   - Cierra al hacer click en enlace, Escape, o fuera del menú
   - Bloquea scroll del body mientras está abierto
   ---------------------------------------------------------------- */
function initMobileNav() {
  const toggle = $('.nav-toggle');
  const nav = $('#main-nav');
  if (!toggle || !nav) return;

  function abrir() {
    nav.classList.add('abierto');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Cerrar menú de navegación');
    // Fix iOS Safari: position:fixed en lugar de overflow:hidden,
    // que clipea elementos fixed en Safari móvil
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
  }

  function cerrar() {
    nav.classList.remove('abierto');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú de navegación');
    // Restaurar scroll position al cerrar
    const scrollY = Math.abs(parseInt(document.body.style.top || '0'));
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollY);
  }

  toggle.addEventListener('click', () => {
    nav.classList.contains('abierto') ? cerrar() : abrir();
  });

  // Cerrar al hacer click en cualquier enlace del menú
  $$('a', nav).forEach((link) => {
    link.addEventListener('click', cerrar);
  });

  // Cerrar con tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('abierto')) {
      cerrar();
      toggle.focus();
    }
  });

  // Cerrar al hacer click fuera del menú y del botón
  document.addEventListener('click', (e) => {
    if (
      nav.classList.contains('abierto') &&
      !nav.contains(e.target) &&
      !toggle.contains(e.target)
    ) {
      cerrar();
    }
  });
}

/* ----------------------------------------------------------------
   4. CARGA DIFERIDA DEL VIDEO HERO
   - En mobile (< 768px) o conexión lenta: no carga el video,
     mantiene solo el poster image para mejorar performance
   - En desktop: carga el video cuando el hero entra al viewport
   ---------------------------------------------------------------- */
function initHeroVideo() {
  const video = $('.hero-video');
  if (!video) return;

  // Detectar conexión lenta o preferencia de ahorro de datos
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const conexionLenta = conn && (
    conn.saveData === true ||
    ['slow-2g', '2g'].includes(conn.effectiveType)
  );

  const esMobile = window.matchMedia('(max-width: 767px)').matches;

  if (esMobile || conexionLenta) {
    // Quitar fuentes del video para no cargarlas en mobile
    $$('source', video).forEach((s) => {
      if (s.dataset.src) s.removeAttribute('src'); // Solo si usamos data-src
    });
    video.removeAttribute('autoplay');
    return;
  }

  // Desktop: cargar el video cuando sea visible usando IntersectionObserver
  const heroSection = $('.hero');
  if (!heroSection) return;

  const heroObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        // Mover data-src → src en cada <source>
        $$('source', video).forEach((source) => {
          const dataSrc = source.getAttribute('data-src');
          if (dataSrc) {
            source.src = dataSrc;
          }
        });

        video.load();
        video.play().catch(() => {
          // Autoplay puede ser bloqueado por el browser — fallo silencioso
        });

        heroObserver.disconnect();
      }
    },
    { threshold: 0.1 }
  );

  heroObserver.observe(heroSection);
}

/* ----------------------------------------------------------------
   5. SCROLL SUAVE PARA ANCLAS INTERNAS
   Compensa el alto del header fijo (variable --header-height
   o calculado dinámicamente).
   ---------------------------------------------------------------- */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href').slice(1);
      if (!id) return;

      const destino = document.getElementById(id);
      if (!destino) return;

      e.preventDefault();

      const headerH = ($('.site-header')?.offsetHeight || 0) + 16;
      const top = destino.getBoundingClientRect().top + window.scrollY - headerH;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ----------------------------------------------------------------
   6. SECCIÓN ACTIVA EN LA NAVEGACIÓN
   Usa IntersectionObserver para marcar el enlace del nav
   correspondiente a la sección visible en pantalla.
   ---------------------------------------------------------------- */
function initActiveNav() {
  const secciones = $$('section[id]');
  const navLinks = $$('.main-nav ul a');

  if (!secciones.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle(
            'active',
            link.getAttribute('href') === `#${entry.target.id}`
          );
        });
      });
    },
    {
      rootMargin: '-35% 0px -60% 0px',
    }
  );

  secciones.forEach((s) => observer.observe(s));
}

/* ----------------------------------------------------------------
   7. ANIMACIÓN DE CONTEO — Puntaje de testimonios
   Cuenta desde un valor base hasta 4.9 con easing.
   ---------------------------------------------------------------- */
function initCountAnimation() {
  const numEl = $('.test-numero');
  if (!numEl) return;

  const objetivo = parseFloat(numEl.dataset.target || numEl.textContent);
  const inicio = 4.0;
  const duracion = 1400; // ms
  let animando = false;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !animando) {
        animando = true;
        const t0 = performance.now();

        function frame(ahora) {
          const progreso = Math.min((ahora - t0) / duracion, 1);
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progreso, 3);
          numEl.textContent = (inicio + (objetivo - inicio) * eased).toFixed(1);

          if (progreso < 1) {
            requestAnimationFrame(frame);
          } else {
            numEl.textContent = objetivo.toFixed(1);
          }
        }

        requestAnimationFrame(frame);
        observer.disconnect();
      }
    },
    { threshold: 0.6 }
  );

  observer.observe(numEl);
}

/* ----------------------------------------------------------------
   8. MODAL DE VIDEO — click en cualquier .video-thumb con data-video
   ---------------------------------------------------------------- */
function initVideoModal() {
  const thumbs = $$('.video-thumb[data-video]');
  if (!thumbs.length) return;

  // Crear overlay del modal una sola vez
  const overlay = document.createElement('div');
  overlay.className = 'video-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Reproductor de video');

  overlay.innerHTML = `
    <div class="video-modal-inner">
      <button class="video-modal-cerrar" aria-label="Cerrar video">✕</button>
      <video controls playsinline></video>
    </div>
  `;
  document.body.appendChild(overlay);

  const videoEl = overlay.querySelector('video');
  const cerrarBtn = overlay.querySelector('.video-modal-cerrar');

  function abrir(src) {
    videoEl.src = src;
    overlay.classList.add('activo');
    document.body.style.overflow = 'hidden';
    videoEl.play().catch(() => {});
    cerrarBtn.focus();
  }

  function cerrar() {
    overlay.classList.remove('activo');
    videoEl.pause();
    videoEl.src = '';
    document.body.style.overflow = '';
  }

  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      abrir(thumb.dataset.video);
    });

    // Soporte teclado: Enter y Space abren el modal
    thumb.setAttribute('tabindex', '0');
    thumb.setAttribute('role', 'button');
    thumb.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        abrir(thumb.dataset.video);
      }
    });
  });

  cerrarBtn.addEventListener('click', cerrar);

  // Cerrar al hacer click en el overlay (fuera del video)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) cerrar();
  });

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('activo')) {
      cerrar();
    }
  });
}

/* ----------------------------------------------------------------
   INIT — Ejecutar todo cuando el DOM esté listo
   ---------------------------------------------------------------- */
function init() {
  initDemoPopup();
  initReveal();
  initHeaderScroll();
  initMobileNav();
  initHeroVideo();
  initSmoothScroll();
  initActiveNav();
  initCountAnimation();
  initVideoModal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
