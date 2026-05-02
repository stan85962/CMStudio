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
  for(const b of ['intelixa']) {
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
    <div class="greeting-text">
      <h2>${word} !</h2>
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
  const brands = selectedBrand ? [selectedBrand] : ['intelixa'];
  const alerts = [];
  const now = Date.now();

  for(const b of brands) {
    try {
      const r = await window.storage.get('history-'+b);
      if(!r) {
        alerts.push({brand:b, platform:'Studio', days:null, msg:`Aucune génération pour ${icon('zap',13)+' Intelixa'} — commence maintenant !`});
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
      const brandIcon = g.brand === 'intelixa' ? icon('zap',13) : '';
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

function _ensureDashCard(id, afterId) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    const ref = document.getElementById(afterId);
    if (ref) ref.insertAdjacentElement('afterend', el);
    else document.getElementById('page-dashboard')?.appendChild(el);
  }
  return el;
}

// ===== OBJECTIF MENSUEL =====
async function renderObjectifMensuel() {
  const el = _ensureDashCard('objectifCard', 'perfBlock');
  if (!el) return;
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const storKey  = 'objectif-mensuel-' + monthKey;
  let goal = 30;
  try { const r = await window.storage.get(storKey); if (r) goal = parseInt(r.value) || 30; } catch(e) {}

  // Compter posts générés ce mois (historique)
  let generated = 0;
  for (const b of ['intelixa']) {
    try {
      const r = await window.storage.get('history-'+b);
      if (r) {
        const arr = JSON.parse(r.value);
        const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        generated += arr.filter(x => x.id >= start).length;
      }
    } catch(e) {}
  }
  // Custom brands history
  try {
    const brands = await _loadCustomBrands();
    for (const b of brands) {
      const r = await window.storage.get('history-' + b.id);
      if (r) {
        const arr = JSON.parse(r.value);
        const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        generated += arr.filter(x => x.id >= start).length;
      }
    }
  } catch(e) {}

  // Compter posts planifiés dans le calendrier ce mois
  let planned = 0;
  try {
    const r = await window.storage.get('cal-'+now.getFullYear()+'-'+now.getMonth());
    if (r) { const d = JSON.parse(r.value); planned = Object.values(d).reduce((a,v)=>a+v.length,0); }
  } catch(e) {}

  const total = generated + planned;
  const pct   = Math.min(100, Math.round((total / Math.max(goal, 1)) * 100));
  const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const monthLabel = MONTHS_FR[now.getMonth()] + ' ' + now.getFullYear();

  el.className = 'card obj-card';
  el.innerHTML = `
    <div class="obj-header">
      <span class="obj-title">🎯 Objectif ${monthLabel}</span>
      <button class="obj-edit-btn" onclick="openObjectifModal()" title="Modifier l'objectif">✏</button>
    </div>
    <div class="obj-progress-wrap">
      <div class="obj-progress-bar" style="width:${pct}%"></div>
    </div>
    <div class="obj-stats">${total} / ${goal} posts <span class="obj-pct">${pct}%</span></div>
    <div class="obj-sub">${generated} générés · ${planned} planifiés</div>
  `;
}

async function openObjectifModal() {
  document.getElementById('_objectifModal')?.remove();
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const storKey  = 'objectif-mensuel-' + monthKey;
  let cur = 30;
  try { const r = await window.storage.get(storKey); if (r) cur = parseInt(r.value) || 30; } catch(e) {}
  const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const monthLabel = MONTHS_FR[now.getMonth()];
  const modal = document.createElement('div');
  modal.id = '_objectifModal';
  modal.className = 'ob-overlay';
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  modal.innerHTML = `
    <div class="ob-confirm" style="min-width:320px;">
      <div class="ob-confirm-title">🎯 Objectif de ${monthLabel}</div>
      <div style="margin:16px 0;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
          <input type="range" id="_objSlider" min="10" max="100" step="5" value="${cur}" style="flex:1;accent-color:var(--accent);" oninput="document.getElementById('_objVal').textContent=this.value">
          <span id="_objVal" style="font-size:20px;font-weight:800;color:var(--accent);min-width:36px;">${cur}</span>
        </div>
        <div style="font-size:12px;color:var(--muted)">posts ce mois</div>
      </div>
      <div class="ob-confirm-footer">
        <button class="ob-confirm-cancel" onclick="document.getElementById('_objectifModal').remove()">Annuler</button>
        <button class="ob-confirm-delete" style="background:var(--accent)" onclick="_saveObjectif('objectif-mensuel-${monthKey}')">Enregistrer</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function _saveObjectif(storKey) {
  const val = document.getElementById('_objSlider')?.value || '30';
  await window.storage.set(storKey, val);
  document.getElementById('_objectifModal')?.remove();
  renderObjectifMensuel();
}

// ===== COUNTDOWN PROCHAIN RDV =====
let _rdvInterval = null;

async function renderRdvCard() {
  const el = _ensureDashCard('rdvCard', 'objectifCard');
  if (!el) return;
  let events = [];
  try {
    const r = await window.storage.get('rdv-events');
    if (r) events = JSON.parse(r.value);
  } catch(e) {}

  // Nettoyer les événements passés (depuis plus de 1h)
  const now = Date.now();
  events = events.filter(e => new Date(e.dt).getTime() > now - 3600000);
  try { await window.storage.set('rdv-events', JSON.stringify(events)); } catch(e) {}

  el.className = 'card rdv-card';

  if (!events.length) {
    el.innerHTML = `
      <div class="rdv-header">
        <span class="rdv-title">⏳ Prochain RDV</span>
        <button class="rdv-add-btn" onclick="openRdvAddModal()">+ Ajouter</button>
      </div>
      <div class="rdv-empty">Aucun événement prévu — ajoutez votre prochain RDV !</div>`;
    return;
  }

  // Trier par date
  events.sort((a,b) => new Date(a.dt) - new Date(b.dt));
  const next = events[0];
  const nextTs = new Date(next.dt).getTime();
  const diff = nextTs - now;
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000)  / 60000);

  let countdownHtml;
  if (diff <= 0) {
    countdownHtml = `<div class="rdv-now">🔴 C'est maintenant !</div>`;
  } else if (days > 0) {
    countdownHtml = `<div class="rdv-countdown"><span class="rdv-num">${days}</span><span class="rdv-unit">j</span> <span class="rdv-num">${hours}</span><span class="rdv-unit">h</span> <span class="rdv-num">${mins}</span><span class="rdv-unit">min</span></div>`;
  } else if (hours > 0) {
    countdownHtml = `<div class="rdv-countdown"><span class="rdv-num">${hours}</span><span class="rdv-unit">h</span> <span class="rdv-num">${mins}</span><span class="rdv-unit">min</span></div>`;
  } else {
    countdownHtml = `<div class="rdv-countdown"><span class="rdv-num">${mins}</span><span class="rdv-unit">min</span></div>`;
  }

  const dateStr = new Date(next.dt).toLocaleString('fr-FR', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
  const otherEvents = events.slice(1, 5);

  el.innerHTML = `
    <div class="rdv-header">
      <span class="rdv-title">⏳ Prochain RDV</span>
      <button class="rdv-add-btn" onclick="openRdvAddModal()">+ Ajouter</button>
    </div>
    <div class="rdv-next-name">${_escHtml(next.title)}</div>
    <div class="rdv-next-date">${dateStr}</div>
    ${countdownHtml}
    ${otherEvents.length ? `<div class="rdv-others">${otherEvents.map((e,i)=>`<div class="rdv-other-item"><span>${_escHtml(e.title)}</span><button class="rdv-del-btn" onclick="_deleteRdvEvent(${events.indexOf(e)})" title="Supprimer">×</button></div>`).join('')}</div>` : ''}
    <button class="rdv-del-btn rdv-del-main" onclick="_deleteRdvEvent(0)">× Supprimer ce RDV</button>
  `;

  // Rafraîchir toutes les minutes
  if (_rdvInterval) clearInterval(_rdvInterval);
  _rdvInterval = setInterval(() => { renderRdvCard(); }, 60000);
}

function openRdvAddModal() {
  document.getElementById('_rdvAddModal')?.remove();
  const modal = document.createElement('div');
  modal.id = '_rdvAddModal';
  modal.className = 'ob-overlay';
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  modal.innerHTML = `
    <div class="ob-confirm" style="min-width:320px;">
      <div class="ob-confirm-title">⏳ Ajouter un RDV</div>
      <div style="margin:16px 0;display:flex;flex-direction:column;gap:10px;">
        <input id="_rdvTitle" class="ob-input" type="text" placeholder="Titre du RDV…" autocomplete="off">
        <input id="_rdvDt" class="ob-input" type="datetime-local" style="font-family:inherit;">
      </div>
      <div class="ob-confirm-footer">
        <button class="ob-confirm-cancel" onclick="document.getElementById('_rdvAddModal').remove()">Annuler</button>
        <button class="ob-confirm-delete" style="background:var(--accent)" onclick="_saveRdvEvent()">Ajouter</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  setTimeout(() => document.getElementById('_rdvTitle')?.focus(), 50);
}

async function _saveRdvEvent() {
  const title = (document.getElementById('_rdvTitle')?.value || '').trim();
  const dt    = document.getElementById('_rdvDt')?.value;
  if (!title || !dt) return;
  let events = [];
  try { const r = await window.storage.get('rdv-events'); if (r) events = JSON.parse(r.value); } catch(e) {}
  events.push({ title, dt });
  await window.storage.set('rdv-events', JSON.stringify(events));
  document.getElementById('_rdvAddModal')?.remove();
  renderRdvCard();
}

async function _deleteRdvEvent(idx) {
  let events = [];
  try { const r = await window.storage.get('rdv-events'); if (r) events = JSON.parse(r.value); } catch(e) {}
  events.sort((a,b) => new Date(a.dt) - new Date(b.dt));
  events.splice(idx, 1);
  await window.storage.set('rdv-events', JSON.stringify(events));
  renderRdvCard();
}

// ===== CUSTOM BRANDS =====
let _customBrandsCache = null;

async function _loadCustomBrands() {
  if (_customBrandsCache !== null) return _customBrandsCache;
  try {
    const r = await window.storage.get('custom-brands');
    if (r && r.value) {
      const arr = JSON.parse(r.value);
      if (Array.isArray(arr)) { _customBrandsCache = arr.map(_migrateBrand); return _customBrandsCache; }
    }
  } catch(e) {}
  _customBrandsCache = [];
  return [];
}

async function _saveCustomBrands(brands) {
  _customBrandsCache = brands;
  await window.storage.set('custom-brands', JSON.stringify(brands));
}

const _ALL_PLATFORM_KEYS = ['tiktok','linkedin','instagram','facebook','pinterest','gmb','brevo','youtube','spotify'];

function _migrateBrand(b) {
  const defaults = {
    slogan:'', secteur:'Autre', secteurLibre:'', cible:'', zone:'National',
    ton:'Professionnel & Expert', sujets:['','',''], formats:[],
    color:'#6c63ff', accentColor:'#6c63ff',
    proposition:'', signature:'',
    platforms: [..._ALL_PLATFORM_KEYS],
    prompts:{},
    concurrents: [], offre: '', prix: '', liens: {}
  };
  const m = { ...defaults, ...b };
  if (!m.color && m.accentColor) m.color = m.accentColor;
  if (!m.accentColor) m.accentColor = m.color;
  if (!m.systemPrompt) m.systemPrompt = _buildSystemPrompt(m);
  if (!m.prompts || Object.keys(m.prompts).length === 0) {
    m.prompts = {};
    (m.platforms || []).forEach(p => { m.prompts[p] = generatePromptForPlatform(m, p); });
  }
  return m;
}

function generatePromptForPlatform(brand, platform) {
  const platformGuidelines = {
    tiktok: "Format court et percutant, accroche immédiate en 3 secondes, ton dynamique, 3-5 hashtags tendance",
    linkedin: "Ton professionnel, storytelling structuré, amorce question ou stat, appel à l'action subtil, 3 hashtags max",
    instagram: "Visuel en tête, caption engageante, emojis dosés, appel à commenter, 5-10 hashtags",
    facebook: "Ton conversationnel, post de 3-5 lignes, question finale pour engager, 1-2 hashtags max",
    facebook_groupe: "Ton communautaire et bienveillant, partage de valeur, invite à la discussion, pas de vente directe",
    pinterest: "Description SEO-friendly, mots-clés naturels, ton inspirationnel, lien vers ressource",
    gmb: "Ton local et professionnel, actualité ou offre courte, appel à l'action clair (appeler, visiter, réserver)",
    brevo: "Objet accrocheur, structure email courte, CTA visible, ton direct et personnalisé",
    youtube: "Titre SEO optimisé, description structurée avec timestamps, appel à s'abonner, 3 tags clés",
    spotify: "Description podcast engageante, résumé de l'épisode, mots-clés naturels"
  };
  const secteur = brand.secteur === 'Autre' ? (brand.secteurLibre || brand.secteur) : brand.secteur;
  const sujets  = (brand.sujets||[]).filter(s=>s&&s.trim()).join(', ') || brand.name;
  const formats = (brand.formats||[]).join(', ') || 'tous formats';
  const sig     = brand.signature ? ` Phrase signature : "${brand.signature}".` : '';
  const prop    = brand.proposition || 'une marque professionnelle';
  const concurrents = (brand.concurrents || []).filter(c => c && c.trim());
  const offre = brand.offre ? ` Offre principale : ${brand.offre}${brand.prix ? ' — Prix : ' + brand.prix : ''}.` : '';
  const concText = concurrents.length ? ` Les concurrents à surveiller sont : ${concurrents.join(', ')}.` : '';
  return `Tu es un expert Community Manager pour ${brand.name}, ${prop}. Secteur : ${secteur}. Cible : ${brand.cible || 'grand public'} (${brand.zone || 'National'}). Ton : ${brand.ton || 'Professionnel & Expert'}. Sujets phares : ${sujets}. Formats privilégiés : ${formats}.${sig}${concText}${offre} Plateforme : ${platform}. ${platformGuidelines[platform]||''} Génère du contenu original, prêt à publier, adapté à cette plateforme.`;
}

function _buildSystemPrompt(d) {
  const secteur = d.secteur === 'Autre' ? (d.secteurLibre || d.name || 'divers') : d.secteur;
  const formats = (d.formats || []).filter(Boolean).join(', ') || 'tous formats';
  const sujets  = (d.sujets  || []).filter(s => s && s.trim()).join(', ') || d.name || '';
  const slogan  = d.slogan ? ` Slogan : "${d.slogan}".` : '';
  const prop    = d.proposition ? ` Proposition de valeur : ${d.proposition}.` : '';
  const sig     = d.signature ? ` Phrase signature : "${d.signature}".` : '';
  const concurrents = (d.concurrents || []).filter(c => c && c.trim());
  const concText = concurrents.length ? ` Les concurrents à surveiller sont : ${concurrents.join(', ')}.` : '';
  const offre = d.offre ? ` Offre principale : ${d.offre}${d.prix ? ' — Prix : ' + d.prix : ''}.` : '';
  return `Tu es un expert Community Manager pour ${d.name}, une marque du secteur ${secteur} qui s'adresse à ${d.cible || 'grand public'} (${d.zone || 'National'}). Ton de communication : ${d.ton || 'Professionnel & Expert'}. Les sujets phares à aborder sont : ${sujets}. Les formats de contenu privilégiés sont : ${formats}.${slogan}${prop}${sig}${concText}${offre} Génère du contenu professionnel, original et prêt à publier, adapté à chaque plateforme.`;
}

function _escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function _rgbToHex(rgb) {
  const m = rgb.match(/\d+/g);
  if (!m) return '#6c63ff';
  return '#' + m.slice(0,3).map(x => (+x).toString(16).padStart(2,'0')).join('');
}

function _injectCustomBrandStyles(brands) {
  let style = document.getElementById('_customBrandStyles');
  if (!style) { style = document.createElement('style'); style.id = '_customBrandStyles'; document.head.appendChild(style); }
  style.textContent = brands.map(b => {
    const color = b.accentColor || '#6c63ff';
    const hex = color.startsWith('rgb') ? _rgbToHex(color) : color;
    return `.badge-${b.id}{background:${hex}22;color:${hex};}`;
  }).join('');
}

function _extractDominantColor(src, cb) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 8;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 8, 8);
      const data = ctx.getImageData(0, 0, 8, 8).data;
      let r=0,g=0,b=0,n=0;
      for (let i=0;i<data.length;i+=4) {
        if (data[i+3]>128 && (data[i]<240||data[i+1]<240||data[i+2]<240)) { r+=data[i];g+=data[i+1];b+=data[i+2];n++; }
      }
      cb(n>0 ? _rgbToHex(`rgb(${Math.round(r/n)},${Math.round(g/n)},${Math.round(b/n)})`) : '#6c63ff');
    } catch(e) { cb('#6c63ff'); }
  };
  img.onerror = () => cb('#6c63ff');
  img.src = src;
}

// ----- Render brand cards -----
async function renderCustomBrandCards() {
  const brands = await _loadCustomBrands();
  _injectCustomBrandStyles(brands);
  const placeholderSVG = '<div class="brand-custom-placeholder"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>';
  const cardsHTML = brands.map((b, i) => `
    <button class="brand-btn brand-custom" data-brand-id="${b.id}" onclick="_selectCustomBrandByIdx(${i}, this)">
      <span class="brand-custom-edit" onclick="event.stopPropagation();_openOnboarding(${i})" title="Modifier">✏</span>
      <span class="brand-custom-del"  onclick="event.stopPropagation();_confirmDeleteCustomBrand(${i})" title="Supprimer">×</span>
      ${b.logo ? `<img src="${b.logo}" alt="${_escHtml(b.name)}" class="brand-custom-logo">` : placeholderSVG}
      <div class="brand-tag">${_escHtml(b.name)}</div>
    </button>
  `).join('');
  const addBtnHTML = `
    <button class="brand-btn brand-add-btn" onclick="_openOnboarding()">
      <span class="brand-add-plus">+</span>
      <div class="brand-tag">Ajouter une marque</div>
    </button>
  `;

  // Dashboard container (#customBrandsContainer, display:contents)
  const dashContainer = document.getElementById('customBrandsContainer');
  if (dashContainer) dashContainer.innerHTML = cardsHTML + addBtnHTML;

  // Studio brand-row: inject after the native Intelixa button
  const studioRow = document.querySelector('#page-studio .brand-row');
  if (studioRow) {
    studioRow.querySelectorAll('.brand-custom, .brand-add-btn').forEach(el => el.remove());
    const tmp = document.createElement('div');
    tmp.innerHTML = cardsHTML + addBtnHTML;
    while (tmp.firstChild) studioRow.appendChild(tmp.firstChild);
  }
}

function _filterStudioPlatforms(activePlatforms) {
  const grid = document.querySelector('#page-studio .platforms-grid');
  if (!grid) return;
  grid.querySelectorAll('.platform-btn').forEach(btn => {
    if (!activePlatforms) { btn.style.display = ''; return; }
    const oc = btn.getAttribute('onclick') || '';
    const m = oc.match(/selectPlatform\('([^']+)'/);
    const p = m ? m[1] : null;
    if (!p) return;
    const show = activePlatforms.includes(p) ||
      (p === 'facebook' && activePlatforms.includes('facebook_groupe'));
    btn.style.display = show ? '' : 'none';
  });
}

function _selectCustomBrandByIdx(idx, el) {
  if (!_customBrandsCache || idx >= _customBrandsCache.length) return;
  const brand = _customBrandsCache[idx];
  window._currentCustomBrand = brand;
  selectedBrand = brand.id;
  if (typeof BRAND_CONTEXT !== 'undefined') {
    BRAND_CONTEXT[brand.id] = { label: brand.name.toUpperCase(), desc: brand.systemPrompt, systemPrompt: brand.systemPrompt };
  }
  document.body.className = document.body.className.split(' ').filter(c => !c.startsWith('theme-')).join(' ');
  document.body.classList.add('theme-custom');
  const accent = brand.color || brand.accentColor || '#6c63ff';
  document.body.style.setProperty('--accent', accent);
  document.body.style.setProperty('--accent2', accent);
  document.querySelectorAll('.brand-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.title = brand.name + ' · Studio CM';
  const dashTitle = document.getElementById('dashTitle');
  const dashSub   = document.getElementById('dashSubtitle');
  if (dashTitle) { dashTitle.textContent = brand.name.toUpperCase(); dashTitle.style.cssText = ''; }
  if (dashSub)   { dashSub.textContent = brand.slogan || 'Community Manager · Marque personnalisée'; dashSub.style.cssText = ''; }
  _filterStudioPlatforms(brand.platforms && brand.platforms.length ? brand.platforms : null);
  if (typeof renderTemplates     === 'function') renderTemplates();
  if (typeof updateStats         === 'function') updateStats();
  if (typeof loadRecentDashboard === 'function') loadRecentDashboard();
  if (typeof checkReminders      === 'function') checkReminders();
  const notesPage = document.getElementById('page-notes');
  if (notesPage?.classList.contains('active') && typeof loadNotes === 'function') loadNotes();
  const histPage = document.getElementById('page-historique');
  if (histPage?.classList.contains('active') && typeof loadHistorique === 'function') loadHistorique();
  if (typeof renderAutopilotBlock === 'function') {
    if (typeof _apEnabled !== 'undefined' && _apEnabled) { if (typeof runAutopilot === 'function') runAutopilot(); }
    else renderAutopilotBlock();
  }
}

// ===== ONBOARDING MODAL 5 ÉTAPES =====
let _obStep = 1, _obData = {}, _obEditIdx = null;

const _OB_SECTEURS = ['IA/Tech','Formation','Santé','Immobilier','Restauration','Commerce','Beauté/Bien-être','Artisan','Autre'];
const _OB_ZONES    = ['Local','National','International'];
const _OB_TONS     = [
  {val:'Professionnel & Expert',   icon:'🎯', desc:'Crédibilité, chiffres, expertise'},
  {val:'Décontracté & Proche',     icon:'😊', desc:'Tutoiement, humain, accessible'},
  {val:'Inspirationnel & Motivant',icon:'🚀', desc:'Vision, ambition, projeter'},
  {val:'Humoristique & Décalé',    icon:'😄', desc:'Dérision, légèreté, surprise'}
];
const _OB_FORMATS = ['Éducatif','Preuve sociale','Storytelling','CTA','Coulisses','Tendances','Tutoriel','Veille'];
const _OB_PLATFORMS_LIST = [
  {key:'tiktok',          label:'TikTok'},
  {key:'linkedin',        label:'LinkedIn'},
  {key:'instagram',       label:'Instagram'},
  {key:'facebook',        label:'Facebook'},
  {key:'facebook_groupe', label:'Groupe Facebook'},
  {key:'pinterest',       label:'Pinterest'},
  {key:'gmb',             label:'Google My Business'},
  {key:'brevo',           label:'Email / Brevo'},
  {key:'youtube',         label:'YouTube'},
  {key:'spotify',         label:'Spotify / Podcast'},
];

function _openOnboarding(editIdx) {
  _obEditIdx = (editIdx !== undefined && editIdx !== null) ? editIdx : null;
  if (_obEditIdx !== null && _customBrandsCache && _customBrandsCache[_obEditIdx]) {
    _obData = JSON.parse(JSON.stringify(_customBrandsCache[_obEditIdx]));
  } else {
    _obData = {
      sujets:['','',''], formats:[], zone:'National', ton:'Professionnel & Expert',
      platforms: [..._ALL_PLATFORM_KEYS],
      color:'#6c63ff', proposition:'', signature:''
    };
  }
  _obStep = 1;
  _renderOnboardingModal();
}

// backward-compat aliases
function openAddBrandModal()   { _openOnboarding(); }
function _closeAddBrandModal() { _closeOnboarding(); }
async function _saveNewBrand() { await _obSave(); }

function _closeOnboarding() {
  document.getElementById('_brandOnboardingOverlay')?.remove();
}

function _renderOnboardingModal() {
  document.getElementById('_brandOnboardingOverlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = '_brandOnboardingOverlay';
  overlay.className = 'ob-overlay';
  overlay.addEventListener('click', e => { if (e.target === overlay) _closeOnboarding(); });
  overlay.innerHTML = `
    <div class="ob-modal">
      <div class="ob-header">
        <div class="ob-title">${_obEditIdx !== null ? 'Modifier la marque' : 'Nouvelle marque'}</div>
        <button class="ob-close" onclick="_closeOnboarding()">✕</button>
      </div>
      <div class="ob-progress">
        ${[1,2,3,4,5].map(n=>`<div class="ob-prog-seg${_obStep>=n?' active':''}${_obStep===n?' current':''}"></div>`).join('')}
      </div>
      <div class="ob-step-labels">
        <span class="${_obStep===1?'ob-sl-active':''}">Identité</span>
        <span class="${_obStep===2?'ob-sl-active':''}">Positionnement</span>
        <span class="${_obStep===3?'ob-sl-active':''}">Contenu</span>
        <span class="${_obStep===4?'ob-sl-active':''}">Plateformes</span>
        <span class="${_obStep===5?'ob-sl-active':''}">Récap</span>
      </div>
      <div class="ob-body" id="_obBody">${_renderObStep(_obStep)}</div>
      <div class="ob-footer" id="_obFooter">${_renderObFooter()}</div>
    </div>`;
  document.body.appendChild(overlay);
  if (_obStep === 1) _obBindLogoInput();
}

function _renderObFooter() {
  const prev = _obStep > 1
    ? `<button class="ob-btn-prev" onclick="_obNav(-1)">← Précédent</button>`
    : `<button class="ob-btn-prev" onclick="_closeOnboarding()">Annuler</button>`;
  const next = _obStep < 5
    ? `<button class="ob-btn-next" onclick="_obNav(1)">Suivant →</button>`
    : `<button class="ob-btn-create" onclick="_obSave()">${_obEditIdx !== null ? 'Enregistrer' : 'Créer la marque'}</button>`;
  return prev + next;
}

function _renderObStep(n) {
  if (n===1) return _renderObStep1();
  if (n===2) return _renderObStep2();
  if (n===3) return _renderObStep3();
  if (n===4) return _renderObStep4();
  if (n===5) return _renderObStep5();
  return '';
}

function _renderObStep1() {
  const name=_escHtml(_obData.name||''), slogan=_escHtml(_obData.slogan||''), hasLogo=!!_obData.logo;
  const color = _obData.color || _obData.accentColor || '#6c63ff';
  return `
    <div>
      <div class="ob-section-title">Logo de la marque</div>
      <label class="ob-logo-upload" for="_obLogoInput">
        <div id="_obLogoPreviewWrap" style="${hasLogo?'':'display:none'}">
          <img id="_obLogoPreview" src="${hasLogo?_obData.logo:''}" alt="Logo" class="ob-logo-preview-img">
        </div>
        <div class="ob-logo-hint" id="_obLogoHint" style="${hasLogo?'display:none':''}">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          <span>Cliquer pour uploader votre logo</span>
          <span style="font-size:11px;opacity:.6">PNG, JPG, SVG — optionnel</span>
        </div>
        <input type="file" id="_obLogoInput" accept="image/*" style="display:none">
      </label>
    </div>
    <div>
      <div class="ob-section-title">Nom de la marque <span style="color:#e53935">*</span></div>
      <input id="_obName" class="ob-input" type="text" placeholder="Ex : MaMarque…" value="${name}" autocomplete="off">
    </div>
    <div>
      <div class="ob-section-title">Slogan ou accroche courte <span style="font-weight:400;color:var(--muted);font-size:10px">(optionnel)</span></div>
      <input id="_obSlogan" class="ob-input" type="text" placeholder="Ex : L'IA au service des pros" value="${slogan}" autocomplete="off">
    </div>
    <div>
      <div class="ob-section-title">Couleur accent</div>
      <div class="ob-color-row">
        <input id="_obColor" type="color" class="ob-color-input" value="${color}">
        <span class="ob-color-label">Couleur principale de la marque — thématise l'interface quand cette marque est active</span>
      </div>
    </div>`;
}

function _renderObStep2() {
  const secteur=_obData.secteur||'Autre', zone=_obData.zone||'National';
  const cible=_escHtml(_obData.cible||''), libre=_escHtml(_obData.secteurLibre||'');
  const prop=_escHtml(_obData.proposition||'');
  return `
    <div>
      <div class="ob-section-title">Secteur d'activité</div>
      <div class="ob-chips">
        ${_OB_SECTEURS.map(s=>`<div class="ob-chip secteur${s===secteur?' selected':''}" data-val="${s}" onclick="obSelectChip(this,'secteur')">${_escHtml(s)}</div>`).join('')}
      </div>
      <div class="ob-secteur-libre${secteur==='Autre'?' visible':''}" id="_obSecteurLibreDiv">
        <input id="_obSecteurLibre" class="ob-input" type="text" placeholder="Précisez votre secteur…" value="${libre}">
      </div>
    </div>
    <div>
      <div class="ob-section-title">Cible client</div>
      <input id="_obCible" class="ob-input" type="text" placeholder='Ex : "Dirigeants de TPE", "Mamans 25-40 ans"' value="${cible}">
    </div>
    <div>
      <div class="ob-section-title">Zone géographique</div>
      <div class="ob-chips">
        ${_OB_ZONES.map(z=>`<div class="ob-chip zone${z===zone?' selected':''}" data-val="${z}" onclick="obSelectChip(this,'zone')">${z}</div>`).join('')}
      </div>
    </div>
    <div>
      <div class="ob-section-title">Proposition de valeur <span style="font-weight:400;color:var(--muted);font-size:10px">(optionnel)</span></div>
      <textarea id="_obProposition" class="ob-input ob-textarea" placeholder="En une phrase, qu'apportez-vous à vos clients ?">${prop}</textarea>
    </div>
    <div>
      <div class="ob-section-title">Concurrents principaux <span style="font-weight:400;color:var(--muted);font-size:10px">(max 5 — injectés dans les prompts)</span></div>
      <div class="ob-concurrent-chips" id="_obConcurrentsContainer">
        ${(_obData.concurrents||[]).map(c=>`<div class="ob-concurrent-chip" data-val="${_escHtml(c)}">${_escHtml(c)} <button type="button" onclick="this.parentElement.remove()" class="ob-concurrent-del">×</button></div>`).join('')}
        <div class="ob-concurrent-input-row" id="_obConcurrentInputRow">
          <input id="_obConcurrentInput" class="ob-input" type="text" placeholder="Ex : NomConcurrent, TapezEntrée…" autocomplete="off" onkeydown="if(event.key==='Enter'){event.preventDefault();obAddConcurrent()}" style="flex:1;">
          <button type="button" class="ob-concurrent-add-btn" onclick="obAddConcurrent()">+ Ajouter</button>
        </div>
      </div>
    </div>
    <div>
      <div class="ob-section-title">Offre principale <span style="font-weight:400;color:var(--muted);font-size:10px">(optionnel — référencé dans le CTA)</span></div>
      <div class="ob-offre-row">
        <input id="_obOffre" class="ob-input" type="text" placeholder="Ex : Formation Excel en ligne" value="${_escHtml(_obData.offre||'')}" style="flex:1;">
        <input id="_obPrix" class="ob-input" type="text" placeholder="Prix (ex : 297€)" value="${_escHtml(_obData.prix||'')}" style="width:120px;">
      </div>
    </div>`;
}

function _renderObStep3() {
  const ton=_obData.ton||'Professionnel & Expert', sujets=_obData.sujets||['','',''], formats=_obData.formats||[];
  const sig=_escHtml(_obData.signature||'');
  return `
    <div>
      <div class="ob-section-title">Ton de communication</div>
      <div class="ob-ton-grid">
        ${_OB_TONS.map(t=>`<div class="ob-ton-card${t.val===ton?' selected':''}" data-val="${t.val}" onclick="obSelectTon(this)">
          <div class="ob-ton-icon">${t.icon}</div>
          <div class="ob-ton-name">${t.val}</div>
          <div class="ob-ton-desc">${t.desc}</div>
        </div>`).join('')}
      </div>
    </div>
    <div>
      <div class="ob-section-title">Sujets phares <span style="font-weight:400;color:var(--muted);font-size:10px">(optionnel)</span></div>
      <div class="ob-sujets">
        ${[0,1,2].map(i=>`<div class="ob-sujet-row">
          <span class="ob-sujet-num">${i+1}</span>
          <input id="_obSujet${i+1}" class="ob-input" type="text" placeholder="Ex : Automatisation, Témoignages clients…" value="${_escHtml(sujets[i]||'')}">
        </div>`).join('')}
      </div>
    </div>
    <div>
      <div class="ob-section-title">Formats favoris <span style="font-weight:400;color:var(--muted);font-size:10px">(multi-sélection)</span></div>
      <div class="ob-chips">
        ${_OB_FORMATS.map(f=>`<div class="ob-chip format${formats.includes(f)?' selected':''}" data-val="${f}" onclick="obToggleFormat(this)">${f}</div>`).join('')}
      </div>
    </div>
    <div>
      <div class="ob-section-title">Phrase signature / gimmick <span style="font-weight:400;color:var(--muted);font-size:10px">(optionnel)</span></div>
      <input id="_obSignature" class="ob-input" type="text" placeholder='Ex : "On ne va pas se mentir", "Concret. Terrain. Efficace."' value="${sig}" autocomplete="off">
    </div>`;
}

function _renderObStep4() {
  const selected = _obData.platforms || [];
  const fbGrpSvg = '<svg viewBox="0 0 24 24" fill="#1877F2" width="20" height="20"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>';
  return `
    <div>
      <div class="ob-section-title">Plateformes actives <span style="font-weight:400;color:var(--muted);font-size:10px">(seules ces plateformes apparaîtront dans Studio pour cette marque)</span></div>
      <div class="ob-platform-grid">
        ${_OB_PLATFORMS_LIST.map(p => {
          const meta = (typeof PLATFORMS_META !== 'undefined') ? (PLATFORMS_META[p.key] || {}) : {};
          const iconSvg = meta.icon || (p.key === 'facebook_groupe' ? fbGrpSvg : '');
          return `<div class="ob-platform-chip${selected.includes(p.key)?' selected':''}" data-val="${p.key}" onclick="obTogglePlatform(this)">
            <span class="ob-platform-icon">${iconSvg}</span>
            <span class="ob-platform-label">${_escHtml(p.label)}</span>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div style="margin-top:16px;">
      <div class="ob-section-title">Liens réseaux sociaux <span style="font-weight:400;color:var(--muted);font-size:10px">(optionnel — affichés sur la fiche marque)</span></div>
      <div id="_obLiensContainer">${_renderObLienInputs()}</div>
    </div>`;
}

function _renderObLienInputs() {
  const selected = [...document.querySelectorAll('.ob-platform-chip.selected')].map(c => c.dataset.val);
  const platforms = selected.length ? selected : (_obData.platforms || []);
  const liens = _obData.liens || {};
  if (!platforms.length) return '<span style="font-size:12px;color:var(--muted)">Sélectionnez des plateformes ci-dessus pour renseigner vos liens.</span>';
  return platforms.filter(p => p !== 'facebook_groupe').map(p => {
    const label = _OB_PLATFORMS_LIST.find(x => x.key === p)?.label || p;
    const val = _escHtml(liens[p] || '');
    return `<div class="ob-lien-row"><label class="ob-lien-label">${label}</label><input class="ob-input ob-lien-input" type="url" placeholder="https://…" data-plat="${p}" value="${val}"></div>`;
  }).join('');
}

function _renderObStep5() {
  const d=_obData, secteurDisplay=d.secteur==='Autre'?(d.secteurLibre||'Non défini'):(d.secteur||'Non défini');
  const sujets=(d.sujets||[]).filter(s=>s&&s.trim()), formats=d.formats||[];
  const selectedPlats=_OB_PLATFORMS_LIST.filter(p=>(d.platforms||[]).includes(p.key));
  return `
    <div class="ob-recap">
      <div class="ob-recap-section">
        <div class="ob-recap-section-head">
          <div class="ob-recap-label">Identité visuelle</div>
          <button class="ob-recap-edit" onclick="_obGoToStep(1)">Modifier</button>
        </div>
        <div class="ob-recap-brand-row">
          ${d.logo?`<img src="${d.logo}" class="ob-recap-logo" alt="Logo">`:'<div class="ob-recap-placeholder"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>'}
          <div>
            <div style="font-size:15px;font-weight:800;color:var(--text)">${_escHtml(d.name||'—')}</div>
            ${d.slogan?`<div style="font-size:12px;color:var(--muted);margin-top:2px;font-style:italic">${_escHtml(d.slogan)}</div>`:''}
          </div>
          ${d.color?`<div style="width:20px;height:20px;border-radius:50%;background:${_escHtml(d.color)};margin-left:auto;border:2px solid var(--border);flex-shrink:0"></div>`:''}
        </div>
      </div>
      <div class="ob-recap-section">
        <div class="ob-recap-section-head">
          <div class="ob-recap-label">Positionnement</div>
          <button class="ob-recap-edit" onclick="_obGoToStep(2)">Modifier</button>
        </div>
        <div class="ob-recap-row"><span>Secteur </span>${_escHtml(secteurDisplay)}</div>
        <div class="ob-recap-row"><span>Cible </span>${_escHtml(d.cible||'—')}</div>
        <div class="ob-recap-row"><span>Zone </span>${_escHtml(d.zone||'National')}</div>
        ${d.proposition?`<div class="ob-recap-row"><span>Valeur </span>${_escHtml(d.proposition)}</div>`:''}
        ${(d.concurrents && d.concurrents.length) ? `<div class="ob-recap-row"><span>Concurrents </span>${d.concurrents.map(c=>_escHtml(c)).join(', ')}</div>` : ''}
        ${d.offre ? `<div class="ob-recap-row"><span>Offre </span>${_escHtml(d.offre)}${d.prix ? ' — '+_escHtml(d.prix) : ''}</div>` : ''}
      </div>
      <div class="ob-recap-section">
        <div class="ob-recap-section-head">
          <div class="ob-recap-label">Identité de contenu</div>
          <button class="ob-recap-edit" onclick="_obGoToStep(3)">Modifier</button>
        </div>
        <div class="ob-recap-row"><span>Ton </span>${_escHtml(d.ton||'—')}</div>
        ${sujets.length?`<div class="ob-recap-row"><span>Sujets </span>${sujets.map(s=>_escHtml(s)).join(', ')}</div>`:''}
        ${formats.length?`<div class="ob-recap-chips">${formats.map(f=>`<span class="ob-recap-chip">${_escHtml(f)}</span>`).join('')}</div>`:''}
        ${d.signature?`<div class="ob-recap-row"><span>Signature </span><em>${_escHtml(d.signature)}</em></div>`:''}
      </div>
      <div class="ob-recap-section">
        <div class="ob-recap-section-head">
          <div class="ob-recap-label">Plateformes (${selectedPlats.length})</div>
          <button class="ob-recap-edit" onclick="_obGoToStep(4)">Modifier</button>
        </div>
        <div class="ob-recap-chips">
          ${selectedPlats.map(p=>`<span class="ob-recap-chip">${_escHtml(p.label)}</span>`).join('')}
        </div>
      </div>
    </div>`;
}

// ----- Chip / card helpers (global — called from onclick) -----
function obSelectChip(el, group) {
  document.querySelectorAll(`.ob-chip.${group}`).forEach(c=>c.classList.remove('selected'));
  el.classList.add('selected');
  if (group==='secteur') {
    const libre=document.getElementById('_obSecteurLibreDiv');
    if (libre) libre.className='ob-secteur-libre'+(el.dataset.val==='Autre'?' visible':'');
  }
}
function obSelectTon(el) {
  document.querySelectorAll('.ob-ton-card').forEach(c=>c.classList.remove('selected'));
  el.classList.add('selected');
}
function obToggleFormat(el)   { el.classList.toggle('selected'); }
function obTogglePlatform(el) {
  el.classList.toggle('selected');
  const liensContainer = document.getElementById('_obLiensContainer');
  if (liensContainer) liensContainer.innerHTML = _renderObLienInputs();
}

function obAddConcurrent() {
  const input = document.getElementById('_obConcurrentInput');
  const val = (input?.value || '').trim();
  if (!val) return;
  const chips = document.querySelectorAll('#_obConcurrentsContainer .ob-concurrent-chip');
  if (chips.length >= 5) { input.style.borderColor='#e53935'; setTimeout(()=>{ input.style.borderColor=''; },1500); return; }
  if ([...chips].some(c => c.dataset.val === val)) { input.value=''; return; }
  const container = document.getElementById('_obConcurrentsContainer');
  const inputRow  = document.getElementById('_obConcurrentInputRow');
  const chip = document.createElement('div');
  chip.className = 'ob-concurrent-chip';
  chip.dataset.val = val;
  chip.innerHTML = `${_escHtml(val)} <button type="button" onclick="this.parentElement.remove()" class="ob-concurrent-del">×</button>`;
  container.insertBefore(chip, inputRow);
  input.value = '';
}

function _obBindLogoInput() {
  const fi=document.getElementById('_obLogoInput');
  if (!fi) return;
  fi.addEventListener('change', function() {
    const file=this.files[0]; if (!file) return;
    const reader=new FileReader();
    reader.onload=e=>{
      _obData.logo=e.target.result;
      _extractDominantColor(e.target.result, color=>{
        // Auto-fill color picker only if user hasn't changed it from the default
        const colorInput=document.getElementById('_obColor');
        if (colorInput && (colorInput.value==='#6c63ff' || colorInput.value===(_obData.color||'#6c63ff'))) {
          _obData.color=color; _obData.accentColor=color;
          colorInput.value=color;
        }
      });
      const wrap=document.getElementById('_obLogoPreviewWrap');
      const img=document.getElementById('_obLogoPreview');
      const hint=document.getElementById('_obLogoHint');
      if (img) img.src=e.target.result;
      if (wrap) wrap.style.display='block';
      if (hint) hint.style.display='none';
    };
    reader.readAsDataURL(file);
  });
}

function _obSaveCurrentStep() {
  if (_obStep===1) {
    _obData.name   = (document.getElementById('_obName')?.value||'').trim();
    _obData.slogan = (document.getElementById('_obSlogan')?.value||'').trim();
    _obData.color  = document.getElementById('_obColor')?.value || _obData.color || '#6c63ff';
    _obData.accentColor = _obData.color;
  } else if (_obStep===2) {
    const sel=document.querySelector('.ob-chip.secteur.selected');
    if (sel) _obData.secteur=sel.dataset.val;
    _obData.secteurLibre=(document.getElementById('_obSecteurLibre')?.value||'').trim();
    _obData.cible=(document.getElementById('_obCible')?.value||'').trim();
    const zon=document.querySelector('.ob-chip.zone.selected');
    if (zon) _obData.zone=zon.dataset.val;
    _obData.proposition=(document.getElementById('_obProposition')?.value||'').trim();
    _obData.concurrents = [...document.querySelectorAll('#_obConcurrentsContainer .ob-concurrent-chip')].map(c => c.dataset.val).filter(Boolean);
    _obData.offre = (document.getElementById('_obOffre')?.value || '').trim();
    _obData.prix  = (document.getElementById('_obPrix')?.value  || '').trim();
  } else if (_obStep===3) {
    const ton=document.querySelector('.ob-ton-card.selected');
    if (ton) _obData.ton=ton.dataset.val;
    _obData.sujets=[1,2,3].map(i=>(document.getElementById('_obSujet'+i)?.value||'').trim());
    _obData.formats=[...document.querySelectorAll('.ob-chip.format.selected')].map(c=>c.dataset.val);
    _obData.signature=(document.getElementById('_obSignature')?.value||'').trim();
  } else if (_obStep===4) {
    _obData.platforms=[...document.querySelectorAll('.ob-platform-chip.selected')].map(c=>c.dataset.val);
    _obData.liens = {};
    document.querySelectorAll('.ob-lien-input').forEach(inp => {
      const url = inp.value.trim();
      if (url) _obData.liens[inp.dataset.plat] = url;
    });
  }
}

function _obValidateStep(step) {
  if (step===1) {
    const name=(document.getElementById('_obName')?.value||'').trim();
    if (!name) {
      const input=document.getElementById('_obName');
      if (input) { input.style.borderColor='#e53935'; input.focus(); setTimeout(()=>{ input.style.borderColor=''; },2000); }
      return false;
    }
  }
  if (step===4) {
    const sel=[...document.querySelectorAll('.ob-platform-chip.selected')];
    if (!sel.length) {
      const grid=document.querySelector('.ob-platform-grid');
      if (grid) { grid.style.outline='2px solid #e53935'; setTimeout(()=>{ grid.style.outline=''; },2000); }
      return false;
    }
  }
  return true;
}

function _obUpdateProgressUI() {
  document.querySelectorAll('.ob-prog-seg').forEach((s,i)=>{
    s.classList.toggle('active', _obStep>=i+1);
    s.classList.toggle('current',_obStep===i+1);
  });
  document.querySelectorAll('.ob-step-labels span').forEach((s,i)=>{
    s.classList.toggle('ob-sl-active', _obStep===i+1);
  });
}

function _obNav(dir) {
  _obSaveCurrentStep();
  if (dir>0 && !_obValidateStep(_obStep)) return;
  _obStep+=dir;
  const body=document.getElementById('_obBody'), footer=document.getElementById('_obFooter');
  if (body)   body.innerHTML=_renderObStep(_obStep);
  if (footer) footer.innerHTML=_renderObFooter();
  _obUpdateProgressUI();
  if (_obStep===1) _obBindLogoInput();
}

function _obGoToStep(n) {
  _obSaveCurrentStep();
  _obStep=n;
  const body=document.getElementById('_obBody'), footer=document.getElementById('_obFooter');
  if (body)   body.innerHTML=_renderObStep(_obStep);
  if (footer) footer.innerHTML=_renderObFooter();
  _obUpdateProgressUI();
  if (_obStep===1) _obBindLogoInput();
}

async function _obSave() {
  _obSaveCurrentStep();
  if (!(_obData.name||'').trim()) {
    _obGoToStep(1);
    setTimeout(()=>{ const i=document.getElementById('_obName'); if(i){i.style.borderColor='#e53935';i.focus();setTimeout(()=>{i.style.borderColor='';},2000);} },50);
    return;
  }
  _obData.name=_obData.name.trim();
  if (!_obData.color) _obData.color='#6c63ff';
  _obData.accentColor=_obData.color;
  if (!_obData.platforms || !_obData.platforms.length) _obData.platforms=[..._ALL_PLATFORM_KEYS];
  _obData.systemPrompt=_buildSystemPrompt(_obData);
  // Génère les prompts par plateforme
  _obData.prompts={};
  _obData.platforms.forEach(p=>{ _obData.prompts[p]=generatePromptForPlatform(_obData,p); });
  const brands=await _loadCustomBrands();
  if (_obEditIdx!==null) {
    _obData.id=brands[_obEditIdx].id;
    brands[_obEditIdx]={..._obData};
    if (selectedBrand===_obData.id && typeof BRAND_CONTEXT!=='undefined') {
      BRAND_CONTEXT[_obData.id]={label:_obData.name.toUpperCase(),desc:_obData.systemPrompt,systemPrompt:_obData.systemPrompt};
      window._currentCustomBrand={..._obData};
      // Mettre à jour la couleur et les plateformes en direct
      document.body.style.setProperty('--accent', _obData.color);
      document.body.style.setProperty('--accent2', _obData.color);
      _filterStudioPlatforms(_obData.platforms.length ? _obData.platforms : null);
    }
  } else {
    _obData.id='custom_'+Date.now();
    brands.push({..._obData});
  }
  await _saveCustomBrands(brands);
  _closeOnboarding();
  renderCustomBrandCards();
}

// ----- Confirm delete -----
function _confirmDeleteCustomBrand(idx) {
  if (!_customBrandsCache||idx>=_customBrandsCache.length) return;
  const brand=_customBrandsCache[idx];
  document.getElementById('_brandConfirmOverlay')?.remove();
  const overlay=document.createElement('div');
  overlay.id='_brandConfirmOverlay';
  overlay.className='ob-overlay';
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
  overlay.innerHTML=`
    <div class="ob-confirm">
      <div class="ob-confirm-title">Supprimer ${_escHtml(brand.name)} ?</div>
      <div class="ob-confirm-msg">Tout l'historique lié à cette marque sera conservé. Cette action est irréversible.</div>
      <div class="ob-confirm-footer">
        <button class="ob-confirm-cancel" onclick="document.getElementById('_brandConfirmOverlay').remove()">Annuler</button>
        <button class="ob-confirm-delete" onclick="_executeDeleteCustomBrand(${idx})">Supprimer</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

async function _executeDeleteCustomBrand(idx) {
  document.getElementById('_brandConfirmOverlay')?.remove();
  const brands=await _loadCustomBrands();
  const deleted=brands[idx];
  brands.splice(idx,1);
  await _saveCustomBrands(brands);
  if (deleted&&selectedBrand===deleted.id) {
    selectedBrand=null;
    window._currentCustomBrand=null;
    document.body.className=document.body.className.split(' ').filter(c=>!c.startsWith('theme-')).join(' ');
    document.body.style.removeProperty('--accent');
    document.body.style.removeProperty('--accent2');
    document.title='Studio CM';
    _filterStudioPlatforms(null);
  }
  renderCustomBrandCards();
}

// backward compat
async function _deleteCustomBrand(idx) { _confirmDeleteCustomBrand(idx); }
function _brandLogoPreview() {}

// ===== ADN BADGES SUR CARTES MARQUE =====
async function renderADNBadges() {
  const sections = ['entreprise','cible','ton','offres','concurrents','signature','tabous'];
  const total = sections.length;

  // Marques fixes
  for (const brandId of ['intelixa']) {
    let filled = 0;
    for (const s of sections) {
      const r = await window.storage.get(`adn-${brandId}-${s}`);
      if (r && r.value && r.value.trim()) filled++;
    }
    document.querySelectorAll(`.brand-btn.${brandId}`).forEach(btn => {
      _applyADNBadge(btn, filled, total);
    });
  }
  // Marques custom
  document.querySelectorAll('.brand-btn[data-brand-id]').forEach(async btn => {
    const brandId = btn.dataset.brandId;
    if (!brandId) return;
    let filled = 0;
    for (const s of sections) {
      const r = await window.storage.get(`adn-${brandId}-${s}`);
      if (r && r.value && r.value.trim()) filled++;
    }
    _applyADNBadge(btn, filled, total);
  });
}

function _applyADNBadge(btn, filled, total) {
  if (filled === 0) {
    const existing = btn.querySelector('.adn-btn-badge');
    if (existing) existing.remove();
    return;
  }
  let badge = btn.querySelector('.adn-btn-badge');
  if (!badge) { badge = document.createElement('div'); badge.className = 'adn-btn-badge'; btn.appendChild(badge); }
  if (filled === total)     { badge.textContent = 'ADN ✓'; badge.className = 'adn-btn-badge adn-btn-complete'; }
  else if (filled < 3)      { badge.textContent = `ADN ${filled}/${total}`; badge.className = 'adn-btn-badge adn-btn-incomplete'; }
  else                      { badge.textContent = `ADN ${filled}/${total}`; badge.className = 'adn-btn-badge adn-btn-partial'; }
}
