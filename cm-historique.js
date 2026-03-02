// ===== HISTORIQUE =====
let _histAllItems = [];
let activeHistBrands = [];
let activeHistPlatforms = [];

function _platIcon(p) {
  return (typeof PLATFORMS_META !== 'undefined' && PLATFORMS_META[p]?.icon) || '';
}
function _platLabel(p) {
  if (typeof PLATFORMS_META === 'undefined' || !PLATFORMS_META[p]) return p;
  return PLATFORMS_META[p].label.split(' — ')[0];
}

async function saveToHistory(theme, content, type) {
  try {
    const key = 'history-'+(selectedBrand||'all');
    let hist = [];
    try { const r=await window.storage.get(key); if(r) hist=JSON.parse(r.value); } catch(e){}
    hist.unshift({
      id:Date.now(), theme, content:content.substring(0,1500),
      platform:selectedPlatform, brand:selectedBrand, type,
      date:new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})
    });
    if(hist.length>50) hist=hist.slice(0,50);
    await window.storage.set(key, JSON.stringify(hist));
  } catch(e){}
}

async function loadHistorique() {
  // Charger les deux marques + legacy history-all
  const allItems = [];
  for (const b of ['intelixa','doudelio']) {
    try {
      const r = await window.storage.get('history-'+b);
      if(r) allItems.push(...JSON.parse(r.value));
    } catch(e){}
  }
  try {
    const r = await window.storage.get('history-all');
    if(r) {
      const ids = new Set(allItems.map(x=>x.id));
      JSON.parse(r.value).forEach(x => { if(!ids.has(x.id)) allItems.push(x); });
    }
  } catch(e){}
  allItems.sort((a,b) => b.id - a.id);
  _histAllItems = allItems;

  const label = document.getElementById('histLabel');
  if(label) label.innerHTML = selectedBrand
    ? 'Historique — '+(selectedBrand==='intelixa'?icon('zap',14)+' Intelixa':icon('leaf',14)+' Doudelio')
    : 'Historique';

  _renderHistFilters(allItems);
  _renderHistList(_applyHistFilters(allItems));
}

function _applyHistFilters(items) {
  let out = items;
  if(activeHistBrands.length)    out = out.filter(h => activeHistBrands.includes(h.brand));
  if(activeHistPlatforms.length) out = out.filter(h => activeHistPlatforms.includes(h.platform));
  return out;
}

function _renderHistFilters(allItems) {
  const el = document.getElementById('histFilters');
  if(!el) return;
  const platforms = [...new Set(allItems.map(h=>h.platform).filter(Boolean))];
  const hasFilter = activeHistBrands.length || activeHistPlatforms.length;

  const brandBtns = ['intelixa','doudelio'].map(b => {
    const on = activeHistBrands.includes(b);
    return `<button class="hist-filter-btn${on?' active':''}" onclick="toggleHistBrand('${b}')">${b==='intelixa'?icon('zap',13)+' Intelixa':icon('leaf',13)+' Doudelio'}</button>`;
  }).join('');

  const platBtns = platforms.map(p => {
    const on = activeHistPlatforms.includes(p);
    return `<button class="hist-filter-btn${on?' active':''}" onclick="toggleHistPlatform('${p}')"><span class="hist-filter-plat-icon">${_platIcon(p)}</span>${_platLabel(p)}</button>`;
  }).join('');

  el.innerHTML = `<div class="hist-filters-row">
    ${brandBtns}
    ${platforms.length ? '<span class="hist-filter-sep"></span>' : ''}
    ${platBtns}
    ${hasFilter ? `<button class="hist-filter-reset" onclick="resetHistFilters()">${icon('x',12)} Tout afficher</button>` : ''}
  </div>`;
}

function _renderHistList(items) {
  const list = document.getElementById('historiqueList');
  if(!items.length) {
    list.innerHTML='<div class="empty-state">Aucune génération pour linstant</div>';
    return;
  }
  list.innerHTML = items.map(h => `
    <div class="recent-item hist-item" onclick="openHistModal(${h.id})">
      <div class="recent-icon">${_platIcon(h.platform)||PLATFORM_EMO[h.platform]||'•'}</div>
      <div class="recent-info">
        <div class="recent-platform">${_platLabel(h.platform)}${h.type?' · '+h.type:''}</div>
        <div class="recent-text">${h.theme}</div>
      </div>
      <span class="brand-badge badge-${h.brand}">${h.brand==='intelixa'?icon('zap',12):icon('leaf',12)}</span>
      <div class="recent-date">${h.date}</div>
      <div class="hist-item-actions" onclick="event.stopPropagation()">
        <button class="hist-copy-btn" onclick="copyHistItem(${h.id})" title="Copier le contenu">${icon('copy',14)}</button>
        <button class="hist-relaunch-btn" onclick="relaunchHistItem(${h.id})" title="Relancer ce thème">${icon('rotateCcw',14)}</button>
      </div>
    </div>
  `).join('');
}

function toggleHistBrand(brand) {
  const i = activeHistBrands.indexOf(brand);
  if(i===-1) activeHistBrands.push(brand); else activeHistBrands.splice(i,1);
  _renderHistFilters(_histAllItems);
  _renderHistList(_applyHistFilters(_histAllItems));
}

function toggleHistPlatform(platform) {
  const i = activeHistPlatforms.indexOf(platform);
  if(i===-1) activeHistPlatforms.push(platform); else activeHistPlatforms.splice(i,1);
  _renderHistFilters(_histAllItems);
  _renderHistList(_applyHistFilters(_histAllItems));
}

function resetHistFilters() {
  activeHistBrands = [];
  activeHistPlatforms = [];
  _renderHistFilters(_histAllItems);
  _renderHistList(_histAllItems);
}

async function copyHistItem(id) {
  const item = _histAllItems.find(h=>h.id===id);
  if(!item||!item.content) return;
  try {
    await navigator.clipboard.writeText(item.content);
    const btn = document.querySelector(`.hist-copy-btn[onclick="copyHistItem(${id})"]`);
    if(btn) { btn.innerHTML=icon('checkCircle',14); setTimeout(()=>{ btn.innerHTML=icon('copy',14); },1500); }
  } catch(e){}
}

function relaunchHistItem(id) {
  const item = _histAllItems.find(h=>h.id===id);
  if(!item) return;
  // Naviguer vers Studio
  const studioTab = document.querySelector('.nav-tab:nth-child(2)');
  if(studioTab) switchPage('studio', studioTab);
  // Sélectionner la marque
  const brandBtn = document.querySelector('.brand-btn.'+item.brand);
  if(brandBtn) selectBrand(item.brand, brandBtn);
  // Pré-remplir le thème
  const themeInput = document.getElementById('theme');
  if(themeInput) themeInput.value = item.theme;
  // Sélectionner la plateforme (après rendu)
  setTimeout(() => {
    const platBtn = [...document.querySelectorAll('.platform-btn')]
      .find(btn => (btn.getAttribute('onclick')||'').includes("'"+item.platform+"'"));
    if(platBtn) selectPlatform(item.platform, platBtn);
    if(themeInput) themeInput.scrollIntoView({behavior:'smooth',block:'center'});
  }, 120);
}

function openHistModal(id) {
  const item = _histAllItems.find(h=>h.id===id);
  if(!item) return;
  const modal = document.getElementById('histModal');
  if(!modal) return;
  const escaped = (item.content||'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\n/g,'<br>');
  modal.innerHTML = `
    <div class="hist-modal-backdrop" onclick="closeHistModal()"></div>
    <div class="hist-modal-box">
      <div class="hist-modal-header">
        <div class="hist-modal-title"><span class="hist-modal-plat-icon">${_platIcon(item.platform)}</span>${_platLabel(item.platform)} · ${item.brand==='intelixa'?icon('zap',12):icon('leaf',12)} · ${item.date}</div>
        <div class="hist-modal-actions">
          <button class="hist-modal-copy" id="histModalCopyBtn" onclick="copyHistModalContent(${id})">${icon('copy',14)} Copier</button>
          <button class="hist-modal-close" onclick="closeHistModal()">${icon('x',14)}</button>
        </div>
      </div>
      <div class="hist-modal-theme">${item.theme.replace(/</g,'&lt;')}</div>
      <div class="hist-modal-body">${escaped||'<em style="color:#aaa">Contenu non disponible (ancien item)</em>'}</div>
    </div>
  `;
  modal.style.display='flex';
}

function closeHistModal() {
  const modal = document.getElementById('histModal');
  if(modal) modal.style.display='none';
}

async function copyHistModalContent(id) {
  const item = _histAllItems.find(h=>h.id===id);
  if(!item||!item.content) return;
  try {
    await navigator.clipboard.writeText(item.content);
    const btn = document.getElementById('histModalCopyBtn');
    if(btn) { btn.innerHTML=icon('checkCircle',14)+' Copié'; setTimeout(()=>{ btn.innerHTML=icon('copy',14)+' Copier'; },1500); }
  } catch(e){}
}

async function loadRecentDashboard() {
  const key = 'history-'+(selectedBrand||'all');
  let hist = [];
  try { const r=await window.storage.get(key); if(r) hist=JSON.parse(r.value); } catch(e){}
  const list = document.getElementById('recentList');
  if(!list) return;
  if(!hist.length) { list.innerHTML='<div class="empty-state">Aucune génération pour linstant — go Studio !</div>'; return; }
  list.innerHTML = hist.slice(0,6).map(h=>`
    <div class="recent-item">
      <div class="recent-icon">${_platIcon(h.platform)||PLATFORM_EMO[h.platform]||'•'}</div>
      <div class="recent-info">
        <div class="recent-platform">${_platLabel(h.platform)}</div>
        <div class="recent-text">${h.theme}</div>
      </div>
      <span class="brand-badge badge-${h.brand}">${h.brand==='intelixa'?icon('zap',12):icon('leaf',12)}</span>
      <div class="recent-date">${h.date}</div>
    </div>
  `).join('');
}
