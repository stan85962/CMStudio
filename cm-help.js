// ===== cm-help.js — Ressources & Prompts + Chatbot flottant =====

// ============================================================
// PARTIE 1 — PANNEAU RESSOURCES & PROMPTS
// ============================================================

let _resActiveBrand    = null;
let _resActivePlatform = null;

const _RES_BRAND_LABELS = { intelixa: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg> INTELIXA', doudelio: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg> DOUDELIO' };

// ---- Ouvrir / fermer ----
function openResourcesDrawer() {
  _resRenderBody();
  document.getElementById('resDrawer')?.classList.add('open');
  document.getElementById('resOverlay')?.classList.add('open');
}

function closeResourcesDrawer() {
  document.getElementById('resDrawer')?.classList.remove('open');
  document.getElementById('resOverlay')?.classList.remove('open');
  _resActiveBrand    = null;
  _resActivePlatform = null;
}

// ---- Badge : prompt personnalisé ? ----
function _resHasCustom(brand, platform) {
  const v = localStorage.getItem('prompt-' + brand + '-' + platform);
  return v !== null && v.length > 0;
}

// ---- Prompt par défaut (appel de la fonction du PLATFORM_PROMPTS) ----
function _resGetDefaultPrompt(brand, platform) {
  try {
    const ctx = BRAND_CONTEXT[brand];
    const result = PLATFORM_PROMPTS[platform](ctx);
    return typeof result === 'string' ? result : '';
  } catch(e) { return ''; }
}

// ---- Rendu du corps du panneau ----
function _resRenderBody() {
  const body = document.getElementById('resBody');
  if (!body) return;

  const chevron = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;

  let html = '';
  for (const brand of ['intelixa', 'doudelio']) {
    const resHidden = _resGetHidden(brand);
    html += `<div class="res-brand-section">
      <div class="res-brand-header" style="display:flex;align-items:center;justify-content:space-between;">
        <span>${_RES_BRAND_LABELS[brand]}</span>
        <button onclick="_resOpenManage('${brand}')" style="font-size:10px;color:var(--muted);background:none;border:none;cursor:pointer;padding:0;">Gérer</button>
      </div>`;

    for (const plat of Object.keys(PLATFORMS_META)) {
      if (resHidden.includes(plat)) continue;
      const hasCustom = _resHasCustom(brand, plat);
      const isActive  = _resActiveBrand === brand && _resActivePlatform === plat;
      const stored    = localStorage.getItem('prompt-' + brand + '-' + plat);

      html += `<button class="res-plat-btn${isActive ? ' res-plat-active' : ''}" onclick="_resSelectPrompt('${brand}','${plat}')">
        <span class="res-plat-icon">${PLATFORMS_META[plat].icon}</span>
        <span class="res-plat-label">${PLATFORMS_META[plat].label}</span>
        ${hasCustom ? '<span class="res-custom-dot" title="Prompt personnalisé"></span>' : ''}
        <span class="res-plat-chevron${isActive ? ' open' : ''}">${chevron}</span>
      </button>`;

      if (isActive) {
        const currentText = (stored && stored.length > 0) ? stored : _resGetDefaultPrompt(brand, plat);
        const escaped = currentText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        html += `<div class="res-editor">
          <textarea class="res-prompt-area" id="resPromptArea">${escaped}</textarea>
          <div class="res-editor-actions">
            <button class="res-save-btn" onclick="saveCustomPrompt('${brand}','${plat}')">Sauvegarder</button>
            <button class="res-reset-btn" onclick="resetCustomPrompt('${brand}','${plat}')" ${!stored || !stored.length ? 'disabled' : ''}>Réinitialiser</button>
          </div>
        </div>`;
      }
    }
    html += `</div>`;
  }
  body.innerHTML = html;

  // Auto-expand textarea
  if (_resActivePlatform) {
    setTimeout(() => {
      const ta = document.getElementById('resPromptArea');
      if (ta) { ta.style.height = 'auto'; ta.style.height = Math.max(120, ta.scrollHeight) + 'px'; }
    }, 10);
  }
}

// ---- Sélection d'une plateforme (toggle) ----
function _resSelectPrompt(brand, platform) {
  if (_resActiveBrand === brand && _resActivePlatform === platform) {
    _resActiveBrand = null; _resActivePlatform = null;
  } else {
    _resActiveBrand = brand; _resActivePlatform = platform;
  }
  _resRenderBody();
  // Scroll editor into view
  if (_resActivePlatform) {
    setTimeout(() => {
      document.getElementById('resPromptArea')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);
  }
}

// ---- Sauvegarder ----
async function saveCustomPrompt(brand, platform) {
  const ta = document.getElementById('resPromptArea');
  if (!ta) return;
  const val = ta.value.trim();
  if (!val) return;
  await window.storage.set('prompt-' + brand + '-' + platform, val);
  const btn = document.querySelector('.res-save-btn');
  if (btn) { btn.textContent = '✓ Sauvegardé'; btn.disabled = true; }
  setTimeout(() => _resRenderBody(), 1300);
}

// ---- Réinitialiser ----
function resetCustomPrompt(brand, platform) {
  localStorage.removeItem('prompt-' + brand + '-' + platform);
  _resActiveBrand = null; _resActivePlatform = null;
  _resRenderBody();
}

// ---- Gestion plateformes visibles par marque ----
function _resGetHidden(brand) {
  try { return JSON.parse(localStorage.getItem('res-hidden-' + brand) || '[]'); } catch { return []; }
}
function _resSetHidden(brand, arr) {
  localStorage.setItem('res-hidden-' + brand, JSON.stringify(arr));
}

function _resOpenManage(brand) {
  const hidden = _resGetHidden(brand);
  const allPlats = typeof PLATFORMS_META !== 'undefined' ? Object.keys(PLATFORMS_META) : [];
  const svgX   = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
  const svgEye = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;

  const rows = allPlats.map(pid => {
    const meta = PLATFORMS_META[pid];
    const label = (meta?.label || pid).split(' — ')[0];
    const icon = meta?.icon || '';
    const isHidden = hidden.includes(pid);
    return isHidden
      ? `<div class="mpl-row mpl-row--hidden"><span class="mpl-row-icon">${icon}</span><span class="mpl-row-label">${label}</span><button class="mpl-toggle-btn mpl-show-it" onclick="_resTogglePlat('${brand}','${pid}',true)">${svgEye} Réafficher</button></div>`
      : `<div class="mpl-row"><span class="mpl-row-icon">${icon}</span><span class="mpl-row-label">${label}</span><button class="mpl-toggle-btn mpl-hide-it" onclick="_resTogglePlat('${brand}','${pid}',false)">${svgX} Masquer</button></div>`;
  }).join('');

  const brandLabel = brand === 'intelixa' ? 'Intelixa' : 'Doudelio';
  let modal = document.getElementById('resManageModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'resManageModal';
    modal.className = 'plat-modal-overlay';
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) _resCloseManage(); });
  }
  modal.innerHTML = `
    <div class="plat-modal plat-modal--manage">
      <div class="plat-modal-header">
        <span>Ressources — ${brandLabel}</span>
        <button class="plat-modal-close" onclick="_resCloseManage()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
      </div>
      <div class="mpl-list">${rows}</div>
    </div>`;
  modal.style.display = 'flex';
  modal.dataset.brand = brand;
}

function _resCloseManage() {
  const modal = document.getElementById('resManageModal');
  if (modal) modal.style.display = 'none';
}

function _resTogglePlat(brand, pid, show) {
  const hidden = _resGetHidden(brand);
  const idx = hidden.indexOf(pid);
  if (show && idx !== -1) hidden.splice(idx, 1);
  else if (!show && idx === -1) hidden.push(pid);
  _resSetHidden(brand, hidden);
  _resOpenManage(brand); // re-render modal
  _resRenderBody();      // re-render drawer
}


// ============================================================
// PARTIE 2 — CHATBOT FLOTTANT
// ============================================================

const _helpMessages = []; // {role, content} — session uniquement

const _HELP_SYSTEM = `Tu es l'assistant intégré de CMStudio, un outil de Community Management pour les marques Intelixa et Doudelio.
Tu réponds UNIQUEMENT aux questions sur CMStudio. Si la question est hors sujet, redirige poliment.
Ton : direct, concis, utile — pas de blabla. Réponds en français.

=== FONCTIONNALITÉS DE CMSTUDIO ===

DASHBOARD (page d'accueil)
- Stats : nombre de posts générés, notes, événements calendrier
- Streak : compteur de jours consécutifs d'activité
- Rappels : alertes si une plateforme n'a pas été postée depuis trop longtemps (seuils par plateforme)
- Bloc AUTOPILOT : suggestion du jour générée automatiquement
- Récents : liste des dernières générations

STUDIO (génération de contenu)
- Sélection de la marque (Intelixa ou Doudelio) et de la plateforme (LinkedIn, Instagram, Twitter/X, TikTok, Facebook, Blog)
- Champ thème libre + bouton "Idée IA" pour suggestions de thèmes
- Mode A/B : génère deux versions simultanées pour comparer
- Templates : structures pré-définies par plateforme (hook-valeur-CTA, storytelling, liste, etc.)
- SEO Analyzer : analyse et score SEO d'un texte copié
- Accroches : bibliothèque d'accroches pré-définies par plateforme
- Copie en un clic, prévisualisation du rendu

HISTORIQUE
- Liste de tous les posts générés, filtrables par marque, plateforme, statut
- Clic sur une entrée → modal avec le contenu complet + option relancer le thème
- Notation des posts (étoiles) pour suivre les performances

NOTES
- Deux sections : Accroches (bibliothèque) et Espace Stan
- Espace Stan : carnet d'idées personnel avec ajout rapide

CALENDRIER
- Vue mensuelle avec planification de posts par jour
- Statuts : planifié, publié, brouillon
- Alertes visuelles sur les jours sans publication

AUTOPILOT
- Switch ON/OFF dans la navigation en haut
- Règles configurables : sujets interdits, niveau d'audace (prudent/équilibré/assumé), seuil de suppression, ton
- Timers : 24h, Weekend, Semaine — désactivation automatique à expiration (même si navigateur fermé)
- Analyse du contexte : détecte la plateforme la moins active, évite les thèmes récents, tient compte des performances
- Journal : historique des suggestions avec statut validé / ignoré / en attente
- Mode assisté : si AUTOPILOT est OFF, la dernière suggestion reste visible

RESSOURCES & PROMPTS (panneau ☰)
- Accès via le bouton ☰ dans la navigation
- Éditeur de prompts par marque (Intelixa / Doudelio) et par plateforme (8 plateformes)
- Sauvegarder un prompt personnalisé → utilisé à la place du prompt par défaut lors des générations
- Badge coloré sur les plateformes dont le prompt a été personnalisé
- Réinitialiser supprime la personnalisation et revient au prompt par défaut

STAN CHEZ INTELIXA (espace perso)
- Accès via la carte Stan dans le sélecteur de marque
- Carnet d'idées : ajout texte, checkbox publié/à faire, date
- Détection de doublons, tri IA, suivi de performance (rating 7j), édition inline

THÈMES
- Doudelio : vert (thème par défaut)
- Intelixa : sombre/rouge (theme-intelixa)
- Stan : gris neutre (theme-stan)`;

// ---- Toggle / fermer la fenêtre chat ----
function toggleChatWindow() {
  document.getElementById('chatWindow')?.classList.toggle('open');
}

function closeChatWindow() {
  document.getElementById('chatWindow')?.classList.remove('open');
}

// ---- Reset conversation ----
function helpResetChat() {
  _helpMessages.length = 0;
  const msgs = document.getElementById('helpMessages');
  if (msgs) msgs.innerHTML = _helpWelcomeHTML();
}

function _helpWelcomeHTML() {
  return `<div class="help-msg help-msg-ai"><img src="mascotte/Wave.png" class="help-msg-avatar" alt=""><div class="help-msg-bubble">Bonjour\u00a0! Je suis l'assistant Intelixa. Pose-moi une question sur l'outil 😊</div></div>`;
}

// ---- Envoi ----
async function helpSend() {
  const input = document.getElementById('helpInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  input.style.height = 'auto';

  _helpMessages.push({ role: 'user', content: text });
  _helpAppendMsg('user', text);

  const loadingId = 'help-loading-' + Date.now();
  _helpAppendLoading(loadingId);

  try {
    const token = getGithubToken();
    if (!token) throw new Error('Token GitHub manquant — colle ton token dans le champ \uD83D\uDD11 en haut de la page.');

    const resp = await fetch('https://models.inference.ai.azure.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 500,
        messages: [
          { role: 'system', content: _HELP_SYSTEM },
          ..._helpMessages
        ]
      })
    });

    const data = await resp.json();
    if (!resp.ok || !data.choices) throw new Error(data?.error?.message || `HTTP ${resp.status}`);
    const answer = data.choices[0].message.content.trim();
    _helpMessages.push({ role: 'assistant', content: answer });
    document.getElementById(loadingId)?.remove();
    _helpAppendMsg('ai', answer);
  } catch(e) {
    document.getElementById(loadingId)?.remove();
    _helpAppendMsg('ai', 'Erreur\u00a0: ' + (e.message || 'Impossible de contacter l\'IA.'));
  }
}

// ---- Helpers DOM ----
function _helpAppendMsg(role, text) {
  const msgs = document.getElementById('helpMessages');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = 'help-msg ' + (role === 'user' ? 'help-msg-user' : 'help-msg-ai');
  if (role === 'ai') {
    const avatar = document.createElement('img');
    avatar.src = 'mascotte/heureux.png';
    avatar.className = 'help-msg-avatar';
    avatar.alt = '';
    div.appendChild(avatar);
  }
  const bubble = document.createElement('div');
  bubble.className = 'help-msg-bubble';
  bubble.innerHTML = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  div.appendChild(bubble);
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function _helpAppendLoading(id) {
  const msgs = document.getElementById('helpMessages');
  if (!msgs) return;
  const div = document.createElement('div');
  div.id = id;
  div.className = 'help-msg help-msg-ai';
  const avatar = document.createElement('img');
  avatar.src = 'mascotte/Perplexe.png';
  avatar.className = 'help-msg-avatar';
  avatar.alt = '';
  div.appendChild(avatar);
  const bubble = document.createElement('div');
  bubble.className = 'help-msg-bubble help-dots';
  bubble.innerHTML = '<span></span><span></span><span></span>';
  div.appendChild(bubble);
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function helpInputKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); helpSend(); }
}

function helpInputInput(e) {
  e.target.style.height = 'auto';
  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
}
