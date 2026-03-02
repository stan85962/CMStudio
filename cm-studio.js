// ===== BRAND =====
function selectBrand(brand, el) {
  const leavingStan = selectedBrand === 'stan' && brand !== 'stan';
  selectedBrand = brand;
  document.querySelectorAll('.brand-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.brand-btn.'+brand).forEach(b => b.classList.add('active'));
  document.body.classList.remove('theme-intelixa','theme-doudelio','theme-stan');
  document.body.classList.add('theme-'+brand);

  // --- MODE STAN ---
  if (brand === 'stan') {
    _stanMaskNav(true);
    if (typeof _injectStanDashWelcome === 'function') _injectStanDashWelcome();
    const notesTab = [...document.querySelectorAll('.nav-tab')]
      .find(t => (t.getAttribute('onclick')||'').includes("'notes'"));
    if (notesTab) switchPage('notes', notesTab);
    setTimeout(() => { if(typeof setNotesView==='function') setNotesView('stan'); }, 80);
    const dashTitle = document.getElementById('dashTitle');
    const dashSub   = document.getElementById('dashSubtitle');
    if(dashTitle) { dashTitle.textContent='Stan chez Intelixa'; dashTitle.style.fontFamily="'Nunito',sans-serif"; }
    if(dashSub)   { dashSub.textContent='Ton espace perso'; dashSub.style.fontFamily="'Nunito',sans-serif"; dashSub.style.fontSize='14px'; dashSub.style.letterSpacing='normal'; }
    return;
  }

  // --- RETOUR DEPUIS STAN ---
  if (leavingStan) {
    _stanMaskNav(false);
    if(typeof setNotesView==='function') setNotesView('notes');
    const dashTab = [...document.querySelectorAll('.nav-tab')]
      .find(t => (t.getAttribute('onclick')||'').includes("'dashboard'"));
    if (dashTab) switchPage('dashboard', dashTab);
  }

  // --- MARQUE NORMALE ---
  const dashTitle = document.getElementById('dashTitle');
  const dashSub = document.getElementById('dashSubtitle');
  if(dashTitle) {
    dashTitle.textContent = brand==='intelixa' ? 'INTELIXA STUDIO' : 'Bienvenue Doudelio 🌱';
    dashTitle.style.fontFamily = brand==='intelixa' ? "'Orbitron',monospace" : "'Nunito',sans-serif";
  }
  if(dashSub) {
    dashSub.textContent = brand==='intelixa' ? '[ IA · AUTOMATISATION · PERFORMANCE ]' : 'Petite enfance · Terrain · Bienveillance';
    dashSub.style.fontFamily = brand==='intelixa' ? "'Orbitron',monospace" : "'Nunito',sans-serif";
    dashSub.style.fontSize = brand==='intelixa' ? '10px' : '14px';
    dashSub.style.letterSpacing = brand==='intelixa' ? '2px' : 'normal';
  }

  renderTemplates();
  updateStats();
  loadRecentDashboard();
  if (typeof renderStreakCard === 'function') renderStreakCard();
  const notesPage = document.getElementById('page-notes');
  if(notesPage && notesPage.classList.contains('active')) loadNotes();
  checkReminders();
  const histPage = document.getElementById('page-historique');
  if(histPage && histPage.classList.contains('active')) loadHistorique();
  if (typeof renderAutopilotBlock === 'function') {
    if (typeof _apEnabled !== 'undefined' && _apEnabled) runAutopilot();
    else renderAutopilotBlock();
  }
}

function _stanMaskNav(mask) {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    const oc = tab.getAttribute('onclick') || '';
    if (oc.includes("'studio'") || oc.includes("'historique'") || oc.includes("'calendrier'")) {
      tab.style.display = mask ? 'none' : '';
    }
  });
  const stanBtn  = document.getElementById('notesViewStan');
  const notesBtn = document.getElementById('notesViewNotes');
  const accBtn   = document.getElementById('notesViewAccroches');
  if (stanBtn)  stanBtn.style.display  = mask ? '' : 'none';
  if (notesBtn) notesBtn.style.display = mask ? 'none' : '';
  if (accBtn)   accBtn.style.display   = mask ? 'none' : '';
}

// ===== PLATFORM =====
function selectPlatform(p, el) {
  selectedPlatform = p;
  document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderTemplates();
}

// ===== AB MODE =====
function setABMode(mode, el) {
  abMode = mode;
  document.querySelectorAll('.ab-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

// ===== TEMPLATES =====
function renderTemplates() {
  const row = document.getElementById('templatesRow');
  if(!row || !selectedBrand) return;
  const byPlatform = TEMPLATES[selectedBrand] || {};
  const list = selectedPlatform && byPlatform[selectedPlatform]
    ? byPlatform[selectedPlatform]
    : byPlatform[Object.keys(byPlatform)[0]] || [];
  row.innerHTML = list.map(t =>
    `<button class="template-chip" onclick="document.getElementById('theme').value='${t.replace(/'/g,"\\'")}'">${t}</button>`
  ).join('');
}

// ===== COPY =====
function copyResult() {
  navigator.clipboard.writeText(document.getElementById('resultContent').innerText).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent='✅ Copié !'; btn.classList.add('copied');
    setTimeout(()=>{btn.textContent='📋 Copier';btn.classList.remove('copied');},2000);
  });
}
function copyAB(v) {
  navigator.clipboard.writeText(document.getElementById('abText'+v).innerText);
}

// ===== SAVE ACCROCHE =====
async function saveAccroche() {
  if (!selectedBrand || !selectedPlatform) {
    alert("Choisis une marque et une plateforme pour sauvegarder l'accroche !");
    return;
  }
  const content = document.getElementById('resultContent');
  if (!content) return;
  const firstLine = (content.innerText || '').split('\n').map(l => l.trim()).find(l => l.length > 0);
  if (!firstLine) { alert('Pas de contenu à sauvegarder !'); return; }

  const key = 'accroches-' + selectedBrand;
  let accroches = [];
  try { const r = await window.storage.get(key); if (r) accroches = JSON.parse(r.value); } catch(e) {}

  accroches.unshift({
    id: Date.now(), text: firstLine,
    platform: selectedPlatform, brand: selectedBrand,
    date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  });
  if (accroches.length > 30) accroches = accroches.slice(0, 30);
  await window.storage.set(key, JSON.stringify(accroches));

  const btn = document.getElementById('saveAccrocheBtn');
  if (btn) {
    btn.textContent = '✅ Sauvegardée !'; btn.classList.add('saved');
    setTimeout(() => { btn.textContent = '💾 Accroche'; btn.classList.remove('saved'); }, 2000);
  }
}

// ===== QUICK ADD CALENDAR =====
function quickAddToCalendar() {
  if(!selectedBrand||!selectedPlatform) return;
  const calTab = document.querySelector('.nav-tab:last-child');
  switchPage('calendrier', calTab);
  setTimeout(()=>openAddForm(new Date().getDate()), 350);
}

// ===== REGENERATE =====
async function regenerate() {
  if(!selectedBrand||!selectedPlatform) return;
  const theme = document.getElementById('theme').value.trim();
  if(!theme) return;
  await generate();
}

// ===== DUPLICATE DETECTOR =====
let dupeTimeout = null;

function initDupeDetector() {
  const textarea = document.getElementById('theme');
  if(!textarea) return;
  textarea.addEventListener('input', () => {
    clearTimeout(dupeTimeout);
    dupeTimeout = setTimeout(checkDuplicates, 600);
  });
}

// Mots courts mais importants à ne pas ignorer
const IMPORTANT_SHORT_WORDS = new Set(['ia','rh','cap','tpe','pme','aeo','seo','cpf','ux','cv','rse']);

// Stemming léger français : supprime les suffixes courants
function stemFR(word) {
  return word
    .replace(/ations?$/, '')
    .replace(/ements?$/, '')
    .replace(/eurs?$/, '')
    .replace(/ants?$/, '')
    .replace(/ités?$/, '')
    .replace(/iques?$/, '')
    .replace(/istes?$/, '');
}

function similarity(a, b) {
  a = a.toLowerCase().trim();
  b = b.toLowerCase().trim();
  if(!a || !b) return 0;
  const tokenize = str => new Set(
    str.split(/\s+/)
      .filter(w => w.length > 3 || IMPORTANT_SHORT_WORDS.has(w))
      .map(stemFR)
  );
  const wordsA = tokenize(a);
  const wordsB = tokenize(b);
  if(!wordsA.size || !wordsB.size) return 0;
  let common = 0;
  wordsA.forEach(w => { if(wordsB.has(w)) common++; });
  return common / Math.max(wordsA.size, wordsB.size);
}

async function checkDuplicates() {
  const input = document.getElementById('theme').value.trim();
  const box = document.getElementById('dupeAlert');
  if(!box) return;
  if(input.length < 5 || !selectedBrand) { box.style.display='none'; return; }

  const key = 'history-' + selectedBrand;
  let hist = [];
  try { const r = await window.storage.get(key); if(r) hist = JSON.parse(r.value); } catch(e){}
  if(!hist.length) { box.style.display='none'; return; }

  // Find similar past themes
  const matches = hist
    .map(h => ({ ...h, score: similarity(input, h.theme) }))
    .filter(h => h.score >= 0.35)
    .sort((a,b) => b.score - a.score)
    .slice(0, 3);

  if(!matches.length) { box.style.display='none'; return; }

  const PLATFORM_EMO_LOCAL = {
    tiktok:'🎵',linkedin:'💼',instagram:'📸',gmb:'📍',
    facebook:'👤',pinterest:'📌',spotify:'🎧',brevo:'📧'
  };

  box.style.display = 'block';
  box.innerHTML = `
    <div class="dupe-alert-title">⚠️ Sujet déjà traité</div>
    <div class="dupe-list">
      ${matches.map(m => `
        <div class="dupe-item" onclick="document.getElementById('theme').value='${m.theme.replace(/'/g,"\'")}';checkDuplicates()" title="Cliquer pour réutiliser ce thème">
          <div class="dupe-item-icon">${PLATFORM_EMO_LOCAL[m.platform]||'•'}</div>
          <div class="dupe-item-info">
            <div class="dupe-item-theme">${m.theme}</div>
            <div class="dupe-item-meta">${m.platform} · ${m.date}</div>
          </div>
          <span class="dupe-item-score ${m.score >= 0.65 ? 'dupe-score-high' : 'dupe-score-mid'}">
            ${m.score >= 0.65 ? '🔴 Très similaire' : '🟡 Similaire'}
          </span>
        </div>
      `).join('')}
    </div>
    <button class="dupe-ignore-btn" onclick="document.getElementById('dupeAlert').style.display='none'">Ignorer et continuer quand même →</button>
  `;
}

// ===== SEO/AEO ANALYZER =====
const SEO_KEYWORDS = {
  intelixa: ['IA','automatisation','TPE','formation','CPF','Excel','productivité','digitalisation','performance','PME','entrepreneur','comptabilité','RH','dirigeant'],
  doudelio: ['crèche','petite enfance','auxiliaire','puéricultrice','éducatrice','accueil','tout-petits','formation','pédagogie','CAP','terrain','bienveillance']
};

const AEO_INDICATORS = ['comment','pourquoi','quand','quel','quelle','combien','qui','est-ce que','faut-il','doit-on','peut-on','vaut-il mieux'];

function analyzeSEOAEO(text, brand) {
  if(!text || text.length < 20) return null;
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  const keywords = SEO_KEYWORDS[brand] || [];

  // SEO score — word-boundary matching, seuil 50%, bonus densité
  const foundKw = keywords.filter(k => {
    const escaped = k.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|\\s|[.,!?;:«»"'])${escaped}(\\s|[.,!?;:«»"']|$)`, 'i').test(lower);
  });
  const base = Math.min(100, Math.round((foundKw.length / Math.max(keywords.length * 0.5, 1)) * 100));
  const density = words.length > 0 ? (foundKw.length / words.length) : 0;
  const kwScore = Math.min(100, base + (density > 0.03 ? 10 : 0));

  // AEO score — scoring gradué : questions + indicateurs + position
  const hasQuestion = lower.includes('?');
  const foundIndicators = AEO_INDICATORS.filter(i => lower.includes(i));
  const questionAtBoundary = /^[^.!?]*\?/.test(text) || /\?\s*$/.test(text.trim());
  let aeoScore = 0;
  if(hasQuestion) aeoScore += 40;
  aeoScore += Math.min(40, foundIndicators.length * 15);
  if(questionAtBoundary) aeoScore += 20;
  aeoScore = Math.min(100, aeoScore);

  // Lisibilité — longueur phrases + pénalité mots complexes + bonus structure
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
  const avgLen = sentences.length ? words.length / sentences.length : 999;
  let readScore = avgLen <= 12 ? 100 : avgLen <= 20 ? 70 : avgLen <= 30 ? 40 : 20;
  const complexWords = words.filter(w => w.replace(/[^a-zA-ZÀ-ÿ]/g,'').length > 10).length;
  const complexRatio = words.length > 0 ? complexWords / words.length : 0;
  if(complexRatio > 0.15) readScore = Math.max(10, readScore - 20);
  else if(complexRatio > 0.08) readScore = Math.max(10, readScore - 10);
  if(/\n|•|^\s*[-*]\s/m.test(text)) readScore = Math.min(100, readScore + 10);

  // Longueur — plancher à 10 si >3x le max
  const len = text.length;
  const idealLengths = {
    linkedin: [1500, 3000], instagram: [800, 2200], gmb: [250, 1500],
    facebook: [400, 1200], tiktok: [100, 500], pinterest: [200, 500],
    spotify: [200, 800], brevo: [500, 2000], youtube: [500, 3000]
  };
  const [min, max] = idealLengths[selectedPlatform] || [200, 1500];
  let lenScore;
  if(len < min) {
    lenScore = Math.round((len / min) * 80);
  } else if(len > max) {
    const overshoot = (len - max) / max;
    lenScore = Math.max(overshoot > 2 ? 10 : 20, Math.round(100 - overshoot * 60));
  } else {
    lenScore = 100;
  }

  return {
    seo: kwScore, aeo: aeoScore, readability: readScore, length: lenScore,
    foundKeywords: foundKw.slice(0, 5),
    aeoIndicators: foundIndicators.slice(0, 3),
    charCount: len, ideal: `${min}–${max}`
  };
}

function renderSEOPanel(text, brand) {
  const box = document.getElementById('seoPanel');
  if(!box) return;
  const data = analyzeSEOAEO(text, brand);
  if(!data) { box.style.display='none'; return; }
  box.style.display='block';

  const scoreColor = s => s >= 70 ? '#4caf50' : s >= 40 ? '#ff9800' : '#f44336';
  const scoreLabel = s => s >= 70 ? '🟢' : s >= 40 ? '🟡' : '🔴';
  const bar = (s, color) => `<div style="height:6px;border-radius:3px;background:var(--border);overflow:hidden;margin-top:4px;">
    <div style="height:100%;width:${s}%;background:${color};border-radius:3px;transition:width .6s ease;"></div></div>`;

  box.innerHTML = `
    <div class="seo-panel-inner">
      <div class="seo-title">📊 Analyse SEO / AEO</div>
      <div class="seo-grid">
        <div class="seo-item">
          <div class="seo-item-label">${scoreLabel(data.seo)} SEO — Mots-clés</div>
          ${bar(data.seo, scoreColor(data.seo))}
          <div class="seo-item-sub">${data.foundKeywords.length ? data.foundKeywords.join(', ') : 'Aucun détecté'}</div>
        </div>
        <div class="seo-item">
          <div class="seo-item-label">${scoreLabel(data.aeo)} AEO — Question/Intention</div>
          ${bar(data.aeo, scoreColor(data.aeo))}
          <div class="seo-item-sub">${data.aeoIndicators && data.aeoIndicators.length ? data.aeoIndicators.join(', ') : (data.aeo >= 50 ? 'Intent AEO présent' : 'Ajouter une question')}</div>
        </div>
        <div class="seo-item">
          <div class="seo-item-label">${scoreLabel(data.readability)} Lisibilité</div>
          ${bar(data.readability, scoreColor(data.readability))}
          <div class="seo-item-sub">Phrases courtes = meilleur score</div>
        </div>
        <div class="seo-item">
          <div class="seo-item-label">${scoreLabel(data.length)} Longueur — ${data.charCount} car.</div>
          ${bar(data.length, scoreColor(data.length))}
          <div class="seo-item-sub">Idéal : ${data.ideal} caractères</div>
        </div>
      </div>
    </div>`;
}

// ===== POST-GENERATION VALIDATION =====
function checkPostGenLength(text, platform) {
  if(!text || !platform) return;
  const idealLengths = {
    linkedin: [1500, 3000], instagram: [800, 2200], gmb: [250, 1500],
    facebook: [400, 1200], tiktok: [100, 500], pinterest: [200, 500],
    spotify: [200, 800], brevo: [500, 2000], youtube: [500, 3000]
  };
  const range = idealLengths[platform];
  if(!range) return;
  const [min, max] = range;
  const len = text.length;
  const el = document.getElementById('errorMsg');
  if(!el) return;
  if(len < min * 0.5) {
    el.innerHTML += `<div class="warn-msg">⚠️ Contenu trop court pour ${platform} — ${len} car. (min idéal : ${min})</div>`;
  } else if(len > max * 1.5) {
    el.innerHTML += `<div class="warn-msg">⚠️ Contenu trop long pour ${platform} — ${len} car. (max idéal : ${max})</div>`;
  }
}

// ===== POST PREVIEW =====
const PREVIEW_TEMPLATES = {
  linkedin: (text, brand) => `
    <div class="preview-linkedin">
      <div class="prev-header">
        <div class="prev-avatar" style="background:${brand==='intelixa'?'#c0392b':'#384786'};">${brand==='intelixa'?'I':'D'}</div>
        <div>
          <div class="prev-name">${brand==='intelixa'?'Intelixa':'Doudelio'}</div>
          <div class="prev-meta">Page entreprise · Maintenant · 🌐</div>
        </div>
      </div>
      <div class="prev-body">${formatPreviewText(text)}</div>
      <div class="prev-footer-linkedin">
        <span>👍 J'aime</span><span>💬 Commenter</span><span>🔄 Republier</span><span>📤 Envoyer</span>
      </div>
    </div>`,

  instagram: (text, brand) => `
    <div class="preview-instagram">
      <div class="prev-header">
        <div class="prev-avatar ig-avatar" style="background:${brand==='intelixa'?'#c0392b':'#384786'};">${brand==='intelixa'?'I':'D'}</div>
        <div class="prev-name">${brand==='intelixa'?'intelixa_officiel':'doudelio_creche'}</div>
        <div class="prev-dots" style="margin-left:auto;">•••</div>
      </div>
      <div class="prev-ig-image" style="background:${brand==='intelixa'?'linear-gradient(135deg,#1a0a0a,#3a1515)':'linear-gradient(135deg,#e8f5e4,#c8e6c9)'};">
        <span style="font-size:32px;">${brand==='intelixa'?'⚡':'🌱'}</span>
      </div>
      <div class="prev-ig-actions">❤️ &nbsp;💬 &nbsp;📤 &nbsp;<span style="margin-left:auto;">🔖</span></div>
      <div class="prev-body" style="padding:0 12px 12px;">${formatPreviewText(text, 200)}</div>
    </div>`,

  gmb: (text, brand) => `
    <div class="preview-gmb">
      <div class="prev-header">
        <div class="prev-avatar" style="background:#4285F4;">G</div>
        <div>
          <div class="prev-name">${brand==='intelixa'?'Intelixa':'Doudelio'}</div>
          <div class="prev-meta">Google · Vient de publier</div>
        </div>
      </div>
      <div class="prev-body">${formatPreviewText(text, 300)}</div>
      <div class="prev-gmb-btn">En savoir plus</div>
    </div>`,

  facebook: (text, brand) => `
    <div class="preview-facebook">
      <div class="prev-header">
        <div class="prev-avatar" style="background:${brand==='intelixa'?'#c0392b':'#384786'};">${brand==='intelixa'?'I':'D'}</div>
        <div>
          <div class="prev-name">${brand==='intelixa'?'Intelixa':'Doudelio'}</div>
          <div class="prev-meta">Maintenant · 🌐</div>
        </div>
      </div>
      <div class="prev-body">${formatPreviewText(text, 300)}</div>
      <div class="prev-footer-linkedin" style="border-top:1px solid #eee;margin-top:10px;padding-top:10px;">
        <span>👍 J'aime</span><span>💬 Commenter</span><span>↗ Partager</span>
      </div>
    </div>`,

  pinterest: (text, brand) => `
    <div class="preview-pinterest">
      <div class="prev-pin-img" style="background:${brand==='intelixa'?'linear-gradient(135deg,#1a0a0a,#3a1515)':'linear-gradient(135deg,#fce4ec,#f8bbd0)'};">
        <span style="font-size:40px;">${brand==='intelixa'?'⚡':'🌸'}</span>
      </div>
      <div class="prev-pin-body">
        <div class="prev-name" style="font-size:14px;margin-bottom:6px;">${text.substring(0,60)}${text.length>60?'...':''}</div>
        <div class="prev-meta">${brand==='intelixa'?'intelixa.fr':'doudelio.com'}</div>
      </div>
    </div>`,

  tiktok: (text, brand) => `
    <div class="preview-tiktok">
      <div class="prev-tiktok-screen" style="background:${brand==='intelixa'?'linear-gradient(180deg,#0a0010,#1a0a20)':'linear-gradient(180deg,#e8f5ff,#d0e8f5)'};">
        <span style="font-size:40px;">🎬</span>
        <div style="font-size:11px;color:${brand==='intelixa'?'#aaa':'#555'};margin-top:8px;text-align:center;">Prompt Veo</div>
      </div>
      <div class="prev-tiktok-caption">
        <div class="prev-name">@${brand==='intelixa'?'intelixa':'doudelio'}</div>
        <div class="prev-body" style="padding:0;font-size:12px;">${formatPreviewText(text, 150)}</div>
      </div>
    </div>`,

  spotify: (text, brand) => `
    <div class="preview-spotify">
      <div class="prev-spotify-img" style="background:${brand==='intelixa'?'linear-gradient(135deg,#1a0a0a,#2a1010)':'linear-gradient(135deg,#e8f5e4,#c8e6c9)'};">
        <span style="font-size:36px;">🎧</span>
      </div>
      <div class="prev-name">Épisode · ${brand==='intelixa'?'Intelixa Podcast':'Doudelio Podcast'}</div>
      <div class="prev-body">${formatPreviewText(text, 200)}</div>
    </div>`,

  brevo: (text, brand) => `
    <div class="preview-brevo">
      <div class="prev-brevo-header" style="background:${brand==='intelixa'?'#1a0a0a':'#384786'};">
        <span style="font-size:22px;">${brand==='intelixa'?'⚡':'🌱'}</span>
        <span style="color:white;font-weight:800;font-size:14px;">${brand==='intelixa'?'INTELIXA':'DOUDELIO'}</span>
      </div>
      <div class="prev-body" style="padding:16px;">${formatPreviewText(text, 300)}</div>
      <div class="prev-gmb-btn" style="margin:0 16px 16px;">Lire l'email complet</div>
    </div>`,

  youtube: (text, brand) => `
    <div class="preview-youtube">
      <div class="prev-yt-thumb" style="background:${brand==='intelixa'?'linear-gradient(135deg,#1a0808,#3a1010)':'linear-gradient(135deg,#e8f5e4,#c8e6c9)'};">
        <span style="font-size:36px;">${brand==='intelixa'?'⚡':'🌱'}</span>
        <div class="prev-yt-play">▶</div>
      </div>
      <div class="prev-yt-info">
        <div class="prev-yt-title">${text.substring(0,80)}${text.length>80?'...':''}</div>
        <div class="prev-meta">${brand==='intelixa'?'Intelixa':'Doudelio'} · 0 vue · À l'instant</div>
        <div class="prev-body" style="padding:0;margin-top:8px;">${formatPreviewText(text, 250)}</div>
      </div>
    </div>`
};

function formatPreviewText(text, maxLen=400) {
  const truncated = maxLen && text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
  return truncated.replace(/\n/g,'<br>');
}

function openPreview() {
  const modal = document.getElementById('previewModal');
  if(!modal) return;
  const text = abMode
    ? (document.getElementById('abTextA').textContent || '')
    : (document.getElementById('resultContent').textContent || '');
  if(!text || text.length < 5) return;

  // Set tabs
  const tabs = document.getElementById('previewTabs');
  const platforms = ['linkedin','instagram','gmb','facebook','tiktok','pinterest','spotify','brevo','youtube'];
  tabs.innerHTML = platforms.map((p,i) =>
    `<button class="prev-tab${i===0?' active':''}" onclick="switchPreview('${p}',this)">${p.charAt(0).toUpperCase()+p.slice(1)}</button>`
  ).join('');

  renderPreviewFor(selectedPlatform || 'linkedin', text);
  modal.style.display='flex';
}

function switchPreview(platform, el) {
  document.querySelectorAll('.prev-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  const text = abMode
    ? (document.getElementById('abTextA').textContent || '')
    : (document.getElementById('resultContent').textContent || '');
  renderPreviewFor(platform, text);
}

function renderPreviewFor(platform, text) {
  const container = document.getElementById('previewContent');
  const fn = PREVIEW_TEMPLATES[platform];
  container.innerHTML = fn ? fn(text, selectedBrand||'intelixa') : `<div class="prev-body">${formatPreviewText(text)}</div>`;
}

function closePreview() {
  document.getElementById('previewModal').style.display='none';
}
