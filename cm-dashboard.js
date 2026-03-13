// ===== TODAY CARD =====
function renderTodayCard() {
  const el = document.getElementById('todayCard');
  if (!el) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Collecter tous les événements des 7 prochains jours
  const events = [];
  for (let offset = 0; offset < 7; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const fetes = (typeof getFetesForDay === 'function')
      ? getFetesForDay(d.getFullYear(), d.getMonth(), d.getDate())
      : [];
    fetes.forEach(f => events.push({ fete: f, daysAhead: offset, date: d }));
  }

  // Aucun événement dans les 7 jours → masquer la card
  if (events.length === 0) {
    el.style.display = 'none';
    return;
  }
  el.style.display = 'block';
  el.innerHTML = _buildTodayCardHtml(today, events);
}

function _buildTodayCardHtml(today, events) {
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const dateStr = cap(today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));

  const eventsHtml = events.map(({ fete, daysAhead, date }) => {
    const safeLabel = fete.label.replace(/'/g, "\\'");
    const isToday = daysAhead === 0;
    const badge = isToday
      ? `<span class="tc-badge today">Aujourd'hui</span>`
      : `<span class="tc-badge upcoming">dans ${daysAhead} jour${daysAhead > 1 ? 's' : ''}</span>`;
    const dateLine = isToday ? '' : `<span class="tc-event-date">${cap(date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))}</span>`;
    return `
      <div class="tc-event${isToday ? ' is-today' : ''}">
        <div class="tc-event-top">
          <span class="tc-event-emoji">${fete.emoji}</span>
          <span class="tc-event-name">${fete.label}</span>
          ${badge}
        </div>
        ${dateLine}
        <div class="tc-event-actions">
          <button class="today-card-btn intelixa" onclick="_goStudioWithEvent('intelixa','${safeLabel}')">
            ${icon('zap',13)} Idée Intelixa →
          </button>
          <button class="today-card-btn doudelio" onclick="_goStudioWithEvent('doudelio','${safeLabel}')">
            ${icon('leaf',13)} Idée Doudelio →
          </button>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="today-card-header">
      <span class="today-card-date">${dateStr}</span>
    </div>
    ${eventsHtml}
  `;
}

function _goStudioWithEvent(brand, eventLabel) {
  const studioTab = [...document.querySelectorAll('.nav-tab')]
    .find(t => (t.getAttribute('onclick') || '').includes("'studio'"));
  if (studioTab) switchPage('studio', studioTab);
  setTimeout(() => {
    const brandBtn = document.querySelector(`.brand-btn[onclick*="${brand}"]`);
    if (brandBtn) brandBtn.click();
    setTimeout(() => {
      const themeInput = document.getElementById('theme');
      if (themeInput) themeInput.value = eventLabel;
    }, 100);
  }, 150);
}

// ===== STATS =====
async function updateStats() {
  let total=0, notes=0, calPosts=0;
  for(const b of ['intelixa','doudelio']) {
    try { const r=await window.storage.get('history-'+b); if(r) total+=JSON.parse(r.value).length; } catch(e){}
  }
  try { const r=await window.storage.get('notes-global'); if(r) notes=JSON.parse(r.value).length; } catch(e){}
  // Count cal posts this month
  const now=new Date();
  try {
    const r=await window.storage.get('cal-'+now.getFullYear()+'-'+now.getMonth());
    if(r) { const d=JSON.parse(r.value); calPosts=Object.values(d).reduce((a,v)=>a+v.length,0); }
  } catch(e){}

  const el=id=>document.getElementById(id);
  if(el('statTotal')) el('statTotal').textContent=total;
  if(el('statNotes')) el('statNotes').textContent=notes;
  if(el('statCal')) el('statCal').textContent=calPosts;
  if(el('statWeek')) {
    let week=0;
    try {
      const r=await window.storage.get('history-'+(selectedBrand||'intelixa'));
      if(r) {
        const h=JSON.parse(r.value);
        const ago=Date.now()-7*86400000;
        week=h.filter(x=>x.id>ago).length;
      }
    } catch(e){}
    el('statWeek').textContent=week;
  }
  renderTodayCard();
}

// ===== GREETING =====
function getGreeting() {
  const h = new Date().getHours();
  if(h >= 5  && h < 12) return { iconName:'sun',      word:'Bonjour' };
  if(h >= 12 && h < 18) return { iconName:'cloud',    word:'Bon après-midi' };
  if(h >= 18 && h < 22) return { iconName:'moon',     word:'Bonsoir' };
  return                        { iconName:'moonStar', word:'Bonne nuit' };
}

const DAILY_MESSAGES = [
  "Prêt à créer du contenu qui claque ?",
  "On fait quoi de bien aujourd'hui ?",
  "Ton audience t'attend. C'est parti !",
  "Une idée = un post. Commençons !",
  "Le meilleur contenu, c'est celui qu'on crée maintenant.",
  "Nouvelle journée, nouvelles idées 💡",
  "C'est ton moment de briller sur les réseaux !",
  "Un post aujourd'hui vaut mieux que dix demain.",
  "Le contenu régulier, c'est la clé. Go !",
  "Studio CM est prêt. Et toi ?",
];

function renderGreeting() {
  const el = document.getElementById('greetingBanner');
  if(!el) return;
  const { iconName, word } = getGreeting();
  const msg = DAILY_MESSAGES[new Date().getDate() % DAILY_MESSAGES.length];
  el.innerHTML = `
    <div class="greeting-emoji">${icon(iconName, 28)}</div>
    <div class="greeting-text">
      <h2>${word}, Stanislas !</h2>
      <p>${msg}</p>
    </div>
  `;
}

// ===== REMINDERS =====
const REMINDER_THRESHOLDS = {
  tiktok: 3, linkedin: 3, instagram: 2, gmb: 7,
  facebook: 2, pinterest: 3, spotify: 14, brevo: 7, youtube: 7
};

async function checkReminders() {
  const remindersEl = document.getElementById('remindersBlock');
  if(!remindersEl) return;

  // --- Alertes calendrier "à publier" dépassées ---
  let calAlerts = [];
  try {
    if (typeof getCalendarAlerts === 'function') {
      calAlerts = await getCalendarAlerts();
    }
  } catch(e) {}

  // --- Rappels de notation post-publication (7 jours après) ---
  let perfAlerts = [];
  try {
    if (typeof getPerformanceReviewAlerts === 'function') {
      perfAlerts = await getPerformanceReviewAlerts();
    }
  } catch(e) {}

  // --- Rappels fréquence de publication ---
  const brands = selectedBrand ? [selectedBrand] : ['intelixa','doudelio'];
  const alerts = [];
  const now = Date.now();

  for(const b of brands) {
    try {
      const r = await window.storage.get('history-'+b);
      if(!r) {
        alerts.push({brand:b, platform:'Studio', days:null, msg:`Aucune génération pour ${b==='intelixa'?icon('zap',13)+' Intelixa':icon('leaf',13)+' Doudelio'} — commence maintenant !`});
        continue;
      }
      const hist = JSON.parse(r.value);
      const byPlatform = {};
      hist.forEach(h => {
        if(!byPlatform[h.platform] || h.id > byPlatform[h.platform]) byPlatform[h.platform] = h.id;
      });
      for(const [plat, lastTs] of Object.entries(byPlatform)) {
        const days = Math.floor((now - lastTs) / 86400000);
        const threshold = REMINDER_THRESHOLDS[plat] || 7;
        if(days >= threshold) {
          alerts.push({brand:b, platform:plat, days, msg:`${b==='intelixa'?icon('zap',13):icon('leaf',13)} Pas de post ${plat} depuis ${days} jours`});
        }
      }
    } catch(e){}
  }

  // Rien à afficher
  if(!alerts.length && !calAlerts.length && !perfAlerts.length) {
    remindersEl.style.display = 'none';
    return;
  }

  remindersEl.style.display = 'block';
  remindersEl.innerHTML = `
    <div class="reminder-title">${icon('bell',16)} Rappels</div>
    ${calAlerts.map(a => `
      <div class="reminder-item cal-alert">
        <span class="reminder-msg">${a.msg}</span>
        <button class="reminder-publish-btn" onclick="${a.actionFn}">${icon('check',13)} Marquer publié</button>
      </div>
    `).join('')}
    ${perfAlerts.map(a => `
      <div class="reminder-item perf-alert">
        <span class="reminder-msg perf-msg">${a.msg}</span>
        <div class="perf-rating-btns">
          <button class="perf-rating-btn top"   onclick="savePostRating(${a.year},${a.month},${a.day},${a.postIndex},'🔥')">${icon('flame',13)} Top</button>
          <button class="perf-rating-btn bien"  onclick="savePostRating(${a.year},${a.month},${a.day},${a.postIndex},'👍')">${icon('thumbsUp',13)} Bien</button>
          <button class="perf-rating-btn moyen" onclick="savePostRating(${a.year},${a.month},${a.day},${a.postIndex},'😐')">${icon('minus',13)} Moyen</button>
          <button class="perf-rating-btn flop"  onclick="savePostRating(${a.year},${a.month},${a.day},${a.postIndex},'👎')">${icon('thumbsDown',13)} Flop</button>
        </div>
      </div>
    `).join('')}
    ${alerts.slice(0, 4).map(a => `
      <div class="reminder-item">
        <span class="reminder-msg">${a.msg}</span>
        ${a.days !== null ? `<span class="reminder-badge">${a.days}j</span>` : ''}
      </div>
    `).join('')}
  `;
}

// ===== STREAK (régularité Duolingo-style) =====
async function calculateStreak(brand) {
  const brands = brand ? [brand] : ['intelixa', 'doudelio'];
  const allDays = new Set();
  for (const b of brands) {
    try {
      const r = await window.storage.get('history-' + b);
      if (!r) continue;
      JSON.parse(r.value).forEach(h => {
        const d = new Date(h.id);
        allDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      });
    } catch(e) {}
  }
  let streak = 0;
  const check = new Date(); check.setHours(0, 0, 0, 0);
  while (true) {
    const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
    if (!allDays.has(key)) break;
    streak++;
    check.setDate(check.getDate() - 1);
  }
  return streak;
}

async function renderStreakCard() {
  const el = document.getElementById('streakCard');
  if (!el) return;
  const streak = await calculateStreak(selectedBrand);
  const msg = streak === 0 ? "Allez, on commence !"
    : streak <= 3 ? "C'est parti !"
    : streak <= 6 ? "Belle série !"
    : "En feu !";
  el.className = 'streak-card';
  el.innerHTML = `
    <div class="streak-fire">${icon('flame', 28)}</div>
    <div class="streak-center">
      <div class="streak-num">${streak}<span class="streak-unit"> jour${streak !== 1 ? 's' : ''}</span></div>
      <div class="streak-sub">${msg}</div>
    </div>
  `;
}

// ===== RÉCAP PERFORMANCES =====
async function renderPerfRecap() {
  const perfBlock = document.getElementById('perfBlock');
  if (!perfBlock) return;

  // Lire toutes les clés perf-* des 3 derniers mois
  const cutoffTs = Date.now() - 90 * 86400000;
  const perfKeys = Object.keys(localStorage).filter(k => k.startsWith('perf-'));
  const entries = [];

  for (const key of perfKeys) {
    try {
      const r = await window.storage.get(key);
      if (!r) continue;
      const entry = JSON.parse(r.value);
      if (!entry.timestamp || entry.timestamp < cutoffTs) continue;
      entries.push(entry);
    } catch(e) {}
  }

  if (!entries.length) {
    perfBlock.style.display = 'none';
    return;
  }

  // Grouper par brand + plateforme
  const groups = {};
  for (const e of entries) {
    const gk = `${e.brand}||${e.platform}`;
    if (!groups[gk]) groups[gk] = { brand: e.brand, platform: e.platform, ratings: [] };
    groups[gk].ratings.push(e.ratingNum || 0);
  }

  const SCORE_ICON = { 4: icon('flame',14), 3: icon('thumbsUp',14), 2: icon('minus',14), 1: icon('thumbsDown',14) };

  const rows = Object.values(groups)
    .sort((a, b) => {
      const avgA = a.ratings.reduce((s, v) => s + v, 0) / a.ratings.length;
      const avgB = b.ratings.reduce((s, v) => s + v, 0) / b.ratings.length;
      return avgB - avgA;
    })
    .map(g => {
      const avg = g.ratings.reduce((s, v) => s + v, 0) / g.ratings.length;
      const dominant = SCORE_ICON[Math.max(1, Math.min(4, Math.round(avg)))] || '•';
      const brandIcon = g.brand === 'intelixa' ? icon('zap',13) : g.brand === 'doudelio' ? icon('leaf',13) : '';
      const platIcon = _platIcon(g.platform);
      return `
        <div class="perf-row">
          <span class="perf-brand">${brandIcon}</span>
          <span class="perf-plat">${platIcon} ${g.platform}</span>
          <span class="perf-count">${g.ratings.length} post${g.ratings.length > 1 ? 's' : ''}</span>
          <span class="perf-score">${dominant}</span>
        </div>
      `;
    }).join('');

  perfBlock.style.display = 'block';
  perfBlock.innerHTML = `
    <div class="perf-title">${icon('barChart2',16)} Mes meilleures performances</div>
    <div class="perf-list">${rows}</div>
  `;
}

// ===== CUSTOM BRANDS =====
let _customBrandsCache = null;

async function _loadCustomBrands() {
  if (_customBrandsCache !== null) return _customBrandsCache;
  try {
    const r = await window.storage.get('custom-brands');
    if (r && r.value) {
      const arr = JSON.parse(r.value);
      if (Array.isArray(arr)) { _customBrandsCache = arr; return arr; }
    }
  } catch(e) {}
  _customBrandsCache = [];
  return [];
}

async function _saveCustomBrands(brands) {
  _customBrandsCache = brands;
  await window.storage.set('custom-brands', JSON.stringify(brands));
}

async function renderCustomBrandCards() {
  const container = document.getElementById('customBrandsContainer');
  if (!container) return;
  const brands = await _loadCustomBrands();
  container.innerHTML = brands.map((b, i) => `
    <button class="brand-btn brand-custom" onclick="_selectCustomBrandByIdx(${i}, this)">
      <span class="brand-custom-del" onclick="event.stopPropagation();_deleteCustomBrand(${i})" title="Supprimer">×</span>
      ${b.logo ? `<img src="${b.logo}" alt="${b.name}" class="brand-custom-logo">` : '<div class="brand-custom-placeholder"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>'}
      <div class="brand-tag">${b.name}</div>
    </button>
  `).join('') + `
    <button class="brand-btn brand-add-btn" onclick="openAddBrandModal()">
      <span class="brand-add-plus">+</span>
      <div class="brand-tag">Ajouter une marque</div>
    </button>
  `;
}

function _selectCustomBrandByIdx(idx, el) {
  if (!_customBrandsCache || idx >= _customBrandsCache.length) return;
  const brand = _customBrandsCache[idx];
  // Set global selectedBrand
  if (typeof window !== 'undefined') window._currentCustomBrand = brand;
  selectedBrand = brand.id;
  // Inject BRAND_CONTEXT entry
  if (typeof BRAND_CONTEXT !== 'undefined') {
    BRAND_CONTEXT[brand.id] = {
      label: brand.name.toUpperCase(),
      desc: `Tu es un expert Community Manager pour ${brand.name}. Génère du contenu professionnel prêt à publier.`
    };
  }
  // Theme
  document.body.className = document.body.className
    .split(' ').filter(c => !c.startsWith('theme-')).join(' ');
  document.body.classList.add('theme-custom');
  // Active state
  document.querySelectorAll('.brand-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  // Dashboard title
  const dashTitle = document.getElementById('dashTitle');
  const dashSub   = document.getElementById('dashSubtitle');
  if (dashTitle) { dashTitle.textContent = brand.name.toUpperCase(); dashTitle.style.cssText = ''; }
  if (dashSub)   { dashSub.textContent = 'Community Manager · Marque personnalisée'; dashSub.style.cssText = ''; }
  // Standard updates
  if (typeof renderTemplates    === 'function') renderTemplates();
  if (typeof updateStats        === 'function') updateStats();
  if (typeof loadRecentDashboard=== 'function') loadRecentDashboard();
  if (typeof checkReminders     === 'function') checkReminders();
}

function openAddBrandModal() {
  const modal = document.getElementById('addBrandModal');
  if (modal) modal.style.display = 'flex';
}

function _closeAddBrandModal() {
  const modal = document.getElementById('addBrandModal');
  if (modal) modal.style.display = 'none';
  const nameInput = document.getElementById('newBrandName');
  const preview   = document.getElementById('brandLogoPreview');
  const previewWrap = document.getElementById('brandLogoPreviewWrap');
  const hint      = document.getElementById('brandLogoHint');
  if (nameInput)    nameInput.value = '';
  if (preview)      preview.src = '';
  if (previewWrap)  previewWrap.style.display = 'none';
  if (hint)         hint.style.display = '';
  window._pendingBrandLogo = null;
}

function _brandLogoPreview(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    window._pendingBrandLogo = e.target.result;
    const preview    = document.getElementById('brandLogoPreview');
    const previewWrap = document.getElementById('brandLogoPreviewWrap');
    const hint       = document.getElementById('brandLogoHint');
    if (preview)      preview.src = e.target.result;
    if (previewWrap)  previewWrap.style.display = 'block';
    if (hint)         hint.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

async function _saveNewBrand() {
  const name = document.getElementById('newBrandName')?.value.trim();
  if (!name) { alert('Entrez un nom de marque'); return; }
  const logo = window._pendingBrandLogo || '';
  const id   = 'custom_' + Date.now();
  const brands = await _loadCustomBrands();
  brands.push({ id, name, logo });
  await _saveCustomBrands(brands);
  _closeAddBrandModal();
  renderCustomBrandCards();
}

async function _deleteCustomBrand(idx) {
  if (!confirm('Supprimer cette marque ?')) return;
  const brands = await _loadCustomBrands();
  const deleted = brands[idx];
  brands.splice(idx, 1);
  await _saveCustomBrands(brands);
  if (deleted && selectedBrand === deleted.id) {
    selectedBrand = null;
    document.body.className = document.body.className
      .split(' ').filter(c => !c.startsWith('theme-')).join(' ');
  }
  renderCustomBrandCards();
}
