// ===== STAN CHEZ INTELIXA =====

let _stanDupeTimer = null;
let _stanAISortOpen = false;
let _stanEditingId = null;

// ---- Storage ----
async function _stanGet() {
  try {
    const r = await window.storage.get('stan-ideas');
    return r ? JSON.parse(r.value) : [];
  } catch(e) { return []; }
}
async function _stanSave(ideas) {
  try { await window.storage.set('stan-ideas', JSON.stringify(ideas)); } catch(e) {}
}

// ---- Entry point ----
async function loadStanSpace() {
  const section = document.getElementById('stanSection');
  if (!section) return;

  section.innerHTML = `
    <div id="stanPerfAlerts" class="stan-perf-alerts"></div>
    <div class="stan-input-area">
      <textarea id="stanInput" class="stan-textarea"
        placeholder="Ajoute une idée… (Entrée pour valider, Shift+Entrée pour un saut de ligne)"
        oninput="_stanDupeCheck()"
        onkeydown="handleStanKey(event)"
        rows="3"></textarea>
      <input type="text" id="stanContext" class="stan-context-input"
        placeholder="Source / contexte… (optionnel — vu sur le compte de X, inspiré par…)">
      <button class="stan-add-btn" onclick="stanAddFromInput()">+ Ajouter</button>
    </div>
    <div id="stanDupAlert" class="stan-dup-alert" style="display:none;"></div>
    <div id="stanList"></div>
    <div class="stan-ai-section">
      <button class="stan-ai-btn" id="stanAIBtn" onclick="toggleStanAISort()">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
        Voir les idées triées par l'IA
      </button>
      <div id="stanAIResult" style="display:none;"></div>
    </div>
  `;

  const ideas = await _stanGet();
  _renderStanList(ideas);
  _stanCheckPerfAlerts(ideas);
}

// ---- Keyboard ----
function handleStanKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    stanAddFromInput();
  }
}

// ---- Add ----
async function stanAddFromInput() {
  const input = document.getElementById('stanInput');
  if (!input || !input.value.trim()) return;
  clearTimeout(_stanDupeTimer);
  const dupAlert = document.getElementById('stanDupAlert');
  if (dupAlert) dupAlert.style.display = 'none';

  const ctxInput = document.getElementById('stanContext');
  const ideas = await _stanGet();
  ideas.unshift({
    id: Date.now(),
    text: input.value.trim(),
    context: ctxInput ? ctxInput.value.trim() : '',
    done: false,
    date: new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
  });
  await _stanSave(ideas);
  input.value = '';
  if (ctxInput) ctxInput.value = '';
  _renderStanList(ideas);
}

// ---- Duplicate detection (on input, 600ms) ----
function _stanDupeCheck() {
  clearTimeout(_stanDupeTimer);
  _stanDupeTimer = setTimeout(_stanRunDupeCheck, 600);
}

async function _stanRunDupeCheck() {
  const input    = document.getElementById('stanInput');
  const dupAlert = document.getElementById('stanDupAlert');
  if (!input || !dupAlert) return;
  const text = input.value.trim();
  if (text.length < 5) { dupAlert.style.display = 'none'; return; }

  const ideas = await _stanGet();
  const matches = ideas
    .map(i => ({ ...i, score: similarity(text, i.text) }))
    .filter(m => m.score >= 0.35)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  if (!matches.length) { dupAlert.style.display = 'none'; return; }

  dupAlert.style.display = 'block';
  dupAlert.innerHTML = `
    <div class="stan-dup-title">💡 Idée similaire déjà dans ta liste :</div>
    ${matches.map(m => `
      <div class="stan-dup-match">
        <span class="stan-dup-match-text">"${m.text.substring(0,90).replace(/</g,'&lt;')}${m.text.length > 90 ? '…' : ''}"</span>
        <a href="#" class="stan-dup-scroll" onclick="_stanScrollToIdea(${m.id});return false;">↗ Voir</a>
      </div>
    `).join('')}
  `;
}

function _stanScrollToIdea(id) {
  const el = document.getElementById('stan-item-' + id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('stan-highlight');
  setTimeout(() => el.classList.remove('stan-highlight'), 1600);
}

// ---- Toggle done ----
async function toggleStanDone(id) {
  const ideas = await _stanGet();
  const item = ideas.find(i => i.id === id);
  if (item) {
    item.done = !item.done;
    if (item.done && !item.publishedAt) item.publishedAt = Date.now();
  }
  await _stanSave(ideas);
  _renderStanList(ideas);
  _stanCheckPerfAlerts(ideas);
}

// ---- Delete ----
async function deleteStanIdea(id) {
  let ideas = await _stanGet();
  ideas = ideas.filter(i => i.id !== id);
  await _stanSave(ideas);
  _renderStanList(ideas);
  _stanCheckPerfAlerts(ideas);
}

// ---- Perf helpers ----
function _getRatingSync(id) {
  try { return JSON.parse(localStorage.getItem('stan-perf-' + id)); } catch(e) { return null; }
}

async function saveStanRating(id, rating) {
  const map = { '🔥': 'top', '👍': 'bien', '😐': 'moyen', '👎': 'flop' };
  await window.storage.set('stan-perf-' + id, JSON.stringify({
    rating,
    ratingClass: map[rating] || 'moyen',
    ratedAt: Date.now()
  }));
  const ideas = await _stanGet();
  _renderStanList(ideas);
  _stanCheckPerfAlerts(ideas);
}

async function _stanCheckPerfAlerts(ideas) {
  const alertsEl = document.getElementById('stanPerfAlerts');
  if (!alertsEl) return;
  const SEVEN_DAYS = 7 * 86400000;
  const now = Date.now();
  const pending = [];
  for (const idea of ideas) {
    if (!idea.publishedAt || now - idea.publishedAt < SEVEN_DAYS) continue;
    const r = await window.storage.get('stan-perf-' + idea.id);
    if (r) continue;
    pending.push(idea);
  }
  if (!pending.length) { alertsEl.innerHTML = ''; return; }
  alertsEl.innerHTML = pending.map(idea => `
    <div class="stan-perf-alert">
      <div class="stan-perf-alert-msg">
        Cette idée a-t-elle marché ?<br>
        <em>"${idea.text.substring(0, 70).replace(/</g,'&lt;')}${idea.text.length > 70 ? '…' : ''}"</em>
      </div>
      <div class="stan-perf-rating-btns">
        <button class="stan-perf-rating-btn top"   onclick="saveStanRating(${idea.id},'🔥')">🔥 Top</button>
        <button class="stan-perf-rating-btn bien"  onclick="saveStanRating(${idea.id},'👍')">👍 Bien</button>
        <button class="stan-perf-rating-btn moyen" onclick="saveStanRating(${idea.id},'😐')">😐 Moyen</button>
        <button class="stan-perf-rating-btn flop"  onclick="saveStanRating(${idea.id},'👎')">👎 Flop</button>
      </div>
    </div>
  `).join('');
}

// ---- Render (chronological, no filter) ----
function _renderStanList(ideas) {
  const list = document.getElementById('stanList');
  if (!list) return;

  const total = ideas.length;
  const done  = ideas.filter(i => i.done).length;

  if (!total) {
    list.innerHTML = '<div class="empty-state">Aucune idée pour linstant — commence !</div>';
    return;
  }

  list.innerHTML = `
    <div class="stan-list-header">
      <span class="stan-list-count">${total} idée${total > 1 ? 's' : ''}</span>
      <span class="stan-list-done">${done} faite${done > 1 ? 's' : ''}</span>
    </div>
    ${ideas.map(i => {
      const perf = _getRatingSync(i.id);
      const badge = perf ? `<span class="stan-perf-badge ${perf.ratingClass}">${perf.rating}</span>` : '';
      if (_stanEditingId === i.id) {
        const safeCtx = (i.context || '').replace(/</g,'&lt;').replace(/"/g,'&quot;');
        return `
          <div class="stan-idea-item stan-editing" id="stan-item-${i.id}">
            <textarea class="stan-edit-area" id="stan-edit-${i.id}" rows="3">${i.text.replace(/</g,'&lt;')}</textarea>
            <input type="text" class="stan-edit-context" id="stan-edit-ctx-${i.id}" value="${safeCtx}" placeholder="Source / contexte… (optionnel)">
            <div class="stan-edit-actions">
              <button class="stan-edit-save-btn" onclick="saveStanEdit(${i.id})">Valider</button>
              <button class="stan-edit-cancel-btn" onclick="cancelStanEdit()">Annuler</button>
            </div>
          </div>
        `;
      }
      return `
        <div class="stan-idea-item${i.done ? ' stan-done' : ''}" id="stan-item-${i.id}">
          <label class="stan-check-label" title="${i.done ? 'Marquer comme à faire' : 'Marquer comme fait'}">
            <input type="checkbox" class="stan-checkbox" ${i.done ? 'checked' : ''} onchange="toggleStanDone(${i.id})">
            <span class="stan-check-box"></span>
          </label>
          <div class="stan-idea-body">
            <div class="stan-idea-text">${i.text.replace(/</g,'&lt;').replace(/\n/g,'<br>')}</div>
            ${i.context ? `<div class="stan-idea-context">${i.context.replace(/</g,'&lt;')}</div>` : ''}
            <div class="stan-idea-date">${i.date}${badge}</div>
          </div>
          <div class="stan-item-actions">
            <button class="stan-edit-btn" onclick="editStanIdea(${i.id})" title="Modifier">${icon('pencil', 13)}</button>
            <button class="stan-delete-btn" onclick="deleteStanIdea(${i.id})" title="Supprimer">${icon('x', 13)}</button>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

// ---- Inline edit ----
function editStanIdea(id) {
  _stanEditingId = id;
  _stanGet().then(_renderStanList);
  // Focus textarea after render
  setTimeout(() => {
    const ta = document.getElementById('stan-edit-' + id);
    if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
  }, 30);
}

async function saveStanEdit(id) {
  const ta = document.getElementById('stan-edit-' + id);
  if (!ta) { cancelStanEdit(); return; }
  const newText = ta.value.trim();
  if (!newText) return;

  const ctxInput = document.getElementById('stan-edit-ctx-' + id);
  const ideas = await _stanGet();
  const item = ideas.find(i => i.id === id);
  if (item) {
    item.text = newText;
    item.context = ctxInput ? ctxInput.value.trim() : (item.context || '');
  }
  _stanEditingId = null;
  await _stanSave(ideas);
  _renderStanList(ideas);

  // Re-run dup check on new text
  const input = document.getElementById('stanInput');
  if (input && input.value.trim().length >= 5) _stanRunDupeCheck();
}

function cancelStanEdit() {
  _stanEditingId = null;
  _stanGet().then(_renderStanList);
}

// ---- AI Sort ----
async function toggleStanAISort() {
  const result = document.getElementById('stanAIResult');
  const btn    = document.getElementById('stanAIBtn');
  if (!result || !btn) return;

  if (_stanAISortOpen) {
    result.style.display = 'none';
    _stanAISortOpen = false;
    btn.innerHTML = btn.innerHTML.replace(/▲.*$/, '') + ' Voir les idées triées par l\'IA';
    return;
  }

  const ideas = await _stanGet();
  const todo  = ideas.filter(i => !i.done);
  _stanAISortOpen = true;
  result.style.display = 'block';

  if (!todo.length) {
    result.innerHTML = '<div class="empty-state">Aucune idée à trier (toutes cochées).</div>';
    return;
  }

  result.innerHTML = `<div class="stan-ai-loading">${icon('sparkles', 14)} Analyse en cours…</div>`;

  try {
    const classified = await _stanCallAISort(todo);
    _renderStanAIResult(classified);
  } catch(e) {
    result.innerHTML = `<div class="stan-ai-error">❌ ${e.message}</div>`;
    _stanAISortOpen = false;
  }
}

async function _stanCallAISort(ideas) {
  const token = getGithubToken();
  if (!token) throw new Error('Token GitHub manquant — colle ton token en haut de la page');

  const list   = ideas.map((i, n) => `${n + 1}. ${i.text}`).join('\n');
  const prompt = `Classe ces idées de contenu social media dans ces catégories exactes : POV, Tutorial, Controverse, Question, Storytelling, Autre.\n\nIdées à classer :\n${list}\n\nRéponds UNIQUEMENT en JSON valide sans markdown avec ce format exact :\n{"POV":[],"Tutorial":[],"Controverse":[],"Question":[],"Storytelling":[],"Autre":[]}`;

  const resp = await fetch('https://models.inference.ai.azure.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 800,
      messages: [
        { role: 'system', content: 'Tu es un expert en stratégie de contenu social media. Tu réponds uniquement en JSON valide, sans markdown ni commentaire.' },
        { role: 'user', content: prompt }
      ]
    })
  });

  const data = await resp.json();
  if (!resp.ok || !data.choices) throw new Error(data?.error?.message || `HTTP ${resp.status} — vérifie ton token`);

  const raw = data.choices[0].message.content.trim();
  try {
    return JSON.parse(raw);
  } catch(e) {
    // Try extracting JSON block if model added markdown
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Réponse IA invalide — réessaie');
  }
}

const _STAN_AI_CATS = ['POV', 'Tutorial', 'Controverse', 'Question', 'Storytelling', 'Autre'];
const _STAN_CAT_ICONS = { POV:'👁', Tutorial:'📖', Controverse:'⚡', Question:'❓', Storytelling:'💬', Autre:'📌' };

function _renderStanAIResult(classified) {
  const result = document.getElementById('stanAIResult');
  const cats   = _STAN_AI_CATS.filter(c => classified[c]?.length > 0);

  if (!cats.length) {
    result.innerHTML = '<div class="empty-state">Aucun résultat — réessaie.</div>';
    return;
  }

  result.innerHTML = `
    <div class="stan-ai-notice">${icon('info', 12)} Vue lecture seule — ta liste brute n'est pas modifiée</div>
    <div class="stan-ai-cats">
      ${cats.map(cat => `
        <div class="stan-ai-cat">
          <div class="stan-ai-cat-title">${_STAN_CAT_ICONS[cat]} ${cat} <span class="stan-ai-cat-count">${classified[cat].length}</span></div>
          <ul class="stan-ai-cat-list">
            ${classified[cat].map(t => `<li>${t.replace(/</g,'&lt;')}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
  `;
}
