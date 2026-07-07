/* ============================================================
   POPO DIGITAL — 2050 PROPOSAL SCRIPTS
   Features: Scroll Reveal | 3D Tilt | Mouse Glow Tracking |
             Particle Canvas | FAB Ripple | Print Logic | Date
   ============================================================ */

'use strict';

/* ════════════════════════════════════════════════════════════
   UTILITY: RAF-throttled event handler
════════════════════════════════════════════════════════════ */
function onRaf(fn) {
  let ticking = false;
  return function (...args) {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        fn.apply(this, args);
        ticking = false;
      });
    }
  };
}

/* ════════════════════════════════════════════════════════════
   1. PROPOSAL DATE
════════════════════════════════════════════════════════════ */
function initDate() {
  const el = document.getElementById('proposal-date');
  if (!el) return;
  const now  = new Date();
  const opts = { day: 'numeric', month: 'long', year: 'numeric' };
  el.textContent = now.toLocaleDateString('he-IL', opts);
}

/* ════════════════════════════════════════════════════════════
   2. SCROLL REVEAL (Intersection Observer)
════════════════════════════════════════════════════════════ */
function initScrollReveal() {
  const options = {
    root: null,
    rootMargin: '0px 0px -55px 0px',
    threshold: 0.07
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, options);

  document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => {
    observer.observe(el);
  });
}

/* ════════════════════════════════════════════════════════════
   3. CURSOR / MOUSE GLOW TRACKING
════════════════════════════════════════════════════════════ */
function initCursorGlow() {
  const glow = document.getElementById('cursorGlow');
  if (!glow || window.matchMedia('(hover: none)').matches) {
    if (glow) glow.style.display = 'none';
    return;
  }

  const move = onRaf((e) => {
    glow.style.left = e.clientX + 'px';
    glow.style.top  = e.clientY + 'px';
  });

  document.addEventListener('mousemove', move, { passive: true });

  document.addEventListener('mouseleave', () => {
    glow.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    glow.style.opacity = '1';
  });
}

/* ════════════════════════════════════════════════════════════
   4. 3D CARD TILT EFFECT
════════════════════════════════════════════════════════════ */
function initTilt() {
  // Skip on touch devices
  if (window.matchMedia('(hover: none)').matches) return;

  const TILT_MAX    = 8;   // max tilt degrees
  const SCALE       = 1.02;
  const GLOW_RADIUS = 180; // px radius of the magnetic glow

  document.querySelectorAll('[data-tilt]').forEach(card => {
    let glowEl = null;

    // Create inner mouse-tracking glow per card
    glowEl = document.createElement('div');
    glowEl.style.cssText = `
      position: absolute;
      width: ${GLOW_RADIUS * 2}px;
      height: ${GLOW_RADIUS * 2}px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(227,27,35,0.12) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
      transform: translate(-50%, -50%);
      opacity: 0;
      transition: opacity 0.35s ease;
      will-change: left, top;
    `;
    card.style.overflow = 'hidden';
    card.appendChild(glowEl);

    card.addEventListener('mousemove', onRaf(function(e) {
      const rect   = card.getBoundingClientRect();
      const x      = e.clientX - rect.left;
      const y      = e.clientY - rect.top;
      const cx     = rect.width  / 2;
      const cy     = rect.height / 2;
      const dx     = (x - cx) / cx; // -1 to 1
      const dy     = (y - cy) / cy; // -1 to 1

      const rotateX =  dy * -TILT_MAX;
      const rotateY =  dx *  TILT_MAX;

      card.style.transform = `
        perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        scale(${SCALE})
        translateZ(0)
      `;

      // Move inner glow to follow cursor
      glowEl.style.left    = x + 'px';
      glowEl.style.top     = y + 'px';
      glowEl.style.opacity = '1';
    }), { passive: true });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      glowEl.style.opacity = '0';
    });
  });
}

/* ════════════════════════════════════════════════════════════
   5. PARTICLE CANVAS
════════════════════════════════════════════════════════════ */
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  // Respect reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d');
  let W, H, particles, animId;

  const PARTICLE_COUNT = 55;
  const RED_CHANCE     = 0.22; // 22% red, rest white/grey

  class Particle {
    constructor() { this.reset(true); }

    reset(initial = false) {
      this.x  = Math.random() * W;
      this.y  = initial ? Math.random() * H : H + 10;
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = -(Math.random() * 0.45 + 0.1);
      this.r  = Math.random() * 1.6 + 0.4;
      this.life    = 0;
      this.maxLife = Math.random() * 280 + 180;
      this.isRed   = Math.random() < RED_CHANCE;
    }

    update() {
      this.x    += this.vx;
      this.y    += this.vy;
      this.life += 1;
      if (this.life >= this.maxLife || this.y < -10) this.reset();
    }

    draw() {
      const t       = this.life / this.maxLife;
      const opacity = Math.sin(Math.PI * t) * 0.55;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      if (this.isRed) {
        ctx.fillStyle = `rgba(227,80,85,${opacity})`;
      } else {
        const g = 160 + Math.round(t * 80);
        ctx.fillStyle = `rgba(${g},${g},${g + 10},${opacity})`;
      }
      ctx.fill();
    }
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function initPool() {
    particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    animId = requestAnimationFrame(loop);
  }

  resize();
  initPool();
  loop();

  const debouncedResize = debounce(() => { resize(); initPool(); }, 250);
  window.addEventListener('resize', debouncedResize, { passive: true });

  // Stop when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animId);
    } else {
      loop();
    }
  });
}

/* ════════════════════════════════════════════════════════════
   6. FAB PRINT BUTTON
════════════════════════════════════════════════════════════ */
function initFab() {
  const fab = document.getElementById('fab-print');
  if (!fab) return;

  fab.addEventListener('click', function (e) {
    // Ripple
    const rect   = fab.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    const size = Math.max(rect.width, rect.height);
    const x    = e.clientX - rect.left - size / 2;
    const y    = e.clientY - rect.top  - size / 2;
    ripple.style.cssText = `width:${size}px; height:${size}px; left:${x}px; top:${y}px;`;
    fab.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());

    // Slight delay so ripple is visible before browser print dialog
    setTimeout(() => window.print(), 240);
  });
}

/* ════════════════════════════════════════════════════════════
   7. SMOOTH ANCHOR SCROLL (hero CTA)
════════════════════════════════════════════════════════════ */
function initSmoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ════════════════════════════════════════════════════════════
   8. STAGGERED HERO ENTRANCE
════════════════════════════════════════════════════════════ */
function initHeroEntrance() {
  const hero = document.getElementById('hero');
  if (!hero) return;
  // Hero should be visible on load immediately
  requestAnimationFrame(() => {
    setTimeout(() => hero.classList.add('visible'), 120);
  });
}

/* ════════════════════════════════════════════════════════════
   9. LIVE RED GLOW PULSE ON PRICE
════════════════════════════════════════════════════════════ */
function initPricePulse() {
  const priceEl = document.querySelector('.price-amount');
  if (!priceEl) return;

  // Add a gentle pulsing glow to the price display
  let up = true;
  let intensity = 0.1;

  function pulse() {
    if (up) { intensity += 0.004; if (intensity >= 0.22) up = false; }
    else     { intensity -= 0.004; if (intensity <= 0.10) up = true;  }
    priceEl.style.textShadow = `
      0 0 ${40 + intensity * 80}px rgba(255,255,255,${intensity * 0.5}),
      0 0 ${80 + intensity * 80}px rgba(255,255,255,${intensity * 0.2})
    `;
    requestAnimationFrame(pulse);
  }

  // Start after pricing section is revealed
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      pulse();
      observer.disconnect();
    }
  }, { threshold: 0.3 });

  const pricingSection = document.getElementById('pricing');
  if (pricingSection) observer.observe(pricingSection);
}

/* ════════════════════════════════════════════════════════════
   UTILITY: debounce
════════════════════════════════════════════════════════════ */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ════════════════════════════════════════════════════════════
   INIT — DOMContentLoaded
════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initDate();
  initHeroEntrance();
  initScrollReveal();
  initCursorGlow();
  initTilt();
  initParticles();
  initFab();
  initSmoothAnchors();
  initPricePulse();
});
