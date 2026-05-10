# Feliz Día Mamá Lissy ♥

Una web app arcade femenina dedicada a **Lissy**, hecha con todo el amor por su hija **Débora** para el Día de la Madre.

## ¿Qué tiene?

- **Página principal** (`index.html`) — Mensajes, poemas y dedicatorias hermosas con estilo arcade neón.
- **Galería** (`galeria.html`) — Carrusel automático donde puedes subir fotos de mamá. Cada foto sale con un mensaje de "Feliz Día Mami". Las fotos se guardan en el navegador.
- **Juego** (`juego.html`) — Estilo dinosaurio de Google: Débora (en muñequito) corre y salta obstáculos. Tiene **3 niveles de dificultad** y al llegar a 500 puntos en **cualquier nivel** aparece mami Lissy con un **FELIZ DÍA DE LAS MADRES**.

- **Modo oscuro / modo claro** — En la barra superior elige **Oscuro** o **Claro**; la preferencia se guarda en el dispositivo (ideal para móvil).

## Estructura

```
feliz-dia-lissy/
├── index.html
├── galeria.html
├── juego.html
├── css/
│   └── styles.css
├── js/
│   ├── theme.js       ← tema claro/oscuro
│   ├── main.js
│   ├── galeria.js
│   └── juego.js
├── assets/
│   ├── debora.jpg     ← coloca aquí la foto de Débora
│   └── lissy.jpg      ← coloca aquí la foto de Lissy
├── vercel.json
└── README.md
```

## Instrucciones para subir las fotos del juego

Para que el juego use la cara de Débora y de Lissy:

1. Guarda la foto de Débora como `assets/debora.jpg`
2. Guarda la foto de Lissy como `assets/lissy.jpg`
3. Listo, el juego las usará automáticamente. Si no existen, se dibuja una carita kawaii como fallback.

> Tip: para que se vean bien recortadas en círculo, usa fotos con la cara más o menos centrada.

## Cómo correr en local

No necesita instalación. Solo abre `index.html` en el navegador, o si quieres servir con Python:

```bash
python -m http.server 8000
```

Luego abre `http://localhost:8000`.

## Cómo subir a GitHub

```bash
cd feliz-dia-lissy
git init
git add .
git commit -m "♥ Web app Día de la Madre para mami Lissy"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/feliz-dia-lissy.git
git push -u origin main
```

## Cómo desplegar en Vercel

1. Entra a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Da clic en **"Add New Project"** y selecciona el repositorio `feliz-dia-lissy`.
3. Vercel detectará que es un sitio estático automáticamente. Solo da clic en **Deploy**.
4. En unos segundos tu sitio estará en una URL tipo `https://feliz-dia-lissy.vercel.app`.

## Controles del juego

- **Espacio** o **Flecha arriba** → Saltar
- **Click / Toque** en el canvas → Saltar también
- **PLAY** → Empezar / reiniciar
- **STOP** → Pausar
- Selecciona dificultad **Fácil**, **Normal** o **Difícil**

---

Hecho con ♥ por Débora · Para mami Lissy · Día de la Madre 2026
