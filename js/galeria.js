// ======================================
// GALERÍA - Carrusel de fotos para mamá
// ======================================
(function () {
  const STORAGE_KEY = 'lissy_gallery_photos';
  const messages = [
    '★ FELIZ DÍA, MAMI LISSY ★',
    '♥ TE AMO MÁS QUE A NADIE ♥',
    '✿ ERES MI HEROÍNA, MAMÁ ✿',
    '★ GRACIAS POR TODO, MAMI ★',
    '♛ LA MEJOR MAMÁ DEL UNIVERSO ♛',
    '☾ MI LUGAR SEGURO ERES TÚ ☾',
    '✦ TE ADORO, MAMÁ HERMOSA ✦',
    '★ MI EJEMPLO A SEGUIR ★',
    '♥ POR SIEMPRE Y SIEMPRE ♥',
    '✿ FELIZ DÍA DE LAS MADRES ✿',
    '★ ERES MI ÁNGEL, MAMI ★',
    '♥ NO HAY OTRA COMO TÚ ♥',
  ];

  const photoInput = document.getElementById('photoInput');
  const uploadSection = document.getElementById('uploadSection');
  const carouselTrack = document.getElementById('carouselTrack');
  const carouselDots = document.getElementById('carouselDots');
  const emptyState = document.getElementById('emptyState');
  const photoCount = document.getElementById('photoCount');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const clearBtn = document.getElementById('clearBtn');

  let photos = [];
  let currentIndex = 0;
  let autoPlayInterval = null;

  function loadPhotos() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        photos = JSON.parse(saved);
      }
    } catch (e) {
      photos = [];
    }
  }

  function savePhotos() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
    } catch (e) {
      console.warn('No se pudo guardar en localStorage. Probablemente la cuota está llena.');
    }
  }

  function getMessage(index) {
    return messages[index % messages.length];
  }

  function render() {
    const slidesHTML = photos
      .map(
        (src, i) => `
        <div class="carousel-slide ${i === currentIndex ? 'active' : ''}" data-idx="${i}">
          <img src="${src}" alt="Foto de mami ${i + 1}" />
          <div class="slide-overlay">
            <p class="slide-message">${getMessage(i)}</p>
          </div>
        </div>
      `
      )
      .join('');

    if (photos.length === 0) {
      carouselTrack.innerHTML =
        '<div class="empty-carousel" id="emptyState"><div class="empty-icon">💖</div><p>SUBE TUS FOTOS PARA<br/>EMPEZAR EL CARRUSEL</p></div>';
      carouselDots.innerHTML = '';
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
      clearBtn.style.display = 'none';
      stopAutoPlay();
    } else {
      carouselTrack.innerHTML = slidesHTML;
      carouselDots.innerHTML = photos
        .map((_, i) => `<span class="carousel-dot ${i === currentIndex ? 'active' : ''}" data-idx="${i}"></span>`)
        .join('');
      prevBtn.style.display = photos.length > 1 ? 'flex' : 'none';
      nextBtn.style.display = photos.length > 1 ? 'flex' : 'none';
      clearBtn.style.display = 'inline-block';

      carouselDots.querySelectorAll('.carousel-dot').forEach((dot) => {
        dot.addEventListener('click', () => {
          currentIndex = parseInt(dot.dataset.idx, 10);
          render();
          restartAutoPlay();
        });
      });

      if (photos.length > 1) startAutoPlay();
    }

    photoCount.textContent = `${photos.length} foto${photos.length !== 1 ? 's' : ''} cargada${photos.length !== 1 ? 's' : ''}`;
  }

  function next() {
    if (photos.length === 0) return;
    currentIndex = (currentIndex + 1) % photos.length;
    render();
  }

  function prev() {
    if (photos.length === 0) return;
    currentIndex = (currentIndex - 1 + photos.length) % photos.length;
    render();
  }

  function startAutoPlay() {
    stopAutoPlay();
    autoPlayInterval = setInterval(next, 4500);
  }

  function stopAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
  }

  function restartAutoPlay() {
    if (photos.length > 1) startAutoPlay();
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function compressImage(dataUrl, maxWidth = 1280, quality = 0.85) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  async function handleFiles(files) {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    photoCount.textContent = `Cargando ${imageFiles.length} foto${imageFiles.length > 1 ? 's' : ''}...`;

    for (const file of imageFiles) {
      try {
        const raw = await readFileAsDataURL(file);
        const compressed = await compressImage(raw);
        photos.push(compressed);
      } catch (e) {
        console.error('Error cargando foto:', e);
      }
    }

    savePhotos();
    if (photos.length > 0 && currentIndex >= photos.length) {
      currentIndex = photos.length - 1;
    }
    render();
  }

  // Event listeners
  photoInput.addEventListener('change', (e) => handleFiles(e.target.files));

  uploadSection.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadSection.classList.add('dragging');
  });

  uploadSection.addEventListener('dragleave', () => {
    uploadSection.classList.remove('dragging');
  });

  uploadSection.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadSection.classList.remove('dragging');
    handleFiles(e.dataTransfer.files);
  });

  prevBtn.addEventListener('click', () => {
    prev();
    restartAutoPlay();
  });

  nextBtn.addEventListener('click', () => {
    next();
    restartAutoPlay();
  });

  clearBtn.addEventListener('click', () => {
    if (confirm('¿Seguro que quieres borrar todas las fotos de la galería?')) {
      photos = [];
      currentIndex = 0;
      savePhotos();
      render();
    }
  });

  // Teclas de flecha para navegar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });

  // Inicializar
  loadPhotos();
  render();
})();
