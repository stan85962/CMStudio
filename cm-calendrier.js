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
              const brandIcon = p.brand === 'intelixa' ? icon('zap',13) : '';
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
          const brandIcon = p.brand === 'intelixa' ? icon('zap',13) : '';
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

// ===== VUE AGENDA SEMAINE (style Google Calendar) =====

let _calWeekOffset = 0;     // 0 = semaine courante, ±N semaines
let _wcalPendingDow  = null; // index PLANNING_HEBDO du jour en attente
let _wcalPendingHour = null;
let _wcalPendingMin  = null;
let _dragData        = null; // { planDow, globalIdx, fromAllDay } pendant un drag
let _touchDragEl     = null; // ghost element pour le drag tactile
let _touchDragSrc    = null; // élément source (drag tactile)
let _trecPendingCol  = null; // colonne en attente pour le modal trec ('quotidien'|'hebdomadaire'|'ponctuel')

// Stubs requis par cm-init.js : initCalendarView().then(renderCalendar)
async function initCalendarView() {}
function renderCalendar() { renderPlanningView(); }

// Couleurs de fond par plateforme
const PLAT_COLORS = {
  linkedin:  ['#0077b5', '#fff'],
  tiktok:    ['#1a1a1a', '#fff'],
  facebook:  ['#1877f2', '#fff'],
  instagram: ['#dd2a7b', '#fff'],
  pinterest: ['#e60023', '#fff'],
  gmb:       ['#34a853', '#fff'],
  youtube:   ['#ff0000', '#fff'],
  brevo:     ['#1969e1', '#fff'],
  spotify:   ['#1db954', '#fff'],
  calendar:  ['#616161', '#fff'],
  sparkles:  ['#7b5ea7', '#fff'],
};
function _platColor(key) { return PLAT_COLORS[key] || PLAT_COLORS.sparkles; }

// Détecte une heure dans le texte (ex : "19h", "11h30", "matin", "soir", "midi")
function _detectTime(text) {
  const t = text.toLowerCase();
  const m = t.match(/(\d{1,2})h(\d{2})?/);
  if (m) {
    const h = parseInt(m[1]), min = parseInt(m[2] || '0');
    if (h >= 0 && h <= 23) return { hour: h, minute: min };
  }
  if (t.includes('matin')) return { hour: 8,  minute: 0 };
  if (t.includes('midi'))  return { hour: 12, minute: 0 };
  if (t.includes('soir'))  return { hour: 19, minute: 0 };
  return null;
}

// Normalise une tâche en {text, platforms[], hour, minute}
// Rétrocompatibilité : string ou objet {platform} ancien format
function _normalizeTask(task) {
  function toPlatforms(raw) {
    if (raw && Array.isArray(raw.platforms) && raw.platforms.length) return raw.platforms;
    if (raw && raw.platform) return [raw.platform];
    return ['sparkles'];
  }
  if (typeof task === 'string') {
    const p = _detectPlatform(task);
    const t = _detectTime(task);
    return { text: task, platforms: [p.key], hour: t ? t.hour : null, minute: t ? t.minute : null };
  }
  const platforms = toPlatforms(task);
  // undefined → heure pas encore définie, détecter depuis le texte
  // null     → sans horaire explicite, ne pas détecter
  if (task.hour === undefined) {
    const t = _detectTime(task.text || '');
    return { text: task.text, platforms, hour: t ? t.hour : null, minute: t ? t.minute : null };
  }
  return { text: task.text, platforms, hour: task.hour, minute: task.minute ?? 0 };
}

// Retourne l'icône SVG à partir d'une clé de plateforme
function _taskIconByKey(key) {
  if (PLATFORMS_META[key]) return _platIcon(key) || icon('sparkles', 13);
  return icon(key || 'sparkles', 13);
}

// Retourne le label lisible d'une liste de plateformes ("LinkedIn · Instagram")
function _platLabels(platforms) {
  return platforms.map(k => PLATFORMS_META[k]?.label || k).join(' · ');
}

// Construit la rangée d'icônes multi-plateforme (max 3 + badge "+X")
function _taskIconsHtml(platforms) {
  const MAX = 3;
  const shown = platforms.slice(0, MAX);
  const extra = platforms.length - MAX;
  const icons = shown.map(k => `<span class="wcal-icon-wrap">${_taskIconByKey(k)}</span>`).join('');
  const badge = extra > 0 ? `<span class="wcal-icon-more">+${extra}</span>` : '';
  return `<span class="wcal-icon-row">${icons}${badge}</span>`;
}

// Retourne la liste brute pour un jour (PLANNING_HEBDO index 0=Lun…6=Dim)
async function _getPlanTasks(day) {
  const key = 'planning-custom-' + day;
  try {
    const r = await window.storage.get(key);
    if (r && r.value !== undefined) {
      const arr = JSON.parse(r.value);
      if (Array.isArray(arr)) return arr;
    }
  } catch(e) {}
  // Fallback PLANNING_HEBDO — filtre les tâches retirées par drag
  const base = (PLANNING_HEBDO[day] || []).slice();
  try {
    const rr = await window.storage.get('planning-removed-' + day);
    if (rr && rr.value !== undefined) {
      const removed = JSON.parse(rr.value);
      if (Array.isArray(removed)) {
        return base.filter(t => !removed.includes(typeof t === 'string' ? t : t.text));
      }
    }
  } catch(e) {}
  return base;
}

// Détecte la plateforme principale d'une tâche
function _detectPlatform(task) {
  const t = task.toLowerCase();
  if (t.includes('tiktok'))                                   return { type: 'meta',   key: 'tiktok' };
  if (t.includes('linkedin'))                                 return { type: 'meta',   key: 'linkedin' };
  if (t.includes('google my business') || t.includes('gmb')) return { type: 'meta',   key: 'gmb' };
  if (t.includes('pinterest'))                                return { type: 'meta',   key: 'pinterest' };
  if (t.includes('youtube') || t.includes('podcast'))         return { type: 'meta',   key: 'youtube' };
  if (t.includes('newsletter') || t.includes('brevo'))        return { type: 'meta',   key: 'brevo' };
  if (t.includes('spotify'))                                  return { type: 'meta',   key: 'spotify' };
  if (t.includes('instagram'))                                return { type: 'meta',   key: 'instagram' };
  if (t.includes('meta') || t.includes('story'))              return { type: 'meta',   key: 'facebook' };
  if (t.includes('webinaire'))                                return { type: 'lucide', key: 'calendar' };
  return { type: 'lucide', key: 'sparkles' };
}

// Construit le sélecteur d'icônes plateforme
function _buildIconPickerHtml(pickerId) {
  const keys = [...Object.keys(PLATFORMS_META), 'calendar', 'sparkles'];
  const btns = keys.map(k => {
    const isPlat = !!PLATFORMS_META[k];
    const lbl = isPlat ? PLATFORMS_META[k].label : (k === 'calendar' ? 'Événement' : 'Autre');
    const ico = isPlat ? (_platIcon(k) || icon('sparkles', 13)) : icon(k, 13);
    return `<button type="button" class="plan-icon-btn" data-platform="${k}" onclick="_planIconSelect(this)" title="${lbl}">${ico}</button>`;
  }).join('');
  return `<div class="plan-icon-picker" id="${pickerId}">${btns}</div>`;
}

// Toggle multi-sélection (clic = cocher / décocher)
function _planIconSelect(btn) {
  btn.classList.toggle('active');
}

// Retourne le dimanche qui ouvre la semaine affichée (Dim→Sam)
function _wcalWeekStart() {
  const now = new Date();
  const d = new Date(now);
  d.setDate(now.getDate() - ((now.getDay() + 6) % 7) + _calWeekOffset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function renderPlanningView() {
  const grid = document.getElementById('planGrid');
  if (!grid) return;

  const HOUR_START = 7, HOUR_END = 20, SLOT_H = 60;
  const TOTAL_H = (HOUR_END - HOUR_START) * SLOT_H; // 960px
  const DOW_SHORT = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
  const MONTHS_FR = ['jan.','fév.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekStart = _wcalWeekStart();
  const weekDates = Array.from({length: 7}, (_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d;
  });

  // Label "12 – 18 mars 2026"
  const d0 = weekDates[0], d6 = weekDates[6];
  const weekLabel = d0.getMonth() === d6.getMonth()
    ? `${d0.getDate()} – ${d6.getDate()} ${MONTHS_FR[d6.getMonth()]} ${d6.getFullYear()}`
    : `${d0.getDate()} ${MONTHS_FR[d0.getMonth()]} – ${d6.getDate()} ${MONTHS_FR[d6.getMonth()]} ${d6.getFullYear()}`;

  // Charger et normaliser les tâches (PLANNING_HEBDO index = getDay()==0 ? 6 : getDay()-1)
  const allTasks = await Promise.all(weekDates.map(async date => {
    const planDow = date.getDay() === 0 ? 6 : date.getDay() - 1;
    return (await _getPlanTasks(planDow)).map(_normalizeTask);
  }));

  const todayIdx = weekDates.findIndex(d => d.getTime() === today.getTime());

  // === Headers colonnes ===
  const colHeaders = weekDates.map((d, i) => {
    const isToday = i === todayIdx;
    return `<div class="wcal-col-header${isToday ? ' today' : ''}">
      <span class="wcal-col-dow">${DOW_SHORT[d.getDay()]}</span>
      <span class="wcal-col-num${isToday ? ' today' : ''}">${d.getDate()}</span>
    </div>`;
  }).join('');

  // === Axe horaire ===
  const timeAxis = Array.from({length: HOUR_END - HOUR_START + 1}, (_, i) =>
    `<div class="wcal-time-label" style="top:${i * SLOT_H}px">${HOUR_START + i}h</div>`
  ).join('');

  // === Colonnes timed ===
  const timedCols = weekDates.map((d, i) => {
    const isToday = i === todayIdx;
    const planDow = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const cards = allTasks[i]
      .map((t, gi) => t.hour !== null ? { t, gi } : null).filter(Boolean)
      .map(({ t, gi }) => {
        const h = t.hour;
        if (h < HOUR_START || h > HOUR_END) return '';
        const topPx = (h - HOUR_START) * SLOT_H + (t.minute || 0);
        const plats = t.platforms;
        const [bg, fg] = _platColor(plats[0]);
        const escaped = t.text.replace(/"/g, '&quot;');
        const tooltipEl = plats.length > 1
          ? `<div class="wcal-card-tooltip">${_platLabels(plats)}</div>` : '';
        return `<div class="wcal-card" style="top:${topPx}px;background:${bg};color:${fg}" title="${escaped}"
          draggable="true"
          onclick="_wcalCardClick(event,this)"
          ondblclick="_wcalEditCard(event,${planDow},${gi})"
          ondragstart="_wcalDragStart(event,${planDow},${gi},false)"
          ondragend="_wcalDragEnd(event)"
          ontouchstart="_wcalTouchStart(event,${planDow},${gi},false)"
          ontouchmove="_wcalTouchMove(event)"
          ontouchend="_wcalTouchEnd(event)">
          ${_taskIconsHtml(plats)}
          <span class="wcal-card-text">${t.text}</span>
          <button class="wcal-card-dup" onclick="_wcalDuplicateCard(event,${planDow},${gi})" title="Dupliquer"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg></button>
          <button class="wcal-card-del" onclick="_wcalDeleteCard(event,${planDow},${gi})">×</button>
          ${tooltipEl}
        </div>`;
      }).join('');
    const nowLine = isToday ? `<div class="wcal-now-line" id="wcalNowLine"></div>` : '';
    return `<div class="wcal-timed-col${isToday ? ' today' : ''}" data-plan-dow="${planDow}"
      onclick="_wcalCellClick(event,${planDow})"
      ondragover="_wcalDragOver(event,${planDow})"
      ondragleave="_wcalDragLeave(event)"
      ondrop="_wcalDropOnTimed(event,${planDow})">
      ${nowLine}<div class="wcal-drop-line" style="display:none"></div>${cards}
    </div>`;
  }).join('');

  grid.innerHTML = `
    <div class="wcal-wrap">
      <div class="wcal-nav">
        <button class="wcal-nav-btn" onclick="_wcalPrevWeek()" title="Semaine précédente">‹</button>
        <button class="wcal-nav-today" onclick="_wcalGoToday()">Aujourd'hui</button>
        <button class="wcal-nav-btn" onclick="_wcalNextWeek()" title="Semaine suivante">›</button>
        <span class="wcal-nav-label">${weekLabel}</span>
        <button class="wcal-export-btn" onclick="exportWeekCSV()" title="Exporter en CSV"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> CSV</button>
        <button class="wcal-export-btn wcal-export-pdf" onclick="exportWeekPDF()" title="Imprimer/PDF"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14" rx="1"/></svg> PDF</button>
      </div>
      <div class="wcal-grid">
        <div class="wcal-headers">
          <div class="wcal-gutter"></div>${colHeaders}
        </div>
        <div class="wcal-scroll">
          <div class="wcal-timed-wrap" style="height:${TOTAL_H}px">
            <div class="wcal-time-axis">${timeAxis}</div>
            <div class="wcal-timed-cols">${timedCols}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="wcal-modal" id="wcalAddModal" style="display:none" onclick="if(event.target===this)_wcalCloseModal()">
      <div class="wcal-modal-inner">
        <div class="wcal-modal-head">
          <span class="wcal-modal-title">Nouvelle tâche</span>
          <button class="wcal-modal-close" onclick="_wcalCloseModal()">×</button>
        </div>
        ${_buildIconPickerHtml('wcalModalPicker')}
        <span class="wcal-picker-hint">Plusieurs plateformes possibles</span>
        <input type="text" class="wcal-modal-input" id="wcalModalText" placeholder="Nom de la tâche…"
          onkeydown="if(event.key==='Enter')_wcalSaveNew()" />
        <div class="wcal-modal-time-row">
          <label>Heure</label>
          <input type="number" id="wcalModalHour" class="wcal-modal-num" min="0" max="23" placeholder="19" />
          <span>h</span>
          <input type="number" id="wcalModalMin"  class="wcal-modal-num" min="0" max="59" placeholder="00" value="0" />
        </div>
        <button class="wcal-modal-save" onclick="_wcalSaveNew()">Ajouter</button>
      </div>
    </div>
    <section class="trec-section" id="trecSection"></section>
    <div class="wcal-modal" id="trecAddModal" style="display:none" onclick="if(event.target===this)_trecCloseModal()">
      <div class="wcal-modal-inner">
        <div class="wcal-modal-head">
          <span class="wcal-modal-title">Nouvelle tâche récurrente</span>
          <button class="wcal-modal-close" onclick="_trecCloseModal()">×</button>
        </div>
        ${_buildIconPickerHtml('trecModalPicker')}
        <span class="wcal-picker-hint">Plusieurs plateformes possibles</span>
        <input type="text" class="wcal-modal-input" id="trecModalText" placeholder="Nom de la tâche…"
          onkeydown="if(event.key==='Enter')_trecSaveNew()" />
        <button class="wcal-modal-save" onclick="_trecSaveNew()">Ajouter</button>
      </div>
    </div>`;

  _wcalUpdateNow();
  renderRecurringSection();
}

// Navigation
function _wcalPrevWeek() { _calWeekOffset--; renderPlanningView(); }
function _wcalNextWeek() { _calWeekOffset++; renderPlanningView(); }
function _wcalGoToday()  { _calWeekOffset = 0; renderPlanningView(); }

// Indicateur heure courante (ligne rouge)
function _wcalUpdateNow() {
  const line = document.getElementById('wcalNowLine');
  if (!line) return;
  const now = new Date();
  const h = now.getHours(), m = now.getMinutes();
  if (h < 7 || h > 20) { line.style.display = 'none'; return; }
  line.style.top = ((h - 7) * 60 + (m / 60) * 60) + 'px';
  line.style.display = 'block';
}

// Clic sur une cellule horaire vide → ouvre la modal d'ajout
function _wcalCellClick(event, planDow) {
  if (event.target.closest('.wcal-card')) return;
  const col = event.currentTarget;
  const rect = col.getBoundingClientRect();
  const rawY = event.clientY - rect.top;
  const hour  = Math.floor(rawY / 60) + 7;
  const snapM = Math.round((rawY % 60) / 15) * 15;
  _wcalPendingDow  = planDow;
  _wcalPendingHour = Math.min(Math.max(hour, 7), 19);
  _wcalPendingMin  = snapM >= 60 ? 0 : snapM;
  _wcalOpenModal();
}

// Clic sur une card (stopPropagation pour éviter _wcalCellClick)
function _wcalCardClick(event, cardEl) { event.stopPropagation(); }

// Double-clic → édition inline du texte de la card
function _wcalEditCard(event, planDow, globalIdx) {
  event.stopPropagation();
  const card = event.currentTarget;
  if (card.classList.contains('editing')) return;

  card.classList.add('editing');
  card.draggable = false; // désactiver drag pendant l'édition

  const textEl = card.querySelector('.wcal-card-text');
  const originalText = textEl.textContent;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'wcal-card-input';
  input.value = originalText;
  textEl.replaceWith(input);
  input.focus();
  input.select();

  let settled = false;

  const done = (text) => {
    if (settled) return;
    settled = true;
    const span = document.createElement('span');
    span.className = 'wcal-card-text';
    span.textContent = text;
    if (input.parentNode) input.replaceWith(span);
    card.classList.remove('editing');
    card.draggable = true;
  };

  const save = async () => {
    const newText = input.value.trim() || originalText;
    done(newText);
    if (newText === originalText) return;
    card.title = newText;
    const raw = await _getPlanTasks(planDow);
    const tasks = raw.map(_normalizeTask);
    if (globalIdx < tasks.length) {
      tasks[globalIdx].text = newText;
      window.storage.set('planning-custom-' + planDow, JSON.stringify(tasks));
    }
  };

  input.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter')  { e.preventDefault(); save(); }
    if (e.key === 'Escape') { e.preventDefault(); done(originalText); }
  });

  // blur → save avec délai pour laisser Escape agir en premier
  input.addEventListener('blur', () => setTimeout(save, 120));
}

// Supprimer une tâche
async function _wcalDeleteCard(event, planDow, globalIdx) {
  event.stopPropagation();
  const raw = await _getPlanTasks(planDow);
  const tasks = raw.map(_normalizeTask);
  tasks.splice(globalIdx, 1);
  window.storage.set('planning-custom-' + planDow, JSON.stringify(tasks));
  renderPlanningView();
}

// Dupliquer une tâche → copie dans "Sans horaire" du même jour
async function _wcalDuplicateCard(event, planDow, globalIdx) {
  event.stopPropagation();
  const raw = await _getPlanTasks(planDow);
  const tasks = raw.map(_normalizeTask);
  if (globalIdx >= tasks.length) return;
  const src = tasks[globalIdx];
  // Flash vert sur la card source avant le re-rendu
  event.target.closest('.wcal-card')?.classList.add('flash-dup');
  // Copie au jour suivant, même heure
  const nextDow = (planDow + 1) % 7;
  const nextRaw = await _getPlanTasks(nextDow);
  const nextTasks = nextRaw.map(_normalizeTask);
  nextTasks.push({ text: src.text, platforms: src.platforms, hour: src.hour, minute: src.minute });
  window.storage.set('planning-custom-' + nextDow, JSON.stringify(nextTasks));
  await renderPlanningView();
  // Animer la card apparue dans la colonne cible
  const cell = document.querySelector(`.wcal-col[data-plan-dow="${nextDow}"]`);
  cell?.querySelector('.wcal-card:last-child')?.classList.add('wcal-chip-new');
}

// Modal : ouvrir
function _wcalOpenModal() {
  const modal = document.getElementById('wcalAddModal');
  if (!modal) return;
  const hEl = document.getElementById('wcalModalHour');
  const mEl = document.getElementById('wcalModalMin');
  const tEl = document.getElementById('wcalModalText');
  if (hEl) hEl.value = _wcalPendingHour ?? '';
  if (mEl) mEl.value = _wcalPendingMin  ?? 0;
  if (tEl) tEl.value = '';
  document.getElementById('wcalModalPicker')?.querySelectorAll('.plan-icon-btn').forEach(b => b.classList.remove('active'));
  modal.style.display = 'flex';
  setTimeout(() => tEl?.focus(), 50);
}

// Modal : fermer
function _wcalCloseModal() {
  const modal = document.getElementById('wcalAddModal');
  if (modal) modal.style.display = 'none';
  _wcalPendingDow = _wcalPendingHour = _wcalPendingMin = null;
}

// Modal : sauvegarder
async function _wcalSaveNew() {
  const text = document.getElementById('wcalModalText')?.value.trim();
  if (!text || _wcalPendingDow === null) return;
  const hVal = document.getElementById('wcalModalHour')?.value;
  const mVal = document.getElementById('wcalModalMin')?.value;
  const actives = [...(document.getElementById('wcalModalPicker')?.querySelectorAll('.plan-icon-btn.active') || [])];
  const platforms = actives.length > 0
    ? actives.map(b => b.dataset.platform)
    : [_detectPlatform(text).key];
  const hour   = hVal !== '' ? parseInt(hVal)  : null;
  const minute = mVal !== '' ? parseInt(mVal)  : 0;
  const newTask = { text, platforms, hour: isNaN(hour) ? null : hour, minute: isNaN(minute) ? 0 : minute };
  const raw = await _getPlanTasks(_wcalPendingDow);
  const tasks = raw.map(_normalizeTask);
  tasks.push(newTask);
  window.storage.set('planning-custom-' + _wcalPendingDow, JSON.stringify(tasks));
  _wcalCloseModal();
  renderPlanningView();
}

// ===== DRAG & DROP =====

function _wcalDragStart(event, planDow, globalIdx, fromAllDay) {
  if (event.target.closest('.wcal-card-del')) { event.preventDefault(); return; }
  _dragData = { planDow, globalIdx, fromAllDay };
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', '1'); // requis par Firefox
  const el = event.currentTarget;
  setTimeout(() => el.classList.add('dragging'), 0);
}

function _wcalDragEnd(event) {
  event.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.wcal-timed-col.drag-over').forEach(col => {
    col.classList.remove('drag-over');
    const dl = col.querySelector('.wcal-drop-line');
    if (dl) dl.style.display = 'none';
  });
  document.querySelectorAll('.wcal-allday-cell.drag-over').forEach(c => c.classList.remove('drag-over'));
}

function _wcalDragOver(event, planDow) {
  if (!_dragData) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  const col = event.currentTarget;
  col.classList.add('drag-over');
  const rect = col.getBoundingClientRect();
  const rawY = event.clientY - rect.top;
  const snapped = Math.round(rawY / 15) * 15;
  const dropLine = col.querySelector('.wcal-drop-line');
  if (dropLine) { dropLine.style.top = snapped + 'px'; dropLine.style.display = 'block'; }
}

function _wcalDragLeave(event) {
  const col = event.currentTarget;
  if (!col.contains(event.relatedTarget)) {
    col.classList.remove('drag-over');
    const dl = col.querySelector('.wcal-drop-line');
    if (dl) dl.style.display = 'none';
  }
}

async function _wcalDropOnTimed(event, planDow) {
  event.preventDefault();
  const col = event.currentTarget;
  col.classList.remove('drag-over');
  const dl = col.querySelector('.wcal-drop-line');
  if (dl) dl.style.display = 'none';
  if (!_dragData) return;
  const rect = col.getBoundingClientRect();
  const rawY = event.clientY - rect.top;
  const hour   = Math.min(Math.max(Math.floor(rawY / 60) + 7, 7), 22);
  const snapM  = Math.round((rawY % 60) / 15) * 15;
  const minute = snapM >= 60 ? 0 : snapM;
  await _wcalCommitDrop(planDow, hour, minute);
}

function _wcalAlldayDragOver(event) {
  if (!_dragData) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  event.currentTarget.classList.add('drag-over');
}

function _wcalAlldayDragLeave(event) {
  if (!event.currentTarget.contains(event.relatedTarget))
    event.currentTarget.classList.remove('drag-over');
}

async function _wcalDropOnAllDay(event, planDow) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
  if (!_dragData) return;
  await _wcalCommitDrop(planDow, null, null);
}

// Applique le déplacement : retire du source, ajoute à la cible
async function _wcalCommitDrop(targetPlanDow, newHour, newMinute) {
  if (!_dragData) return;
  const { planDow: srcDow, globalIdx } = _dragData;
  _dragData = null;

  // Récupérer la tâche déplacée
  const rawSrc  = await _getPlanTasks(srcDow);
  const tasksSrc = rawSrc.map(_normalizeTask);
  if (globalIdx >= tasksSrc.length) return;
  const moved = tasksSrc[globalIdx];

  // Vérifier si le source a du stockage custom (vs PLANNING_HEBDO)
  const srcKey = 'planning-custom-' + srcDow;
  let srcHasCustom = false;
  try {
    const r = await window.storage.get(srcKey);
    if (r && r.value !== undefined) {
      const arr = JSON.parse(r.value);
      if (Array.isArray(arr)) srcHasCustom = true;
    }
  } catch(e) {}

  if (srcHasCustom) {
    tasksSrc.splice(globalIdx, 1);
    window.storage.set(srcKey, JSON.stringify(tasksSrc));
  } else {
    // Marquer comme retiré du PLANNING_HEBDO statique
    const removedKey = 'planning-removed-' + srcDow;
    let removed = [];
    try {
      const r = await window.storage.get(removedKey);
      if (r && r.value !== undefined) removed = JSON.parse(r.value) || [];
    } catch(e) {}
    if (!removed.includes(moved.text)) removed.push(moved.text);
    window.storage.set(removedKey, JSON.stringify(removed));
  }

  // Ajouter à la cible
  const tgtKey  = 'planning-custom-' + targetPlanDow;
  const rawTgt  = await _getPlanTasks(targetPlanDow);
  const tasksTgt = rawTgt.map(_normalizeTask);
  tasksTgt.push({ text: moved.text, platforms: moved.platforms, hour: newHour, minute: newMinute ?? 0 });
  window.storage.set(tgtKey, JSON.stringify(tasksTgt));

  renderPlanningView();
}

// ===== DRAG & DROP TACTILE (mobile) =====

function _wcalTouchStart(event, planDow, globalIdx, fromAllDay) {
  if (event.target.closest('.wcal-card-del')) return;
  _dragData = { planDow, globalIdx, fromAllDay };
  _touchDragSrc = event.currentTarget;
  const touch = event.touches[0];
  const el = _touchDragSrc;

  // Ghost visuel
  _touchDragEl = el.cloneNode(true);
  _touchDragEl.style.cssText = `position:fixed;pointer-events:none;z-index:9999;
    opacity:.75;width:${el.offsetWidth}px;border-radius:6px;
    left:${touch.clientX - el.offsetWidth / 2}px;top:${touch.clientY - 24}px;`;
  document.body.appendChild(_touchDragEl);
  el.classList.add('dragging');
}

function _wcalTouchMove(event) {
  if (!_dragData || !_touchDragEl) return;
  event.preventDefault(); // bloque le scroll natif
  const touch = event.touches[0];
  const w = parseInt(_touchDragEl.style.width);
  _touchDragEl.style.left = (touch.clientX - w / 2) + 'px';
  _touchDragEl.style.top  = (touch.clientY - 24) + 'px';

  // Trouver l'élément sous le doigt
  _touchDragEl.style.display = 'none';
  const under = document.elementFromPoint(touch.clientX, touch.clientY);
  _touchDragEl.style.display = '';

  // Reset états précédents
  document.querySelectorAll('.wcal-timed-col.drag-over').forEach(c => {
    c.classList.remove('drag-over');
    const dl = c.querySelector('.wcal-drop-line');
    if (dl) dl.style.display = 'none';
  });
  document.querySelectorAll('.wcal-allday-cell.drag-over').forEach(c => c.classList.remove('drag-over'));

  const col  = under?.closest('.wcal-timed-col');
  const cell = under?.closest('.wcal-allday-cell');
  if (col) {
    col.classList.add('drag-over');
    const rect   = col.getBoundingClientRect();
    const rawY   = touch.clientY - rect.top;
    const snapped = Math.round(rawY / 15) * 15;
    const dl = col.querySelector('.wcal-drop-line');
    if (dl) { dl.style.top = snapped + 'px'; dl.style.display = 'block'; }
  }
  if (cell) cell.classList.add('drag-over');
}

async function _wcalTouchEnd(event) {
  if (!_dragData) return;
  const touch = event.changedTouches[0];

  // Nettoyer ghost
  if (_touchDragEl) { _touchDragEl.remove(); _touchDragEl = null; }
  if (_touchDragSrc) { _touchDragSrc.classList.remove('dragging'); _touchDragSrc = null; }

  // Trouver la cible
  const under = document.elementFromPoint(touch.clientX, touch.clientY);
  const col   = under?.closest('.wcal-timed-col');
  const cell  = under?.closest('.wcal-allday-cell');

  document.querySelectorAll('.wcal-timed-col.drag-over').forEach(c => {
    c.classList.remove('drag-over');
    const dl = c.querySelector('.wcal-drop-line');
    if (dl) dl.style.display = 'none';
  });
  document.querySelectorAll('.wcal-allday-cell.drag-over').forEach(c => c.classList.remove('drag-over'));

  if (col) {
    const targetPlanDow = parseInt(col.dataset.planDow);
    const rect   = col.getBoundingClientRect();
    const rawY   = touch.clientY - rect.top;
    const hour   = Math.min(Math.max(Math.floor(rawY / 60) + 7, 7), 19);
    const snapM  = Math.round((rawY % 60) / 15) * 15;
    const minute = snapM >= 60 ? 0 : snapM;
    await _wcalCommitDrop(targetPlanDow, hour, minute);
  } else if (cell) {
    const targetPlanDow = parseInt(cell.dataset.planDow);
    await _wcalCommitDrop(targetPlanDow, null, null);
  } else {
    _dragData = null;
  }
}

// ===== TÂCHES RÉCURRENTES =====

async function _getTrecTasks() {
  try {
    const r = await window.storage.get('taches-recurrentes-custom');
    if (r && r.value !== undefined) {
      const data = JSON.parse(r.value);
      if (data && typeof data === 'object') return data;
    }
  } catch(e) {}
  return {
    quotidien:    (TACHES_RECURRENTES.quotidien    || []).slice(),
    hebdomadaire: (TACHES_RECURRENTES.hebdomadaire || []).slice(),
    ponctuel:     (TACHES_RECURRENTES.ponctuel     || []).slice()
  };
}

async function renderRecurringSection() {
  const container = document.getElementById('trecSection');
  if (!container) return;
  const data = await _getTrecTasks();
  const COLS = [
    { key: 'quotidien',    label: 'Quotidien' },
    { key: 'hebdomadaire', label: 'Hebdomadaire' },
    { key: 'ponctuel',     label: 'Ponctuel' }
  ];
  container.innerHTML = COLS.map(({ key, label }) => {
    const tasks = (data[key] || []).map(_normalizeTask);
    const chips = tasks.map((t, i) => {
      const plats = t.platforms;
      const [bg, fg] = _platColor(plats[0]);
      const escaped = t.text.replace(/"/g, '&quot;');
      return `<span class="wcal-allday-chip trec-chip" style="--chip-bg:${bg};--chip-fg:${fg}" title="${escaped}"
        ondblclick="_trecEditChip(event,'${key}',${i})">
        ${_taskIconsHtml(plats)}
        <span class="wcal-allday-chip-text">${t.text}</span>
        <button class="wcal-card-del" onclick="_trecDelete(event,'${key}',${i})">×</button>
      </span>`;
    }).join('');
    return `<div class="trec-col">
      <div class="trec-col-header">
        <span class="trec-col-label">${label}</span>
        <button class="trec-add-btn" onclick="_trecOpenModal('${key}')" title="Ajouter">+</button>
      </div>
      <div class="trec-chips" data-col="${key}">${chips}</div>
    </div>`;
  }).join('');
}

function _trecOpenModal(col) {
  _trecPendingCol = col;
  const modal = document.getElementById('trecAddModal');
  if (!modal) return;
  document.getElementById('trecModalText').value = '';
  document.getElementById('trecModalPicker')?.querySelectorAll('.plan-icon-btn').forEach(b => b.classList.remove('active'));
  modal.style.display = 'flex';
  setTimeout(() => document.getElementById('trecModalText')?.focus(), 50);
}

function _trecCloseModal() {
  const modal = document.getElementById('trecAddModal');
  if (modal) modal.style.display = 'none';
  _trecPendingCol = null;
}

async function _trecSaveNew() {
  const text = document.getElementById('trecModalText')?.value.trim();
  if (!text || !_trecPendingCol) return;
  const actives = [...(document.getElementById('trecModalPicker')?.querySelectorAll('.plan-icon-btn.active') || [])];
  const platforms = actives.length > 0
    ? actives.map(b => b.dataset.platform)
    : [_detectPlatform(text).key];
  const data = await _getTrecTasks();
  (data[_trecPendingCol] = data[_trecPendingCol] || []).push({ text, platforms, hour: null, minute: null });
  window.storage.set('taches-recurrentes-custom', JSON.stringify(data));
  _trecCloseModal();
  renderRecurringSection();
}

async function _trecDelete(event, col, idx) {
  event.stopPropagation();
  const data = await _getTrecTasks();
  if (!data[col]) return;
  data[col].splice(idx, 1);
  window.storage.set('taches-recurrentes-custom', JSON.stringify(data));
  renderRecurringSection();
}

function _trecEditChip(event, col, idx) {
  event.stopPropagation();
  const chip = event.currentTarget;
  if (chip.classList.contains('editing')) return;
  chip.classList.add('editing');
  const textEl = chip.querySelector('.wcal-allday-chip-text');
  const originalText = textEl.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'wcal-card-input';
  input.value = originalText;
  textEl.replaceWith(input);
  input.focus(); input.select();
  let settled = false;
  const done = (text) => {
    if (settled) return;
    settled = true;
    const span = document.createElement('span');
    span.className = 'wcal-allday-chip-text';
    span.textContent = text;
    if (input.parentNode) input.replaceWith(span);
    chip.classList.remove('editing');
  };
  const save = async () => {
    const newText = input.value.trim() || originalText;
    done(newText);
    if (newText === originalText) return;
    const data = await _getTrecTasks();
    if (data[col] && idx < data[col].length) {
      const t = _normalizeTask(data[col][idx]);
      data[col][idx] = { text: newText, platforms: t.platforms, hour: null, minute: null };
      window.storage.set('taches-recurrentes-custom', JSON.stringify(data));
    }
  };
  input.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter')  { e.preventDefault(); save(); }
    if (e.key === 'Escape') { e.preventDefault(); done(originalText); }
  });
  input.addEventListener('blur', () => setTimeout(save, 120));
}

// ===== EXPORT SEMAINE =====
async function exportWeekCSV() {
  const weekStart = _wcalWeekStart();
  const weekDates = Array.from({length: 7}, (_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d;
  });
  const DOW_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const rows = [['Jour','Date','Tâche','Plateformes','Heure']];
  for (let i = 0; i < 7; i++) {
    const d = weekDates[i];
    const planDow = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const raw = await _getPlanTasks(planDow);
    const tasks = raw.map(_normalizeTask);
    const dow = DOW_FR[i === 6 ? 6 : i];
    const dateStr = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
    if (!tasks.length) { rows.push([dow, dateStr, '', '', '']); continue; }
    tasks.forEach(t => {
      const hour = t.hour !== null ? `${String(t.hour).padStart(2,'0')}h${String(t.minute||0).padStart(2,'0')}` : '';
      const plats = (t.platforms || []).join(', ');
      rows.push([dow, dateStr, t.text, plats, hour]);
    });
  }
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const d0 = weekDates[0], d6 = weekDates[6];
  a.download = `planning_${d0.getDate()}-${d6.getDate()}_${d6.toLocaleDateString('fr-FR',{month:'short',year:'numeric'}).replace(' ','_')}.csv`;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
}

function exportWeekPDF() {
  window.print();
}
