/* ============================================================
   ENGENITIX — Escena 3D de partículas (Three.js)
   Inspirada en la estética de Lusion: formas 3D siempre vivas
   que reaccionan al cursor y giran con el scroll.
   - Esfera de puntos en el hero (derecha).
   - Portátil de puntos que aparece (izquierda) al salir del hero.
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // Respeta la preferencia de movimiento reducido
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Escena, cámara, renderer ---
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 7;

  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Reducir densidad en móviles para rendimiento
  var isMobile = window.innerWidth < 768;

  var accents = [
    new THREE.Color('#0029FF'),
    new THREE.Color('#FF0022'),
    new THREE.Color('#ffffff')
  ];

  // Utilitario: posición esférica con densidad en los polos
  function spherePoint(radius) {
    var u = Math.random();
    var v = Math.random();
    var theta = 2 * Math.PI * u;
    var phi = Math.acos(2 * v - 1);
    return {
      x: radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.cos(phi),
      z: radius * Math.sin(phi) * Math.sin(theta)
    };
  }

  /* ============================================================
     ESFERA DE PUNTOS (hero)
     ============================================================ */
  var SPHERE_COUNT = isMobile ? 4500 : 12000;
  var spherePositions = new Float32Array(SPHERE_COUNT * 3);
  var sphereColors = new Float32Array(SPHERE_COUNT * 3);

  var radius = 2.4;
  for (var i = 0; i < SPHERE_COUNT; i++) {
    var p = spherePoint(radius);
    spherePositions[i * 3] = p.x;
    spherePositions[i * 3 + 1] = p.y;
    spherePositions[i * 3 + 2] = p.z;
    var c = accents[(Math.random() * 3) | 0].clone();
    var brightness = 0.6 + Math.random() * 0.4;
    sphereColors[i * 3] = c.r * brightness;
    sphereColors[i * 3 + 1] = c.g * brightness;
    sphereColors[i * 3 + 2] = c.b * brightness;
  }

  var sphereGeo = new THREE.BufferGeometry();
  sphereGeo.setAttribute('position', new THREE.BufferAttribute(spherePositions, 3));
  sphereGeo.setAttribute('color', new THREE.BufferAttribute(sphereColors, 3));

  var size = isMobile ? 0.045 : 0.03;
  var partMaterial = new THREE.PointsMaterial({
    size: size,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  var sphere = new THREE.Points(sphereGeo, partMaterial);
  sphere.position.x = 2.2;
  sphere.position.y = -0.2;
  scene.add(sphere);

  /* ============================================================
     PORTÁTIL DE PUNTOS (aparece tras el hero, lado izquierdo)
     Abierto: pantalla vertical (plano XY) + base/teclado horizontal
     (plano XZ) que sale hacia el espectador, formando una "L".
     ============================================================ */
  var LAP_COUNT = isMobile ? 3800 : 10000;
  var lapPositions = new Float32Array(LAP_COUNT * 3);
  var lapColors = new Float32Array(LAP_COUNT * 3);

  // Dimensiones
  var PANEL_W = 3.0;      // ancho pantalla
  var PANEL_H = 2.0;      // alto pantalla
  var BASE_W = 3.2;       // ancho base
  var BASE_D = 1.6;       // profundidad base (hacia el espectador)
  var THICK = 0.16;       // grosor
  var hingeY = 0.0;       // altura de la bisagra

  var halfW = PANEL_W / 2;
  var halfB = BASE_W / 2;

  var li = 0;
  function addLapPoint(x, y, z) {
    if (li >= LAP_COUNT) return;
    lapPositions[li * 3] = x;
    lapPositions[li * 3 + 1] = y;
    lapPositions[li * 3 + 2] = z;
    var c = accents[(Math.random() * 3) | 0].clone();
    var br = 0.55 + Math.random() * 0.45;
    lapColors[li * 3] = c.r * br;
    lapColors[li * 3 + 1] = c.g * br;
    lapColors[li * 3 + 2] = c.b * br;
    li++;
  }

  // 1) Pantalla — cara frontal (plano XY, y arriba de la bisagra)
  var screenN = Math.floor(LAP_COUNT * 0.60);
  for (var s = 0; s < screenN; s++) {
    var sx = (Math.random() * 2 - 1) * halfW;
    var sy = hingeY + 0.1 + Math.random() * PANEL_H;
    var zOff = (Math.random() - 0.5) * THICK * 0.5;
    addLapPoint(sx, sy, THICK / 2 + zOff);
  }

  // 2) Bisagra — tira horizontal entre pantalla y base
  var hingeN = Math.floor(LAP_COUNT * 0.08);
  for (var g = 0; g < hingeN; g++) {
    addLapPoint(
      (Math.random() * 2 - 1) * halfB,
      hingeY,
      (Math.random() - 0.5) * THICK
    );
  }

  // 3) Base / teclado — plano horizontal XZ (y=hingeY), z hacia el espectador
  var baseN = LAP_COUNT - li;
  for (var b = 0; b < baseN; b++) {
    if (li >= LAP_COUNT) break;
    var bx = (Math.random() * 2 - 1) * halfB;
    var bz = 0.4 + Math.random() * BASE_D;   // desde la bisagra hacia adelante
    var by = hingeY - 0.12 + (Math.random() - 0.5) * THICK * 0.4;
    // Trackpad: zona central inferior con menos puntos (deja un hueco)
    if (Math.abs(bx) < 0.45 && bz > 0.9 && bz < 1.4 && Math.random() < 0.8) {
      by = hingeY - 0.05;
    }
    addLapPoint(bx, by, bz);
  }

  // Reposicionar el grupo: base sobre la bisagra, todo a la izquierda y
  // ligeramente reclinado hacia el espectador para la perspectiva clásica.
  var lapGeo = new THREE.BufferGeometry();
  lapGeo.setAttribute('position', new THREE.BufferAttribute(lapPositions, 3));
  lapGeo.setAttribute('color', new THREE.BufferAttribute(lapColors, 3));

  var lapMaterial = new THREE.PointsMaterial({
    size: size,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  var laptop = new THREE.Points(lapGeo, lapMaterial);
  laptop.position.x = -2.6;
  laptop.position.y = -0.4;
  laptop.rotation.z = -0.08;
  laptop.rotation.x = -0.55;   // reclinar la pantalla para verse como mismo portátil
  scene.add(laptop);

  /* ============================================================
     MONITOR DE PUNTOS (aparece en "Explora nuestro catálogo",
     lado derecho; mismo estilo de partículas)
     ============================================================ */
  var MON_COUNT = isMobile ? 3600 : 9000;
  var monPositions = new Float32Array(MON_COUNT * 3);
  var monColors = new Float32Array(MON_COUNT * 3);

  var MW = 2.8;    // ancho pantalla
  var MH = 1.9;    // alto pantalla
  var MSTAND = 0.22; // alto del pie de la pantalla
  var BZ = 0.9;    // profundidad marco
  var thick = 0.16;

  var mi = 0;
  function addMonPoint(x, y, z) {
    if (mi >= MON_COUNT) return;
    monPositions[mi * 3] = x;
    monPositions[mi * 3 + 1] = y;
    monPositions[mi * 3 + 2] = z;
    var c = accents[(Math.random() * 3) | 0].clone();
    var br = 0.55 + Math.random() * 0.45;
    monColors[mi * 3] = c.r * br;
    monColors[mi * 3 + 1] = c.g * br;
    monColors[mi * 3 + 2] = c.b * br;
    mi++;
  }

  // 1) Pantalla — cara frontal (plano XY) con leve grosor en z
  var screenN = Math.floor(MON_COUNT * 0.85);
  for (var sn = 0; sn < screenN; sn++) {
    if (mi >= MON_COUNT) break;
    var sx = (Math.random() * 2 - 1) * (MW / 2);
    var sy = MSTAND + 0.1 + Math.random() * MH;
    // Simular contenido/píxeles con pequeñas agrupaciones verticales
    var sz = (Math.random() - 0.5) * thick;
    addMonPoint(sx, sy, thick / 2 + sz);
  }

  // 2) Soporte vertical central (pie) — pequeña columna debajo de la pantalla
  var neckN = Math.floor(MON_COUNT * 0.05);
  for (var nn = 0; nn < neckN; nn++) {
    if (mi >= MON_COUNT) break;
    var nx = (Math.random() - 0.5) * 0.28;
    var ny = 0 + (Math.random() * MSTAND);
    var nz = (Math.random() - 0.5) * 0.2;
    addMonPoint(nx, ny, nz);
  }

  // 3) Base (patas) — panel horizontal fino en la parte inferior
  var baseN = MON_COUNT - mi;
  for (var mn = 0; mn < baseN; mn++) {
    if (mi >= MON_COUNT) break;
    var bx = (Math.random() * 2 - 1) * (MW * 0.42);
    var by = 0 - (Math.random() - 0.5) * thick;
    var bz = (Math.random() - 0.5) * BZ;
    addMonPoint(bx, by, bz);
  }

  var monGeo = new THREE.BufferGeometry();
  monGeo.setAttribute('position', new THREE.BufferAttribute(monPositions, 3));
  monGeo.setAttribute('color', new THREE.BufferAttribute(monColors, 3));

  var monMaterial = new THREE.PointsMaterial({
    size: size,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  var monitor = new THREE.Points(monGeo, monMaterial);
  monitor.position.x = 2.6;   // lado derecho
  monitor.position.y = -0.3;
  monitor.rotation.y = 0.5;   // leve giro para dar volumen
  scene.add(monitor);

  /* ============================================================
     ESTADO INTERACTIVO
     ============================================================ */
  var mouse = { x: 0, y: 0 };
  var targetRotX = 0, targetRotY = 0;
  var currentRotX = 0, currentRotY = 0;

  var basePositions = spherePositions.slice();
  var mouseStrength = { value: 0 };

  window.addEventListener('pointermove', function (e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    if (!reduced) mouseStrength.value = 1;
  });

  // --- Scroll: rotación de ambas formas ---
  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: function (self) {
      if (reduced) return;
      targetRotX = self.progress * Math.PI * 2.5;
      targetRotY = self.progress * Math.PI * 2;
    }
  });

  // --- Distorsión líquida de la esfera por cursor ---
  var posAttr = sphereGeo.attributes.position;
  var lapPosAttr = lapGeo.attributes.position;
  var lapBasePositions = lapPositions.slice();
  var prnPosAttr = monGeo.attributes.position;
  var prnBasePositions = monPositions.slice();

  function updateDistortion() {
    if (reduced || mouseStrength.value < 0.02) {
      mouseStrength.value *= 0.9;
    }
    var ampl = mouseStrength.value * 0.35;

    if (sphere.material.opacity > 0.02) {
      for (var i = 0; i < SPHERE_COUNT; i++) {
        var ix = i * 3;
        var bx = basePositions[ix];
        var by = basePositions[ix + 1];
        var bz = basePositions[ix + 2];
        var nd = Math.sqrt(bx * bx + by * by);
        var f = Math.max(0, 1 - nd / 2.4);
        posAttr.array[ix] = bx + (mouse.x * f * ampl);
        posAttr.array[ix + 1] = by + (-mouse.y * f * ampl);
        posAttr.array[ix + 2] = bz + (mouse.x * mouse.y * f * ampl);
      }
      posAttr.needsUpdate = true;
    }

    // Ligera distorsión del portátil basada en el cursor
    if (laptop.material.opacity > 0.02) {
      for (var j = 0; j < li; j++) {
        var jx = j * 3;
        var lx = lapBasePositions[jx];
        var ly = lapBasePositions[jx + 1];
        var lz = lapBasePositions[jx + 2];
        var mag = 0.06;
        lapPosAttr.array[jx] = lx + mouse.x * mag;
        lapPosAttr.array[jx + 1] = ly - mouse.y * mag * 0.5;
        lapPosAttr.array[jx + 2] = lz + (mouse.x * mouse.y) * mag;
      }
      lapPosAttr.needsUpdate = true;
    }

    // Ligera distorsión del monitor basada en el cursor
    if (monitor.material.opacity > 0.02) {
      for (var k = 0; k < mi; k++) {
        var kx = k * 3;
        var px = prnBasePositions[kx];
        var py = prnBasePositions[kx + 1];
        var pz = prnBasePositions[kx + 2];
        var mag = 0.05;
        prnPosAttr.array[kx] = px + mouse.y * mag;
        prnPosAttr.array[kx + 1] = py - mouse.x * mag * 0.5;
        prnPosAttr.array[kx + 2] = pz + (mouse.x * mouse.y) * mag;
      }
      prnPosAttr.needsUpdate = true;
    }
  }

  /* ============================================================
     BUCLE DE ANIMACIÓN
     ============================================================ */
  function animate() {
    requestAnimationFrame(animate);

    currentRotX += (targetRotX - currentRotX) * 0.05;
    currentRotY += (targetRotY - currentRotY) * 0.05;

    if (!reduced) {
      sphere.rotation.x = currentRotX + mouse.y * 0.4;
      sphere.rotation.y = currentRotY + mouse.x * 0.6;

      laptop.rotation.x = -0.55 + currentRotX * 0.5 + mouse.y * 0.3;
      laptop.rotation.y = currentRotY * 0.4 + mouse.x * 0.4;

      monitor.rotation.y = 0.5 + currentRotY * 0.5 + mouse.x * 0.4;
      monitor.rotation.x = mouse.y * 0.25;
    }

    updateDistortion();
    renderer.render(scene, camera);
  }
  animate();

  /* ============================================================
     CROSS-FADE POR SCROLL (3 etapas)
   1) Hero: esfera visible.
   2) Servicios → manifiesto: portátil (izquierda) aparece y se mantiene.
      Justo al llegar a "Tu tecnología merece estar al día" se desaparece.
   3) Explora nuestro catálogo: el monitor (derecha) aparece y se mantiene.
   ============================================================ */
  // Etapa 1 → 2: esfera sale, portátil entra (por el hero)
  ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    onUpdate: function (self) {
      var t = self.progress;
      if (!reduced) {
        sphere.material.opacity = Math.max(0, 0.9 - t * 1.6);
        laptop.material.opacity = Math.min(0.9, Math.max(0, (t - 0.2) * 1.8));
      }
    }
  });

  // Etapa 2 → 3: al pasar el manifiesto, el portátil se va y la impresora entra.
  ScrollTrigger.create({
    trigger: '.manifiesto',
    start: 'top 45%',
    end: 'bottom top',
    onUpdate: function (self) {
      var p = self.progress;
      if (reduced) return;
      laptop.material.opacity = Math.max(0, 0.9 - p * 1.5);
      monitor.material.opacity = Math.min(0.9, Math.max(0, (p - 0.15) * 1.7));
    }
  });

  // --- Resize ---
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  window.addEventListener('resize', onResize);
})();