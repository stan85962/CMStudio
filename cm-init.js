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
      <div class="token-setup-icon">🔑</div>
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
  if (page === 'dashboard')   { updateStats(); loadRecentDashboard(); renderStreakCard(); renderPerfRecap(); }
}

// ===== INIT =====
if (!_hasToken()) _showTokenSetup();
updateStats();
loadRecentDashboard();
setTimeout(checkReminders, 500);
setTimeout(renderStreakCard, 600);
setTimeout(renderPerfRecap, 700);
renderGreeting();
checkConnectivity();
setTimeout(initAutopilot, 800);
setTimeout(initVeille, 850);
document.addEventListener('click', () => {
  if (openMoveId !== null) { openMoveId = null; getNotes().then(renderNotes); }
});
initDupeDetector();
