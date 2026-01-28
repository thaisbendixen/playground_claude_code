// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  initWaveAnimation();
  initScrollAnimations();
});

// Wave width animation for the name
function initWaveAnimation() {
  const chars = document.querySelectorAll('.char');
  const totalChars = chars.length;

  // Animation parameters
  const waveSpeed = 0.002; // Speed of the wave
  const waveLength = 6; // How many characters span one wave cycle
  const minScale = 0.7; // Minimum scaleX (condensed)
  const maxScale = 1.4; // Maximum scaleX (expanded)
  const minWeight = 300; // Minimum font weight
  const maxWeight = 700; // Maximum font weight

  let time = 0;

  function animate() {
    time += waveSpeed;

    chars.forEach((char, index) => {
      // Calculate wave phase for this character
      const phase = (index / waveLength) * Math.PI * 2;
      const wave = Math.sin(time * Math.PI * 2 + phase);

      // Map wave (-1 to 1) to scale range
      const scale = minScale + ((wave + 1) / 2) * (maxScale - minScale);

      // Map wave to font weight
      const weight = minWeight + ((wave + 1) / 2) * (maxWeight - minWeight);

      // Apply the transformations
      char.style.setProperty('--scale-x', scale);
      char.style.setProperty('--font-weight', weight);
      char.style.transform = `scaleX(${scale})`;
      char.style.fontVariationSettings = `'wght' ${weight}`;
    });

    requestAnimationFrame(animate);
  }

  animate();
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
