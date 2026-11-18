/* ============================================================
   ENGENITIX — Interacciones y animaciones (GSAP)
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Año en el footer ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Navbar: fondo al hacer scroll ---------- */
  var navbar = document.getElementById('navbar');
  function onScroll() {
    if (window.scrollY > 40) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menú móvil ---------- */
  var burger = document.getElementById('navBurger');
  var navLinks = document.getElementById('navLinks');
  burger.addEventListener('click', function () {
    var open = navLinks.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });

  /* ============================================================
     ANIMACIONES DE ENTRADA (si el usuario no reduce el movimiento)
     ============================================================ */
  if (!reduced) {
    // Revelado tipo Lusion: líneas de texto que se descubren con máscara
    gsap.utils.toArray('[data-line]').forEach(function (line) {
      gsap.from(line, {
        yPercent: 110,
        duration: 1.1,
        ease: 'power4.out',
        delay: 0.3,
        scrollTrigger: {
          trigger: line.closest('.mask-line'),
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        overwrite: true
      });
    });

    // Revelado general por elemento [data-reveal]
    gsap.utils.toArray('[data-reveal]').forEach(function (el) {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none'
        }
      });
    });

    // --- Texto gigante del manifiesto con parallax y deslizamiento ---
    gsap.utils.toArray('[data-scroll-line]').forEach(function (line, i) {
      gsap.fromTo(line,
        { x: i % 2 === 0 ? -60 : 60, opacity: 0.15 },
        {
          x: 0,
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: '#manifiesto',
            start: 'top 80%',
            end: 'bottom 20%',
            scrub: true
          }
        }
      );
    });

    // --- Parallax del manifiesto como bloque ---
    gsap.fromTo('.manifiesto h2', {
      y: 80, opacity: 0.4
    }, {
      y: 0, opacity: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: '.manifiesto',
        start: 'top bottom',
        end: 'center center',
        scrub: true
      }
    });

    // --- Contadores de estadísticas ---
    gsap.utils.toArray('[data-count]').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      var obj = { n: 0 };
      scrollTriggerCounter(el, obj, target);
    });
  } else {
    // Sin animación: asegurar que todo sea visible
    gsap.set('[data-line], [data-reveal], [data-scroll-line], .manifiesto h2', { opacity: 1, x: 0, y: 0 });
  }

  function scrollTriggerCounter(el, obj, target) {
    gsap.to(obj, {
      n: target,
      duration: 2,
      ease: 'power1.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
      onUpdate: function () {
        el.textContent = Math.round(obj.n);
      }
    });
  }

  /* ============================================================
     PESTAÑAS DEL PORTAFOLIO (4 áreas de servicios)
     ============================================================ */
  var pills = document.querySelectorAll('.pill');
  var panels = document.querySelectorAll('.tab-panel');

  pills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      var tab = pill.getAttribute('data-tab');

      // Desactivar la pestaña activa
      pills.forEach(function (p) { p.classList.remove('active'); });
      pill.classList.add('active');

      // Cambiar el panel visible
      panels.forEach(function (panel) {
        var isActive = panel.id === 'tab-' + tab;
        if (isActive) {
          panel.classList.add('active');
          // Re-aplicar las animaciones de revelado dentro del panel activado
          if (!reduced && window.gsap) {
            gsap.fromTo(panel.querySelectorAll('.work-row'), { y: 24, opacity: 0 }, {
              y: 0, opacity: 1, duration: 0.6,
              stagger: 0.08, ease: 'power3.out', overwrite: true
            });
          }
        } else {
          panel.classList.remove('active');
        }
      });
    });
  });

  /* ============================================================
     OVERLAY DE DETALLE por servicio — "adentrarse" al hacer clic
     ============================================================ */
  var workRows = document.querySelectorAll('.work-row');
  var overlays = document.querySelectorAll('.overlay');

  function openOverlay(project) {
    var overlay = document.getElementById('overlay-' + project);
    if (!overlay) return;

    var panel = overlay.querySelector('.overlay-panel');
    var backdrop = overlay.querySelector('.overlay-backdrop');

    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');

    if (!reduced && window.gsap) {
      gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
      gsap.fromTo(panel,
        { scale: 0.92, y: 30, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.6, ease: 'power4.out', delay: 0.05 }
      );
    } else {
      backdrop.style.opacity = '1';
      panel.style.opacity = '1';
      panel.style.transform = 'scale(1) translateY(0)';
    }

    // Bloquea el scroll de fondo
    document.body.style.overflow = 'hidden';
  }

  function closeOverlay(overlay) {
    if (!overlay.classList.contains('active')) return;

    var panel = overlay.querySelector('.overlay-panel');
    var backdrop = overlay.querySelector('.overlay-backdrop');

    if (!reduced && window.gsap) {
      gsap.to(panel, { scale: 0.94, y: 24, opacity: 0, duration: 0.35, ease: 'power3.in' });
      gsap.to(backdrop, { opacity: 0, duration: 0.35, ease: 'power2.in', onComplete: function () {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }});
    } else {
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  // Abrir al hacer clic (o Enter/Espacio) en una fila de servicio
  workRows.forEach(function (row) {
    var open = function (e) {
      e.preventDefault();
      openOverlay(row.getAttribute('data-project'));
    };
    row.addEventListener('click', open);
    row.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openOverlay(row.getAttribute('data-project')); }
    });
  });

  // Cerrar con el botón ✕
  overlays.forEach(function (overlay) {
    var closeBtn = overlay.querySelector('.overlay-close');
    if (closeBtn) closeBtn.addEventListener('click', function () { closeOverlay(overlay); });
    // Cerrar al hacer clic fuera del panel
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.classList.contains('overlay-backdrop')) {
        closeOverlay(overlay);
      }
    });
  });

  // Cerrar con tecla Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      overlays.forEach(function (o) {
        if (o.classList.contains('active')) closeOverlay(o);
      });
    }
  });

  /* ============================================================
     FORMULARIO DE CONTACTO → comercial@engenitix.com
     Envío AJAX vía FormSubmit + validación de correo real
     (anti-temporales con Disify) y teléfono por país
     (intl-tel-input / libphonenumber)
     ============================================================ */
  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');
  var telInput = document.getElementById('telefono');

  // Selector de indicativo + validación por país (Colombia por defecto)
  var iti = null;
  if (form && telInput && window.intlTelInput) {
    try {
      iti = window.intlTelInput(telInput, {
        initialCountry: 'co',
        preferredCountries: ['co', 'mx', 'ec', 'pe', 'us'],
        separateDialCode: true,
        utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js'
      });
    } catch (err) { iti = null; }
  }

  function showStatus(msg, type) {
    status.textContent = msg;
    status.className = 'form-status' + (type ? ' ' + type : '');
  }

  // Valida contra correos temporales/desechables usando Disify (API gratuita).
  // Si la API no responde, devuelve null → el envío se permite (no perder clientes).
  function checkDisposableEmail(email) {
    return fetch('https://www.disify.com/api/email/' + encodeURIComponent(email), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'email=' + encodeURIComponent(email)
    })
      .then(function (r) {
        if (!r.ok) throw new Error('Disify HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        return { disposable: !!data.disposable, badDns: data.dns === false };
      })
      .catch(function () { return null; });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var nombre = document.getElementById('nombre').value.trim();
    var email = document.getElementById('email').value.trim();
    var mensaje = document.getElementById('mensaje').value.trim();
    var servicio = document.getElementById('servicio').value;
    var honey = form.querySelector('input[name="_honey"]').value;

    // Honeypot llenado por un bot → ignorar silenciosamente
    if (honey) return;

    showStatus('', '');

    if (!nombre) { showStatus('Por favor escribe tu nombre.', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showStatus('Por favor escribe un correo válido.', 'error'); return;
    }
    if (!mensaje) {
      showStatus('El campo «Cuéntanos tu necesidad» es obligatorio.', 'error'); return;
    }

    // Teléfono obligatorio y válido según el país seleccionado
    var telefonoE164 = '';
    if (iti) {
      var raw = telInput.value.trim();
      if (!raw) { showStatus('Por favor escribe tu teléfono (con indicativo del país).', 'error'); return; }
      var valid;
      try { valid = iti.isValidNumber(); } catch (err) { valid = false; }
      if (!valid) {
        showStatus('El número no es válido para el país seleccionado. Revisa el indicativo y los dígitos.', 'error');
        return;
      }
      telefonoE164 = iti.getNumber();
    } else if (!telInput.value.trim()) {
      showStatus('Por favor escribe tu teléfono.', 'error'); return;
    }

    var submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    showStatus('Verificando correo…', 'loading');

    // Filtro anti-correo temporal antes de enviar
    checkDisposableEmail(email).then(function (verdict) {
      if (verdict && (verdict.disposable || verdict.badDns)) {
        submitBtn.disabled = false;
        showStatus(
          'Este correo parece temporal o desechable. Usa tu correo real para que podamos responderte.',
          'error'
        );
        return;
      }

      // Envío AJAX a FormSubmit (llega a comercial@engenitix.com)
      var payload = new URLSearchParams();
      payload.append('_subject', 'Nuevo mensaje desde engenitix.com — Formulario de contacto');
      payload.append('_template', 'table');
      payload.append('_captcha', 'false');
      payload.append('_replyto', email);
      payload.append('_honey', honey);
      payload.append('nombre', nombre);
      payload.append('email', email);
      payload.append('telefono', telefonoE164 || telInput.value.trim());
      payload.append('servicio', servicio || 'Sin especificar');
      payload.append('mensaje', mensaje);

      showStatus('Enviando…', 'loading');
      fetch(form.getAttribute('action'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: payload.toString()
      })
        .then(function (res) {
          if (!res.ok) throw new Error('FormSubmit HTTP ' + res.status);
          return res.json();
        })
        .then(function () {
          showStatus('¡Mensaje enviado con éxito! Te responderemos muy pronto.', 'success');
          form.reset();
          if (iti) { try { iti.setNumber(''); } catch (err) {} }
        })
        .catch(function () {
          showStatus('No se pudo enviar el mensaje. Inténtalo de nuevo o escríbenos por WhatsApp.', 'error');
        })
        .then(function () { submitBtn.disabled = false; });
    });
  });
})();