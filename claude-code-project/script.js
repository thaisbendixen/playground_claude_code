document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initParallax();
  initSpeechBubbleTap();
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
