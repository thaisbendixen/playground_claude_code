// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  initTextureAnimation();
  initScrollAnimations();
});

// Texture types available
const TEXTURES = ['grainy', 'metallic', 'glass', 'matte'];

// Texture and size animation for the name
function initTextureAnimation() {
  const chars = document.querySelectorAll('.char');

  // Initialize each character with its starting texture
  chars.forEach((char, index) => {
    const initialTexture = char.dataset.texture || TEXTURES[index % TEXTURES.length];
    char.classList.add(`texture-${initialTexture}`);
    char.currentTexture = initialTexture;

    // Random initial scale
    const scale = 0.9 + Math.random() * 0.3;
    char.style.transform = `scale(${scale})`;
    char.currentScale = scale;
  });

  // Animate textures and sizes
  function animateChar(char, index) {
    // Random interval between texture changes (2-5 seconds)
    const interval = 2000 + Math.random() * 3000;

    setInterval(() => {
      // Remove current texture class
      char.classList.remove(`texture-${char.currentTexture}`);

      // Pick a new random texture (different from current)
      let newTexture;
      do {
        newTexture = TEXTURES[Math.floor(Math.random() * TEXTURES.length)];
      } while (newTexture === char.currentTexture && TEXTURES.length > 1);

      // Apply new texture
      char.classList.add(`texture-${newTexture}`);
      char.currentTexture = newTexture;

      // Animate scale
      const targetScale = 0.85 + Math.random() * 0.4;
      animateScale(char, targetScale);

    }, interval);
  }

  // Smooth scale animation
  function animateScale(char, targetScale) {
    const startScale = char.currentScale;
    const duration = 800;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);

      const currentScale = startScale + (targetScale - startScale) * eased;
      char.style.transform = `scale(${currentScale})`;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        char.currentScale = targetScale;
      }
    }

    requestAnimationFrame(step);
  }

  // Start animation for each character with staggered timing
  chars.forEach((char, index) => {
    setTimeout(() => {
      animateChar(char, index);
    }, index * 200);
  });

  // Also add subtle continuous movement
  initSubtleMovement(chars);
}

// Subtle floating movement
function initSubtleMovement(chars) {
  chars.forEach((char, index) => {
    const offsetX = Math.random() * Math.PI * 2;
    const offsetY = Math.random() * Math.PI * 2;
    const speedX = 0.5 + Math.random() * 0.5;
    const speedY = 0.3 + Math.random() * 0.4;

    function move() {
      const time = performance.now() / 1000;
      const x = Math.sin(time * speedX + offsetX) * 3;
      const y = Math.sin(time * speedY + offsetY) * 2;

      // Combine with current scale
      const scale = char.currentScale || 1;
      char.style.transform = `scale(${scale}) translate(${x}px, ${y}px)`;

      requestAnimationFrame(move);
    }

    move();
  });
}

// Scroll-triggered animations
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

  scrollContents.forEach(content => {
    observer.observe(content);
  });
}
