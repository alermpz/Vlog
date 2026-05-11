/* ================================================================
   script.js — AleRam · Window system + drag + clock
   ================================================================ */

let zTop = 20; // z-index counter

/* ── Año en footer (páginas internas) ────────────────────────── */
document.querySelectorAll('#year').forEach(el => {
  el.textContent = new Date().getFullYear();
});



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
  // Taskbar is removed from HTML but keep setupTaskbar in case it's added back
  setupTaskbar();

  // Vinyl Player logic
  const vinylPlayBtn = document.getElementById('vinylPlayBtn');
  const vinylAudio = document.getElementById('vinylAudio');
  const vinylDisc = document.getElementById('vinylDisc');
  const vinylSongTitle = document.getElementById('vinylSongTitle');

  if (vinylPlayBtn && vinylAudio) {
    // Attempt to get filename from src if empty
    if(vinylAudio.src) {
        let filename = vinylAudio.src.split('/').pop();
        if(filename && filename !== 'song.mp3') {
           vinylSongTitle.textContent = decodeURIComponent(filename);
        }
    }

    vinylPlayBtn.addEventListener('click', () => {
      if (vinylAudio.paused) {
        vinylAudio.play().catch(e => {
            vinylSongTitle.textContent = "error: mp3 not found";
            console.error("Audio play failed:", e);
        });
        vinylPlayBtn.textContent = '⏸';
        vinylDisc.classList.add('playing');
      } else {
        vinylAudio.pause();
        vinylPlayBtn.textContent = '>>';
        vinylDisc.classList.remove('playing');
      }
    });

    vinylAudio.addEventListener('ended', () => {
        vinylPlayBtn.textContent = '>>';
        vinylDisc.classList.remove('playing');
    });
  }

  // Bring welcome window to front by default
  const welcome = document.getElementById('win-welcome');
  if (welcome) bringToFront(welcome);

  // Subtle fade-in
  document.body.style.opacity = '0';
  requestAnimationFrame(() => {
    document.body.style.transition = 'opacity 0.4s ease';
    document.body.style.opacity    = '1';
  });

  // Load CMS Data
  loadCMSData();
});

/* ── CMS Data Loading ───────────────────────────────────────── */
async function loadCMSData() {
  try {
    // Load About/Settings
    const aboutRes = await fetch('content/about.json');
    if (aboutRes.ok) {
      const about = await aboutRes.json();
      
      const elCarrera = document.getElementById('cms-carrera');
      const elLibro = document.getElementById('cms-libro');
      const elAutor = document.getElementById('cms-autor');
      const elEscuchando = document.getElementById('cms-escuchando');
      const elWelcomeText = document.getElementById('cms-welcome-text');

      if (elCarrera) elCarrera.textContent = about.carrera || '';
      if (elLibro) elLibro.textContent = about.libro || '';
      if (elAutor) elAutor.textContent = about.autor_libro || '';
      if (elEscuchando) elEscuchando.textContent = about.escuchando || '';
      
      if (elWelcomeText && about.descripcion) {
        // Basic markdown bold replacement for **text**
        let desc = about.descripcion.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#005599;">$1</strong>');
        elWelcomeText.innerHTML = desc;
      }
    }

    // Load Meditaciones (latest entry on homepage OR full list on meditaciones.html)
    const elMedDate = document.getElementById('cms-med-date');
    const elMedTitle = document.getElementById('cms-med-title');
    const elMedBody = document.getElementById('cms-med-body');
    const elMedList = document.getElementById('cms-meditaciones-list');

    if (elMedDate || elMedList) {
      const medRes = await fetch('content/meditaciones.json');
      if (medRes.ok) {
        const medData = await medRes.json();
        if (medData && medData.items && medData.items.length > 0) {
          // Sort by date descending (latest first)
          const sortedMeds = medData.items.sort((a,b) => new Date(b.date) - new Date(a.date));
          
          // Populate homepage
          if (elMedDate && elMedTitle && elMedBody) {
            const latest = sortedMeds[0];
            const d = new Date(latest.date);
            elMedDate.textContent = `${d.getDate().toString().padStart(2, '0')} · ${(d.getMonth()+1).toString().padStart(2, '0')} · ${d.getFullYear()}`;
            elMedTitle.textContent = latest.title;
            elMedBody.textContent = latest.body;
          }

          // Populate meditaciones.html
          if (elMedList) {
            let listHtml = '';
            sortedMeds.forEach(m => {
              const d = new Date(m.date);
              const dateStr = `${d.getDate().toString().padStart(2, '0')} · ${(d.getMonth()+1).toString().padStart(2, '0')} · ${d.getFullYear()}`;
              listHtml += `
                <div class="book-entry" style="margin-bottom:15px;">
                  <div class="book-author" style="color:#4a6070;">${dateStr}</div>
                  <div class="book-title" style="margin-bottom:5px; font-size:13px;">${m.title}</div>
                  <div class="welcome-text" style="font-size:12px; white-space:pre-wrap;">${m.body}</div>
                </div>
              `;
            });
            elMedList.innerHTML = listHtml;
          }

        } else {
          if (elMedTitle) elMedTitle.textContent = "No hay entradas.";
          if (elMedList) elMedList.innerHTML = '<p class="welcome-text" style="font-size:12px;">No hay entradas aún.</p>';
        }
      }
    }

    // Load Videos (only if containers exist)
    const elYoutube = document.getElementById('cms-videos-youtube');
    const elMovies = document.getElementById('cms-videos-movies');

    if (elYoutube || elMovies) {
      const vidRes = await fetch('content/videos.json');
      if (vidRes.ok) {
        const vidData = await vidRes.json();
        if (vidData && vidData.items) {
          
          let ytHtml = '';
          let movieHtml = '';

          vidData.items.forEach(v => {
            let stars = '★'.repeat(v.calificacion || 0) + '✧'.repeat(5 - (v.calificacion || 0));
            let linkHtml = v.enlace ? `<a href="${v.enlace}" target="_blank" rel="noopener" style="font-family:'Tahoma', 'Verdana', sans-serif; font-size:5px;">ver enlace ↗</a>` : '';
            
            let html = `
              <div class="book-entry">
                <div class="book-title" style="display:flex; justify-content:space-between; align-items:center;">
                  <span>${v.title}</span>
                  <span class="rating-stars" style="font-size:10px;">${stars}</span>
                </div>
                <div class="book-author" style="color:#4a6070; margin-bottom:4px;">${v.subtitulo || v.categoria}</div>
                <p class="welcome-text" style="font-size:11px;">${v.resena}</p>
                ${linkHtml}
              </div>
            `;

            if (v.categoria === 'youtube') ytHtml += html;
            else movieHtml += html;
          });

          if (elYoutube) elYoutube.innerHTML = ytHtml || '<p class="welcome-text" style="font-size:11px;">No hay canales aún.</p>';
          if (elMovies) elMovies.innerHTML = movieHtml || '<p class="welcome-text" style="font-size:11px;">No hay películas aún.</p>';
        }
      }
    }

    // Load Personajes
    const elPersonajesFilters = document.getElementById('cms-personajes-filters');
    const elPersonajesGrid = document.getElementById('cms-personajes-grid');

    if (elPersonajesFilters && elPersonajesGrid) {
      const perRes = await fetch('content/personajes.json');
      if (perRes.ok) {
        const perData = await perRes.json();
        if (perData && perData.items) {
          
          let gridHtml = '';
          const seriesSet = new Set();

          perData.items.forEach(p => {
            const seriesId = (p.serie || 'otros').toLowerCase().replace(/\s+/g, '-');
            seriesSet.add({ id: seriesId, name: p.serie || 'Otros' });
            
            let imgSrc = p.imagen || '';
            if (imgSrc && imgSrc.startsWith('/assets/')) {
               imgSrc = imgSrc.substring(1); // remove leading slash for relative path
            }

            gridHtml += `
              <div class="shrine-card" data-series="${seriesId}">
                <img src="${imgSrc}" alt="${p.nombre}" class="shrine-img"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="shrine-ph" style="display:none;">
                  <span style="font-size:18px;opacity:0.2;">◉</span>
                  <span style="font-size:6px;">${p.nombre}</span>
                </div>
                <div class="shrine-info">
                  <div class="shrine-name">${p.nombre}</div>
                  <div class="shrine-series">${p.serie}</div>
                </div>
              </div>
            `;
          });

          elPersonajesGrid.innerHTML = gridHtml || '<p class="welcome-text" style="font-size:11px;">No hay personajes aún.</p>';

          // Generate filters (unique by id)
          const uniqueSeries = Array.from(new Map([...seriesSet].map(item => [item.id, item])).values());
          
          let filtersHtml = `<button class="filter-btn active" data-filter="all">todos</button>`;
          uniqueSeries.forEach(s => {
             filtersHtml += `<button class="filter-btn" data-filter="${s.id}">${s.name.toLowerCase()}</button>`;
          });
          elPersonajesFilters.innerHTML = filtersHtml;

          // Re-bind filter events since we just generated the HTML
          const filterBtns = elPersonajesFilters.querySelectorAll('.filter-btn');
          const shrineCards = elPersonajesGrid.querySelectorAll('.shrine-card');

          filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
              filterBtns.forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              const f = btn.getAttribute('data-filter');
              shrineCards.forEach(card => {
                if (f === 'all' || card.getAttribute('data-series') === f) {
                  card.style.display = 'block';
                } else {
                  card.style.display = 'none';
                }
              });
            });
          });
        }
      }
    }

    // Load Libros (Biblioteca)
    const elTop5List = document.getElementById('cms-top5-list');
    const elAllBooksList = document.getElementById('cms-allbooks-list');

    if (elTop5List || elAllBooksList) {
      const librosRes = await fetch('content/libros.json');
      if (librosRes.ok) {
        const librosData = await librosRes.json();
        if (librosData && librosData.items) {
          let top5Html = '';
          let allBooksHtml = '';

          librosData.items.forEach(b => {
            const ratingNum = parseInt(b.rating) || 0;
            const stars = '★'.repeat(ratingNum) + '☆'.repeat(5 - ratingNum);
            
            let imgSrc = b.cover || '';
            if (imgSrc && imgSrc.startsWith('/assets/')) {
               imgSrc = imgSrc.substring(1);
            }
            if (!imgSrc) {
               imgSrc = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="70" height="105" viewBox="0 0 70 105"><rect width="70" height="105" fill="%23f0f8ff"/><text x="35" y="52" font-family="Arial" font-size="10" fill="%23a0c0d0" text-anchor="middle">Sin portada</text></svg>';
            }

            // Top 5 HTML
            if (b.is_top_5) {
              top5Html += `
                <div class="top5-entry">
                  <div>
                    <div class="top5-title">${b.title}</div>
                    <div class="top5-author">${b.author}</div>
                  </div>
                  <div class="rating-stars">${stars}</div>
                </div>
              `;
            }

            // All books HTML (Registro de Lectura)
            allBooksHtml += `
              <div class="book-entry">
                <img src="${imgSrc}" class="book-cover" alt="Portada de ${b.title}">
                <div class="book-info">
                  <div class="book-title">${b.title}</div>
                  <div class="book-author">${b.author}</div>
                  <div class="rating-stars">${stars}</div>
                  <div class="welcome-text" style="font-size:12px;">${b.review || ''}</div>
                </div>
              </div>
            `;
          });

          if (elTop5List) elTop5List.innerHTML = top5Html || '<p style="font-size:11px; color:#666;">No hay Top 5.</p>';
          if (elAllBooksList) elAllBooksList.innerHTML = allBooksHtml || '<p style="font-size:11px; color:#666;">No hay libros registrados.</p>';
        }
      }
    }

  } catch (err) {
    console.error("Error loading CMS data:", err);
  }
}
