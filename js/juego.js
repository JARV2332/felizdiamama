// ======================================
// JUEGO - Débora corre hacia mami Lissy
// Tipo Chrome Dinosaur game, arcade femenino
// ======================================
(function () {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const playBtn = document.getElementById('playBtn');
  const stopBtn = document.getElementById('stopBtn');
  const scoreVal = document.getElementById('scoreVal');
  const bestVal = document.getElementById('bestVal');
  const levelVal = document.getElementById('levelVal');
  const speedVal = document.getElementById('speedVal');
  const overlay = document.getElementById('gameOverlay');
  const overlayContent = document.getElementById('overlayContent');
  const diffBtns = document.querySelectorAll('.diff-btn');
  const imgDebora = document.getElementById('imgDebora');
  const imgLissy = document.getElementById('imgLissy');

  // Hacer canvas responsive (se mantiene la lógica en coords lógicas)
  const W = 900;
  const H = 360;

  function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth;
    const cssHeight = (cssWidth / W) * H;
    canvas.style.height = cssHeight + 'px';
    canvas.width = cssWidth * ratio;
    canvas.height = cssHeight * ratio;
    ctx.setTransform(ratio * (cssWidth / W), 0, 0, ratio * (cssHeight / H), 0, 0);
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
    if (state === STATE.READY || state === STATE.STOPPED) drawIntro();
  });

  // ---------- ESTADO DEL JUEGO ----------
  const STATE = {
    READY: 'ready',
    PLAYING: 'playing',
    GAMEOVER: 'gameover',
    WIN: 'win',
    STOPPED: 'stopped',
  };

  const LEVELS = {
    1: {
      name: 'FÁCIL',
      baseSpeed: 4,
      gravity: 0.6,
      jumpV: -12,
      obstacleGapMin: 520,
      obstacleGapMax: 720,
      obstacleVariety: 1,
      speedRampPer1000: 0.6,
      bgColor1: '#2d0a4a',
      bgColor2: '#ff9ed8',
    },
    2: {
      name: 'NORMAL',
      baseSpeed: 6,
      gravity: 0.7,
      jumpV: -13,
      obstacleGapMin: 440,
      obstacleGapMax: 620,
      obstacleVariety: 2,
      speedRampPer1000: 1.0,
      bgColor1: '#1a0533',
      bgColor2: '#c084fc',
    },
    3: {
      name: 'DIFÍCIL',
      baseSpeed: 8,
      gravity: 0.85,
      jumpV: -14.5,
      obstacleGapMin: 380,
      obstacleGapMax: 540,
      obstacleVariety: 3,
      speedRampPer1000: 1.4,
      bgColor1: '#0d0221',
      bgColor2: '#ff6ec7',
    },
  };

  let level = 1;
  let state = STATE.READY;
  let score = 0;
  let best = parseInt(localStorage.getItem('lissy_game_best') || '0', 10);
  let lastFrame = 0;
  let speedMultiplier = 1;
  let mamaShown = false;
  const WIN_SCORE = 500;

  // ---------- PERSONAJE: DÉBORA ----------
  const debora = {
    x: 100,
    y: 0,
    w: 56,
    h: 80,
    vy: 0,
    onGround: true,
    runFrame: 0,
    skirtColor: '#ff6ec7',
    skirtColor2: '#c084fc',
  };

  const groundY = H - 60;

  // ---------- OBSTÁCULOS ----------
  let obstacles = [];
  let pendingGap = 0; // gap aleatorio que debe cubrirse antes del siguiente obstáculo
  let groundOffset = 0;

  // ---------- NUBES / CORAZONES DE FONDO ----------
  let clouds = [];
  for (let i = 0; i < 6; i++) {
    clouds.push({
      x: Math.random() * W,
      y: 30 + Math.random() * 120,
      size: 16 + Math.random() * 18,
      speed: 0.3 + Math.random() * 0.5,
      shape: Math.random() < 0.5 ? 'heart' : 'star',
    });
  }

  // ---------- IMAGEN -> CIRCULAR ----------
  // Comprueba si las imágenes cargaron (puede que el archivo no exista aún)
  let deboraReady = false;
  let lissyReady = false;
  imgDebora.addEventListener('load', () => { deboraReady = imgDebora.naturalWidth > 0; });
  imgDebora.addEventListener('error', () => { deboraReady = false; });
  imgLissy.addEventListener('load', () => { lissyReady = imgLissy.naturalWidth > 0; });
  imgLissy.addEventListener('error', () => { lissyReady = false; });

  if (imgDebora.complete && imgDebora.naturalWidth > 0) deboraReady = true;
  if (imgLissy.complete && imgLissy.naturalWidth > 0) lissyReady = true;

  // ---------- FUNCIONES DE DIBUJO ----------
  function drawBackground() {
    const conf = LEVELS[level];
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, conf.bgColor1);
    grd.addColorStop(0.6, '#4a1568');
    grd.addColorStop(1, conf.bgColor2);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // Sol/luna grande al fondo
    const sunX = W - 100;
    const sunY = 90;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 80);
    sunGrad.addColorStop(0, 'rgba(255, 230, 247, 0.95)');
    sunGrad.addColorStop(0.4, 'rgba(255, 158, 216, 0.5)');
    sunGrad.addColorStop(1, 'rgba(255, 110, 199, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
    ctx.fill();

    // Montañas pixeladas al fondo
    ctx.fillStyle = 'rgba(124, 58, 237, 0.55)';
    for (let i = 0; i < 5; i++) {
      const mx = ((i * 220 - groundOffset * 0.2) % (W + 220)) - 110;
      ctx.beginPath();
      ctx.moveTo(mx, groundY);
      ctx.lineTo(mx + 110, groundY - 90);
      ctx.lineTo(mx + 220, groundY);
      ctx.closePath();
      ctx.fill();
    }

    // Nubes / formas decorativas
    clouds.forEach((c) => {
      drawShape(c.x, c.y, c.size, c.shape, 'rgba(255, 230, 247, 0.6)');
    });
  }

  function drawShape(x, y, size, shape, color) {
    ctx.fillStyle = color;
    if (shape === 'heart') {
      ctx.font = `${size * 1.2}px sans-serif`;
      ctx.fillText('♥', x, y);
    } else {
      ctx.font = `${size * 1.2}px sans-serif`;
      ctx.fillText('★', x, y);
    }
  }

  function drawGround() {
    // Suelo con líneas de neón
    const gradient = ctx.createLinearGradient(0, groundY, 0, H);
    gradient.addColorStop(0, '#ff6ec7');
    gradient.addColorStop(1, '#7c3aed');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, groundY, W, H - groundY);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();

    // Líneas tipo grid retro en el suelo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    const spacing = 40;
    for (let i = 0; i < W / spacing + 2; i++) {
      const x = ((i * spacing - groundOffset) % (W + spacing));
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x - 60, H);
      ctx.stroke();
    }

    for (let y = groundY + 15; y < H; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }

  function drawDebora() {
    const x = debora.x;
    const y = debora.y;
    const w = debora.w;
    const h = debora.h;

    ctx.save();

    // Sombra
    if (debora.onGround) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, groundY + 4, w / 2, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Piernas (animadas al correr)
    const legSwing = debora.onGround ? Math.sin(debora.runFrame) * 6 : 0;
    ctx.fillStyle = '#ffd6b8';
    ctx.fillRect(x + 14, y + h - 18, 10, 18 + legSwing);
    ctx.fillRect(x + w - 24, y + h - 18, 10, 18 - legSwing);
    // Zapatos rosados
    ctx.fillStyle = '#ff3aa9';
    ctx.fillRect(x + 12, y + h - 4 + legSwing, 14, 6);
    ctx.fillRect(x + w - 26, y + h - 4 - legSwing, 14, 6);

    // Vestido (degradado rosa-morado)
    const dressGrad = ctx.createLinearGradient(x, y + 28, x, y + h - 14);
    dressGrad.addColorStop(0, debora.skirtColor);
    dressGrad.addColorStop(1, debora.skirtColor2);
    ctx.fillStyle = dressGrad;
    // forma trapezoidal
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 30);
    ctx.lineTo(x + w - 14, y + 30);
    ctx.lineTo(x + w - 4, y + h - 14);
    ctx.lineTo(x + 4, y + h - 14);
    ctx.closePath();
    ctx.fill();

    // Detalle del vestido (corazón)
    ctx.fillStyle = '#fff5fb';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('♥', x + w / 2, y + h - 28);
    ctx.textAlign = 'left';

    // Brazos
    ctx.fillStyle = '#ffd6b8';
    const armSwing = debora.onGround ? Math.sin(debora.runFrame + Math.PI) * 5 : -5;
    ctx.fillRect(x + 4, y + 32 + armSwing, 8, 18);
    ctx.fillRect(x + w - 12, y + 32 - armSwing, 8, 18);

    // Cabeza con la foto de Débora
    const headCX = x + w / 2;
    const headCY = y + 18;
    const headR = 22;

    // Aura brillante
    const aura = ctx.createRadialGradient(headCX, headCY, 5, headCX, headCY, headR + 8);
    aura.addColorStop(0, 'rgba(255, 230, 247, 0)');
    aura.addColorStop(1, 'rgba(255, 110, 199, 0.5)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(headCX, headCY, headR + 8, 0, Math.PI * 2);
    ctx.fill();

    // Borde rosa
    ctx.beginPath();
    ctx.arc(headCX, headCY, headR + 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6ec7';
    ctx.fill();

    // Cara recortada en círculo
    ctx.save();
    ctx.beginPath();
    ctx.arc(headCX, headCY, headR, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    if (deboraReady) {
      const img = imgDebora;
      // calcular cuadrado central de la imagen
      const minDim = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - minDim) / 2;
      const sy = (img.naturalHeight - minDim) / 2;
      ctx.drawImage(img, sx, sy, minDim, minDim, headCX - headR, headCY - headR, headR * 2, headR * 2);
    } else {
      // Fallback: carita kawaii dibujada
      drawKawaiiFace(headCX, headCY, headR, '#ffd6b8');
    }
    ctx.restore();

    // Lacito rosa encima
    ctx.fillStyle = '#ff3aa9';
    ctx.beginPath();
    ctx.moveTo(headCX - 4, headCY - headR - 2);
    ctx.lineTo(headCX - 12, headCY - headR - 12);
    ctx.lineTo(headCX, headCY - headR - 6);
    ctx.lineTo(headCX + 12, headCY - headR - 12);
    ctx.lineTo(headCX + 4, headCY - headR - 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawKawaiiFace(cx, cy, r, skin) {
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    // ojos
    ctx.fillStyle = '#1a0533';
    ctx.beginPath();
    ctx.arc(cx - 7, cy - 2, 3, 0, Math.PI * 2);
    ctx.arc(cx + 7, cy - 2, 3, 0, Math.PI * 2);
    ctx.fill();
    // mejillas
    ctx.fillStyle = 'rgba(255, 110, 199, 0.6)';
    ctx.beginPath();
    ctx.arc(cx - 11, cy + 5, 3, 0, Math.PI * 2);
    ctx.arc(cx + 11, cy + 5, 3, 0, Math.PI * 2);
    ctx.fill();
    // sonrisa
    ctx.strokeStyle = '#1a0533';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy + 4, 5, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }

  // ---------- OBSTÁCULOS ----------
  function spawnObstacle() {
    const variety = LEVELS[level].obstacleVariety;
    const type = Math.floor(Math.random() * variety);
    let ob;
    if (type === 0) {
      // Corazón espinoso pequeño
      ob = { type: 'heart', x: W + 20, y: groundY - 35, w: 34, h: 35, color: '#ff3aa9' };
    } else if (type === 1) {
      // Cactus rosado
      ob = { type: 'cactus', x: W + 20, y: groundY - 50, w: 26, h: 50, color: '#c084fc' };
    } else {
      // Pájaro/mariposa volando (más alto)
      const flying = Math.random() < 0.5;
      ob = {
        type: 'butterfly',
        x: W + 20,
        y: flying ? groundY - 100 : groundY - 60,
        w: 38,
        h: 30,
        color: '#67e8f9',
        wingFrame: 0,
      };
    }
    obstacles.push(ob);

    const conf = LEVELS[level];
    // calcula el siguiente gap aleatorio que se aplicará tras este obstáculo
    pendingGap = conf.obstacleGapMin + Math.random() * (conf.obstacleGapMax - conf.obstacleGapMin);
  }

  function drawObstacle(ob) {
    if (ob.type === 'heart') {
      // Corazón con pinchitos
      ctx.fillStyle = ob.color;
      ctx.font = `${ob.h}px sans-serif`;
      ctx.fillText('♥', ob.x, ob.y + ob.h);
      ctx.fillStyle = '#7c3aed';
      ctx.font = `${ob.h * 0.5}px sans-serif`;
      ctx.fillText('✦', ob.x + 5, ob.y + ob.h * 0.6);
    } else if (ob.type === 'cactus') {
      // Cactus tipo flor pixelada
      const grad = ctx.createLinearGradient(ob.x, ob.y, ob.x, ob.y + ob.h);
      grad.addColorStop(0, '#c084fc');
      grad.addColorStop(1, '#7c3aed');
      ctx.fillStyle = grad;
      ctx.fillRect(ob.x + 8, ob.y, 10, ob.h);
      ctx.fillRect(ob.x, ob.y + 12, 10, 18);
      ctx.fillRect(ob.x + 18, ob.y + 18, 8, 14);
      // Flor en la punta
      ctx.fillStyle = '#ff6ec7';
      ctx.beginPath();
      ctx.arc(ob.x + 13, ob.y + 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(ob.x + 13, ob.y + 2, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Mariposa
      ob.wingFrame = (ob.wingFrame || 0) + 0.4;
      const flap = Math.sin(ob.wingFrame) * 4;
      ctx.fillStyle = ob.color;
      // alas
      ctx.beginPath();
      ctx.ellipse(ob.x + 9, ob.y + 12 + flap, 10, 8, 0, 0, Math.PI * 2);
      ctx.ellipse(ob.x + 28, ob.y + 12 + flap, 10, 8, 0, 0, Math.PI * 2);
      ctx.ellipse(ob.x + 9, ob.y + 22 - flap, 8, 6, 0, 0, Math.PI * 2);
      ctx.ellipse(ob.x + 28, ob.y + 22 - flap, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // cuerpo
      ctx.fillStyle = '#1a0533';
      ctx.fillRect(ob.x + 17, ob.y + 8, 4, 18);
    }
  }

  function checkCollision() {
    // Hitbox un poco generoso (más amigable para Débora)
    const px = debora.x + 8;
    const py = debora.y + 8;
    const pw = debora.w - 16;
    const ph = debora.h - 12;
    for (const ob of obstacles) {
      const hbX = ob.x + 4;
      const hbY = ob.y + 4;
      const hbW = ob.w - 8;
      const hbH = ob.h - 8;
      if (px < hbX + hbW && px + pw > hbX && py < hbY + hbH && py + ph > hbY) {
        return true;
      }
    }
    return false;
  }

  // ---------- CONTROL ----------
  function jump() {
    if (state !== STATE.PLAYING) return;
    if (debora.onGround) {
      debora.vy = LEVELS[level].jumpV;
      debora.onGround = false;
      beep(500, 0.08);
    }
  }

  function beep(freq, dur) {
    try {
      const ctxA = window.__lissyAudio || (window.__lissyAudio = new (window.AudioContext || window.webkitAudioContext)());
      const o = ctxA.createOscillator();
      const g = ctxA.createGain();
      o.type = 'square';
      o.frequency.value = freq;
      g.gain.value = 0.04;
      o.connect(g);
      g.connect(ctxA.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctxA.currentTime + dur);
      o.stop(ctxA.currentTime + dur);
    } catch (e) {}
  }

  function reset() {
    score = 0;
    obstacles = [];
    pendingGap = LEVELS[level].obstacleGapMin;
    debora.y = groundY - debora.h;
    debora.vy = 0;
    debora.onGround = true;
    debora.runFrame = 0;
    speedMultiplier = 1;
    mamaShown = false;
    overlay.classList.remove('visible');
    overlayContent.innerHTML = '';
  }

  function showGameOver() {
    state = STATE.GAMEOVER;
    if (score > best) {
      best = Math.floor(score);
      localStorage.setItem('lissy_game_best', best);
    }
    bestVal.textContent = best;
    overlayContent.innerHTML = `
      <h2>★ ¡UPS, MAMI! ★</h2>
      <p>Débora se tropezó, pero no te preocupes: ¡las mejores hijas se levantan más fuertes!</p>
      <p style="color: var(--cyan); font-family: var(--font-pixel); font-size: 0.9rem; letter-spacing: 2px;">PUNTOS: ${Math.floor(score)} · RÉCORD: ${best}</p>
      <button class="arcade-btn pink" id="retryBtn" style="margin-top: 1rem;">▶ INTENTAR DE NUEVO</button>
    `;
    overlay.classList.add('visible');
    const retry = document.getElementById('retryBtn');
    if (retry) retry.addEventListener('click', startGame);
    beep(200, 0.4);
  }

  function showVictory() {
    state = STATE.WIN;
    if (score > best) {
      best = Math.floor(score);
      localStorage.setItem('lissy_game_best', best);
    }
    bestVal.textContent = best;

    let imagesHTML = '';
    if (deboraReady) {
      imagesHTML += `<img class="victory-img" src="assets/debora.jpg" alt="Débora" />`;
    }
    imagesHTML += `<div style="font-size: 4rem; align-self: center; filter: drop-shadow(0 0 15px var(--pink-glow));">♥</div>`;
    if (lissyReady) {
      imagesHTML += `<img class="victory-img" src="assets/lissy.jpg" alt="Mami Lissy" />`;
    }

    overlayContent.innerHTML = `
      <div class="victory-images">${imagesHTML}</div>
      <h2>★ FELIZ DÍA<br/>DE LAS MADRES ★</h2>
      <p style="font-size: 1.4rem; line-height: 1.7;">
        ¡Lo lograste, Débora! Llegaste hasta los brazos de mami Lissy.<br/>
        <span style="color: var(--pink); text-shadow: 0 0 10px var(--pink-glow);">Te amo infinito, mamá. Este juego es para ti. ♥</span>
      </p>
      <p style="color: var(--cyan); font-family: var(--font-pixel); font-size: 0.8rem; letter-spacing: 2px; margin-top: 1rem;">
        PUNTOS: ${Math.floor(score)} · RÉCORD: ${best}
      </p>
      <button class="arcade-btn pink" id="playAgainBtn" style="margin-top: 1.2rem;">♥ JUGAR DE NUEVO</button>
    `;
    overlay.classList.add('visible');
    const again = document.getElementById('playAgainBtn');
    if (again) again.addEventListener('click', startGame);
  }

  function startGame() {
    reset();
    state = STATE.PLAYING;
    overlay.classList.remove('visible');
    lastFrame = 0; // se inicializa en el primer frame del loop
    requestAnimationFrame(loop);
  }

  function stopGame() {
    state = STATE.STOPPED;
    overlayContent.innerHTML = `
      <h2>⏸ JUEGO PAUSADO</h2>
      <p>Pulsa PLAY para volver a la aventura, mami.</p>
    `;
    overlay.classList.add('visible');
  }

  // ---------- LOOP PRINCIPAL ----------
  function loop(ts) {
    if (state !== STATE.PLAYING) return;
    // Si es el primer frame o veníamos de una pausa de pestaña, forzar dt = 1
    if (!lastFrame) lastFrame = ts;
    const rawDt = (ts - lastFrame) / 16.67;
    // Cap conservador para que no se "teletransporte" si hay un frame lento
    const dt = Math.min(Math.max(rawDt, 0), 1.5);
    lastFrame = ts;

    // velocidad acumulada con score
    const conf = LEVELS[level];
    speedMultiplier = 1 + (score / 1000) * (conf.speedRampPer1000 * 0.1);
    const speed = conf.baseSpeed * speedMultiplier;

    // mover suelo / fondo
    groundOffset = (groundOffset + speed) % 80;

    // mover nubes
    clouds.forEach((c) => {
      c.x -= c.speed * speed * 0.3;
      if (c.x < -40) {
        c.x = W + 40;
        c.y = 30 + Math.random() * 120;
      }
    });

    // física personaje
    debora.vy += conf.gravity * dt;
    debora.y += debora.vy * dt;
    if (debora.y >= groundY - debora.h) {
      debora.y = groundY - debora.h;
      debora.vy = 0;
      debora.onGround = true;
    }
    if (debora.onGround) debora.runFrame += 0.35 * dt;

    // mover obstáculos
    obstacles.forEach((o) => (o.x -= speed * dt));
    obstacles = obstacles.filter((o) => o.x + o.w > -20);

    // generar nuevos: solo cuando el último obstáculo se haya alejado lo suficiente del borde derecho
    if (obstacles.length === 0) {
      spawnObstacle();
    } else {
      const last = obstacles[obstacles.length - 1];
      const distFromRight = W - (last.x + last.w);
      if (distFromRight >= pendingGap) {
        spawnObstacle();
      }
    }

    // score
    score += 0.5 * dt;
    scoreVal.textContent = Math.floor(score);
    speedVal.textContent = 'x' + speedMultiplier.toFixed(2);

    // colisión
    if (checkCollision()) {
      showGameOver();
      return;
    }

    // ¿victoria? En CUALQUIER nivel al pasar WIN_SCORE
    if (!mamaShown && score >= WIN_SCORE) {
      mamaShown = true;
      startWinAnimation();
      return;
    }

    // dibujar
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawGround();
    obstacles.forEach(drawObstacle);
    drawDebora();

    requestAnimationFrame(loop);
  }

  // ---------- ANIMACIÓN DE VICTORIA (estilo Mario Bros llegando a la princesa) ----------
  let winT = 0;        // tiempo de la animación en segundos
  let winLastFrame = 0;
  let winParticles = [];
  let deboraStartX = 100;
  const lissyX = W - 200;
  const lissyY = groundY - 100;
  const TOTAL_WIN_TIME = 8.5; // segundos antes de mostrar el overlay

  function startWinAnimation() {
    state = STATE.WIN;
    winT = 0;
    winLastFrame = 0;
    winParticles = [];
    obstacles = []; // se limpia el camino
    deboraStartX = debora.x;

    // Melodía de victoria larga y feliz
    const melody = [
      [800, 0.12, 0],
      [1000, 0.12, 180],
      [1200, 0.12, 360],
      [1500, 0.3, 540],
      [1200, 0.15, 1800],
      [1500, 0.15, 1980],
      [1800, 0.4, 2160],
      [1500, 0.15, 4500],
      [1800, 0.15, 4680],
      [2000, 0.5, 4860],
    ];
    melody.forEach(([f, d, t]) => setTimeout(() => beep(f, d), t));

    requestAnimationFrame(winLoop);
  }

  function winLoop(ts) {
    if (state !== STATE.WIN) return;
    if (!winLastFrame) winLastFrame = ts;
    const dt = Math.min((ts - winLastFrame) / 1000, 0.05); // máx 50ms para que sea estable
    winLastFrame = ts;
    winT += dt;

    drawWinScene(winT, dt);

    if (winT < TOTAL_WIN_TIME) {
      requestAnimationFrame(winLoop);
    } else {
      showVictory();
    }
  }

  // Dibuja a mami Lissy en la posición dada. opts.hugging cierra los brazos.
  function drawLissyCharacter(lx, ly, opts) {
    const lw = 80;
    const lh = 100;
    const hugging = opts && opts.hugging;
    const bounce = opts && opts.bounce ? opts.bounce : 0;
    ly += bounce;

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(lx + lw / 2, groundY + 5, lw / 2, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // piernas
    ctx.fillStyle = '#ffd6b8';
    ctx.fillRect(lx + 22, ly + lh - 14, 10, 14);
    ctx.fillRect(lx + lw - 32, ly + lh - 14, 10, 14);
    // zapatos morados
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(lx + 20, ly + lh - 4, 14, 6);
    ctx.fillRect(lx + lw - 34, ly + lh - 4, 14, 6);

    // vestido (degradado morado)
    const lGrad = ctx.createLinearGradient(lx, ly + 30, lx, ly + lh);
    lGrad.addColorStop(0, '#7c3aed');
    lGrad.addColorStop(1, '#c084fc');
    ctx.fillStyle = lGrad;
    ctx.beginPath();
    ctx.moveTo(lx + 18, ly + 36);
    ctx.lineTo(lx + lw - 18, ly + 36);
    ctx.lineTo(lx + lw - 4, ly + lh - 14);
    ctx.lineTo(lx + 4, ly + lh - 14);
    ctx.closePath();
    ctx.fill();

    // detalle corazón en el vestido
    ctx.fillStyle = '#fff5fb';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('♥', lx + lw / 2, ly + lh - 28);
    ctx.textAlign = 'left';

    // brazos
    ctx.fillStyle = '#ffd6b8';
    if (hugging) {
      // brazos cerrados hacia el frente (abrazando)
      ctx.save();
      ctx.translate(lx + 6, ly + 40);
      ctx.rotate(-0.5);
      ctx.fillRect(0, 0, 22, 9);
      ctx.restore();
      ctx.save();
      ctx.translate(lx + lw - 6, ly + 40);
      ctx.rotate(Math.PI + 0.5);
      ctx.fillRect(0, 0, 22, 9);
      ctx.restore();
    } else {
      // brazos abiertos esperando
      ctx.save();
      ctx.translate(lx + 4, ly + 38);
      ctx.rotate(0.4);
      ctx.fillRect(-22, 0, 24, 9);
      ctx.restore();
      ctx.save();
      ctx.translate(lx + lw - 4, ly + 38);
      ctx.rotate(-0.4);
      ctx.fillRect(0, 0, 24, 9);
      ctx.restore();
    }

    // cabeza con foto
    const hcx = lx + lw / 2;
    const hcy = ly + 22;
    const hr = 26;

    // aura
    const aura = ctx.createRadialGradient(hcx, hcy, 5, hcx, hcy, hr + 10);
    aura.addColorStop(0, 'rgba(255,230,247,0)');
    aura.addColorStop(1, 'rgba(255,110,199,0.5)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(hcx, hcy, hr + 10, 0, Math.PI * 2);
    ctx.fill();

    // borde
    ctx.beginPath();
    ctx.arc(hcx, hcy, hr + 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6ec7';
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(hcx, hcy, hr, 0, Math.PI * 2);
    ctx.clip();

    if (lissyReady) {
      const img = imgLissy;
      const minDim = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - minDim) / 2;
      const sy = (img.naturalHeight - minDim) / 2;
      ctx.drawImage(img, sx, sy, minDim, minDim, hcx - hr, hcy - hr, hr * 2, hr * 2);
    } else {
      drawKawaiiFace(hcx, hcy, hr, '#ffd6b8');
    }
    ctx.restore();
  }

  // Easing
  function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
  function easeOutBack(x) {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

  function drawWinScene(t, dt) {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawGround();

    // ---- Posición de Débora (corre hacia mami con easing) ----
    const runDuration = 2.0;
    const targetX = lissyX - 60; // se detiene un poco antes de mami
    let runProgress = Math.min(t / runDuration, 1);
    runProgress = easeOutCubic(runProgress);
    debora.x = deboraStartX + (targetX - deboraStartX) * runProgress;
    debora.y = groundY - debora.h;
    debora.onGround = true;
    if (t < runDuration) debora.runFrame += dt * 14;

    // ---- Fases ----
    const arrived = t >= runDuration;        // 2.0s: ya llegó a mami
    const hugging = t >= runDuration + 0.4;  // 2.4s: se abrazan
    const showBigMsg = t >= runDuration + 1.5; // 3.5s: aparece mensaje grande

    // Pequeño bote alegre cuando llega
    let lissyBounce = 0;
    if (arrived) {
      const bt = t - runDuration;
      lissyBounce = Math.sin(bt * 8) * 4 * Math.exp(-bt * 1.0);
    }

    // ---- Dibujar mami Lissy ----
    drawLissyCharacter(lissyX, lissyY, { hugging: hugging, bounce: lissyBounce });

    // ---- Dibujar Débora ----
    drawDebora();

    // ---- Generar corazones / estrellas alrededor del abrazo ----
    if (hugging && Math.random() < 0.55) {
      const cx = (debora.x + debora.w / 2 + lissyX + 40) / 2 + (Math.random() - 0.5) * 70;
      const cy = lissyY + 20 + (Math.random() - 0.5) * 50;
      const colors = ['#ff6ec7', '#c084fc', '#67e8f9', '#fde047', '#ffb3e6'];
      winParticles.push({
        x: cx,
        y: cy,
        vx: (Math.random() - 0.5) * 140,
        vy: -60 - Math.random() * 100,
        life: 1.5 + Math.random() * 1,
        size: 14 + Math.random() * 18,
        shape: Math.random() < 0.7 ? '♥' : (Math.random() < 0.5 ? '★' : '✿'),
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Update + draw partículas
    for (let i = winParticles.length - 1; i >= 0; i--) {
      const p = winParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt;
      p.life -= dt;
      if (p.life <= 0) {
        winParticles.splice(i, 1);
        continue;
      }
      const alpha = Math.min(p.life / 1.2, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.font = `${p.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(p.shape, p.x, p.y);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';

    // ---- Mensaje pequeño "¡MAMIIII!" arriba durante toda la escena ----
    if (t > 0.15) {
      ctx.font = 'bold 22px "Press Start 2P", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff5fb';
      ctx.shadowColor = '#ff6ec7';
      ctx.shadowBlur = 20;
      ctx.fillText('♥ ¡MAMIIIII! ♥', W / 2, 50);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
    }

    // ---- Mensaje grande "FELIZ DÍA DE LAS MADRES" con animación de aparición ----
    if (showBigMsg) {
      const msgT = Math.min((t - (runDuration + 1.5)) / 0.7, 1);
      const scale = easeOutBack(msgT);
      const alpha = msgT;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(W / 2, H / 2);
      ctx.scale(scale, scale);

      // caja de fondo translúcida
      ctx.fillStyle = 'rgba(13, 2, 33, 0.7)';
      const boxW = 560, boxH = 120;
      ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);
      ctx.strokeStyle = '#ff6ec7';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ff6ec7';
      ctx.shadowBlur = 25;
      ctx.strokeRect(-boxW / 2, -boxH / 2, boxW, boxH);

      ctx.font = 'bold 28px "Press Start 2P", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff6ec7';
      ctx.shadowBlur = 30;
      ctx.fillText('★ FELIZ DÍA ★', 0, -10);
      ctx.fillStyle = '#fff5fb';
      ctx.fillText('DE LAS MADRES', 0, 30);
      ctx.shadowBlur = 0;
      ctx.restore();
      ctx.textAlign = 'left';
    }
  }

  // ---------- INPUT ----------
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      // Ignorar repeticiones por mantener tecla presionada
      if (e.repeat) return;
      if (state === STATE.READY || state === STATE.GAMEOVER || state === STATE.STOPPED) {
        startGame();
      } else {
        jump();
      }
    }
  });

  // Si la pestaña se oculta y vuelve, resetear el timer para evitar saltos "buggy"
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state === STATE.PLAYING) {
      lastFrame = 0;
    }
  });

  canvas.addEventListener('click', () => {
    if (state === STATE.PLAYING) jump();
    else startGame();
  });

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (state === STATE.PLAYING) jump();
    else startGame();
  }, { passive: false });

  playBtn.addEventListener('click', startGame);
  stopBtn.addEventListener('click', stopGame);

  diffBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      diffBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      level = parseInt(btn.dataset.level, 10);
      levelVal.textContent = level;
      // reiniciar
      reset();
      state = STATE.READY;
      drawIntro();
    });
  });

  // ---------- INTRO ----------
  function drawIntro() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawGround();
    drawDebora();

    // Texto central
    ctx.font = 'bold 28px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#ff6ec7';
    ctx.shadowBlur = 20;
    ctx.fillText('PULSA PLAY O ESPACIO', W / 2, H / 2 - 20);
    ctx.shadowBlur = 10;
    ctx.font = '20px "VT323", monospace';
    ctx.fillStyle = '#67e8f9';
    ctx.fillText('Nivel ' + level + ' · ' + LEVELS[level].name, W / 2, H / 2 + 14);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
  }

  // ---------- INIT ----------
  function init() {
    resizeCanvas();
    debora.y = groundY - debora.h;
    bestVal.textContent = best;
    levelVal.textContent = level;
    drawIntro();
  }

  // Esperar a que carguen las fonts un toque para que se vea bien
  setTimeout(init, 100);

  // Si la imagen carga después de la intro, redibujar
  imgDebora.addEventListener('load', () => {
    if (state === STATE.READY) drawIntro();
  });
})();
