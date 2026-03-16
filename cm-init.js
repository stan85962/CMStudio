// ===== SETUP TOKEN (premier lancement) =====
function _hasToken() {
  return !!(
    (typeof CONFIG !== 'undefined' && CONFIG.GITHUB_TOKEN ? CONFIG.GITHUB_TOKEN : '') ||
    localStorage.getItem('cm_github_token') || ''
  ).trim();
}

function _showTokenSetup() {
  const overlay = document.createElement('div');
  overlay.id = 'tokenSetupOverlay';
  overlay.className = 'token-setup-overlay';
  overlay.innerHTML = `
    <div class="token-setup-card">
      <div class="token-setup-icon">${icon('keyRound', 24)}</div>
      <h2 class="token-setup-title">Clé API requise</h2>
      <p class="token-setup-desc">Pour utiliser la génération IA, colle ton token GitHub Models ci-dessous. Il sera sauvegardé sur cet appareil.</p>
      <input type="password" id="tokenSetupInput" class="token-setup-input"
        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
        onkeydown="if(event.key==='Enter')_saveTokenSetup()" />
      <button class="token-setup-btn" onclick="_saveTokenSetup()">Enregistrer →</button>
      <p class="token-setup-hint">Token GitHub Models → <strong>github.com/settings/tokens</strong></p>
    </div>`;
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('tokenSetupInput')?.focus(), 300);
}

function _saveTokenSetup() {
  const val = document.getElementById('tokenSetupInput')?.value.trim();
  if (!val) { document.getElementById('tokenSetupInput')?.classList.add('token-setup-error'); return; }
  localStorage.setItem('cm_github_token', val);
  document.getElementById('tokenSetupOverlay')?.remove();
  checkConnectivity();
}

// ===== CONNECTIVITÉ & TOKEN =====
function checkConnectivity() {
  const banner      = document.getElementById('statusBanner');
  const generateBtn = document.getElementById('generateBtn');
  const ideaBtn     = document.getElementById('ideaBtn');
  const isOnline    = navigator.onLine;
  // Priorité : config.js → localStorage (fallback)
  const hasToken    = !!(
    (typeof CONFIG !== 'undefined' && CONFIG.GITHUB_TOKEN ? CONFIG.GITHUB_TOKEN : '') ||
    localStorage.getItem('cm_github_token') ||
    ''
  ).trim();

  let msg = '', cls = '';
  if (!isOnline)      { msg = icon('wifiOff',14) + ' Hors-ligne — notes et calendrier disponibles'; cls = 'status-offline'; }
  else if (!hasToken) { msg = icon('keyRound',14) + ' Token manquant — génération désactivée';       cls = 'status-notoken'; }

  if (banner) {
    if (msg) { banner.innerHTML = msg; banner.className = 'status-banner ' + cls; banner.style.display = 'block'; }
    else     { banner.style.display = 'none'; }
  }

  const disabled = !isOnline || !hasToken;
  [generateBtn, ideaBtn].forEach(btn => {
    if (!btn) return;
    btn.disabled = disabled;
    btn.classList.toggle('btn-offline', disabled);
  });
}

window.addEventListener('online',  checkConnectivity);
window.addEventListener('offline', checkConnectivity);

// ===== PAGE SWITCH =====
function switchPage(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  el.classList.add('active');
  if (page === 'notes')       loadNotes();
  if (page === 'studio')      setTimeout(initDupeDetector, 100);
  if (page === 'calendrier')  initCalendarView().then(renderCalendar);
  if (page === 'historique')  loadHistorique();
  if (page === 'dashboard')   { updateStats(); loadRecentDashboard(); renderPerfRecap(); }
  if (page === 'adn')         loadADNPage();
}

// ===== INIT =====
if (!_hasToken()) _showTokenSetup();
renderCustomBrandCards();
updateStats();
loadRecentDashboard();
setTimeout(checkReminders, 500);
setTimeout(renderPerfRecap, 700);
renderGreeting();
checkConnectivity();
setTimeout(initAutopilot, 800);
setTimeout(initVeille, 850);
document.addEventListener('click', () => {
  if (openMoveId !== null) { openMoveId = null; getNotes().then(renderNotes); }
});
initDupeDetector();

// ===== ADN DE MARQUE =====
const _ADN_SECTION_DEFS = [
  { id:'entreprise', label:"L'entreprise",          placeholder:"Décris ton entreprise en détail — histoire, mission, ce qui vous différencie" },
  { id:'cible',      label:"La cible",              placeholder:"Décris ton client idéal — qui il est, ses douleurs, ses aspirations, son vocabulaire" },
  { id:'ton',        label:"Le ton",                placeholder:"Comment tu parles — exemples de phrases, ce qu'on dit, ce qu'on ne dit jamais" },
  { id:'offres',     label:"Les offres",            placeholder:"Tes offres, leurs prix, leurs bénéfices concrets" },
  { id:'concurrents',label:"Les concurrents",       placeholder:"Qui sont-ils, comment tu te différencies" },
  { id:'signature',  label:"Phrases signature",     placeholder:"Gimmicks, accroches récurrentes, expressions de la marque" },
  { id:'tabous',     label:"Ce qu'on ne dit jamais",placeholder:"Sujets tabous, angles à éviter, mots bannis" }
];

const _ADN_DEFAULTS = {
  intelixa: {
    entreprise: `Intelixa est spécialisé dans les formations en Intelligence Artificielle et en bureautique professionnelle pour freelances, solopreneurs et TPE/PME. Formations bureautiques finançables CPF : Excel, Word, PowerPoint, WordPress, Photoshop, InDesign, Illustrator. Formations IA hors CPF. Zone : France entière.`,
    cible: `Freelances, solopreneurs, indépendants, dirigeants TPE/PME de moins de 10 salariés. Douleurs : temps perdu en tâches répétitives, argent gaspillé, surcharge mentale, retard concurrentiel. Aspirations : automatiser, gagner du temps, scaler sans embaucher, vivre mieux.`,
    ton: `Direct, cash, provocateur mais jamais agressif. Comme un ami qui dit ce que les autres n'osent pas. Pas de langue de bois. Pas de jargon inutile. Des faits, des chiffres, des transformations réelles. Tutoiement.`,
    offres: `Formations IA (no-code, ChatGPT, automatisation) — hors CPF. Formations bureautiques CPF (Excel, Word, PowerPoint, Photoshop, InDesign, Illustrator, WordPress). Diagnostic gratuit productivité.`,
    concurrents: `Organismes de formation bureautique généralistes (OpenClassrooms, OF locaux). Différenciation : focus TPE/PME et solopreneurs, approche pain-driven, résultats mesurables, pas de théorie inutile.`,
    signature: `L'IA n'est plus un luxe, c'est une arme. Ceux qui ignorent l'IA perdent du temps, de l'argent et des clients — chaque jour. Automatise ou reste à la traîne.`,
    tabous: `Jargon technique incompréhensible. Promesses vagues sans chiffres. Culpabilisation. Ton corporate bullshit. Présenter l'IA comme simple tendance ou gadget. Mettre le CPF en avant comme argument principal.`
  },
  doudelio: {
    entreprise: `Doudelio est une plateforme de formations dédiée aux professionnels de la petite enfance : auxiliaires de puéricultrice, éducatrices de jeunes enfants, directrices de crèche. Accompagnement d'équipes, formations réglementaires et pédagogiques.`,
    cible: `Auxiliaires de puéricultrice, éducatrices de jeunes enfants, directrices de crèche. Douleurs : épuisement professionnel, burn-out, sous-effectif, manque de reconnaissance, turn-over. Aspirations : se former, progresser, trouver du soutien, améliorer les pratiques.`,
    ton: `Humain, chaleureux, compréhensif, non moralisateur. Bienveillant et ancré dans le terrain. Jamais condescendant. Toujours positif. Vouvoiement ou tutoiement selon le contexte.`,
    offres: `Formations en ligne et présentiel pour équipes de crèche. Catalogue : pédagogie active, réglementation EAJE, gestion d'équipe, soins et bien-être, accueil inclusif. Financement OPCO possible.`,
    concurrents: `Organismes de formation petite enfance généralistes. Différenciation : spécialisation crèche exclusive, proximité terrain, ton bienveillant, expertise pédagogique de terrain.`,
    signature: `Parce que les tout-petits méritent les meilleurs pros. Doudelio, c'est le terrain d'abord.`,
    tabous: `Culpabilisation. Ton moralisateur. Promesses irréalistes. Négliger la réalité du terrain. Termes médicaux inaccessibles.`
  }
};

function _initADN() {
  // Injecter la page
  if (!document.getElementById('page-adn')) {
    const page = document.createElement('div');
    page.id = 'page-adn';
    page.className = 'page';
    page.innerHTML = `
      <div class="adn-hero">
        <div class="adn-hero-icon">${icon('dna', 32)}</div>
        <h2 id="adnTitle">ADN de marque</h2>
        <p class="adn-subtitle">Contexte de marque — injecté automatiquement dans chaque génération IA</p>
      </div>
      <div id="adnCompletion" class="adn-completion"></div>
      <div id="adnSections" class="adn-sections"></div>
    `;
    const firstPage = document.querySelector('.page');
    if (firstPage) firstPage.parentNode.insertBefore(page, firstPage);
    else document.body.appendChild(page);
  }
  // Injecter l'onglet nav entre Notes et Calendrier
  if (!document.getElementById('navTabADN')) {
    const navTabs = document.querySelector('.nav-tabs');
    if (navTabs) {
      const calTab = [...navTabs.querySelectorAll('.nav-tab')]
        .find(t => (t.getAttribute('onclick') || '').includes("'calendrier'"));
      const tab = document.createElement('button');
      tab.id = 'navTabADN';
      tab.className = 'nav-tab';
      tab.setAttribute('onclick', "switchPage('adn',this)");
      tab.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c.6.5 1.2 1 2.5 1C7 13 7 11 9.5 11s2.5 2 5 2 2.5-2 5-2"/><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5s2.5 2 5 2 2.5-2 5-2"/><path d="M2 18c.6.5 1.2 1 2.5 1C7 19 7 17 9.5 17s2.5 2 5 2 2.5-2 5-2"/></svg> ADN`;
      if (calTab) navTabs.insertBefore(tab, calTab);
      else navTabs.appendChild(tab);
    }
  }
}

function _adnCompletionHtml(filled, total) {
  const pct = Math.round((filled / total) * 100);
  let cls, txt;
  if (filled === total)  { cls = 'adn-badge-complete';   txt = 'ADN complet ✓'; }
  else if (filled < 3)   { cls = 'adn-badge-incomplete'; txt = `ADN incomplet (${filled}/${total})`; }
  else                   { cls = 'adn-badge-partial';    txt = `ADN ${filled}/${total}`; }
  return `<div class="adn-completion-inner">
    <div class="adn-completion-bar-wrap"><div class="adn-completion-bar" style="width:${pct}%"></div></div>
    <span class="adn-badge ${cls}">${txt}</span>
  </div>`;
}

async function loadADNPage() {
  const brand = selectedBrand;
  const titleEl     = document.getElementById('adnTitle');
  const sectionsEl  = document.getElementById('adnSections');
  const completionEl = document.getElementById('adnCompletion');
  if (!sectionsEl) return;
  if (!brand) {
    if (titleEl) titleEl.textContent = 'ADN de marque';
    sectionsEl.innerHTML = '<div class="adn-empty">Sélectionne une marque pour accéder à son ADN.</div>';
    if (completionEl) completionEl.innerHTML = '';
    return;
  }
  const brandLabel = (typeof BRAND_CONTEXT !== 'undefined' && BRAND_CONTEXT[brand])
    ? BRAND_CONTEXT[brand].label : brand.toUpperCase();
  if (titleEl) titleEl.textContent = `ADN de ${brandLabel}`;

  await _adnMaybePreFill(brand);

  const values = {};
  for (const def of _ADN_SECTION_DEFS) {
    const r = await window.storage.get(`adn-${brand}-${def.id}`);
    values[def.id] = (r && r.value) ? r.value : '';
  }
  const filled = Object.values(values).filter(v => v.trim()).length;
  if (completionEl) completionEl.innerHTML = _adnCompletionHtml(filled, _ADN_SECTION_DEFS.length);

  sectionsEl.innerHTML = _ADN_SECTION_DEFS.map(def => {
    const val = values[def.id];
    const hasCont = !!val.trim();
    const preview = hasCont ? val.substring(0, 60).replace(/</g,'&lt;').replace(/>/g,'&gt;') + '…' : '';
    return `<div class="adn-section${hasCont ? ' adn-section-filled' : ''}" id="adn-sec-${def.id}">
      <div class="adn-section-header" onclick="_adnToggle('${def.id}')">
        <span class="adn-section-icon">${hasCont ? '✓' : '○'}</span>
        <span class="adn-section-title">${def.label}</span>
        <span class="adn-section-preview">${preview}</span>
        <button class="adn-edit-btn" onclick="event.stopPropagation();_adnToggle('${def.id}')" title="Éditer">${icon('pencil', 14)}</button>
        <span class="adn-section-chevron">▸</span>
      </div>
      <div class="adn-section-body" id="adn-body-${def.id}" style="display:none">
        <textarea class="adn-textarea" id="adn-ta-${def.id}" placeholder="${def.placeholder}" rows="5">${val.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</textarea>
        <div class="adn-save-row">
          <button class="adn-save-btn" onclick="saveADNSection('${def.id}')">Sauvegarder ✓</button>
          <span class="adn-saved-ok" id="adn-saved-${def.id}"></span>
        </div>
      </div>
    </div>`;
  }).join('');
}

function _adnToggle(sectionId) {
  const body    = document.getElementById(`adn-body-${sectionId}`);
  const chevron = document.querySelector(`#adn-sec-${sectionId} .adn-section-chevron`);
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  if (chevron) chevron.textContent = isOpen ? '▸' : '▾';
}

async function saveADNSection(sectionId) {
  const ta = document.getElementById(`adn-ta-${sectionId}`);
  if (!ta || !selectedBrand) return;
  const value = ta.value;
  await window.storage.set(`adn-${selectedBrand}-${sectionId}`, value);
  const indicator = document.getElementById(`adn-saved-${sectionId}`);
  if (indicator) { indicator.textContent = 'Sauvegardé ✓'; setTimeout(() => { indicator.textContent = ''; }, 2000); }
  const sec = document.getElementById(`adn-sec-${sectionId}`);
  const hasCont = !!value.trim();
  if (sec) {
    sec.classList.toggle('adn-section-filled', hasCont);
    const icon = sec.querySelector('.adn-section-icon');
    if (icon) icon.textContent = hasCont ? '✓' : '○';
    const preview = sec.querySelector('.adn-section-preview');
    if (preview) preview.textContent = hasCont ? value.substring(0, 60) + '…' : '';
  }
  let filled = 0;
  for (const def of _ADN_SECTION_DEFS) {
    const r = await window.storage.get(`adn-${selectedBrand}-${def.id}`);
    if (r && r.value && r.value.trim()) filled++;
  }
  const completionEl = document.getElementById('adnCompletion');
  if (completionEl) completionEl.innerHTML = _adnCompletionHtml(filled, _ADN_SECTION_DEFS.length);
  if (typeof renderADNBadges === 'function') renderADNBadges();
}

async function _adnMaybePreFill(brandId) {
  const r = await window.storage.get(`adn-${brandId}-entreprise`);
  if (r && r.value && r.value.trim()) return;
  const defaults = _ADN_DEFAULTS[brandId];
  if (!defaults) return;
  for (const [section, value] of Object.entries(defaults)) {
    await window.storage.set(`adn-${brandId}-${section}`, value);
  }
}

_initADN();
setTimeout(renderADNBadges, 600);
