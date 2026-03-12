// ===== TODAY CARD =====
let _planningEditMode = false;

function _getTodayPlanningDay() {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay - 1; // 0=Lundi … 6=Dimanche
}

async function renderTodayCard() {
  const el = document.getElementById('todayCard');
  if (!el) return;

  const today = new Date();
  const planningDay = _getTodayPlanningDay();

  // Custom ou défaut
  let tasks = null;
  try {
    const r = await window.storage.get(`planning-custom-${planningDay}`);
    if (r) tasks = JSON.parse(r.value);
  } catch(e) {}
  if (!tasks) tasks = (typeof PLANNING_HEBDO !== 'undefined' ? PLANNING_HEBDO[planningDay] : null) || [];

  // Fête du jour
  const fetes = (typeof getFetesForDay === 'function')
    ? getFetesForDay(today.getFullYear(), today.getMonth(), today.getDate())
    : [];

  el.style.display = 'block';
  el.innerHTML = _buildTodayCardHtml(today, planningDay, tasks, fetes);
}

function _buildTodayCardHtml(today, planningDay, tasks, fetes) {
  const dateStr = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const isEditMode = _planningEditMode;
  const isSaturday = planningDay === 5;

  const headerRight = isEditMode
    ? `<div class="today-card-header-actions">
        <button class="today-card-reset-btn" onclick="_planningReset()">${icon('rotateCcw',12)} Réinitialiser</button>
        <button class="today-card-validate-btn" onclick="_planningValidate()">${icon('check',13)} Valider</button>
       </div>`
    : `<button class="today-card-edit-btn" onclick="_planningToggleEdit()" title="Modifier">${icon('edit2',14)}</button>`;

  let tasksHtml;
  if (isSaturday && !isEditMode) {
    tasksHtml = `<p class="today-card-rest">Repos — pas de publication aujourd'hui 👌</p>`;
  } else if (isEditMode) {
    const items = tasks.map((t, i) => `
      <li class="today-task-edit-item">
        <input class="today-task-input" value="${t.replace(/"/g, '&quot;')}" />
        <button class="today-task-remove-btn" onclick="_planningRemoveTask(this)">${icon('x',12)}</button>
      </li>
    `).join('');
    tasksHtml = `
      <ul class="today-card-tasks edit">
        ${items}
        <li class="today-task-add-item">
          <input class="today-task-add-input" id="tc-new-task" placeholder="Ajouter une tâche…"
            onkeydown="if(event.key==='Enter')_planningAddTask()" />
          <button class="today-task-add-btn" onclick="_planningAddTask()">${icon('plus',13)}</button>
        </li>
      </ul>`;
  } else if (tasks.length === 0) {
    tasksHtml = `<p class="today-card-rest">Aucune tâche pour aujourd'hui 👌</p>`;
  } else {
    const items = tasks.map(t => `<li class="today-task-item">${t}</li>`).join('');
    tasksHtml = `<ul class="today-card-tasks">${items}</ul>`;
  }

  let feteHtml = '';
  if (fetes.length > 0) {
    const f = fetes[0];
    const safeLabel = f.label.replace(/'/g, "\\'");
    feteHtml = `
      <div class="today-card-fete">
        <span class="today-card-emoji">${f.emoji}</span>
        <span class="today-card-fete-label">${f.label}</span>
        <div class="today-card-fete-actions">
          <button class="today-card-btn intelixa" onclick="_goStudioWithEvent('intelixa','${safeLabel}')">
            ${icon('zap',13)} Idée Intelixa →
          </button>
          <button class="today-card-btn doudelio" onclick="_goStudioWithEvent('doudelio','${safeLabel}')">
            ${icon('leaf',13)} Idée Doudelio →
          </button>
        </div>
      </div>`;
  }

  return `
    <div class="today-card-header">
      <span class="today-card-date">${dateStr}</span>
      ${headerRight}
    </div>
    ${tasksHtml}
    ${feteHtml}
  `;
}

function _planningToggleEdit() {
  _planningEditMode = !_planningEditMode;
  renderTodayCard();
}

async function _planningValidate() {
  const inputs = document.querySelectorAll('.today-task-input');
  const tasks = [...inputs].map(i => i.value.trim()).filter(Boolean);
  const planningDay = _getTodayPlanningDay();
  try {
    await window.storage.set(`planning-custom-${planningDay}`, JSON.stringify(tasks));
  } catch(e) {}
  _planningEditMode = false;
  renderTodayCard();
}

async function _planningReset() {
  const planningDay = _getTodayPlanningDay();
  try { localStorage.removeItem(`planning-custom-${planningDay}`); } catch(e) {}
  _planningEditMode = false;
  renderTodayCard();
}

function _planningRemoveTask(btn) {
  btn.closest('.today-task-edit-item').remove();
}

function _planningAddTask() {
  const input = document.getElementById('tc-new-task');
  if (!input || !input.value.trim()) return;
  const addItem = document.querySelector('.today-task-add-item');
  if (!addItem) return;
  const li = document.createElement('li');
  li.className = 'today-task-edit-item';
  li.innerHTML = `
    <input class="today-task-input" value="${input.value.trim().replace(/"/g, '&quot;')}" />
    <button class="today-task-remove-btn" onclick="_planningRemoveTask(this)">${icon('x',12)}</button>
  `;
  addItem.parentNode.insertBefore(li, addItem);
  input.value = '';
  input.focus();
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

// ===== STAN DASHBOARD =====
function _injectStanDashWelcome() {
  if (document.getElementById('stanDashWelcome')) return;
  const welcome = document.createElement('div');
  welcome.id = 'stanDashWelcome';
  welcome.className = 'stan-dash-welcome';
  welcome.innerHTML = `
    <div class="stan-dash-title">Bienvenue Stan</div>
    <div class="stan-dash-sub">Ton espace perso</div>
    <button class="stan-dash-cta" onclick="_stanGoToIdeas()">Mes idées →</button>
  `;
  const brandRow = document.querySelector('#page-dashboard .brand-row');
  if (brandRow) brandRow.insertAdjacentElement('afterend', welcome);
  else document.getElementById('page-dashboard')?.appendChild(welcome);
}

function _stanGoToIdeas() {
  const notesTab = [...document.querySelectorAll('.nav-tab')]
    .find(t => (t.getAttribute('onclick') || '').includes("'notes'"));
  if (notesTab) switchPage('notes', notesTab);
  setTimeout(() => { if (typeof setNotesView === 'function') setNotesView('stan'); }, 80);
}
