/* ═══════════════════════════════════════════
   Snake Game — Retro Pixel Arcade
   ═══════════════════════════════════════════
   Canvas-rendered pixel snake game.
   - Chunky pixel-block snake with shaded segments
   - Splash screen with decorative coiled snake
   - Pixel egg food with orange yolk
   - Exaggerated "nom" bite sound
   - Retro HUD, game-over overlay inside board
   - Arrow keys + WASD, mobile swipe + d-pad
   - Personal best via localStorage
   - Respects prefers-reduced-motion
   ═══════════════════════════════════════════ */

/*
 * TODO: Global Leaderboard
 * This site is static (GitHub Pages) with no backend.
 * Recommended: Firebase Realtime DB, Supabase, or Cloudflare Worker + KV.
 * For now, only personal best is stored via localStorage.
 */

(function () {
  'use strict';

  // ── Config ─────────────────────────────────
  const GRID = 20;
  const TICK_MS = 110;

  // Retro palette
  const C = {
    bg:           '#12102c',
    gridLine:     '#1a1640',
    // Snake
    headTop:      '#b8a0ff',
    headBase:     '#8a72d6',
    headOutline:  '#2a1854',
    bodyTop:      '#9b8aff',
    bodyBase:     '#6b5cbe',
    bodyDark:     '#4a3d8f',
    bodyOutline:  '#1e1545',
    eyeWhite:     '#f0ecff',
    pupil:        '#1e1545',
    tongue:       '#e85d75',
    // Egg
    eggShell:     '#f5f0e0',
    eggOutline:   '#b0a080',
    eggYolk:      '#e8943a',
    eggYolkLight: '#f5c542',
    eggHighlight: '#fffef5',
    // Splash
    splashTitle:  '#aeb8fe',
  };

  // ── State ──────────────────────────────────
  let canvas, ctx, cellSize;
  let snake, direction, nextDirection, food;
  let score, bestScore, gameRunning, gameOver;
  let lastTick, tickAccumulator;
  let soundEnabled = true;
  let biteAudio = null;
  let animFrameId = null;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── DOM refs ───────────────────────────────
  let scoreEl, bestScoreEl, soundBtn;
  let splashEl, splashCanvas, playBtn;
  let boardEl, gameoverEl, gameoverScoreEl, replayBtn;

  // ═══════════════════════════════════════════
  //  Init
  // ═══════════════════════════════════════════
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    canvas       = document.getElementById('snake-canvas');
    if (!canvas) return;
    ctx          = canvas.getContext('2d');

    scoreEl          = document.getElementById('snake-score');
    bestScoreEl      = document.getElementById('snake-best');
    soundBtn         = document.getElementById('snake-sound-btn');
    splashEl         = document.getElementById('snake-splash');
    splashCanvas     = document.getElementById('snake-splash-canvas');
    playBtn          = document.getElementById('snake-play-btn');
    boardEl          = document.getElementById('snake-board');
    gameoverEl       = document.getElementById('snake-gameover');
    gameoverScoreEl  = document.getElementById('snake-gameover-score');
    replayBtn        = document.getElementById('snake-replay-btn');

    bestScore = parseInt(localStorage.getItem('snake-best-score') || '0', 10);
    updateHUD();

    drawSplashSnake();

    // Events
    playBtn.addEventListener('click', startFromSplash);
    replayBtn.addEventListener('click', startFromGameover);
    soundBtn.addEventListener('click', toggleSound);
    document.addEventListener('keydown', handleKey);

    // Mobile d-pad
    document.querySelectorAll('.snake-dpad-btn').forEach(btn => {
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        setDirection(btn.dataset.dir);
      });
      btn.addEventListener('click', () => setDirection(btn.dataset.dir));
    });

    initSwipe();
  }

  // ═══════════════════════════════════════════
  //  Splash screen — decorative coiled snake
  // ═══════════════════════════════════════════
  function drawSplashSnake() {
    const sc = splashCanvas;
    if (!sc) return;

    // Make it crisp
    const dpr = 1; // keep pixel-perfect, no scaling
    const w = sc.width;
    const h = sc.height;
    const sctx = sc.getContext('2d');

    sctx.clearRect(0, 0, w, h);

    const px = 8; // pixel size
    // S-shaped snake body coords (grid positions)
    const body = [
      // Head (facing right)
      [15, 4],
      // Neck
      [14, 4], [13, 4], [12, 4], [11, 4],
      // Curve down
      [10, 4], [10, 5], [10, 6], [10, 7],
      // Go right
      [11, 7], [12, 7], [13, 7], [14, 7],
      // Curve down
      [14, 8], [14, 9], [14, 10],
      // Go left
      [13, 10], [12, 10], [11, 10], [10, 10],
      // Curve down
      [10, 11], [10, 12],
      // Go right (tail)
      [11, 12], [12, 12], [13, 12],
    ];

    // Offset to center
    const ox = Math.floor((w - 26 * px) / 2) + 2 * px;
    const oy = Math.floor((h - 16 * px) / 2);

    // Draw body segments (back to front so head is on top)
    for (let i = body.length - 1; i >= 0; i--) {
      const [gx, gy] = body[i];
      const x = ox + gx * px;
      const y = oy + gy * px;
      const isHead = i === 0;

      if (isHead) {
        drawPixelHead(sctx, x, y, px, 'right');
      } else {
        drawPixelSegment(sctx, x, y, px, i, body.length);
      }
    }

    // Style the canvas element to display size
    sc.style.width = w + 'px';
    sc.style.height = h + 'px';
  }

  // ═══════════════════════════════════════════
  //  Canvas sizing (game board)
  // ═══════════════════════════════════════════
  function sizeBoard() {
    const screen = document.getElementById('snake-screen');
    if (!screen) return;
    const maxW = Math.min(screen.clientWidth, 400);
    const size = Math.floor(maxW / GRID) * GRID;
    canvas.width = size;
    canvas.height = size;
    cellSize = size / GRID;
  }

  // ═══════════════════════════════════════════
  //  Game lifecycle
  // ═══════════════════════════════════════════
  function startFromSplash() {
    initAudio();
    splashEl.classList.add('hidden');
    boardEl.classList.add('active');
    sizeBoard();
    beginGame();
  }

  function startFromGameover() {
    gameoverEl.classList.remove('active');
    beginGame();
  }

  function beginGame() {
    resetGame();
    gameRunning = true;
    gameOver = false;
    lastTick = performance.now();
    tickAccumulator = 0;
    draw();
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function resetGame() {
    const mid = Math.floor(GRID / 2);
    snake = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
    ];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    updateHUD();
    placeFood();
  }

  function endGame() {
    gameRunning = false;
    gameOver = true;
    if (animFrameId) cancelAnimationFrame(animFrameId);

    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('snake-best-score', String(bestScore));
    }
    updateHUD();
    gameoverScoreEl.textContent = 'SCORE: ' + String(score).padStart(3, '0');
    gameoverEl.classList.add('active');
  }

  // ═══════════════════════════════════════════
  //  Game loop
  // ═══════════════════════════════════════════
  function gameLoop(now) {
    if (!gameRunning) return;
    const delta = now - lastTick;
    lastTick = now;
    tickAccumulator += delta;

    while (tickAccumulator >= TICK_MS) {
      tickAccumulator -= TICK_MS;
      update();
      if (!gameRunning) return;
    }
    draw();
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function update() {
    direction = nextDirection;
    const head = { ...snake[0] };
    switch (direction) {
      case 'up':    head.y--; break;
      case 'down':  head.y++; break;
      case 'left':  head.x--; break;
      case 'right': head.x++; break;
    }

    if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) { endGame(); return; }
    if (snake.some(s => s.x === head.x && s.y === head.y)) { endGame(); return; }

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score++;
      updateHUD();
      playBite();
      placeFood();
    } else {
      snake.pop();
    }
  }

  // ═══════════════════════════════════════════
  //  Drawing — retro pixel style
  // ═══════════════════════════════════════════
  function draw() {
    const w = canvas.width, h = canvas.height;
    // Background
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = C.gridLine;
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID; i++) {
      const p = i * cellSize;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(w, p); ctx.stroke();
    }

    // Egg
    drawPixelEgg(ctx, food.x * cellSize, food.y * cellSize, cellSize);

    // Snake (tail first so head draws on top)
    for (let i = snake.length - 1; i >= 0; i--) {
      const seg = snake[i];
      const x = seg.x * cellSize;
      const y = seg.y * cellSize;
      if (i === 0) {
        drawPixelHead(ctx, x, y, cellSize, direction);
      } else {
        drawPixelSegment(ctx, x, y, cellSize, i, snake.length);
      }
    }
  }

  // ── Pixel segment (body) ───────────────────
  function drawPixelSegment(c, x, y, s, idx, total) {
    const inset = 1;
    const ix = x + inset;
    const iy = y + inset;
    const is = s - inset * 2;

    // Outline
    c.fillStyle = C.bodyOutline;
    c.fillRect(x, y, s, s);

    // Base fill
    c.fillStyle = C.bodyBase;
    c.fillRect(ix, iy, is, is);

    // Top highlight band (top 30%)
    c.fillStyle = C.bodyTop;
    c.fillRect(ix, iy, is, Math.floor(is * 0.35));

    // Bottom shadow band (bottom 25%)
    c.fillStyle = C.bodyDark;
    const shadowH = Math.floor(is * 0.25);
    c.fillRect(ix, iy + is - shadowH, is, shadowH);

    // Corner pixel highlight (top-left)
    const pxSz = Math.max(2, Math.floor(s * 0.15));
    c.fillStyle = 'rgba(200,190,255,0.3)';
    c.fillRect(ix, iy, pxSz, pxSz);
  }

  // ── Pixel head ─────────────────────────────
  function drawPixelHead(c, x, y, s, dir) {
    const inset = 1;
    const ix = x + inset;
    const iy = y + inset;
    const is = s - inset * 2;

    // Outline
    c.fillStyle = C.headOutline;
    c.fillRect(x, y, s, s);

    // Base
    c.fillStyle = C.headBase;
    c.fillRect(ix, iy, is, is);

    // Highlight
    c.fillStyle = C.headTop;
    c.fillRect(ix, iy, is, Math.floor(is * 0.4));

    // Eyes (2×2 px white blocks + 1×1 pupil)
    const eyeSize = Math.max(2, Math.floor(s * 0.22));
    const pupilSize = Math.max(1, Math.floor(eyeSize * 0.55));

    let e1x, e1y, e2x, e2y, pOff;
    const margin = Math.floor(s * 0.18);
    const center = Math.floor(s * 0.5 - eyeSize * 0.5);

    switch (dir) {
      case 'right':
        e1x = x + s - margin - eyeSize; e1y = y + margin;
        e2x = e1x; e2y = y + s - margin - eyeSize;
        pOff = { x: eyeSize - pupilSize, y: Math.floor(eyeSize * 0.25) };
        break;
      case 'left':
        e1x = x + margin; e1y = y + margin;
        e2x = e1x; e2y = y + s - margin - eyeSize;
        pOff = { x: 0, y: Math.floor(eyeSize * 0.25) };
        break;
      case 'up':
        e1x = x + margin; e1y = y + margin;
        e2x = x + s - margin - eyeSize; e2y = e1y;
        pOff = { x: Math.floor(eyeSize * 0.25), y: 0 };
        break;
      case 'down':
        e1x = x + margin; e1y = y + s - margin - eyeSize;
        e2x = x + s - margin - eyeSize; e2y = e1y;
        pOff = { x: Math.floor(eyeSize * 0.25), y: eyeSize - pupilSize };
        break;
    }

    // Eye whites
    c.fillStyle = C.eyeWhite;
    c.fillRect(e1x, e1y, eyeSize, eyeSize);
    c.fillRect(e2x, e2y, eyeSize, eyeSize);
    // Pupils
    c.fillStyle = C.pupil;
    c.fillRect(e1x + pOff.x, e1y + pOff.y, pupilSize, pupilSize);
    c.fillRect(e2x + pOff.x, e2y + pOff.y, pupilSize, pupilSize);
  }

  // ── Pixel egg ──────────────────────────────
  function drawPixelEgg(c, x, y, s) {
    // All pixel-art: small rects
    const p = Math.max(2, Math.floor(s / 5)); // pixel unit
    const cx = x + Math.floor(s / 2);
    const cy = y + Math.floor(s / 2);

    // Egg shell (3×4 pixels centered)
    const ew = p * 3;
    const eh = p * 4;
    const ex = cx - Math.floor(ew / 2);
    const ey = cy - Math.floor(eh / 2);

    // Outline
    c.fillStyle = C.eggOutline;
    c.fillRect(ex - 1, ey - 1, ew + 2, eh + 2);

    // Shell
    c.fillStyle = C.eggShell;
    c.fillRect(ex, ey, ew, eh);

    // Yolk (2×2 in bottom-center area)
    const yw = p * 2;
    const yh = p * 2;
    const yx = cx - Math.floor(yw / 2);
    const yy = cy;
    c.fillStyle = C.eggYolk;
    c.fillRect(yx, yy, yw, yh);

    // Yolk highlight (1px)
    c.fillStyle = C.eggYolkLight;
    c.fillRect(yx, yy, p, p);

    // Shell highlight (top)
    c.fillStyle = C.eggHighlight;
    c.fillRect(ex, ey, p, p);
  }

  // ═══════════════════════════════════════════
  //  Food placement
  // ═══════════════════════════════════════════
  function placeFood() {
    let pos;
    do {
      pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    food = pos;
  }

  // ═══════════════════════════════════════════
  //  Controls
  // ═══════════════════════════════════════════
  function handleKey(e) {
    const map = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', W: 'up', a: 'left', A: 'left', s: 'down', S: 'down', d: 'right', D: 'right',
    };
    const dir = map[e.key];
    if (!dir) return;
    if (gameRunning) e.preventDefault();
    setDirection(dir);
  }

  function setDirection(dir) {
    if (!gameRunning) return;
    const opp = { up: 'down', down: 'up', left: 'right', right: 'left' };
    if (dir !== opp[direction]) nextDirection = dir;
  }

  function initSwipe() {
    let sx, sy;
    const el = document.getElementById('snake-screen');
    if (!el) return;
    el.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) setDirection(dx > 0 ? 'right' : 'left');
      else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 30) setDirection(dy > 0 ? 'down' : 'up');
      sx = sy = null;
    }, { passive: true });
  }

  // ═══════════════════════════════════════════
  //  Sound — exaggerated "nom"
  // ═══════════════════════════════════════════
  function initAudio() {
    if (biteAudio) return;
    biteAudio = new Audio(createNomSound());
    biteAudio.volume = 0.35;
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    soundBtn.textContent = soundEnabled ? 'SND:ON' : 'SND:OFF';
    soundBtn.setAttribute('aria-pressed', String(soundEnabled));
  }

  function playBite() {
    if (!soundEnabled || !biteAudio) return;
    biteAudio.currentTime = 0;
    biteAudio.play().catch(() => {});
  }

  // Procedural "nom/crunch" — longer, more exaggerated than a simple pop
  function createNomSound() {
    const sr = 22050;
    const dur = 0.18;
    const n = Math.floor(sr * dur);
    const buf = new ArrayBuffer(44 + n * 2);
    const v = new DataView(buf);

    function ws(o, s) { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }
    ws(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true);
    ws(8, 'WAVE'); ws(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true);
    v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    ws(36, 'data'); v.setUint32(40, n * 2, true);

    for (let i = 0; i < n; i++) {
      const t = i / sr;
      // Two-stage: initial crunch (noise burst) + descending "wom"
      const phase1 = t < 0.04 ? 1 : 0; // crunch phase
      const crunch = (Math.random() * 2 - 1) * Math.exp(-t * 80) * 0.5 * phase1;
      const freq = 400 - t * 1800;
      const wom = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 25) * 0.45;
      // Mix
      const sample = crunch + wom;
      const i16 = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
      v.setInt16(44 + i * 2, i16, true);
    }

    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return 'data:audio/wav;base64,' + btoa(bin);
  }

  // ═══════════════════════════════════════════
  //  HUD
  // ═══════════════════════════════════════════
  function updateHUD() {
    if (scoreEl) scoreEl.textContent = String(score || 0).padStart(3, '0');
    if (bestScoreEl) bestScoreEl.textContent = String(bestScore || 0).padStart(3, '0');
  }

})();
