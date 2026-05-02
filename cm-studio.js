// ===== BRAND =====
function selectBrand(brand, el) {
  const leavingStan = selectedBrand === 'stan' && brand !== 'stan';
  selectedBrand = brand;
  document.querySelectorAll('.brand-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.brand-btn.'+brand).forEach(b => b.classList.add('active'));
  document.body.classList.remove('theme-intelixa','theme-stan','theme-custom');
  document.body.classList.add('theme-'+brand);
  document.body.style.removeProperty('--accent');
  document.body.style.removeProperty('--accent2');
  window._currentCustomBrand = null;
  if (typeof _filterStudioPlatforms === 'function') _filterStudioPlatforms(selectedBrand);
  document.title = (brand === 'intelixa' ? 'INTELIXA' : brand) + ' · Studio CM';

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
    dashTitle.textContent = 'INTELIXA STUDIO';
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
  if (typeof initContexteDuJour === 'function') initContexteDuJour();
  _cvRenderPlatforms();
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

// ===== PLATFORM MANAGEMENT =====

async function _getHiddenPlatforms(brandId) {
  const key = `platforms-hidden-${brandId}`;
  const raw = await window.storage.get(key);
  if (raw === null) {
    const defaults = (typeof PLATFORM_DEFAULTS_HIDDEN !== 'undefined' && PLATFORM_DEFAULTS_HIDDEN[brandId]) || [];
    await window.storage.set(key, JSON.stringify(defaults));
    return defaults;
  }
  try { return JSON.parse(raw.value) || []; } catch { return []; }
}
async function _setHiddenPlatforms(brandId, arr) {
  await window.storage.set(`platforms-hidden-${brandId}`, JSON.stringify(arr));
}
async function _getCustomPlatforms(brandId) {
  const raw = await window.storage.get(`custom-platforms-${brandId}`);
  if (!raw) return [];
  try { return JSON.parse(raw.value) || []; } catch { return []; }
}
async function _setCustomPlatforms(brandId, arr) {
  await window.storage.set(`custom-platforms-${brandId}`, JSON.stringify(arr));
}

// Fix 2: robust brand check — excludes stan and custom brands (which use a fixed platform list)
function _isManageableBrand(brand) {
  if (!brand) return false;
  if (brand === 'stan') return false;
  // Custom brands set window._currentCustomBrand; they manage their platform list via onboarding
  if (window._currentCustomBrand && window._currentCustomBrand.id === brand) return false;
  return true;
}

// Helper: reset the grid to its neutral state (all native buttons visible, no injected elements)
function _resetGridToNeutral(grid) {
  grid.classList.remove('platforms-grid--dynamic');
  grid.querySelectorAll('.platform-btn:not(.platform-btn--add):not(.platform-btn--custom)').forEach(btn => {
    btn.style.display = '';
    const x = btn.querySelector('.plat-hide-btn');
    if (x) x.remove();
  });
  grid.querySelectorAll('.platform-btn--custom').forEach(b => b.remove());
  const oldPlus = grid.querySelector('.platform-btn--add');
  if (oldPlus) oldPlus.remove();
}

async function _filterStudioPlatforms(arg) {
  // arg: brand ID string, array of platform IDs (custom brand), or null
  const isExplicitList = Array.isArray(arg);
  const brand = isExplicitList ? selectedBrand : (arg || selectedBrand);
  const grid = document.querySelector('#page-studio .platforms-grid');
  if (!grid) return;

  // Fix 1: always sync manage-link visibility
  let manageLink = document.getElementById('managePlatformsLink');

  // --- Custom brand: use explicit platform list, no manage link ---
  if (isExplicitList) {
    grid.classList.add('platforms-grid--dynamic');
    const allowedIds = arg;
    grid.querySelectorAll('.platform-btn:not(.platform-btn--add):not(.platform-btn--custom)').forEach(btn => {
      if (!btn.dataset.platform) {
        const m = (btn.getAttribute('onclick') || '').match(/selectPlatform\('([^']+)'/);
        if (m) btn.dataset.platform = m[1];
      }
      const pid = btn.dataset.platform;
      if (pid) btn.style.display = allowedIds.includes(pid) ? '' : 'none';
    });
    grid.querySelectorAll('.platform-btn--custom').forEach(b => b.remove());
    const oldPlus = grid.querySelector('.platform-btn--add');
    if (oldPlus) oldPlus.remove();
    if (manageLink) manageLink.style.display = 'none';
    return;
  }

  // --- Not a manageable brand (stan, null, unrecognised) ---
  if (!_isManageableBrand(brand)) {
    _resetGridToNeutral(grid);
    if (manageLink) manageLink.style.display = 'none';
    return;
  }

  // --- Manageable brand: apply stored hidden list ---
  const hidden  = await _getHiddenPlatforms(brand);
  const customs = await _getCustomPlatforms(brand);

  grid.classList.add('platforms-grid--dynamic');

  // 1. Process native static buttons
  grid.querySelectorAll('.platform-btn:not(.platform-btn--add):not(.platform-btn--custom)').forEach(btn => {
    if (!btn.dataset.platform) {
      const m = (btn.getAttribute('onclick') || '').match(/selectPlatform\('([^']+)'/);
      if (m) btn.dataset.platform = m[1];
    }
    const pid = btn.dataset.platform;
    if (!pid) return;
    if (hidden.includes(pid)) {
      btn.style.display = 'none';
    } else {
      btn.style.display = '';
      if (!btn.querySelector('.plat-hide-btn')) {
        const x = document.createElement('button');
        x.className = 'plat-hide-btn';
        x.title = 'Masquer cette plateforme';
        x.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
        x.addEventListener('click', (e) => { e.stopPropagation(); _hidePlatform(pid); });
        btn.appendChild(x);
      }
    }
  });

  // 2. Remove old custom/add buttons
  grid.querySelectorAll('.platform-btn--custom').forEach(b => b.remove());
  const oldPlus = grid.querySelector('.platform-btn--add');
  if (oldPlus) oldPlus.remove();

  // 3. Add visible custom platform buttons
  customs.forEach(cp => {
    if (!hidden.includes(cp.id)) grid.appendChild(_makeCustomPlatformBtn(cp, brand));
  });

  // 4. Add "+" button
  const plusBtn = document.createElement('button');
  plusBtn.className = 'platform-btn platform-btn--add';
  plusBtn.title = 'Ajouter une plateforme';
  plusBtn.addEventListener('click', () => _openAddPlatformModal(brand));
  plusBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg><div class="platform-label">Ajouter</div>`;
  grid.appendChild(plusBtn);

  // 5. Ensure "Gérer les plateformes" link (Fix 1: always show for manageable brands)
  if (!manageLink) {
    manageLink = document.createElement('div');
    manageLink.id = 'managePlatformsLink';
    manageLink.className = 'manage-platforms-link';
    manageLink.innerHTML = `<button onclick="_openManagePlatformsModal()">Gérer les plateformes</button>`;
    grid.insertAdjacentElement('afterend', manageLink);
  }
  manageLink.style.display = '';
}

function _makeCustomPlatformBtn(cp, brand) {
  const btn = document.createElement('button');
  btn.className = 'platform-btn platform-btn--custom';
  btn.dataset.platform = cp.id;
  btn.addEventListener('click', function() { selectPlatform(cp.id, this); });
  const iconHtml = cp.icon
    ? `<img src="${cp.icon}" class="plat-custom-img" alt="">`
    : `<div class="plat-custom-avatar">${cp.label.substring(0, 2).toUpperCase()}</div>`;
  const labelSafe = cp.label.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  btn.innerHTML = iconHtml + `<div class="platform-label">${labelSafe}</div>`;
  // × delete button (confirm-on-second-click)
  const x = document.createElement('button');
  x.className = 'plat-hide-btn plat-delete-btn';
  x.title = 'Supprimer (cliquer 2× pour confirmer)';
  x.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
  x.addEventListener('click', (e) => { e.stopPropagation(); _deleteCustomPlatform(cp.id, brand, x); });
  btn.appendChild(x);
  return btn;
}

async function _hidePlatform(pid) {
  if (!_isManageableBrand(selectedBrand)) return;
  const hidden = await _getHiddenPlatforms(selectedBrand);
  if (!hidden.includes(pid)) {
    hidden.push(pid);
    await _setHiddenPlatforms(selectedBrand, hidden);
  }
  if (selectedPlatform === pid) selectedPlatform = null;
  _filterStudioPlatforms(selectedBrand);
}

async function _deleteCustomPlatform(pid, brand, btnEl) {
  if (btnEl._confirmDelete) {
    const customs = await _getCustomPlatforms(brand);
    await _setCustomPlatforms(brand, customs.filter(c => c.id !== pid));
    if (selectedPlatform === pid) selectedPlatform = null;
    _filterStudioPlatforms(brand);
    return;
  }
  btnEl._confirmDelete = true;
  btnEl.style.cssText = 'background:#e53935;opacity:1;';
  setTimeout(() => {
    if (btnEl._confirmDelete) {
      btnEl._confirmDelete = false;
      btnEl.style.cssText = '';
    }
  }, 2500);
}

// ===== ADD PLATFORM MODAL =====
let _newPlatIconBase64 = null;

function _openAddPlatformModal(brand) {
  let modal = document.getElementById('addPlatformModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'addPlatformModal';
    modal.className = 'plat-modal-overlay';
    modal.innerHTML = `
      <div class="plat-modal">
        <div class="plat-modal-header">
          <span>Nouvelle plateforme</span>
          <button class="plat-modal-close" onclick="_closeAddPlatformModal()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
        </div>
        <div class="plat-modal-body">
          <label class="plat-modal-label">Nom de la plateforme</label>
          <input type="text" id="newPlatName" class="plat-modal-input" placeholder="ex: Threads" maxlength="30" onkeydown="if(event.key==='Enter')_confirmAddPlatform()">
          <label class="plat-modal-label" style="margin-top:14px">Icône (optionnel)</label>
          <div class="plat-icon-upload-area">
            <input type="file" id="newPlatIconFile" accept="image/*" style="display:none" onchange="_previewPlatIcon(this)">
            <label for="newPlatIconFile" class="plat-icon-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Choisir une image
            </label>
            <div id="platIconPreview" class="plat-icon-preview"></div>
          </div>
          <div class="plat-modal-footer">
            <button class="plat-modal-cancel" onclick="_closeAddPlatformModal()">Annuler</button>
            <button class="plat-modal-confirm" onclick="_confirmAddPlatform()">Ajouter</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) _closeAddPlatformModal(); });
  }
  modal.style.display = 'flex';
  modal.dataset.brand = brand;
  _newPlatIconBase64 = null;
  const nameInput = document.getElementById('newPlatName');
  if (nameInput) { nameInput.value = ''; setTimeout(() => nameInput.focus(), 80); }
  const iconFile = document.getElementById('newPlatIconFile');
  if (iconFile) iconFile.value = '';
  const preview = document.getElementById('platIconPreview');
  if (preview) preview.innerHTML = '';
}

function _closeAddPlatformModal() {
  const modal = document.getElementById('addPlatformModal');
  if (modal) modal.style.display = 'none';
}

function _previewPlatIcon(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    _newPlatIconBase64 = e.target.result;
    const preview = document.getElementById('platIconPreview');
    if (preview) preview.innerHTML = `<img src="${e.target.result}" style="width:32px;height:32px;object-fit:contain;border-radius:6px;">`;
  };
  reader.readAsDataURL(input.files[0]);
}

async function _confirmAddPlatform() {
  const modal = document.getElementById('addPlatformModal');
  const brand = modal?.dataset?.brand || selectedBrand;
  const nameInput = document.getElementById('newPlatName');
  const name = nameInput ? nameInput.value.trim() : '';
  if (!name) { nameInput?.focus(); return; }
  const customs = await _getCustomPlatforms(brand);
  customs.push({ id: 'custom_' + Date.now(), label: name, icon: _newPlatIconBase64 || null });
  await _setCustomPlatforms(brand, customs);
  _closeAddPlatformModal();
  _filterStudioPlatforms(brand);
}

// ===== MANAGE PLATFORMS MODAL =====
async function _openManagePlatformsModal() {
  const brand = selectedBrand;
  // Fix 3: show message if no brand selected instead of silent return
  if (!brand) {
    if (typeof _showPreviewToast === 'function') _showPreviewToast('Sélectionne une marque d\'abord');
    return;
  }
  // Fix 2: use proper brand check
  if (!_isManageableBrand(brand)) return;
  const hidden  = await _getHiddenPlatforms(brand);
  const customs = await _getCustomPlatforms(brand);
  const allNative = typeof PLATFORMS_META !== 'undefined' ? Object.keys(PLATFORMS_META) : [];

  const svgX   = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
  const svgEye = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;

  function nativeRow(pid, isActive) {
    const meta = typeof PLATFORMS_META !== 'undefined' ? PLATFORMS_META[pid] : null;
    const label = (meta?.label || pid).split(' — ')[0];
    const icon  = meta?.icon || '';
    if (isActive) {
      return `<div class="mpl-row"><span class="mpl-row-icon">${icon}</span><span class="mpl-row-label">${label}</span><button class="mpl-toggle-btn mpl-hide-it" onclick="_mplToggle('${pid}',false)">${svgX} Masquer</button></div>`;
    } else {
      return `<div class="mpl-row mpl-row--hidden"><span class="mpl-row-icon">${icon}</span><span class="mpl-row-label">${label}</span><button class="mpl-toggle-btn mpl-show-it" onclick="_mplToggle('${pid}',true)">${svgEye} Réafficher</button></div>`;
    }
  }

  function customRow(cp, isActive) {
    const iconHtml = cp.icon
      ? `<img src="${cp.icon}" style="width:22px;height:22px;object-fit:contain;">`
      : `<div class="plat-custom-avatar" style="width:22px;height:22px;font-size:9px">${cp.label.substring(0,2).toUpperCase()}</div>`;
    const labelSafe = cp.label.replace(/</g,'&lt;').replace(/>/g,'&gt;');
    if (isActive) {
      return `<div class="mpl-row"><span class="mpl-row-icon">${iconHtml}</span><span class="mpl-row-label">${labelSafe}</span><button class="mpl-toggle-btn mpl-hide-it" onclick="_mplToggle('${cp.id}',false)">${svgX} Masquer</button></div>`;
    } else {
      return `<div class="mpl-row mpl-row--hidden"><span class="mpl-row-icon">${iconHtml}</span><span class="mpl-row-label">${labelSafe}</span><button class="mpl-toggle-btn mpl-show-it" onclick="_mplToggle('${cp.id}',true)">${svgEye} Réafficher</button></div>`;
    }
  }

  const activeNative = allNative.filter(p => !hidden.includes(p));
  const hiddenNative = allNative.filter(p =>  hidden.includes(p));
  const activeCustom = customs.filter(c => !hidden.includes(c.id));
  const hiddenCustom = customs.filter(c =>  hidden.includes(c.id));

  const activeRows = [...activeNative.map(p => nativeRow(p, true)), ...activeCustom.map(c => customRow(c, true))].join('');
  const hiddenRows = [...hiddenNative.map(p => nativeRow(p, false)), ...hiddenCustom.map(c => customRow(c, false))].join('');
  const hasHidden  = (hiddenNative.length + hiddenCustom.length) > 0;

  let modal = document.getElementById('managePlatformsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'managePlatformsModal';
    modal.className = 'plat-modal-overlay';
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) _closeManagePlatformsModal(); });
  }
  modal.innerHTML = `
    <div class="plat-modal plat-modal--manage">
      <div class="plat-modal-header">
        <span>Gérer les plateformes</span>
        <button class="plat-modal-close" onclick="_closeManagePlatformsModal()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
      </div>
      <div class="plat-modal-body">
        <div class="mpl-section">
          <div class="mpl-section-title">Plateformes actives</div>
          <div class="mpl-list">${activeRows || '<div class="mpl-empty">Aucune plateforme active</div>'}</div>
        </div>
        ${hasHidden ? `<div class="mpl-section">
          <div class="mpl-section-title mpl-section-title--hidden">Plateformes masquées</div>
          <div class="mpl-list">${hiddenRows}</div>
        </div>` : ''}
        <div class="mpl-footer">
          <button class="mpl-reset-btn" onclick="_resetAllPlatforms()">Réinitialiser toutes les plateformes</button>
        </div>
      </div>
    </div>`;
  modal.style.display = 'flex';
}

function _closeManagePlatformsModal() {
  const modal = document.getElementById('managePlatformsModal');
  if (modal) modal.style.display = 'none';
}

async function _mplToggle(pid, makeVisible) {
  if (!_isManageableBrand(selectedBrand)) return;
  const hidden = await _getHiddenPlatforms(selectedBrand);
  const updated = makeVisible ? hidden.filter(h => h !== pid) : (hidden.includes(pid) ? hidden : [...hidden, pid]);
  if (!makeVisible && selectedPlatform === pid) selectedPlatform = null;
  await _setHiddenPlatforms(selectedBrand, updated);
  _filterStudioPlatforms(selectedBrand);
  _openManagePlatformsModal(); // refresh modal
}

async function _resetAllPlatforms() {
  if (!selectedBrand || selectedBrand === 'stan') return;
  localStorage.removeItem(`platforms-hidden-${selectedBrand}`);
  _closeManagePlatformsModal();
  await _filterStudioPlatforms(selectedBrand);
}

// ===== AB MODE =====
function setABMode(mode, el) {
  abMode = mode;
  document.querySelectorAll('.ab-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

// ===== TEMPLATES =====
let _currentDisplayedTplIds = [];

async function _pickFreshTemplates(brand, platform, excludeIds) {
  const templates = (TEMPLATES[brand] || {})[platform] || [];
  if(!templates.length) return [];

  const key = `templates-seen-${brand}-${platform}`;
  let seen = [];
  try { const r = await window.storage.get(key); if(r) seen = JSON.parse(r.value); } catch(e){}

  // All published? Auto-reset
  if(seen.length >= templates.length) {
    seen = [];
    await window.storage.set(key, JSON.stringify([]));
  }

  // Prefer unseen & not currently displayed
  let pool = templates.filter(t => !seen.includes(t.id) && !excludeIds.includes(t.id));

  // Not enough excluding current display? Expand to all unseen
  if(pool.length < 4) pool = templates.filter(t => !seen.includes(t.id));

  // Still not enough (total < 4)? Use all
  if(pool.length < 4) pool = [...templates];

  return [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(4, pool.length));
}

function _renderTemplateCards(row, templates, brand, platform) {
  row.innerHTML = templates.map(t =>
    `<div class="template-card">
      <button class="template-chip" data-text="${t.text.replace(/"/g,'&quot;')}"
        onclick="document.getElementById('theme').value=this.dataset.text">${t.text}</button>
      <button class="template-published-btn"
        onclick="markTemplatePublished('${brand}','${platform}',${t.id})">✓ Publié</button>
    </div>`
  ).join('');
}

function _ensureRefreshRow(brand, platform) {
  const row = document.getElementById('templatesRow');
  if(!row) return;
  let rr = document.getElementById('templatesRefreshRow');
  if(!rr) {
    rr = document.createElement('div');
    rr.id = 'templatesRefreshRow';
    row.insertAdjacentElement('afterend', rr);
  }
  rr.style.display = '';
  rr.innerHTML = `<button class="template-refresh-btn" onclick="refreshTemplates()">↺ Nouvelles idées</button>`;
}

async function _renderTemplatesStatic() {
  const row = document.getElementById('templatesRow');
  if(!row || !selectedBrand) return;
  const byPlatform = TEMPLATES[selectedBrand] || {};
  const platform = (selectedPlatform && byPlatform[selectedPlatform])
    ? selectedPlatform
    : Object.keys(byPlatform)[0];
  if(!platform) return;

  const picked = await _pickFreshTemplates(selectedBrand, platform, []);
  _currentDisplayedTplIds = picked.map(t => t.id);
  _renderTemplateCards(row, picked, selectedBrand, platform);
  _ensureRefreshRow(selectedBrand, platform);
}

async function markTemplatePublished(brand, platform, id) {
  const key = `templates-seen-${brand}-${platform}`;
  let seen = [];
  try { const r = await window.storage.get(key); if(r) seen = JSON.parse(r.value); } catch(e){}
  if(!seen.includes(id)) seen.push(id);

  const templates = (TEMPLATES[brand]||{})[platform] || [];
  const allDone = seen.length >= templates.length;
  await window.storage.set(key, JSON.stringify(allDone ? [] : seen));

  _currentDisplayedTplIds = _currentDisplayedTplIds.filter(i => i !== id);

  const row = document.getElementById('templatesRow');
  if(!row) return;

  if(allDone) {
    row.innerHTML = `<div class="template-all-used">✨ Toutes les idées utilisées — on recommence !</div>`;
    _currentDisplayedTplIds = [];
    setTimeout(async () => {
      const fresh = await _pickFreshTemplates(brand, platform, []);
      _currentDisplayedTplIds = fresh.map(t => t.id);
      _renderTemplateCards(row, fresh, brand, platform);
    }, 2500);
    return;
  }

  // Pick one replacement not already displayed or seen
  const candidates = await _pickFreshTemplates(brand, platform, _currentDisplayedTplIds);
  if(candidates.length > 0) {
    _currentDisplayedTplIds.push(candidates[0].id);
  }
  const currentTpls = _currentDisplayedTplIds
    .map(i => templates.find(t => t.id === i)).filter(Boolean);
  _renderTemplateCards(row, currentTpls, brand, platform);
}

async function refreshTemplates() {
  const row = document.getElementById('templatesRow');
  if(!row || !selectedBrand || !selectedPlatform) return;
  const picked = await _pickFreshTemplates(selectedBrand, selectedPlatform, _currentDisplayedTplIds);
  _currentDisplayedTplIds = picked.map(t => t.id);
  _renderTemplateCards(row, picked, selectedBrand, selectedPlatform);
}

async function _renderVeilleTemplates() {
  const row = document.getElementById('templatesRow');
  if(!row || !selectedBrand || !selectedPlatform) return;
  const rr = document.getElementById('templatesRefreshRow');
  if(rr) rr.style.display = 'none';

  row.innerHTML = '<span class="template-loading"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="template-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Tendances en cours…</span>';

  const token = getGithubToken();
  if(!token) { _renderTemplatesStatic(); return; }

  const brand = BRAND_CONTEXT[selectedBrand];
  const veilleContext = getVeillePrompt(selectedBrand);

  try {
    const _studioApiCfg = (typeof _getAPIConfig === 'function') ? _getAPIConfig() : { endpoint: 'https://api.openai.com/v1/chat/completions', token };
    const resp = await fetch(_studioApiCfg.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_studioApiCfg.token}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: `Tu es un expert Community Manager pour ${brand.label}. ${brand.desc}${veilleContext}`
          },
          {
            role: 'user',
            content: `Génère exactement 4 idées de posts tendance pour ${brand.label} sur ${selectedPlatform}. Retourne UNIQUEMENT un tableau JSON de 4 courtes chaînes (max 55 caractères chacune). Format strict : ["idée 1","idée 2","idée 3","idée 4"]. Rien d'autre.`
          }
        ]
      })
    });
    const data = await resp.json();
    if(!resp.ok || !data.choices) throw new Error('api');
    const raw = data.choices[0].message.content.trim();
    const match = raw.match(/\[[\s\S]*?\]/);
    const ideas = match ? JSON.parse(match[0]) : [];
    if(ideas.length > 0) {
      row.innerHTML = ideas.map(t =>
        `<button class="template-chip veille-chip" onclick="document.getElementById('theme').value='${t.replace(/'/g,"\'")}'">${t}</button>`
      ).join('');
    } else {
      _renderTemplatesStatic();
    }
  } catch(e) {
    _renderTemplatesStatic();
  }
}

function renderTemplates() {
  if(typeof _veilleEnabled !== 'undefined' && _veilleEnabled && selectedPlatform) {
    _renderVeilleTemplates();
  } else {
    _renderTemplatesStatic();
  }
}

// ===== STRUCTURED RESULT =====
function parseStructuredResult(text) {
  const sections = [];
  const lines = text.split('\n');
  let current = null;
  for (const line of lines) {
    const match = line.match(/^\*{0,2}(\d+)[\.\-\)]\s*\*{0,2}\s*(.+)/);
    if (match) {
      if (current) sections.push(current);
      current = { title: match[2].replace(/\*+/g, '').trim(), content: '' };
    } else if (current) {
      current.content += (current.content ? '\n' : '') + line;
    }
  }
  if (current) sections.push(current);
  return sections;
}

function renderStructuredInto(el, text) {
  const sections = parseStructuredResult(text);
  if (sections.length < 3) return;
  el.dataset.rawText = text;
  const svgCopy = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
  el.innerHTML = '<div class="struct-list">' + sections.map((s, i) => {
    const tSafe = s.title.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const bSafe = s.content.trim().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
    return `<div class="struct-card">
  <div class="struct-header">
    <span class="struct-num">${i + 1}</span>
    <span class="struct-title">${tSafe}</span>
    <button class="struct-copy-btn" onclick="copySection(this)" title="Copier">${svgCopy}</button>
  </div>
  ${bSafe ? `<div class="struct-body">${bSafe}</div>` : ''}
</div>`;
  }).join('') + '</div>';
}

function copySection(btn) {
  const card = btn.closest('.struct-card');
  const title = card.querySelector('.struct-title').textContent.trim();
  const body  = card.querySelector('.struct-body')?.innerText?.trim() || '';
  const saved = btn.innerHTML;
  navigator.clipboard.writeText(body ? `${title}\n${body}` : title).then(() => {
    btn.textContent = '✓'; btn.classList.add('struct-copy-done');
    setTimeout(() => { btn.innerHTML = saved; btn.classList.remove('struct-copy-done'); }, 1500);
  });
}

function _initStructuredObserver() {
  const watch = (elId) => {
    const el = document.getElementById(elId);
    if (!el) return;
    let _t, _busy = false;
    new MutationObserver(() => {
      if (_busy) return;
      clearTimeout(_t);
      _t = setTimeout(() => {
        if (el.querySelector('.cursor')) return;
        const text = el.textContent.trim();
        if (!text || text === '—' || el.querySelector('.struct-card')) return;
        _busy = true;
        renderStructuredInto(el, text);
        _busy = false;
      }, 150);
    }).observe(el, { childList: true, subtree: true, characterData: true });
  };
  watch('resultContent');
  watch('abTextA');
  watch('abTextB');
}

// ===== COPY =====
function copyResult() {
  const el = document.getElementById('resultContent');
  navigator.clipboard.writeText(el.dataset.rawText || el.innerText).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent='✅ Copié !'; btn.classList.add('copied');
    setTimeout(()=>{btn.textContent='📋 Copier';btn.classList.remove('copied');},2000);
  });
}
function copyAB(v) {
  const el = document.getElementById('abText' + v);
  navigator.clipboard.writeText(el.dataset.rawText || el.innerText);
}

// ===== SAVE ACCROCHE =====
async function sendToPublisher() {
  const text = abMode
    ? (document.getElementById('abTextA').textContent || '')
    : (document.getElementById('resultContent').textContent || '');

  if (!text.trim() || text === '—') {
    alert('Génère un post avant de publier.');
    return;
  }

  const btn = document.getElementById('publishBtn');
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = '…';

  try {
    const res = await fetch('http://localhost:5001/add-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.trim(),
        brand: selectedBrand || 'intelixa',
        platform: selectedPlatform || 'gmb',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    btn.textContent = '✓ Envoyé !';
    setTimeout(() => { btn.innerHTML = original; btn.disabled = false; }, 2500);
  } catch {
    btn.textContent = '✗ Serveur hors ligne';
    setTimeout(() => { btn.innerHTML = original; btn.disabled = false; }, 3000);
  }
}

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
// ===== PREVIEW HELPERS =====
function _prevBrandData(brand) {
  const ctx = (typeof BRAND_CONTEXT !== 'undefined' && BRAND_CONTEXT[brand]) || {};
  const rawLabel = ctx.label || (brand.charAt(0).toUpperCase() + brand.slice(1));
  const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1).toLowerCase();
  const initials = rawLabel.substring(0, 2).toUpperCase();
  const ig = brand === 'intelixa' ? 'intelixa_off'
           : brand.toLowerCase().replace(/\s+/g, '_');
  const sub1 = brand === 'intelixa' ? 'Expert IA & Automatisation · Intelixa'
             : label;
  return { label, initials, ig, sub1 };
}

function _prevHashtags(text, color) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(#[\wÀ-ÿ]+)/g, `<span style="color:${color};font-weight:600">$1</span>`)
    .replace(/\n/g, '<br>');
}

function _showPreviewToast(msg) {
  let t = document.getElementById('_prvToast');
  if (!t) {
    t = document.createElement('div');
    t.id = '_prvToast';
    t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;font-weight:600;z-index:9999;pointer-events:none;opacity:0;transition:opacity .25s;white-space:nowrap';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._tid);
  t._tid = setTimeout(() => { t.style.opacity = '0'; }, 2500);
}

const PREVIEW_TEMPLATES = {
  linkedin: (text, brand) => {
    const bd = _prevBrandData(brand);
    const isLong = text.length > 250;
    const bodyHtml = _prevHashtags(isLong ? text.substring(0, 250) : text, '#0A66C2')
                   + (isLong ? ' <strong style="cursor:pointer">… voir plus</strong>' : '');
    const svgLike = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>';
    const svgCom  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    const svgRep  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';
    const svgSend = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
    return `<div class="prv-li-wrap"><div class="prv-li-card">
  <div class="prv-li-header">
    <div class="prv-li-avatar">${bd.initials}</div>
    <div class="prv-li-info">
      <div class="prv-li-name">${bd.label}</div>
      <div class="prv-li-sub">${bd.sub1}</div>
      <div class="prv-li-sub">1er · maintenant · 🌐</div>
    </div>
    <button class="prv-li-follow">Suivre +</button>
    <span class="prv-li-dots">···</span>
  </div>
  <div class="prv-li-body">${bodyHtml}</div>
  <div class="prv-li-reactions">👍 1 · ❤️ · 🎉 <span>12 réactions</span></div>
  <div class="prv-li-sep"></div>
  <div class="prv-li-actions">
    <button class="prv-li-action-btn">${svgLike} J'aime</button>
    <button class="prv-li-action-btn">${svgCom} Commenter</button>
    <button class="prv-li-action-btn">${svgRep} Republier</button>
    <button class="prv-li-action-btn">${svgSend} Envoyer</button>
  </div>
</div></div>`;
  },

  instagram: (text, brand) => {
    const bd = _prevBrandData(brand);
    const mainText = text.replace(/(#[\wÀ-ÿ]+)/g, '').replace(/\s{2,}/g, ' ').trim();
    const isLong = mainText.length > 125;
    const displayText = (isLong ? mainText.substring(0, 125) : mainText)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, ' ');
    const hashtags = (text.match(/(#[\wÀ-ÿ]+)/g) || [])
      .map(h => `<span style="color:#00376B;font-weight:600;margin-right:4px">${h}</span>`).join('');
    const svgHeart = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
    const svgCom  = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    const svgSend = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
    const svgBook = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>';
    const svgImg  = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#AAAAAA" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
    return `<div class="prv-ig-wrap"><div class="prv-ig-card">
  <div class="prv-ig-header">
    <div class="prv-ig-avatar"></div>
    <span class="prv-ig-uname">${bd.ig}</span>
    <span class="prv-ig-follow">• Suivre</span>
    <span class="prv-ig-hdots">···</span>
  </div>
  <div class="prv-ig-image">${svgImg}</div>
  <div class="prv-ig-actions">
    <div class="prv-ig-left">${svgHeart}${svgCom}${svgSend}</div>
    <div class="prv-ig-right">${svgBook}</div>
  </div>
  <div class="prv-ig-likes">234 J'aime</div>
  <div class="prv-ig-caption">
    <span class="prv-ig-cname">${bd.ig}</span>${displayText}${isLong ? '<span class="prv-ig-more"> ... plus</span>' : ''}
    ${hashtags ? `<div class="prv-ig-tags">${hashtags}</div>` : ''}
  </div>
  <div class="prv-ig-comments">Voir les 12 commentaires</div>
  <div class="prv-ig-time">IL Y A 1 MINUTE</div>
</div></div>`;
  },

  gmb: (text, brand) => `
    <div class="preview-gmb">
      <div class="prev-header">
        <div class="prev-avatar" style="background:#4285F4;">G</div>
        <div>
          <div class="prev-name">Intelixa</div>
          <div class="prev-meta">Google · Vient de publier</div>
        </div>
      </div>
      <div class="prev-body">${formatPreviewText(text, 300)}</div>
      <div class="prev-gmb-btn">En savoir plus</div>
    </div>`,

  facebook: (text, brand) => {
    const bd = _prevBrandData(brand);
    const bodyHtml = _prevHashtags(text, '#216FDB');
    const svgLike  = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#65676B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>';
    const svgCom   = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#65676B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    const svgShare = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#65676B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';
    const svgImg   = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#BCC0C4" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
    return `<div class="prv-fb-wrap"><div class="prv-fb-card">
  <div class="prv-fb-header">
    <div class="prv-fb-avatar">${bd.initials}</div>
    <div class="prv-fb-info">
      <div class="prv-fb-name">${bd.label} <span class="prv-fb-badge">Page</span></div>
      <div class="prv-fb-meta">maintenant · 🌍</div>
    </div>
    <div class="prv-fb-hright"><span>···</span><span style="font-size:16px">✕</span></div>
  </div>
  <div class="prv-fb-body">${bodyHtml}</div>
  <div class="prv-fb-image">${svgImg}</div>
  <div class="prv-fb-react-row">
    <span>👍 ❤️ Vous et 12 autres personnes</span>
    <span>3 commentaires · 1 partage</span>
  </div>
  <div class="prv-fb-sep"></div>
  <div class="prv-fb-actions">
    <button class="prv-fb-action">${svgLike} J'aime</button>
    <button class="prv-fb-action prv-fb-action-mid">${svgCom} Commenter</button>
    <button class="prv-fb-action">${svgShare} Partager</button>
  </div>
</div></div>`;
  },

  pinterest: (text, brand) => `
    <div class="preview-pinterest">
      <div class="prev-pin-img" style="background:${brand==='intelixa'?'linear-gradient(135deg,#1a0a0a,#3a1515)':'linear-gradient(135deg,#fce4ec,#f8bbd0)'};">
        <span style="font-size:40px;">${brand==='intelixa'?'⚡':'🌸'}</span>
      </div>
      <div class="prev-pin-body">
        <div class="prev-name" style="font-size:14px;margin-bottom:6px;">${text.substring(0,60)}${text.length>60?'...':''}</div>
        <div class="prev-meta">intelixa.fr</div>
      </div>
    </div>`,

  tiktok: (text, brand) => `
    <div class="preview-tiktok">
      <div class="prev-tiktok-screen" style="background:${brand==='intelixa'?'linear-gradient(180deg,#0a0010,#1a0a20)':'linear-gradient(180deg,#e8f5ff,#d0e8f5)'};">
        <span style="font-size:40px;">🎬</span>
        <div style="font-size:11px;color:${brand==='intelixa'?'#aaa':'#555'};margin-top:8px;text-align:center;">Prompt Veo</div>
      </div>
      <div class="prev-tiktok-caption">
        <div class="prev-name">@intelixa</div>
        <div class="prev-body" style="padding:0;font-size:12px;">${formatPreviewText(text, 150)}</div>
      </div>
    </div>`,

  spotify: (text, brand) => `
    <div class="preview-spotify">
      <div class="prev-spotify-img" style="background:${brand==='intelixa'?'linear-gradient(135deg,#1a0a0a,#2a1010)':'linear-gradient(135deg,#e8f5e4,#c8e6c9)'};">
        <span style="font-size:36px;">🎧</span>
      </div>
      <div class="prev-name">Épisode · Intelixa Podcast</div>
      <div class="prev-body">${formatPreviewText(text, 200)}</div>
    </div>`,

  brevo: (text, brand) => `
    <div class="preview-brevo">
      <div class="prev-brevo-header" style="background:#1a0a0a;">
        <span style="font-size:22px;">⚡</span>
        <span style="color:white;font-weight:800;font-size:14px;">INTELIXA</span>
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
        <div class="prev-meta">Intelixa · 0 vue · À l'instant</div>
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
  if (!modal) return;
  const text = abMode
    ? (document.getElementById('abTextA').textContent || '')
    : (document.getElementById('resultContent').textContent || '');
  if (!text || text.trim() === '—' || text.length < 5) return;

  const platform = selectedPlatform || '';
  const supported = ['linkedin', 'instagram', 'facebook'];
  if (!supported.includes(platform)) {
    _showPreviewToast('Aperçu disponible pour LinkedIn, Instagram et Facebook');
    return;
  }

  const tabs = document.getElementById('previewTabs');
  tabs.innerHTML = supported.map(p =>
    `<button class="prev-tab${p === platform ? ' active' : ''}" onclick="switchPreview('${p}',this)">${p.charAt(0).toUpperCase() + p.slice(1)}</button>`
  ).join('');
  renderPreviewFor(platform, text);
  modal.style.display = 'flex';
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

// ===== CONTEXTE DU JOUR =====
async function initContexteDuJour() {
  if (!selectedBrand) return;
  const brandId = selectedBrand;
  const keyCtx  = 'contexte-du-jour-' + brandId;
  const keyDate = 'contexte-date-' + brandId;
  const todayStr = new Date().toISOString().slice(0, 10);

  // Auto-reset quotidien
  let text = '';
  try {
    const rDate = await window.storage.get(keyDate);
    if (rDate && rDate.value === todayStr) {
      const rCtx = await window.storage.get(keyCtx);
      if (rCtx) text = rCtx.value || '';
    } else {
      await window.storage.set(keyCtx, '');
      await window.storage.set(keyDate, todayStr);
    }
  } catch(e) {}

  // Créer ou mettre à jour le bloc UI
  let block = document.getElementById('contexteJourBlock');
  if (!block) {
    block = document.createElement('div');
    block.id = 'contexteJourBlock';
    block.className = 'contexte-jour-block';
    // Insérer après la platforms-grid dans #page-studio
    const grid = document.querySelector('#page-studio .platforms-grid');
    if (grid) grid.insertAdjacentElement('afterend', block);
    else document.getElementById('page-studio')?.appendChild(block);
  }

  const isActive = text.trim().length > 0;
  block.innerHTML = `
    <div class="cj-header" onclick="_cjToggle()">
      <span class="cj-label"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:6px"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>Contexte du jour</span>
      ${isActive ? '<span class="cj-badge">actif</span>' : ''}
      <span class="cj-chevron" id="cjChevron">▾</span>
    </div>
    <div class="cj-body" id="cjBody" style="display:${isActive ? 'block' : 'none'}">
      <textarea id="cjTextarea" class="cj-textarea" placeholder="Ex : Ce matin on lance notre nouvelle offre de formation. Mettre en avant le lancement aujourd'hui." onchange="_cjSave(this.value)">${text}</textarea>
      <div class="cj-hint">Sera injecté en début de prompt pour chaque génération aujourd'hui.</div>
    </div>`;
}

function _cjToggle() {
  const body = document.getElementById('cjBody');
  const chev = document.getElementById('cjChevron');
  if (!body) return;
  const open = body.style.display === 'block';
  body.style.display = open ? 'none' : 'block';
  if (chev) chev.textContent = open ? '▾' : '▴';
  if (!open) setTimeout(() => document.getElementById('cjTextarea')?.focus(), 50);
}

async function _cjSave(text) {
  if (!selectedBrand) return;
  const keyCtx  = 'contexte-du-jour-' + selectedBrand;
  const keyDate = 'contexte-date-' + selectedBrand;
  const todayStr = new Date().toISOString().slice(0, 10);
  await window.storage.set(keyCtx, text);
  await window.storage.set(keyDate, todayStr);
  // Mettre à jour le badge actif
  const block = document.getElementById('contexteJourBlock');
  if (!block) return;
  const isActive = text.trim().length > 0;
  const existing = block.querySelector('.cj-badge');
  if (isActive && !existing) {
    block.querySelector('.cj-header')?.insertAdjacentHTML('beforeend', '<span class="cj-badge">actif</span>');
  } else if (!isActive && existing) {
    existing.remove();
  }
}

// ===== CAPTION VISUEL =====
let _cvImages = [];
let _cvSelectedPlatforms = [];

function initCaptionVisuel() {
  const page = document.getElementById('page-studio');
  if (!page || document.getElementById('cvTabBar')) return;

  // Find the brand selector step (first direct .step child)
  const brandStep = page.querySelector(':scope > .step');
  if (!brandStep) return;

  // Collect all children after the brand step → wrap in post wrapper
  const children = [...page.children];
  const brandIdx = children.indexOf(brandStep);
  const postChildren = children.slice(brandIdx + 1);

  const postWrapper = document.createElement('div');
  postWrapper.id = 'studioPostWrapper';
  postChildren.forEach(child => postWrapper.appendChild(child));

  // Tab bar
  const tabBar = document.createElement('div');
  tabBar.id = 'cvTabBar';
  tabBar.className = 'cv-tab-bar';
  tabBar.innerHTML = `
    <button class="cv-tab active" id="cvTabPost" onclick="switchStudioTab('post')">✦ Générer un post</button>
    <button class="cv-tab" id="cvTabCaption" onclick="switchStudioTab('caption')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg> Caption visuel</button>
  `;

  // CV panel
  const cvPanel = document.createElement('div');
  cvPanel.id = 'cvPanel';
  cvPanel.style.display = 'none';
  cvPanel.innerHTML = `
    <div class="step card cv-panel-card">
      <div class="cv-drop-zone" id="cvDropZone"
           onclick="document.getElementById('cvFileInput').click()"
           ondragover="event.preventDefault();this.classList.add('cv-drop-hover')"
           ondragleave="this.classList.remove('cv-drop-hover')"
           ondrop="_cvHandleDrop(event)">
        <div class="cv-drop-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>
        <div class="cv-drop-label">Glisse tes visuels ici ou clique pour sélectionner</div>
        <div class="cv-drop-hint" id="cvDropHint">PNG, JPG, WebP — max 4 images</div>
        <input type="file" id="cvFileInput" accept="image/*" multiple style="display:none">
      </div>
      <div class="cv-preview-grid" id="cvPreviewGrid" style="display:none"></div>
      <div class="cv-section-label">Plateformes</div>
      <div class="cv-plat-grid" id="cvPlatGrid"></div>
      <div class="cv-context-row">
        <input type="text" class="cv-context-input" id="cvContextInput"
               placeholder="Contexte optionnel (ex : lancement produit, promo d'été…)">
      </div>
      <button class="cv-gen-btn" id="cvGenBtn" onclick="generateCaptions()" disabled>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg> Générer les captions
      </button>
      <div id="cvError" class="cv-error-msg" style="display:none"></div>
      <div id="cvResults" class="cv-results"></div>
    </div>
  `;

  // Insert: brandStep → tabBar → postWrapper → cvPanel
  brandStep.insertAdjacentElement('afterend', cvPanel);
  brandStep.insertAdjacentElement('afterend', postWrapper);
  brandStep.insertAdjacentElement('afterend', tabBar);

  // File input change binding
  document.getElementById('cvFileInput').addEventListener('change', function() {
    _cvHandleFiles(this.files);
    this.value = '';
  });

  _cvRenderPlatforms();
}

function switchStudioTab(tab) {
  const postWrapper = document.getElementById('studioPostWrapper');
  const cvPanel     = document.getElementById('cvPanel');
  const tabPost     = document.getElementById('cvTabPost');
  const tabCaption  = document.getElementById('cvTabCaption');
  if (!postWrapper || !cvPanel) return;

  if (tab === 'post') {
    postWrapper.style.display = '';
    cvPanel.style.display     = 'none';
    tabPost.classList.add('active');
    tabCaption.classList.remove('active');
  } else {
    postWrapper.style.display = 'none';
    cvPanel.style.display     = '';
    tabPost.classList.remove('active');
    tabCaption.classList.add('active');
    _cvRenderPlatforms();
  }
}

function _cvRenderPlatforms() {
  const grid = document.getElementById('cvPlatGrid');
  if (!grid || typeof PLATFORMS_META === 'undefined') return;
  grid.innerHTML = Object.keys(PLATFORMS_META).map(p => {
    const meta   = PLATFORMS_META[p];
    const active = _cvSelectedPlatforms.includes(p);
    return `<button class="cv-plat-btn${active ? ' active' : ''}" data-platform="${p}" onclick="_cvTogglePlatform('${p}',this)">${meta.icon}<span>${meta.label.split(' — ')[0]}</span></button>`;
  }).join('');
}

function _cvHandleDrop(e) {
  e.preventDefault();
  document.getElementById('cvDropZone')?.classList.remove('cv-drop-hover');
  _cvHandleFiles(e.dataTransfer.files);
}

function _cvHandleFiles(files) {
  const toAdd = [...files].filter(f => f.type.startsWith('image/')).slice(0, 4 - _cvImages.length);
  toAdd.forEach(file => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      _cvImages.push({ name: file.name, dataUrl: ev.target.result });
      _cvRenderPreviews();
      _cvUpdateGenBtn();
    };
    reader.readAsDataURL(file);
  });
}

function _cvRemoveImage(idx) {
  _cvImages.splice(idx, 1);
  _cvRenderPreviews();
  _cvUpdateGenBtn();
}

function _cvRenderPreviews() {
  const grid = document.getElementById('cvPreviewGrid');
  const hint = document.getElementById('cvDropHint');
  if (!grid) return;

  if (_cvImages.length === 0) {
    grid.innerHTML = '';
    grid.style.display = 'none';
    if (hint) hint.textContent = 'PNG, JPG, WebP — max 4 images';
    return;
  }

  grid.style.display = 'grid';
  grid.innerHTML = _cvImages.map((img, i) => `
    <div class="cv-preview-item">
      <img src="${img.dataUrl}" class="cv-preview-img" alt="${img.name}">
      <button class="cv-preview-del" onclick="_cvRemoveImage(${i})" title="Supprimer">×</button>
    </div>
  `).join('');

  if (hint) {
    const n = _cvImages.length;
    hint.textContent = `${n}/4 image${n > 1 ? 's' : ''} sélectionnée${n > 1 ? 's' : ''}${n < 4 ? ' — glisse encore pour en ajouter' : ' — maximum atteint'}`;
  }
}

function _cvTogglePlatform(platform, el) {
  const idx = _cvSelectedPlatforms.indexOf(platform);
  if (idx === -1) _cvSelectedPlatforms.push(platform);
  else            _cvSelectedPlatforms.splice(idx, 1);
  el.classList.toggle('active', _cvSelectedPlatforms.includes(platform));
  _cvUpdateGenBtn();
}

function _cvUpdateGenBtn() {
  const btn = document.getElementById('cvGenBtn');
  if (btn) btn.disabled = _cvImages.length === 0 || _cvSelectedPlatforms.length === 0;
}

async function generateCaptions() {
  if (!selectedBrand) { alert('Choisis une marque !'); return; }
  if (_cvImages.length === 0 || _cvSelectedPlatforms.length === 0) return;

  const btn    = document.getElementById('cvGenBtn');
  const results = document.getElementById('cvResults');
  const errEl  = document.getElementById('cvError');
  btn.disabled = true;
  btn.textContent = '⏳ Génération en cours…';
  if (errEl) errEl.style.display = 'none';

  const context = document.getElementById('cvContextInput')?.value?.trim() || '';
  const brand   = BRAND_CONTEXT[selectedBrand];

  // Loading cards
  results.innerHTML = _cvSelectedPlatforms.map(p => {
    const meta = PLATFORMS_META[p];
    return `<div class="cv-result-card" id="cvCard-${p}">
      <div class="cv-result-header">${meta.icon}<span>${meta.label.split(' — ')[0]}</span></div>
      <div class="cv-result-body"><div class="cv-loading">⏳ Génération…</div></div>
    </div>`;
  }).join('');

  // All platforms in parallel
  await Promise.all(_cvSelectedPlatforms.map(async platform => {
    const card = document.getElementById('cvCard-' + platform);
    try {
      const caption = await callClaudeVision(brand, _cvImages, platform, context);
      if (!card) return;
      const escaped = caption
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
      card.querySelector('.cv-result-body').innerHTML = `
        <div class="cv-caption-text">${escaped}</div>
        <div class="cv-result-actions">
          <button class="cv-copy-btn" onclick="_cvCopyCaption('${platform}')">📋 Copier</button>
          <button class="cv-regen-btn" onclick="_cvRegenCaption('${platform}')">↺ Relancer</button>
          <button class="cv-save-btn" onclick="_cvSaveCaption('${platform}')">💾 Historique</button>
        </div>`;
      card.dataset.caption  = caption;
      card.dataset.platform = platform;
    } catch(err) {
      if (card) card.querySelector('.cv-result-body').innerHTML =
        `<span style="color:#e53935">❌ ${err.message}</span>`;
    }
  }));

  btn.disabled    = false;
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg> Générer les captions';
}

async function _cvCopyCaption(platform) {
  const card = document.getElementById('cvCard-' + platform);
  if (!card || !card.dataset.caption) return;
  try {
    await navigator.clipboard.writeText(card.dataset.caption);
    const btn = card.querySelector('.cv-copy-btn');
    if (btn) { btn.textContent = '✅ Copié !'; setTimeout(() => { btn.textContent = '📋 Copier'; }, 1500); }
  } catch(e) {}
}

async function _cvRegenCaption(platform) {
  const card = document.getElementById('cvCard-' + platform);
  if (!card) return;
  const context = document.getElementById('cvContextInput')?.value?.trim() || '';
  const brand   = BRAND_CONTEXT[selectedBrand];
  card.querySelector('.cv-result-body').innerHTML = '<div class="cv-loading">⏳ Régénération…</div>';
  try {
    const caption = await callClaudeVision(brand, _cvImages, platform, context);
    const escaped = caption
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    card.querySelector('.cv-result-body').innerHTML = `
      <div class="cv-caption-text">${escaped}</div>
      <div class="cv-result-actions">
        <button class="cv-copy-btn" onclick="_cvCopyCaption('${platform}')">📋 Copier</button>
        <button class="cv-regen-btn" onclick="_cvRegenCaption('${platform}')">↺ Relancer</button>
        <button class="cv-save-btn" onclick="_cvSaveCaption('${platform}')">💾 Historique</button>
      </div>`;
    card.dataset.caption = caption;
  } catch(err) {
    card.querySelector('.cv-result-body').innerHTML =
      `<span style="color:#e53935">❌ ${err.message}</span>`;
  }
}

async function _cvSaveCaption(platform) {
  const card = document.getElementById('cvCard-' + platform);
  if (!card || !card.dataset.caption) return;
  const context       = document.getElementById('cvContextInput')?.value?.trim() || '';
  const caption       = card.dataset.caption;
  const platformLabel = (PLATFORMS_META[platform]?.label?.split(' — ')[0]) || platform;
  const theme         = context || ('Caption visuel — ' + platformLabel);

  // Temporarily set selectedPlatform so saveToHistory tags the right platform
  const prevPlatform  = selectedPlatform;
  selectedPlatform    = platform;
  await saveToHistory(theme, caption, 'CAPTION VISUEL');
  selectedPlatform    = prevPlatform;

  const btn = card.querySelector('.cv-save-btn');
  if (btn) { btn.textContent = '✅ Sauvegardé !'; setTimeout(() => { btn.textContent = '💾 Historique'; }, 1500); }
}

// Initialize on page load
initCaptionVisuel();
_initStructuredObserver();
