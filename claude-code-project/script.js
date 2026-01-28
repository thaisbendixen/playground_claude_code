// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  initCharacterAnimations();
  initScrollAnimations();
  initMouseParallax();
  initCursorTrail();
});

// Character animations for the name
function initCharacterAnimations() {
  const chars = document.querySelectorAll('.char');

  // Add loaded class after initial animation completes
  setTimeout(() => {
    chars.forEach(char => {
      char.classList.add('loaded');
    });
  }, 1500);

  // Add magnetic effect on mouse move
  chars.forEach(char => {
    char.addEventListener('mousemove', (e) => {
      const rect = char.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      char.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px) scale(1.1)`;
    });

    char.addEventListener('mouseleave', () => {
      char.style.transform = '';
    });
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

  // Parallax effect on hero text while scrolling
  const heroName = document.querySelector('.name');
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const opacity = Math.max(0, 1 - scrollY / 500);
        const translateY = scrollY * 0.5;
        const scale = Math.max(0.8, 1 - scrollY / 2000);

        heroName.style.transform = `translateY(${translateY}px) scale(${scale})`;
        heroName.style.opacity = opacity;

        ticking = false;
      });
      ticking = true;
    }
  });
}

// Mouse parallax effect for hero section
function initMouseParallax() {
  const hero = document.querySelector('.hero');
  const heroContent = document.querySelector('.hero-content');

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const percentX = (mouseX - centerX) / centerX;
    const percentY = (mouseY - centerY) / centerY;

    const moveX = percentX * 20;
    const moveY = percentY * 20;

    heroContent.style.transform = `translate(${moveX}px, ${moveY}px)`;
  });

  hero.addEventListener('mouseleave', () => {
    heroContent.style.transform = 'translate(0, 0)';
    heroContent.style.transition = 'transform 0.5s ease';

    setTimeout(() => {
      heroContent.style.transition = '';
    }, 500);
  });
}

// Cursor trail effect
function initCursorTrail() {
  const trail = document.createElement('div');
  trail.className = 'cursor-trail';
  document.body.appendChild(trail);

  let mouseX = 0;
  let mouseY = 0;
  let trailX = 0;
  let trailY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animate() {
    // Smooth follow effect
    trailX += (mouseX - trailX) * 0.15;
    trailY += (mouseY - trailY) * 0.15;

    trail.style.left = trailX + 'px';
    trail.style.top = trailY + 'px';

    requestAnimationFrame(animate);
  }

  animate();

  // Hide trail when mouse leaves window
  document.addEventListener('mouseleave', () => {
    trail.style.opacity = '0';
  });

  document.addEventListener('mouseenter', () => {
    trail.style.opacity = '0.5';
  });
}
