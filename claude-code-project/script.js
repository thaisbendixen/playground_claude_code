document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initParallax();
  initSpeechBubbleTap();
  initChickenCursor();
});

// Scroll-triggered reveal for sections below the hero
function initScrollAnimations() {
  const scrollContents = document.querySelectorAll('.scroll-content');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.3,
    rootMargin: '0px 0px -100px 0px'
  });

  scrollContents.forEach(content => observer.observe(content));
}

// Light mouse-parallax on floating shapes + avatar
function initParallax() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const hero = document.querySelector('.hero');
  const shapes = document.querySelectorAll('.floating-shape');
  const avatarWrap = document.querySelector('.hero-avatar-wrap');
  if (!hero) return;

  let mouseX = 0;
  let mouseY = 0;
  let rafId = null;

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

    if (!rafId) {
      rafId = requestAnimationFrame(applyParallax);
    }
  });

  hero.addEventListener('mouseleave', () => {
    mouseX = 0;
    mouseY = 0;
    if (!rafId) {
      rafId = requestAnimationFrame(applyParallax);
    }
  });

  function applyParallax() {
    rafId = null;

    // Shapes parallax at varying depths
    shapes.forEach((shape, i) => {
      const depth = 6 + (i % 4) * 4;
      shape.style.setProperty('--px', `${mouseX * depth}px`);
      shape.style.setProperty('--py', `${mouseY * depth}px`);
    });

    // Avatar gets a very light parallax (opposite direction for depth feel)
    if (avatarWrap) {
      const ax = mouseX * -8;
      const ay = mouseY * -6;
      avatarWrap.style.translate = `${ax}px ${ay}px`;
    }
  }
}

// Chicken cursor: fake cursor element for guaranteed 64–80px size.
// Swaps to pecking image on mousedown, reverts on mouseup.
function initChickenCursor() {
  // Skip on touch-only devices (no fine pointer)
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Create cursor element
  const cursor = document.createElement('div');
  cursor.id = 'chicken-cursor';
  document.body.appendChild(cursor);

  // Preload both images so the peck swap is instant
  const imgStand = new Image();
  imgStand.src = 'assets/chicken-stand.png';
  const imgPeck = new Image();
  imgPeck.src = 'assets/chicken-peck.png';

  let mouseX = -100;
  let mouseY = -100;
  let rafScheduled = false;
  let timer = null;

  function updatePosition() {
    // translate3d positions top-left at the mouse point,
    // then translate(-50%, -50%) centers the image on it
    cursor.style.transform =
      `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    rafScheduled = false;
  }

  // Show cursor and hide system cursor on first mouse move
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Activate on first move
    if (cursor.style.display !== 'block') {
      cursor.style.display = 'block';
      document.documentElement.classList.add('chicken-cursor-active');
    }

    if (!rafScheduled) {
      rafScheduled = true;
      requestAnimationFrame(updatePosition);
    }
  });

  // Hide fake cursor and revert peck when mouse leaves the viewport
  document.addEventListener('mouseleave', () => {
    cursor.style.display = 'none';
    cursor.classList.remove('pecking');
    if (timer) { clearTimeout(timer); timer = null; }
  });

  document.addEventListener('mouseenter', () => {
    cursor.style.display = 'block';
  });

  // Peck on click
  document.addEventListener('mousedown', () => {
    cursor.classList.add('pecking');

    // Safety timeout: revert after 150ms even if mouseup never fires
    if (!reducedMotion) {
      timer = setTimeout(() => cursor.classList.remove('pecking'), 150);
    }
  });

  document.addEventListener('mouseup', () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    cursor.classList.remove('pecking');
  });
}

// Mobile tap fallback for speech bubble
function initSpeechBubbleTap() {
  const zone = document.querySelector('.hero-avatar-zone');
  const bubble = document.querySelector('.speech-bubble');
  if (!zone || !bubble) return;

  zone.addEventListener('touchstart', (e) => {
    e.stopPropagation();
    bubble.classList.toggle('is-visible');
  }, { passive: true });

  document.addEventListener('touchstart', () => {
    bubble.classList.remove('is-visible');
  }, { passive: true });
}
