// ===== FÊTES & ÉVÉNEMENTS MARKETING =====
const FETES = {
  // Format: 'MM-DD': { label, emoji, type }
  // Types: 'ferie' (jour férié), 'commercial' (fête commerciale), 'marketing' (événement marketing)

  // Jours fériés France
  '01-01': { label: "Jour de l'an", emoji: '🎆', type: 'ferie' },
  '05-01': { label: 'Fête du Travail', emoji: '✊', type: 'ferie' },
  '05-08': { label: 'Victoire 1945', emoji: '🕊️', type: 'ferie' },
  '07-14': { label: 'Fête Nationale', emoji: '🇫🇷', type: 'ferie' },
  '08-15': { label: 'Assomption', emoji: '⛪', type: 'ferie' },
  '11-01': { label: 'Toussaint', emoji: '🕯️', type: 'ferie' },
  '11-11': { label: 'Armistice', emoji: '🎖️', type: 'ferie' },
  '12-25': { label: 'Noël', emoji: '🎄', type: 'ferie' },

  // Fêtes commerciales & marketing incontournables
  '01-06': { label: 'Épiphanie', emoji: '👑', type: 'commercial' },
  '02-02': { label: 'Chandeleur', emoji: '🥞', type: 'commercial' },
  '02-14': { label: 'Saint-Valentin', emoji: '❤️', type: 'commercial' },
  '03-08': { label: 'Journée de la Femme', emoji: '♀️', type: 'commercial' },
  '03-19': { label: 'Fête des Grands-Pères', emoji: '👴', type: 'commercial' },
  '04-01': { label: "Poisson d'Avril", emoji: '🐟', type: 'commercial' },
  '06-01': { label: "Journée de l'Enfance", emoji: '🧒', type: 'commercial' },
  '06-21': { label: 'Fête de la Musique', emoji: '🎵', type: 'commercial' },
  '10-31': { label: 'Halloween', emoji: '🎃', type: 'commercial' },
  '11-19': { label: 'Fête des Hommes', emoji: '👨', type: 'commercial' },
  '12-06': { label: 'Saint-Nicolas', emoji: '🎅', type: 'commercial' },
  '12-31': { label: 'Réveillon', emoji: '🥂', type: 'commercial' },

  // Événements marketing (dates approximatives — semaines clés)
  '01-15': { label: "Soldes d'hiver", emoji: '🏷️', type: 'marketing' },
  '01-24': { label: 'Fin soldes hiver', emoji: '🏷️', type: 'marketing' },
  '06-25': { label: "Soldes d'été", emoji: '☀️', type: 'marketing' },
  '07-22': { label: 'Fin soldes été', emoji: '☀️', type: 'marketing' },
  '11-28': { label: 'Black Friday', emoji: '🖤', type: 'marketing' },
  '12-02': { label: 'Cyber Monday', emoji: '💻', type: 'marketing' },

  // Journées internationales utiles CM
  '01-28': { label: 'Journée Données Perso', emoji: '🔒', type: 'marketing' },
  '02-11': { label: 'Journée Femmes & Sciences', emoji: '🔬', type: 'marketing' },
  '03-20': { label: 'Printemps / Bonheur', emoji: '🌸', type: 'marketing' },
  '04-22': { label: 'Jour de la Terre', emoji: '🌍', type: 'marketing' },
  '05-15': { label: 'Journée Famille', emoji: '👨‍👩‍👧', type: 'marketing' },
  '06-05': { label: 'Journée Environnement', emoji: '🌿', type: 'marketing' },
  '09-01': { label: 'Rentrée', emoji: '🎒', type: 'marketing' },
  '10-10': { label: 'Santé Mentale', emoji: '🧠', type: 'marketing' },
  '11-13': { label: 'Journée Gentillesse', emoji: '💛', type: 'marketing' },
};

// Fêtes à dates variables (calculées dynamiquement)
function getFetesVariables(year) {
  const result = {};

  // Calcul Pâques (algorithme de Meeus/Jones/Butcher)
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 1-based
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  const paques = new Date(year, month - 1, day);

  const pad = n => String(n).padStart(2, '0');
  const key = d => `${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

  // Pâques
  result[key(paques)] = { label: 'Pâques', emoji: '🐣', type: 'ferie' };

  // Lundi de Pâques
  const lundiPaques = new Date(paques); lundiPaques.setDate(paques.getDate() + 1);
  result[key(lundiPaques)] = { label: 'Lundi de Pâques', emoji: '🐰', type: 'ferie' };

  // Ascension (39 jours après Pâques)
  const ascension = new Date(paques); ascension.setDate(paques.getDate() + 39);
  result[key(ascension)] = { label: 'Ascension', emoji: '✝️', type: 'ferie' };

  // Pentecôte (49 jours après Pâques)
  const pentecote = new Date(paques); pentecote.setDate(paques.getDate() + 49);
  result[key(pentecote)] = { label: 'Pentecôte', emoji: '🕊️', type: 'ferie' };

  // Lundi de Pentecôte
  const lundiPentecote = new Date(paques); lundiPentecote.setDate(paques.getDate() + 50);
  result[key(lundiPentecote)] = { label: 'Lundi de Pentecôte', emoji: '🕊️', type: 'ferie' };

  // Fête des Mères : dernier dimanche de mai (ou 1er juin si coïncide avec Pentecôte)
  let feteMeres = new Date(year, 4, 1); // 1er mai
  while (feteMeres.getDay() !== 0) feteMeres.setDate(feteMeres.getDate() + 1);
  // Dernier dimanche de mai
  let tmp = new Date(year, 4, 31);
  while (tmp.getDay() !== 0) tmp.setDate(tmp.getDate() - 1);
  if (key(tmp) === key(pentecote)) tmp.setDate(tmp.getDate() + 7); // décalage si Pentecôte
  result[key(tmp)] = { label: 'Fête des Mères', emoji: '👩', type: 'commercial' };

  // Fête des Pères : 3ème dimanche de juin
  let fetePeres = new Date(year, 5, 1);
  let sundayCount = 0;
  while (sundayCount < 3) {
    if (fetePeres.getDay() === 0) sundayCount++;
    if (sundayCount < 3) fetePeres.setDate(fetePeres.getDate() + 1);
  }
  result[key(fetePeres)] = { label: 'Fête des Pères', emoji: '👨', type: 'commercial' };

  return result;
}

function getFetesForDay(year, month, day) {
  const pad = n => String(n).padStart(2, '0');
  const fixedKey = `${pad(month+1)}-${pad(day)}`;
  const variables = getFetesVariables(year);
  const fixed = FETES[fixedKey];
  const variable = variables[fixedKey];
  const result = [];
  if (fixed) result.push(fixed);
  if (variable) result.push(variable);
  return result;
}

// ===== HELPER TODAY CARD =====
function getUpcomingFete(maxDaysAhead) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let offset = 0; offset <= maxDaysAhead; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const fetes = getFetesForDay(d.getFullYear(), d.getMonth(), d.getDate());
    if (fetes.length) return { fete: fetes[0], daysAhead: offset };
  }
  return null;
}

// ===== ALERTES "À PUBLIER" DÉPASSÉES =====
// Retourne un tableau d'alertes pour les posts "a-publier" dont la date <= aujourd'hui
async function getCalendarAlerts() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const alerts = [];

  // Scanner le mois courant + les 2 mois précédents
  for (let offset = 0; offset <= 2; offset++) {
    let y = today.getFullYear();
    let m = today.getMonth() - offset;
    if (m < 0) { m += 12; y--; }

    try {
      const r = await window.storage.get(`cal-${y}-${m}`);
      if (!r) continue;
      const posts = JSON.parse(r.value);

      for (const [dayStr, dayPosts] of Object.entries(posts)) {
        const day = parseInt(dayStr);
        const postDate = new Date(y, m, day);
        postDate.setHours(0, 0, 0, 0);

        if (postDate <= today) {
          dayPosts.forEach((p, idx) => {
            if (p.status === 'a-publier') {
              const isToday = postDate.getTime() === today.getTime();
              const dayLabel = isToday
                ? "aujourd'hui"
                : `le ${postDate.toLocaleDateString('fr-FR', {day:'2-digit', month:'2-digit'})}`;
              const brandIcon = p.brand === 'intelixa' ? icon('zap',13) : p.brand === 'doudelio' ? icon('leaf',13) : '';
              alerts.push({
                msg: `${icon('alertTriangle',14)} Post ${_platIcon(p.platform) || ''} ${p.platform} ${brandIcon} prévu ${dayLabel} — as-tu publié ?`,
                actionFn: `markPostPublished(${y},${m},${day},${idx})`,
                isToday
              });
            }
          });
        }
      }
    } catch(e) {}
  }

  return alerts;
}

// ===== SUIVI PERFORMANCE =====

// Retourne les posts publiés il y a 6-8 jours sans notation
async function getPerformanceReviewAlerts() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const alerts = [];
  const seenKeys = new Set();

  for (let daysAgo = 6; daysAgo <= 8; daysAgo++) {
    const target = new Date(today);
    target.setDate(today.getDate() - daysAgo);
    const y = target.getFullYear();
    const m = target.getMonth();
    const d = target.getDate();

    try {
      const r = await window.storage.get(`cal-${y}-${m}`);
      if (!r) continue;
      const posts = JSON.parse(r.value);
      const dayPosts = posts[d] || [];

      dayPosts.forEach((p, idx) => {
        const uniqKey = `${y}-${m}-${d}-${idx}`;
        if (p.status === 'publie' && !p.rating && !seenKeys.has(uniqKey)) {
          seenKeys.add(uniqKey);
          const dateStr = target.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
          const brandIcon = p.brand === 'intelixa' ? icon('zap',13) : p.brand === 'doudelio' ? icon('leaf',13) : '';
          alerts.push({
            year: y, month: m, day: d, postIndex: idx,
            brand: p.brand, platform: p.platform, dateStr,
            msg: `${icon('barChart2',14)} Ton post ${_platIcon(p.platform) || ''} ${p.platform} ${brandIcon} du ${dateStr} — comment ça a marché ?`
          });
        }
      });
    } catch(e) {}
  }

  return alerts;
}

// Enregistre le ressenti (appelé depuis les boutons du dashboard)
async function savePostRating(year, month, day, postIndex, rating) {
  try {
    const calKey = `cal-${year}-${month}`;
    const r = await window.storage.get(calKey);
    if (!r) return;
    const posts = JSON.parse(r.value);
    if (!posts[day] || !posts[day][postIndex]) return;
    const post = posts[day][postIndex];

    post.rating = rating;
    await window.storage.set(calKey, JSON.stringify(posts));

    const RATING_NUM = { '🔥': 4, '👍': 3, '😐': 2, '👎': 1 };
    const perfKey = `perf-${post.brand}-${post.platform}-${year}-${month}-${day}-${postIndex}`;
    await window.storage.set(perfKey, JSON.stringify({
      brand: post.brand,
      platform: post.platform,
      rating,
      ratingNum: RATING_NUM[rating] || 0,
      year, month, day,
      dateStr: new Date(year, month, day).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      timestamp: Date.now()
    }));

    checkReminders();
    if (typeof renderPerfRecap === 'function') renderPerfRecap();
  } catch(e) {}
}

// Marquer un post comme publié depuis l'alerte dashboard
async function markPostPublished(year, month, day, postIndex) {
  try {
    const key = `cal-${year}-${month}`;
    const r = await window.storage.get(key);
    if (!r) return;
    const posts = JSON.parse(r.value);
    if (posts[day] && posts[day][postIndex]) {
      posts[day][postIndex].status = 'publie';
      await window.storage.set(key, JSON.stringify(posts));
      checkReminders();
    }
  } catch(e) {}
}

// ===== PLANNING HEBDOMADAIRE — VUE CALENDRIER =====
let _planColEditDay = null;

// Stubs requis par cm-init.js : initCalendarView().then(renderCalendar)
async function initCalendarView() {} // no-op
function renderCalendar() { renderPlanningView(); }

async function _getPlanTasks(day) {
  const key = 'planning-custom-' + day;
  try {
    const r = await window.storage.get(key);
    if (r && r.value !== undefined) {
      const arr = JSON.parse(r.value);
      if (Array.isArray(arr)) return arr;
    }
  } catch(e) {}
  return (PLANNING_HEBDO[day] || []).slice();
}

// Détecte la plateforme principale d'une tâche
function _detectPlatform(task) {
  const t = task.toLowerCase();
  if (t.includes('tiktok'))                          return { type: 'meta',   key: 'tiktok' };
  if (t.includes('linkedin'))                        return { type: 'meta',   key: 'linkedin' };
  if (t.includes('google my business') || t.includes('gmb')) return { type: 'meta', key: 'gmb' };
  if (t.includes('pinterest'))                       return { type: 'meta',   key: 'pinterest' };
  if (t.includes('youtube') || t.includes('podcast')) return { type: 'meta', key: 'youtube' };
  if (t.includes('newsletter') || t.includes('brevo')) return { type: 'meta', key: 'brevo' };
  if (t.includes('spotify'))                         return { type: 'meta',   key: 'spotify' };
  if (t.includes('instagram'))                       return { type: 'meta',   key: 'instagram' };
  if (t.includes('meta') || t.includes('story'))     return { type: 'meta',   key: 'facebook' };
  if (t.includes('webinaire'))                       return { type: 'lucide', key: 'calendar' };
  return { type: 'lucide', key: 'sparkles' };
}

function _taskIcon(task) {
  const p = _detectPlatform(task);
  if (p.type === 'meta') return _platIcon(p.key) || icon('sparkles', 18);
  return icon(p.key, 18);
}

// Retourne les badges marque détectés dans le texte de la tâche
function _taskBrandBadges(task) {
  let html = '';
  if (/intelixa/i.test(task)) html += `<span class="plan-task-badge plan-badge-intelixa">${icon('zap', 10)}</span>`;
  if (/doudelio/i.test(task)) html += `<span class="plan-task-badge plan-badge-doudelio">${icon('leaf', 10)}</span>`;
  return html;
}

async function renderPlanningView() {
  const grid = document.getElementById('planGrid');
  if (!grid) return;

  const today = new Date();
  // Convertir getDay() (0=Dim) en index 0=Lun…6=Dim
  const todayDow = today.getDay() === 0 ? 6 : today.getDay() - 1;

  const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Dimanche'];
  const BASE_DAYS = [0, 1, 2, 3, 4]; // Lun-Ven toujours affichés

  // Afficher Dimanche seulement si des tâches existent
  const sundayTasks = await _getPlanTasks(6);
  const activeDays = sundayTasks.length ? [...BASE_DAYS, 6] : BASE_DAYS;

  // Précharger toutes les tâches en parallèle
  const allTasks = {};
  await Promise.all(activeDays.map(async d => { allTasks[d] = await _getPlanTasks(d); }));

  let html = '';
  for (const day of activeDays) {
    const name = day === 6 ? DAY_NAMES[5] : DAY_NAMES[day];
    const tasks = allTasks[day];
    const isToday = day === todayDow;
    const isEditing = _planColEditDay === day;
    const colClass = ['plan-week-col', isToday ? 'today' : '', day === 6 ? 'dimanche' : ''].filter(Boolean).join(' ');

    const headerHtml = isEditing
      ? `<div class="plan-col-header">
          <span class="plan-col-day">${name}</span>
          <div class="plan-col-edit-actions">
            <button class="plan-col-validate-btn" onclick="_planColValidate(${day})">Valider</button>
            <button class="plan-col-reset-btn" onclick="_planColReset(${day})">Réinitialiser</button>
          </div>
        </div>`
      : `<div class="plan-col-header">
          <span class="plan-col-day">${name}</span>
          <button class="plan-col-edit-btn" onclick="_planColToggleEdit(${day})" title="Modifier">${icon('pencil', 13)}</button>
        </div>`;

    let tasksHtml = '';
    if (isEditing) {
      const itemsHtml = tasks.map((t, i) => `
        <li class="plan-task-edit-item">
          <input type="text" class="plan-task-input" value="${t.replace(/"/g, '&quot;')}" data-idx="${i}" />
          <button class="plan-task-remove-btn" onclick="_planColRemoveTask(this)" title="Supprimer">${icon('x', 11)}</button>
        </li>`).join('');
      tasksHtml = `
        <ul class="plan-col-tasks edit" id="planColTasks${day}">${itemsHtml}</ul>
        <div class="plan-task-add-item">
          <input type="text" class="plan-task-add-input" id="planColAddInput${day}" placeholder="Nouvelle tâche…"
            onkeydown="if(event.key==='Enter')_planColAddTask(${day})" />
          <button class="plan-task-add-btn" onclick="_planColAddTask(${day})">${icon('plus', 13)}</button>
        </div>`;
    } else if (tasks.length === 0) {
      tasksHtml = `<div class="plan-col-empty">Repos</div>`;
    } else {
      const itemsHtml = tasks.map(t => `
        <li class="plan-task-item">
          <span class="plan-task-icon">${_taskIcon(t)}</span>
          <span class="plan-task-text">${t}</span>
          ${_taskBrandBadges(t)}
        </li>`).join('');
      tasksHtml = `<ul class="plan-col-tasks">${itemsHtml}</ul>`;
    }

    html += `<div class="${colClass}">${headerHtml}${tasksHtml}</div>`;
  }

  grid.innerHTML = `<div class="plan-inner-grid" style="grid-template-columns:repeat(${activeDays.length},minmax(180px,1fr));">${html}</div>`;
}

function _planColToggleEdit(day) {
  _planColEditDay = _planColEditDay === day ? null : day;
  renderPlanningView();
}

function _planColValidate(day) {
  const list = document.getElementById('planColTasks' + day);
  const tasks = list
    ? Array.from(list.querySelectorAll('.plan-task-input')).map(i => i.value.trim()).filter(Boolean)
    : [];
  const addInput = document.getElementById('planColAddInput' + day);
  if (addInput && addInput.value.trim()) tasks.push(addInput.value.trim());
  window.storage.set('planning-custom-' + day, JSON.stringify(tasks));
  _planColEditDay = null;
  renderPlanningView();
}

function _planColReset(day) {
  window.storage.set('planning-custom-' + day, JSON.stringify(PLANNING_HEBDO[day] || []));
  _planColEditDay = null;
  renderPlanningView();
}

function _planColRemoveTask(btn) {
  const item = btn.closest('.plan-task-edit-item');
  if (item) item.remove();
}

function _planColAddTask(day) {
  const input = document.getElementById('planColAddInput' + day);
  if (!input || !input.value.trim()) return;
  const list = document.getElementById('planColTasks' + day);
  if (!list) return;
  const li = document.createElement('li');
  li.className = 'plan-task-edit-item';
  li.innerHTML = `<input type="text" class="plan-task-input" value="${input.value.trim().replace(/"/g, '&quot;')}" />
    <button class="plan-task-remove-btn" onclick="_planColRemoveTask(this)">${icon('x', 11)}</button>`;
  list.appendChild(li);
  input.value = '';
  input.focus();
}
