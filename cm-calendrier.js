// ===== CALENDRIER =====
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let calView = 'mois';
let calWeekDate = new Date();
let pendingDay = null;
let pendingYear = null;
let pendingMonth = null;

const _MONTH_NAMES_SHORT = ['jan.','fév.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
const _DAY_NAMES = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

function _getWeekMonday(date) {
  const d = new Date(date || calWeekDate);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function initCalendarView() {
  try {
    const r = await window.storage.get('cal-view');
    if (r && r.value === 'semaine') calView = 'semaine';
  } catch(e) {}
}

async function setCalView(view) {
  calView = view;
  await window.storage.set('cal-view', view);
  _updateCalViewButtons();
  renderCalendar();
}

function _updateCalViewButtons() {
  const btnMois = document.getElementById('calViewMois');
  const btnSem  = document.getElementById('calViewSemaine');
  if (btnMois) btnMois.classList.toggle('active', calView === 'mois');
  if (btnSem)  btnSem.classList.toggle('active', calView === 'semaine');
}

function calNavPrev() {
  if (calView === 'semaine') changeWeek(-1);
  else changeMonth(-1);
}
function calNavNext() {
  if (calView === 'semaine') changeWeek(1);
  else changeMonth(1);
}

function changeWeek(dir) {
  calWeekDate.setDate(calWeekDate.getDate() + dir * 7);
  renderCalendar();
}

const STATUS_ICONS = {
  brouillon: () => icon('fileText', 13),
  'a-publier': () => icon('calendar', 13),
  publie: () => icon('checkCircle', 13)
};

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

function getCalKey() {
  return 'cal-' + calYear + '-' + calMonth;
}

async function getCalPosts() {
  try {
    const r = await window.storage.get(getCalKey());
    return r ? JSON.parse(r.value) : {};
  } catch(e) { return {}; }
}

async function saveCalPosts(posts) {
  try { await window.storage.set(getCalKey(), JSON.stringify(posts)); } catch(e) {}
}

function changeMonth(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}

async function renderCalendar() {
  _updateCalViewButtons();
  const header = document.getElementById('calGridHeader');
  if (calView === 'semaine') {
    if (header) header.style.display = 'none';
    await renderWeekView();
  } else {
    if (header) header.style.display = '';
    await renderMonthView();
  }
}

async function renderMonthView() {
  const posts = await getCalPosts();
  const today = new Date();
  const firstDay = new Date(calYear, calMonth, 1);
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  document.getElementById('calTitle').textContent =
    new Date(calYear, calMonth).toLocaleDateString('fr-FR', {month:'long', year:'numeric'});

  let html = '';
  for (let i = 0; i < startDow; i++) html += '<div class="cal-day empty"></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = today.getFullYear()===calYear && today.getMonth()===calMonth && today.getDate()===d;
    const dayPosts = posts[d] || [];
    const hasPosts = dayPosts.length > 0;
    const primaryBrand = dayPosts.find(p => p.brand)?.brand || '';

    const fetes = getFetesForDay(calYear, calMonth, d);
    const fetesHtml = fetes.map(f => `
      <div class="cal-fete cal-fete-${f.type}" title="${f.label}">
        <span class="cal-fete-emoji">${f.emoji}</span>
        <span class="cal-fete-label">${f.label}</span>
      </div>
    `).join('');

    const postsHtml = dayPosts.map((p, i) => {
      const statusIcon = STATUS_ICONS[p.status] ? STATUS_ICONS[p.status]() : '•';
      const statusText = { brouillon: 'Brouillon', 'a-publier': 'À publier', publie: 'Publié' }[p.status] || p.status;
      const ratingPastille = p.rating ? `<span class="cal-post-rating" title="Ressenti : ${p.rating}">${p.rating}</span>` : '';
      return `
        <div class="cal-post ${p.status}" title="${p.platform} · ${statusText}${p.rating ? ' · ' + p.rating : ''}">
          <span class="cal-post-icon">${_platIcon(p.platform) || '•'}</span>
          <span class="cal-post-label">${p.platform}</span>
          <span class="cal-post-badge">${statusIcon} ${statusText}</span>
          ${ratingPastille}
          <button class="cal-post-delete" onclick="event.stopPropagation();deletePost(${d},${i})">${icon('x',12)}</button>
        </div>
      `;
    }).join('');

    const hasFete = fetes.length > 0;
    const dayClasses = ['cal-day', isToday?'today':'', hasFete?'has-fete':'', hasPosts?'has-posts':''].filter(Boolean).join(' ');

    html += `<div class="${dayClasses}"${primaryBrand ? ` data-brand="${primaryBrand}"` : ''} onclick="openAddForm(${d})">
      <div class="cal-day-num">${d}</div>
      ${fetesHtml}
      <div class="cal-posts">${postsHtml}</div>
    </div>`;
  }

  document.getElementById('calGrid').innerHTML = html;
}

async function renderWeekView() {
  const monday = _getWeekMonday();
  const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6);

  // Title
  const from = monday.getDate() + ' ' + _MONTH_NAMES_SHORT[monday.getMonth()];
  const to   = sunday.getDate()  + ' ' + _MONTH_NAMES_SHORT[sunday.getMonth()];
  const y1   = monday.getFullYear(), y2 = sunday.getFullYear();
  document.getElementById('calTitle').textContent =
    'Semaine du ' + from + (y1 !== y2 ? ' ' + y1 : '') + ' au ' + to + ' ' + y2;

  // Collect the 7 days
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday); d.setDate(d.getDate() + i);
    days.push(d);
  }

  // Fetch posts for each unique year-month in the week
  const postsCache = {};
  const monthKeys = [...new Set(days.map(d => `${d.getFullYear()}-${d.getMonth()}`))];
  for (const key of monthKeys) {
    const [y, m] = key.split('-').map(Number);
    try {
      const r = await window.storage.get(`cal-${y}-${m}`);
      postsCache[key] = r ? JSON.parse(r.value) : {};
    } catch(e) { postsCache[key] = {}; }
  }

  const today = new Date();
  let html = '<div class="cal-week-grid">';

  for (const d of days) {
    const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
    const key = `${y}-${m}`;
    const dayPosts = (postsCache[key] || {})[day] || [];
    const fetes    = getFetesForDay(y, m, day);
    const isToday  = today.getFullYear()===y && today.getMonth()===m && today.getDate()===day;

    const fetesHtml = fetes.map(f => `
      <div class="cal-fete cal-fete-${f.type}">
        <span class="cal-fete-emoji">${f.emoji}</span>
        <span class="cal-fete-label">${f.label}</span>
      </div>
    `).join('');

    const postsHtml = dayPosts.map((p, i) => {
      const statusIcon = STATUS_ICONS[p.status] ? STATUS_ICONS[p.status]() : '•';
      const statusText = { brouillon: 'Brouillon', 'a-publier': 'À publier', publie: 'Publié' }[p.status] || p.status;
      const ratingPastille = p.rating ? `<span class="cal-post-rating">${p.rating}</span>` : '';
      return `
        <div class="cal-post ${p.status}">
          <span class="cal-post-icon">${_platIcon(p.platform) || '•'}</span>
          <span class="cal-post-label">${p.platform}</span>
          <span class="cal-post-badge">${statusIcon} ${statusText}</span>
          ${ratingPastille}
          <button class="cal-post-delete" onclick="event.stopPropagation();deletePostForDate(${y},${m},${day},${i})">${icon('x',12)}</button>
        </div>
      `;
    }).join('');

    html += `
      <div class="cal-week-col${isToday ? ' today' : ''}" onclick="openAddFormForDate(${y},${m},${day})">
        <div class="cal-week-col-header">
          <span class="cal-week-day-name">${_DAY_NAMES[d.getDay()]}</span>
          <span class="cal-week-day-num${isToday ? ' today' : ''}">${day}</span>
        </div>
        ${fetesHtml}
        <div class="cal-week-posts">${postsHtml}</div>
      </div>
    `;
  }

  html += '</div>';
  document.getElementById('calGrid').innerHTML = html;
}

function openAddFormForDate(year, month, day) {
  pendingYear = year;
  pendingMonth = month;
  pendingDay = day;
  document.getElementById('calAddForm').style.display = 'block';
  document.getElementById('calBrand').value = selectedBrand || '';
  document.getElementById('calPlatform').value = '';
  document.getElementById('calStatus').value = 'brouillon';
}

function openAddForm(day) {
  openAddFormForDate(calYear, calMonth, day);
}

function cancelAddPost() {
  pendingDay = null;
  pendingYear = null;
  pendingMonth = null;
  document.getElementById('calAddForm').style.display = 'none';
}

async function confirmAddPost() {
  const brand = document.getElementById('calBrand').value;
  const platform = document.getElementById('calPlatform').value;
  const status = document.getElementById('calStatus').value;
  if (!platform) { alert('Choisis une plateforme !'); return; }

  const y = pendingYear ?? calYear;
  const m = pendingMonth ?? calMonth;
  const calKey = `cal-${y}-${m}`;
  let posts = {};
  try {
    const r = await window.storage.get(calKey);
    posts = r ? JSON.parse(r.value) : {};
  } catch(e) {}
  if (!posts[pendingDay]) posts[pendingDay] = [];
  posts[pendingDay].push({ brand, platform, status });
  await window.storage.set(calKey, JSON.stringify(posts));

  cancelAddPost();
  renderCalendar();
}

async function deletePostForDate(year, month, day, index) {
  const calKey = `cal-${year}-${month}`;
  try {
    const r = await window.storage.get(calKey);
    if (!r) return;
    const posts = JSON.parse(r.value);
    if (posts[day]) {
      posts[day].splice(index, 1);
      if (!posts[day].length) delete posts[day];
      await window.storage.set(calKey, JSON.stringify(posts));
      renderCalendar();
    }
  } catch(e) {}
}

async function deletePost(day, index) {
  await deletePostForDate(calYear, calMonth, day, index);
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

    // Inscrire le rating sur l'objet post (pour la pastille calendrier)
    post.rating = rating;
    await window.storage.set(calKey, JSON.stringify(posts));

    // Sauvegarder dans la clé perf dédiée
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

    // Re-render calendrier si on est sur le bon mois
    if (year === calYear && month === calMonth) renderCalendar();

    // Rafraîchir les rappels et le récap perf
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
      // Re-rendu du calendrier si on est sur le bon mois
      if (year === calYear && month === calMonth) renderCalendar();
      // Rafraîchir les rappels
      checkReminders();
    }
  } catch(e) {}
}
