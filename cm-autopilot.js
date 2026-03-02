// ===== AUTOPILOT MODE =====

let _apEnabled = false;
let _apResults = {}; // platform -> { text, loading, error, brandKey }

// ===== INIT =====
async function initAutopilot() {
  try {
    const r = await window.storage.get('autopilot-enabled');
    _apEnabled = r ? r.value === 'true' : false;
  } catch(e) {}
  _apUpdateNavUI();
  if (_apEnabled) renderAutopilotBlock();
}

// ===== TOGGLE =====
async function toggleAutopilot() {
  const toggle = document.getElementById('autopilotToggle');
  _apEnabled = toggle ? toggle.checked : !_apEnabled;
  await window.storage.set('autopilot-enabled', String(_apEnabled));
  _apUpdateNavUI();
  if (!_apEnabled) _apResults = {};
  renderAutopilotBlock();
}

// ===== NAV UI =====
function _apUpdateNavUI() {
  const toggle = document.getElementById('autopilotToggle');
  if (toggle) toggle.checked = _apEnabled;
  document.body.classList.toggle('autopilot-on', _apEnabled);
}

// ===== DASHBOARD PANEL =====
function renderAutopilotBlock() {
  const block = document.getElementById('autopilotBlock');
  if (!block) return;
  if (!_apEnabled) { block.innerHTML = ''; return; }

  const brandVal = _apResults._brand || 'intelixa';
  const platforms = Object.keys(PLATFORMS_META);

  block.innerHTML = `
    <div class="ap-panel">
      <div class="ap-panel-header">${icon('zap', 15)} AUTOPILOT — Génération multi-plateformes</div>

      <div class="ap-brand-row">
        <label class="ap-brand-radio">
          <input type="radio" name="apBrand" value="intelixa" ${brandVal === 'intelixa' ? 'checked' : ''}> INTELIXA
        </label>
        <label class="ap-brand-radio">
          <input type="radio" name="apBrand" value="doudelio" ${brandVal === 'doudelio' ? 'checked' : ''}> DOUDELIO
        </label>
      </div>

      <div class="ap-plat-grid">
        ${platforms.map(p => `
          <label class="ap-plat-item">
            <input type="checkbox" name="apPlat" value="${p}">
            <span class="ap-plat-icon">${PLATFORMS_META[p].icon}</span>
            <span class="ap-plat-label">${PLATFORMS_META[p].label}</span>
          </label>
        `).join('')}
      </div>

      <button class="ap-run-btn" onclick="_apRunAll()">
        ${icon('zap', 14)} Générer tous les posts
      </button>

      <div id="apResultsArea">${_apRenderResults()}</div>
    </div>`;
}

function _apRenderResults() {
  const platforms = Object.keys(_apResults).filter(k => k !== '_brand');
  if (!platforms.length) return '';
  return platforms.map(p => {
    const r = _apResults[p];
    const meta = PLATFORMS_META[p] || {};
    if (r.loading) {
      return `<div class="ap-result-block ap-result-loading-block">
        <div class="ap-result-header">${meta.icon || ''} ${meta.label || p}</div>
        <div class="ap-result-spinner">Génération en cours…</div>
      </div>`;
    }
    if (r.error) {
      return `<div class="ap-result-block ap-result-error-block">
        <div class="ap-result-header">${meta.icon || ''} ${meta.label || p}</div>
        <div class="ap-result-err-msg">❌ ${r.error}</div>
        <button class="ap-regen-btn" onclick="_apRegenPlatform('${r.brandKey}','${p}')">↺ Réessayer</button>
      </div>`;
    }
    return `<div class="ap-result-block">
      <div class="ap-result-header">${meta.icon || ''} ${meta.label || p}</div>
      <textarea class="ap-result-textarea" id="apRes-${p}">${r.text || ''}</textarea>
      <div class="ap-result-actions">
        <button class="ap-copy-btn" onclick="_apCopyResult('${p}')">📋 Copier</button>
        <button class="ap-regen-btn" onclick="_apRegenPlatform('${r.brandKey}','${p}')">↺ Regénérer</button>
      </div>
    </div>`;
  }).join('');
}

// ===== GENERATE ALL =====
async function _apRunAll() {
  const block = document.getElementById('autopilotBlock');
  if (!block) return;

  const brandEl = block.querySelector('input[name="apBrand"]:checked');
  const brandKey = brandEl ? brandEl.value : 'intelixa';
  const checked = [...block.querySelectorAll('input[name="apPlat"]:checked')].map(el => el.value);

  if (!checked.length) { alert('Coche au moins une plateforme !'); return; }

  // Mark all as loading
  _apResults = { _brand: brandKey };
  checked.forEach(p => { _apResults[p] = { loading: true, brandKey }; });

  const area = document.getElementById('apResultsArea');
  if (area) area.innerHTML = _apRenderResults();

  // Generate in parallel, update DOM as each completes
  await Promise.allSettled(checked.map(async p => {
    try {
      const text = await _apGenerateForPlatform(brandKey, p);
      _apResults[p] = { text, brandKey };
    } catch(e) {
      _apResults[p] = { error: e.message || 'Erreur inconnue', brandKey };
    }
    const area2 = document.getElementById('apResultsArea');
    if (area2) area2.innerHTML = _apRenderResults();
  }));
}

// ===== GENERATE FOR ONE PLATFORM =====
async function _apGenerateForPlatform(brandKey, platform) {
  const token = (document.getElementById('apiKeyInput')?.value
    || localStorage.getItem('cm_github_token') || '').trim();
  if (!token) throw new Error('Token manquant — colle ton token en haut.');

  const brand = BRAND_CONTEXT[brandKey];
  if (!brand) throw new Error('Marque inconnue');

  const _customRes = await window.storage.get('prompt-' + brandKey + '-' + platform);
  const platformPrompt = (_customRes && _customRes.value)
    ? _customRes.value
    : PLATFORM_PROMPTS[platform](brand);

  const resp = await fetch('https://models.inference.ai.azure.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: `Tu es un expert Community Manager pour ${brand.label}. ${brand.desc} Tu choisis toi-même l'angle le plus pertinent et tu génères le contenu prêt à publier pour ${platform}, sans commentaire ni explication.`
        },
        {
          role: 'user',
          content: `Choisis toi-même l'idée la plus pertinente du moment pour ${brand.label} sur ${platform}. Lance-toi directement dans le contenu, sans préciser le thème choisi au préalable.\n\n${platformPrompt}`
        }
      ]
    })
  });
  const data = await resp.json();
  if (!resp.ok || !data.choices) throw new Error(data?.error?.message || `HTTP ${resp.status}`);
  return data.choices[0].message.content.trim();
}

// ===== COPY =====
async function _apCopyResult(platform) {
  const ta = document.getElementById('apRes-' + platform);
  if (!ta) return;
  try {
    await navigator.clipboard.writeText(ta.value);
    const btn = ta.closest('.ap-result-block')?.querySelector('.ap-copy-btn');
    if (btn) { btn.textContent = '✓ Copié !'; setTimeout(() => btn.textContent = '📋 Copier', 2000); }
  } catch(e) {}
}

// ===== REGEN ONE =====
async function _apRegenPlatform(brandKey, platform) {
  _apResults[platform] = { loading: true, brandKey };
  const area = document.getElementById('apResultsArea');
  if (area) area.innerHTML = _apRenderResults();
  try {
    const text = await _apGenerateForPlatform(brandKey, platform);
    _apResults[platform] = { text, brandKey };
  } catch(e) {
    _apResults[platform] = { error: e.message || 'Erreur inconnue', brandKey };
  }
  const area2 = document.getElementById('apResultsArea');
  if (area2) area2.innerHTML = _apRenderResults();
}
