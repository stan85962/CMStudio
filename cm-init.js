// ===== CONNECTIVITÉ & TOKEN =====
function checkConnectivity() {
  const banner      = document.getElementById('statusBanner');
  const generateBtn = document.getElementById('generateBtn');
  const ideaBtn     = document.getElementById('ideaBtn');
  const isOnline    = navigator.onLine;
  const hasToken    = !!(localStorage.getItem('cm_github_token') || '').trim();

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

// Réécouter le champ token pour mise à jour immédiate du banner
const _apiKeyEl = document.getElementById('apiKeyInput');
if (_apiKeyEl) _apiKeyEl.addEventListener('input', checkConnectivity);

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
