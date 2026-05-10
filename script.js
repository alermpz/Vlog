/* ================================================================
   script.js — AleRam · Window system + drag + clock
   ================================================================ */

let zTop = 20; // z-index counter

/* ── Año en footer (páginas internas) ────────────────────────── */
document.querySelectorAll('#year').forEach(el => {
  el.textContent = new Date().getFullYear();
});

/* ── Pinterest board auto-rotate ─────────────────────────────── */
function setupPinterest() {
  const tabs      = document.querySelectorAll('.pin-tab');
  const panels    = document.querySelectorAll('.pin-panel');
  const barFill   = document.getElementById('pinBarFill');
  const timerEl   = document.getElementById('pinTimer');
  if (!tabs.length) return;

  const DURATION  = 8000;  // 8 segundos por tablero
  let current     = 0;
  let elapsed     = 0;
  let rafId;

  function switchTo(idx) {
    current = idx % tabs.length;
    tabs.forEach((t, i) => {
      t.classList.toggle('active', i === current);
      t.style.background  = i === current ? '#1a0c28' : '#0e0818';
      t.style.color       = i === current ? '#c0a0e8' : '#6a4880';
    });
    panels.forEach((p, i) => {
      p.style.opacity = i === current ? '1' : '0';
      p.style.zIndex  = i === current ? '2' : '1';
      p.style.pointerEvents = i === current ? 'auto' : 'none';
    });
    elapsed = 0;
  }

  function animate(ts) {
    elapsed += 16;
    const pct = Math.min((elapsed / DURATION) * 100, 100);
    if (barFill) barFill.style.width = pct + '%';
    const remaining = Math.ceil((DURATION - elapsed) / 1000);
    if (timerEl) timerEl.textContent = remaining + 's';
    if (elapsed >= DURATION) { switchTo(current + 1); }
    rafId = requestAnimationFrame(animate);
  }

  tabs.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      cancelAnimationFrame(rafId);
      switchTo(i);
      rafId = requestAnimationFrame(animate);
    });
  });

  rafId = requestAnimationFrame(animate);
}



/* ── Reloj en taskbar ─────────────────────────────────────────── */
function updateClock() {
  const clock = document.getElementById('tbClock');
  if (!clock) return;
  const now  = new Date();
  const hh   = String(now.getHours()).padStart(2, '0');
  const mm   = String(now.getMinutes()).padStart(2, '0');
  clock.textContent = hh + ':' + mm;
}
updateClock();
setInterval(updateClock, 30000);

/* ── Window system ────────────────────────────────────────────── */
function bringToFront(win) {
  win.style.zIndex = ++zTop;
  win.classList.add('is-active');
  document.querySelectorAll('.win').forEach(w => {
    if (w !== win) w.classList.remove('is-active');
  });
}

/* Draggable windows */
function makeDraggable(win) {
  const titlebar = win.querySelector('.win-titlebar');
  if (!titlebar) return;

  let dragging = false, startX, startY, origLeft, origTop;

  titlebar.addEventListener('mousedown', (e) => {
    // Skip if clicking a button
    if (e.target.classList.contains('win-btn')) return;
    dragging = true;
    startX   = e.clientX;
    startY   = e.clientY;
    origLeft = win.offsetLeft;
    origTop  = win.offsetTop;
    bringToFront(win);
    titlebar.style.cursor = 'grabbing';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    win.style.left = Math.max(0, origLeft + dx) + 'px';
    win.style.top  = Math.max(0, origTop  + dy) + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    titlebar.style.cursor = 'grab';
  });

  // Touch support
  titlebar.addEventListener('touchstart', (e) => {
    if (e.target.classList.contains('win-btn')) return;
    const t = e.touches[0];
    dragging = true;
    startX   = t.clientX;
    startY   = t.clientY;
    origLeft = win.offsetLeft;
    origTop  = win.offsetTop;
    bringToFront(win);
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    const t  = e.touches[0];
    win.style.left = Math.max(0, origLeft + t.clientX - startX) + 'px';
    win.style.top  = Math.max(0, origTop  + t.clientY - startY) + 'px';
  }, { passive: true });

  document.addEventListener('touchend', () => { dragging = false; });
}

/* Minimize / Close buttons */
function setupWinButtons(win) {
  const winId = win.id;

  win.querySelectorAll('.wbtn-min').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      win.classList.toggle('is-minimized');
      // Update taskbar button state
      const tbBtn = document.querySelector(`.tb-btn[data-win="${winId}"]`);
      if (tbBtn) tbBtn.classList.toggle('is-active', !win.classList.contains('is-minimized'));
    });
  });

  win.querySelectorAll('.wbtn-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      win.style.display = 'none';
      const tbBtn = document.querySelector(`.tb-btn[data-win="${winId}"]`);
      if (tbBtn) tbBtn.classList.remove('is-active');
    });
  });

  // Click window to bring to front
  win.addEventListener('mousedown', () => bringToFront(win));
}

/* Taskbar buttons */
function setupTaskbar() {
  document.querySelectorAll('.tb-btn[data-win]').forEach(btn => {
    btn.addEventListener('click', () => {
      const winId = btn.dataset.win;
      const win   = document.getElementById(winId);
      if (!win) return;

      if (win.style.display === 'none') {
        // Re-open
        win.style.display = '';
        win.classList.remove('is-minimized');
        bringToFront(win);
        btn.classList.add('is-active');
      } else if (win.classList.contains('is-minimized')) {
        // Restore
        win.classList.remove('is-minimized');
        bringToFront(win);
        btn.classList.add('is-active');
      } else {
        // Minimize
        win.classList.add('is-minimized');
        btn.classList.remove('is-active');
      }
    });
  });
}

/* ── Theme toggle (páginas internas) ─────────────────────────── */
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') document.body.classList.add('dark');
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}

/* ── Filter buttons (personajes.html) ────────────────────────── */
const filterBar  = document.getElementById('filterBar');
const shrineGrid = document.getElementById('shrineGrid');
if (filterBar && shrineGrid) {
  const cards = shrineGrid.querySelectorAll('.shrine-card');
  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    cards.forEach(card => {
      card.style.display = (filter === 'all' || card.dataset.series === filter) ? '' : 'none';
    });
  });
}

/* ── Init ─────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.win').forEach(win => {
    makeDraggable(win);
    setupWinButtons(win);
  });
  setupTaskbar();
  setupPinterest();


  // Bring welcome window to front by default
  const welcome = document.getElementById('win-welcome');
  if (welcome) bringToFront(welcome);

  // Subtle fade-in
  document.body.style.opacity = '0';
  requestAnimationFrame(() => {
    document.body.style.transition = 'opacity 0.4s ease';
    document.body.style.opacity    = '1';
  });
});
