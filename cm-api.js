// ===== RÈGLES DE STYLE GLOBALES =====
const _STYLE_RULES = ` Règles de style impératives : n'utilise jamais d'astérisques (*, **), jamais d'émojis, jamais de tirets em (—) ni de tirets en milieu de phrase pour lister des idées (utilise des points ou des retours à la ligne à la place), vouvoie toujours le lecteur, n'utilise jamais "je" à la première personne.`;

function _cleanOutput(text) {
  return text
    .replace(/\*\*/g, '')   // retire les **gras**
    .replace(/\*/g, '')      // retire les *italique*
    .replace(/^—\s*/gm, '')  // retire les tirets em en début de ligne
    .replace(/\s—\s/g, ' ') // retire les tirets em inline
    .trim();
}

// ===== API =====
function getOpenAIToken() {
  return (
    (typeof CONFIG !== 'undefined' && CONFIG.OPENAI_TOKEN ? CONFIG.OPENAI_TOKEN : '') ||
    localStorage.getItem('cm_openai_token') ||
    ''
  ).trim();
}

function getGithubToken() {
  // Priorité : clé OpenAI → config.js GitHub → localStorage (fallback)
  return getOpenAIToken() || (
    (typeof CONFIG !== 'undefined' && CONFIG.GITHUB_TOKEN ? CONFIG.GITHUB_TOKEN : '') ||
    localStorage.getItem('cm_github_token') ||
    ''
  ).trim();
}

function _getAPIConfig() {
  const openaiToken = getOpenAIToken();
  if (openaiToken) {
    return {
      endpoint: 'https://api.openai.com/v1/chat/completions',
      token: openaiToken
    };
  }
  return {
    endpoint: 'https://models.inference.ai.azure.com/chat/completions',
    token: getGithubToken()
  };
}

function getBraveToken() {
  return (typeof CONFIG !== 'undefined' && CONFIG.BRAVE_TOKEN ? CONFIG.BRAVE_TOKEN : '').trim();
}

function getAnthropicToken() {
  return (
    (typeof CONFIG !== 'undefined' && CONFIG.ANTHROPIC_TOKEN ? CONFIG.ANTHROPIC_TOKEN : '') ||
    localStorage.getItem('cm_anthropic_token') ||
    ''
  ).trim();
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

// ===== SEO/AEO CONTRAINTES PROMPT =====
const _IDEAL_LENGTHS = {
  linkedin:[1500,3000], instagram:[800,2200], gmb:[250,1500],
  facebook:[400,1200], tiktok:[100,500], pinterest:[200,500],
  spotify:[200,800], brevo:[500,2000], youtube:[500,3000]
};

function _lengthConstraint(platform) {
  const [min, max] = _IDEAL_LENGTHS[platform] || [200, 1500];
  return ` Longueur idéale : ${min}–${max} caractères.`;
}

// ===== ADN CONTEXT =====
const _ADN_KEYS = ['entreprise','cible','ton','offres','concurrents','signature','tabous'];
const _ADN_KEY_LABELS = {
  entreprise:"L'entreprise", cible:"Client idéal", ton:"Ton et style",
  offres:"Offres", concurrents:"Concurrents", signature:"Phrases signature", tabous:"À ne jamais dire"
};

async function buildADNContext(brandId) {
  if (!brandId) return '';
  let context = '';
  for (const s of _ADN_KEYS) {
    const r = await window.storage.get(`adn-${brandId}-${s}`);
    if (r && r.value && r.value.trim()) context += `\n[${_ADN_KEY_LABELS[s]}] ${r.value.trim()}`;
  }
  return context ? `\n\nCONTEXTE DE MARQUE :${context}` : '';
}

// ===== CALL API CORE =====
async function callClaude(brand, theme, variant) {
  const token = getGithubToken();
  if(!token) throw new Error("Token GitHub manquant — colle ton token dans le champ 🔑 en haut de la page.");

  const _customRes = await window.storage.get('prompt-' + selectedBrand + '-' + selectedPlatform);
  let _platformPrompt;
  if (_customRes && _customRes.value) {
    _platformPrompt = _customRes.value;
  } else if (window._currentCustomBrand?.prompts?.[selectedPlatform]) {
    _platformPrompt = window._currentCustomBrand.prompts[selectedPlatform];
  } else if (typeof PLATFORM_PROMPTS !== 'undefined' && PLATFORM_PROMPTS[selectedPlatform]) {
    _platformPrompt = PLATFORM_PROMPTS[selectedPlatform](brand);
  } else {
    _platformPrompt = `Génère du contenu pour ${brand.label || selectedBrand} sur ${selectedPlatform}. Prêt à publier, sans commentaire.`;
  }

  const veilleInject = _veilleEnabled ? getVeillePrompt(selectedBrand) : '';
  const seoInject = _lengthConstraint(selectedPlatform);
  const adnContext = await buildADNContext(selectedBrand);

  // Starred posts injection
  let _starredPostsText = '';
  try {
    const rStarred = await window.storage.get('posts-starred-' + selectedBrand);
    if (rStarred && rStarred.value) {
      const starredIds = JSON.parse(rStarred.value);
      if (starredIds.length) {
        const rHist = await window.storage.get('history-' + selectedBrand);
        if (rHist && rHist.value) {
          const hist = JSON.parse(rHist.value);
          const starred = hist
            .filter(h => starredIds.includes(h.id) && h.platform === selectedPlatform && h.content)
            .slice(0, 3);
          if (starred.length) {
            _starredPostsText = '\n\nEXEMPLES DE POSTS RÉUSSIS (favoris) :\n' + starred.map((h,i) => `[${i+1}] Thème "${h.theme}" :\n${h.content.substring(0,400)}`).join('\n---\n');
          }
        }
      }
    }
  } catch(e) {}

  const apiCfg = _getAPIConfig();
  if(!apiCfg.token) throw new Error("Clé API manquante — ajoute ta clé OpenAI dans config.js.");

  const resp = await fetch(apiCfg.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiCfg.token}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: brand.systemPrompt
            ? `${brand.systemPrompt}${adnContext} Génère uniquement le contenu demandé, prêt à publier, sans commentaire ni explication.${variant ? ' ' + variant + '.' : ''}${veilleInject}${seoInject}${_starredPostsText}${_STYLE_RULES}`
            : `Tu es un expert Community Manager pour ${brand.label}. ${brand.desc}${adnContext} Génère uniquement le contenu demandé, prêt à publier, sans commentaire ni explication.${variant ? ' ' + variant + '.' : ''}${veilleInject}${seoInject}${_starredPostsText}${_STYLE_RULES}`
        },
        {
          role: 'user',
          content: await (async () => {
            let ctx = '';
            try {
              const keyDate = 'contexte-date-' + selectedBrand;
              const keyCtx  = 'contexte-du-jour-' + selectedBrand;
              const todayStr = new Date().toISOString().slice(0, 10);
              const rDate = await window.storage.get(keyDate);
              if (rDate && rDate.value === todayStr) {
                const rCtx = await window.storage.get(keyCtx);
                if (rCtx && rCtx.value && rCtx.value.trim()) ctx = 'Contexte du jour : ' + rCtx.value.trim() + '\n\n';
              }
            } catch(e) {}
            return ctx + `Thème : ${theme}\n\n${_platformPrompt}`;
          })()
        }
      ]
    })
  });
  const data = await resp.json();
  if(!resp.ok || !data.choices) {
    throw new Error(data?.error?.message || `HTTP ${resp.status} — vérifie ta clé API`);
  }
  return _cleanOutput(data.choices[0].message.content.trim());
}

// ===== CALL CLAUDE VISION (Caption Visuel) =====
async function callClaudeVision(brand, images, platform, context) {
  const token = getGithubToken();
  if (!token) throw new Error("Token GitHub manquant — colle ton token dans le champ 🔑 en haut de la page.");

  const seoInject = _lengthConstraint(platform);
  const adnContext = await buildADNContext(selectedBrand);

  const platLabel = (typeof PLATFORMS_META !== 'undefined' && PLATFORMS_META[platform])
    ? PLATFORMS_META[platform].label
    : platform;

  const platInstructions = `Génère une caption percutante et optimisée pour ${platLabel}, prête à publier, sans commentaire ni explication.`;

  const apiCfg = _getAPIConfig();
  if (!apiCfg.token) throw new Error("Clé API manquante — ajoute ta clé OpenAI dans config.js.");

  const resp = await fetch(apiCfg.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiCfg.token}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: brand.systemPrompt
            ? `${brand.systemPrompt}${adnContext} Génère uniquement la caption demandée, prête à publier, sans commentaire.${seoInject}${_STYLE_RULES}`
            : `Tu es un expert Community Manager pour ${brand.label || selectedBrand}.${adnContext} Génère uniquement la caption demandée, prête à publier, sans commentaire.${seoInject}${_STYLE_RULES}`
        },
        {
          role: 'user',
          content: [
            ...images.map(img => ({
              type: 'image_url',
              image_url: { url: img.dataUrl }
            })),
            {
              type: 'text',
              text: `${context ? 'Contexte : ' + context + '\n\n' : ''}Analyse ${images.length > 1 ? 'ces ' + images.length + ' visuels' : 'ce visuel'} et génère une caption pour ${platLabel}.\n\n${platInstructions}`
            }
          ]
        }
      ]
    })
  });

  const data = await resp.json();
  if (!resp.ok || !data.choices) throw new Error(data?.error?.message || `HTTP ${resp.status}`);
  return _cleanOutput(data.choices[0].message.content.trim());
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
  document.getElementById('copyBtn').style.display = 'flex';
  document.getElementById('resultContent').innerHTML = '<span class="cursor"></span>';

  try {
    const apiCfg = _getAPIConfig();
    if(!apiCfg.token) throw new Error("Clé API manquante — ajoute ta clé OpenAI dans config.js.");

    const veilleInject = _veilleEnabled ? getVeillePrompt(selectedBrand) : '';
    const seoInject = _lengthConstraint(selectedPlatform);
    const adnContext = await buildADNContext(selectedBrand);

    const ideaTheme =`Choisis toi-même l'idée la plus pertinente du moment pour ${brand.label} sur ${selectedPlatform}. Lance-toi directement dans le contenu, sans préciser le thème choisi au préalable.`;

    const resp = await fetch(apiCfg.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiCfg.token}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: brand.systemPrompt
              ? `${brand.systemPrompt}${adnContext} Tu choisis toi-même l'angle le plus pertinent et tu génères le contenu prêt à publier pour ${selectedPlatform}, sans commentaire ni explication.${veilleInject}${seoInject}${_STYLE_RULES}`
              : `Tu es un expert Community Manager pour ${brand.label}. ${brand.desc}${adnContext} Tu choisis toi-même l'angle le plus pertinent et tu génères le contenu prêt à publier pour ${selectedPlatform}, sans commentaire ni explication.${veilleInject}${seoInject}${_STYLE_RULES}`
          },
          { role: 'user', content: ideaTheme }
        ]
      })
    });
    const data = await resp.json();
    if(!resp.ok || !data.choices) {
      throw new Error(data?.error?.message || `HTTP ${resp.status} — vérifie ta clé API`);
    }
    const postContent = _cleanOutput(data.choices[0].message.content.trim());

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

  document.getElementById('resultSingle').style.display='block';
  document.getElementById('copyBtn').style.display='flex';
  document.getElementById('resultContent').innerHTML='<span class="cursor"></span>';

  try {
    const brand = BRAND_CONTEXT[selectedBrand];
    const result = await callClaude(brand, theme, '');
    document.getElementById('resultContent').textContent = result;
    saveToHistory(theme, result, '');
    updateStats();
    loadRecentDashboard();
    checkPostGenLength(document.getElementById('resultContent').textContent, selectedPlatform);
  } catch(err) {
    document.getElementById('errorMsg').innerHTML = `<div class="error-msg">❌ ${err.message}</div>`;
    document.getElementById('resultContent').textContent = '—';
  }

  btn.disabled = false;
  btn.textContent = selectedBrand==='intelixa' ? '[ GENERER ]' : '✨ Générer';
}


// ===== GÉNÉRATION D'IMAGE DALL-E 3 =====
async function generateImage() {
  const text = document.getElementById('resultContent')?.textContent || '';

  if (!text || text === '—' || text.length < 10) {
    alert('Génère d\'abord un post !');
    return;
  }

  const apiCfg = _getAPIConfig();
  if (!apiCfg.token) { alert('Clé API OpenAI manquante — vérifie config.js'); return; }

  const btn = document.getElementById('genImgBtn');
  const block = document.getElementById('imageBlock');

  const sizeMap = {
    instagram: '1024x1024', facebook: '1024x1024', gmb: '1024x1024',
    tiktok: '1024x1792', pinterest: '1024x1792',
    linkedin: '1792x1024', youtube: '1792x1024',
    spotify: '1024x1024', brevo: '1024x1024'
  };
  const size = sizeMap[selectedPlatform] || '1024x1024';
  const brand = (typeof BRAND_CONTEXT !== 'undefined' && BRAND_CONTEXT[selectedBrand]) || {};
  const platLabel = (typeof PLATFORMS_META !== 'undefined' && PLATFORMS_META[selectedPlatform])
    ? PLATFORMS_META[selectedPlatform].label : selectedPlatform;

  btn.disabled = true;
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation:tplSpin .8s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Génération…`;
  block.style.display = 'block';
  block.innerHTML = `<div class="img-loading"><div class="img-loading-spinner"></div><span>DALL-E 3 génère ton visuel…</span></div>`;

  try {
    // Étape 1 : GPT génère le prompt DALL-E en anglais
    const promptResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiCfg.token}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 200,
        messages: [
          { role: 'system', content: 'You write concise DALL-E 3 image prompts in English for professional social media visuals. Reply ONLY with the prompt, no explanation. No text in the image. Style: clean, modern, professional photography or flat design.' },
          { role: 'user', content: `Write a DALL-E 3 prompt for a ${platLabel} visual for the brand "${brand.label || 'Intelixa'}". Based on this post:\n\n${text.substring(0, 600)}` }
        ]
      })
    });
    const promptData = await promptResp.json();
    if (!promptResp.ok) throw new Error(promptData?.error?.message || `HTTP ${promptResp.status}`);
    const imgPrompt = promptData.choices[0].message.content.trim();

    // Étape 2 : DALL-E 3 génère l'image
    const imgResp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiCfg.token}` },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: imgPrompt,
        n: 1,
        size,
        quality: 'standard'
      })
    });
    const imgData = await imgResp.json();
    if (!imgResp.ok) throw new Error(imgData?.error?.message || `HTTP ${imgResp.status}`);

    const url = imgData.data[0].url;
    const revisedPrompt = imgData.data[0].revised_prompt || imgPrompt;

    block.innerHTML = `
      <div class="img-result">
        <img src="${url}" alt="Visuel généré" class="img-result-img" crossorigin="anonymous">
        <div class="img-result-meta">
          <span class="img-result-size">${size} · DALL-E 3</span>
          <div class="img-result-actions">
            <a href="${url}" download="intelixa-${selectedPlatform}.png" class="img-dl-btn" target="_blank">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Télécharger
            </a>
            <button class="img-regen-btn" onclick="generateImage()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
              Regénérer
            </button>
          </div>
          <p class="img-prompt-text">${revisedPrompt.substring(0, 150)}…</p>
        </div>
      </div>`;
  } catch(e) {
    block.innerHTML = `<div class="img-error">❌ ${e.message}</div>`;
  }

  btn.disabled = false;
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg> Image IA`;
}
