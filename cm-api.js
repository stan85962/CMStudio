// ===== API =====
function getGithubToken() {
  // Priorité : config.js → localStorage (fallback compatibilité)
  return (
    (typeof CONFIG !== 'undefined' && CONFIG.GITHUB_TOKEN ? CONFIG.GITHUB_TOKEN : '') ||
    localStorage.getItem('cm_github_token') ||
    ''
  ).trim();
}

function getBraveToken() {
  return (typeof CONFIG !== 'undefined' && CONFIG.BRAVE_TOKEN ? CONFIG.BRAVE_TOKEN : '').trim();
}

// ===== MODE VEILLE =====
let _veilleEnabled = false;

async function initVeille() {
  try {
    const r = await window.storage.get('veille-enabled');
    _veilleEnabled = r && r.value === 'true';
    const toggle = document.getElementById('veilleToggle');
    if (toggle) toggle.checked = _veilleEnabled;
  } catch(e) {}
}

function toggleVeille(enabled) {
  _veilleEnabled = enabled;
  window.storage.set('veille-enabled', String(enabled));
  if(typeof renderTemplates === 'function') renderTemplates();
}

function getVeillePrompt(brandKey) {
  if (brandKey === 'intelixa') {
    return ' Avant de générer, appuie-toi sur les tendances IA et bureautique les plus récentes que tu connais en 2025-2026. Ancre le contenu dans l\'actualité du secteur.';
  }
  return ' Avant de générer, appuie-toi sur les tendances actuelles de la petite enfance, les évolutions réglementaires et les sujets qui buzzent dans le secteur crèche en 2025-2026. Ancre le contenu dans l\'actualité du secteur.';
}

function _veilleHeaderBadge() {
  if (!_veilleEnabled) return '';
  return '<span class="veille-badge"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg> Veille active</span>';
}

// ===== CALL API CORE =====
async function callClaude(brand, theme, variant) {
  const token = getGithubToken();
  if(!token) throw new Error("Token GitHub manquant — colle ton token dans le champ 🔑 en haut de la page.");

  const _customRes = await window.storage.get('prompt-' + selectedBrand + '-' + selectedPlatform);
  const _platformPrompt = (_customRes && _customRes.value) ? _customRes.value : PLATFORM_PROMPTS[selectedPlatform](brand);

  const veilleInject = _veilleEnabled ? getVeillePrompt(selectedBrand) : '';

  const resp = await fetch('https://models.inference.ai.azure.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: `Tu es un expert Community Manager pour ${brand.label}. ${brand.desc} Génère uniquement le contenu demandé, prêt à publier, sans commentaire ni explication.${variant ? ' ' + variant + '.' : ''}${veilleInject}`
        },
        {
          role: 'user',
          content: `Thème : ${theme}\n\n${_platformPrompt}`
        }
      ]
    })
  });
  const data = await resp.json();
  if(!resp.ok || !data.choices) {
    throw new Error(data?.error?.message || `HTTP ${resp.status} — vérifie ton token GitHub`);
  }
  return data.choices[0].message.content.trim();
}

// ===== GENERATE IDEA ("J'ai pas d'idée") =====
async function generateIdea() {
  if(!selectedBrand) { alert('Choisis une marque !'); return; }
  if(!selectedPlatform) { alert('Choisis une plateforme !'); return; }

  const btn    = document.getElementById('ideaBtn');
  const genBtn = document.getElementById('generateBtn');
  btn.disabled = true;
  genBtn.disabled = true;
  btn.textContent = selectedBrand === 'intelixa' ? '[ INSPIRATION... ]' : '🌱 Inspiration...';
  document.getElementById('errorMsg').innerHTML = '';

  // Masquer l'ancien badge
  const badge = document.getElementById('ideaBadge');
  if(badge) badge.style.display = 'none';

  // Préparer la result box
  const brand   = BRAND_CONTEXT[selectedBrand];
  const meta    = PLATFORMS_META[selectedPlatform];
  const resultBox = document.getElementById('resultBox');
  resultBox.classList.add('visible');
  document.getElementById('resultHeader').innerHTML = meta.icon + `<div class="result-platform">${meta.label}</div>` + _veilleHeaderBadge();
  document.getElementById('resultSingle').style.display = 'block';
  document.getElementById('resultAB').style.display = 'none';
  document.getElementById('copyBtn').style.display = 'flex';
  document.getElementById('resultContent').innerHTML = '<span class="cursor"></span>';

  try {
    const token = getGithubToken();
    if(!token) throw new Error("Token GitHub manquant — colle ton token dans le champ 🔑 en haut de la page.");

    const veilleInject = _veilleEnabled ? getVeillePrompt(selectedBrand) : '';

    const ideaTheme = `Choisis toi-même l'idée la plus pertinente du moment pour ${brand.label} sur ${selectedPlatform}. Lance-toi directement dans le contenu, sans préciser le thème choisi au préalable.`;

    const resp = await fetch('https://models.inference.ai.azure.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: `Tu es un expert Community Manager pour ${brand.label}. ${brand.desc} Tu choisis toi-même l'angle le plus pertinent et tu génères le contenu prêt à publier pour ${selectedPlatform}, sans commentaire ni explication.${veilleInject}`
          },
          { role: 'user', content: ideaTheme }
        ]
      })
    });
    const data = await resp.json();
    if(!resp.ok || !data.choices) {
      throw new Error(data?.error?.message || `HTTP ${resp.status} — vérifie ton token GitHub`);
    }
    const postContent = data.choices[0].message.content.trim();

    // Extraire la 1re phrase non-vide comme label d'idée pour le badge + textarea
    const firstLine = postContent.split('\n').find(l => l.trim().length > 0) || '';
    const ideaLine = firstLine.replace(/^[*_#•\-–—]+\s*/, '').substring(0, 80).trim();

    // Auto-remplir le champ thème
    const themeEl = document.getElementById('theme');
    if(themeEl) themeEl.value = ideaLine;

    // Afficher le badge "Idée choisie"
    if(badge && ideaLine) {
      badge.textContent = '💡 Idée choisie : ' + ideaLine;
      badge.style.display = 'block';
    }

    // Afficher le contenu
    document.getElementById('resultContent').textContent = postContent;
    saveToHistory(ideaLine, postContent, 'IDÉE');
    updateStats();
    loadRecentDashboard();
    renderSEOPanel(postContent, selectedBrand);
    checkPostGenLength(postContent, selectedPlatform);

  } catch(err) {
    document.getElementById('errorMsg').innerHTML = `<div class="error-msg">❌ ${err.message}</div>`;
    document.getElementById('resultContent').textContent = '—';
  }

  btn.disabled = false;
  genBtn.disabled = false;
  btn.textContent = selectedBrand === 'intelixa' ? "[ PAS D'IDÉE ]" : "💡 J'ai pas d'idée";
}

// ===== GENERATE =====
async function generate() {
  if(!selectedBrand) { alert('Choisis une marque !'); return; }
  if(!selectedPlatform) { alert('Choisis une plateforme !'); return; }
  const theme = document.getElementById('theme').value.trim();
  if(!theme) { alert('Tape ton idee !'); return; }

  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  btn.textContent = selectedBrand==='intelixa' ? '[ GENERATION... ]' : '🌱 Génération...';
  document.getElementById('errorMsg').innerHTML = '';

  const resultBox = document.getElementById('resultBox');
  resultBox.classList.add('visible');
  const meta = PLATFORMS_META[selectedPlatform];
  document.getElementById('resultHeader').innerHTML = meta.icon + `<div class="result-platform">${meta.label}</div>` + _veilleHeaderBadge();

  if(abMode) {
    document.getElementById('resultSingle').style.display='none';
    document.getElementById('resultAB').style.display='block';
    document.getElementById('copyBtn').style.display='none';
    document.getElementById('abTextA').innerHTML='<span class="cursor"></span>';
    document.getElementById('abTextB').innerHTML='<span class="cursor"></span>';
  } else {
    document.getElementById('resultSingle').style.display='block';
    document.getElementById('resultAB').style.display='none';
    document.getElementById('copyBtn').style.display='flex';
    document.getElementById('resultContent').innerHTML='<span class="cursor"></span>';
  }

  try {
    const brand = BRAND_CONTEXT[selectedBrand];
    if(abMode) {
      const [rA, rB] = await Promise.all([
        callClaude(brand, theme, 'Version A - premier angle'),
        callClaude(brand, theme, 'Version B - angle completement different, style different')
      ]);
      document.getElementById('abTextA').textContent = rA;
      document.getElementById('abTextB').textContent = rB;
      saveToHistory(theme, rA, 'A/B');
      // Vérification divergence A/B
      const abSim = similarity(rA, rB);
      if(abSim > 0.60) {
        document.getElementById('errorMsg').innerHTML =
          `<div class="warn-msg">⚠️ Versions A et B trop similaires (${Math.round(abSim*100)}% mots communs) — relancer pour plus de divergence.</div>`;
      }
    } else {
      const result = await callClaude(brand, theme, '');
      document.getElementById('resultContent').textContent = result;
      saveToHistory(theme, result, '');
    }
    updateStats();
    loadRecentDashboard();
    // SEO analysis
    const textForSEO = abMode ? document.getElementById('abTextA').textContent : document.getElementById('resultContent').textContent;
    renderSEOPanel(textForSEO, selectedBrand);
    // Validation longueur post-génération
    checkPostGenLength(textForSEO, selectedPlatform);
  } catch(err) {
    document.getElementById('errorMsg').innerHTML = `<div class="error-msg">❌ ${err.message}</div>`;
    if(abMode) {
      document.getElementById('abTextA').textContent = '—';
      document.getElementById('abTextB').textContent = '—';
    } else {
      document.getElementById('resultContent').textContent = '—';
    }
  }

  btn.disabled = false;
  btn.textContent = selectedBrand==='intelixa' ? '[ GENERER ]' : '✨ Générer';
}
