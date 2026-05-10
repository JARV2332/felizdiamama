// ======================================
// EFECTOS GLOBALES - Corazones flotantes
// ======================================
(function () {
  const container = document.getElementById('floatingHearts');
  if (!container) return;

  const heartIcons = ['♥', '♡', '✿', '★', '✦'];

  function spawnHeart() {
    const heart = document.createElement('span');
    heart.className = 'floating-heart';
    heart.textContent = heartIcons[Math.floor(Math.random() * heartIcons.length)];

    const startX = Math.random() * 100;
    const size = 0.8 + Math.random() * 1.5;
    const duration = 8 + Math.random() * 8;
    const delay = Math.random() * 2;
    const colors = ['#ff6ec7', '#c084fc', '#67e8f9', '#fde047', '#ffb3e6'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    heart.style.left = startX + 'vw';
    heart.style.fontSize = size + 'rem';
    heart.style.color = color;
    heart.style.animationDuration = duration + 's';
    heart.style.animationDelay = delay + 's';
    heart.style.filter = `drop-shadow(0 0 8px ${color})`;

    container.appendChild(heart);

    setTimeout(() => heart.remove(), (duration + delay) * 1000);
  }

  for (let i = 0; i < 8; i++) {
    setTimeout(spawnHeart, i * 800);
  }

  setInterval(spawnHeart, 1200);
})();

// ======================================
// Suavizado del scroll y revelado al entrar
// ======================================
(function () {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('.message-card, .stat-card, .welcome-card, .poem-section').forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    observer.observe(el);
  });
})();

// ======================================
// Sonidito sutil arcade al hacer clic en botones
// ======================================
(function () {
  let audioCtx = null;

  function beep(freq, duration) {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // silencio si el navegador bloquea audio
    }
  }

  document.querySelectorAll('.arcade-btn, .nav-links a, .game-btn, .diff-btn, .theme-btn').forEach((btn) => {
    btn.addEventListener('mouseenter', () => beep(800, 0.05));
    btn.addEventListener('click', () => beep(1200, 0.1));
  });
})();
