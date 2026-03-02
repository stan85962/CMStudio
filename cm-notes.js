// ===== NOTES =====
const CATEGORIES = [
  { id:'all',           label:'Toutes',          iconName:'clipboardList', color:'#7fa882' },
  { id:'idee',          label:'Idées',           iconName:'lightbulb',    color:'#9c27b0' },
  { id:'a-publier',     label:'À publier',       iconName:'calendar',     color:'#2196f3' },
  { id:'a-retravailler',label:'À retravailler',  iconName:'pencil',       color:'#ff9800' },
  { id:'urgent',        label:'Urgent',          iconName:'flame',        color:'#f44336' },
  { id:'archive',       label:'Archive',         iconName:'archive',      color:'#9e9e9e' }
];

let activeNoteCat = 'all';
let openMoveId = null;
let notesView = 'notes';
let activeAccrochePlatform = 'all';

const notesKey = () => selectedBrand ? 'notes-'+selectedBrand : null;

function handleNoteKey(e) {
  if(e.key==='Enter' && !e.shiftKey) {
    e.preventDefault();
    if(!selectedBrand) { alert('Choisis une marque !'); return; }
    const text = document.getElementById('noteInput').value.trim();
    if(!text) return;
    const cat = document.getElementById('noteCatSelect').value || 'idee';
    saveNote(text, cat);
    document.getElementById('noteInput').value='';
  }
}

async function saveNote(text, cat='idee') {
  const notes = await getNotes();
  notes.unshift({
    id: Date.now(), text, cat,
    date: new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})
  });
  try { await window.storage.set(notesKey(), JSON.stringify(notes)); } catch(e){}
  renderNotes(notes); updateStats();
}

async function getNotes() {
  const k = notesKey(); if(!k) return [];
  try { const r=await window.storage.get(k); return r?JSON.parse(r.value):[]; } catch(e){return[];}
}

async function deleteNote(id) {
  const notes = (await getNotes()).filter(n=>n.id!==id);
  try { await window.storage.set(notesKey(), JSON.stringify(notes)); } catch(e){}
  renderNotes(notes); updateStats();
}

async function moveNote(id, newCat) {
  const notes = await getNotes();
  const n = notes.find(n=>n.id===id);
  if(n) n.cat = newCat;
  try { await window.storage.set(notesKey(), JSON.stringify(notes)); } catch(e){}
  openMoveId = null;
  renderNotes(notes);
}

function toggleMoveMenu(id, e) {
  e.stopPropagation();
  openMoveId = openMoveId===id ? null : id;
  // Re-render to show/hide dropdown
  getNotes().then(notes => renderNotes(notes));
}

function filterCat(catId) {
  activeNoteCat = catId;
  getNotes().then(renderNotes);
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  const tab = document.querySelector(`.cat-tab[data-cat="${catId}"]`);
  if(tab) {
    tab.classList.add('active');
    tab.style.background = CATEGORIES.find(c=>c.id===catId)?.color || 'var(--accent)';
  }
}

async function loadNotes() {
  const h = document.getElementById('notesHeader');
  if(!selectedBrand) {
    if(h) h.textContent='Mes Notes';
    document.getElementById('notesWall').innerHTML='<div class="empty-state">Choisis une marque pour voir tes notes</div>';
    document.getElementById('notesCatTabs').innerHTML='';
    if(notesView === 'accroches') renderAccroches();
    return;
  }
  if(h) h.innerHTML='Notes — '+(selectedBrand==='intelixa'?icon('zap',14)+' Intelixa':selectedBrand==='stan'?'👤 Stan':icon('leaf',14)+' Doudelio');
  if(notesView === 'accroches') { renderAccroches(); return; }
  const notes = await getNotes();
  renderCatTabs(notes);
  renderNotes(notes);
}

function renderCatTabs(notes) {
  const tabs = document.getElementById('notesCatTabs');
  if(!tabs) return;
  tabs.innerHTML = CATEGORIES.map(c => {
    const count = c.id==='all' ? notes.length : notes.filter(n=>n.cat===c.id).length;
    const isActive = activeNoteCat===c.id;
    return `<button class="cat-tab${isActive?' active':''}" data-cat="${c.id}"
      style="${isActive?'background:'+c.color+';border-color:'+c.color:''}"
      onclick="filterCat('${c.id}')">
      ${icon(c.iconName, 13)} ${c.label}
      <span class="cat-count">${count}</span>
    </button>`;
  }).join('');
}

function renderNotes(notes) {
  const wall = document.getElementById('notesWall');
  const filtered = activeNoteCat==='all' ? notes : notes.filter(n=>n.cat===activeNoteCat);

  renderCatTabs(notes);

  if(!filtered.length) {
    wall.innerHTML=`<div class="empty-state">Aucune note dans cette catégorie</div>`;
    return;
  }

  const CAT_COLORS = {
    'idee':'#e1bee7','a-publier':'#bbdefb','a-retravailler':'#ffe0b2',
    'urgent':'#ffcdd2','archive':'#f5f5f5'
  };

  wall.innerHTML = filtered.map(n => {
    const catInfo = CATEGORIES.find(c=>c.id===n.cat) || CATEGORIES[1];
    const bgColor = CAT_COLORS[n.cat] || '#fff9c4';
    const showMenu = openMoveId===n.id;
    const otherCats = CATEGORIES.filter(c=>c.id!=='all'&&c.id!==n.cat);
    return `<div class="postit" style="background:${bgColor};">
      <div class="postit-cat-badge">${icon(catInfo.iconName, 12)} ${catInfo.label}</div>
      <div class="postit-text">${n.text.replace(/\n/g,'<br>')}</div>
      <div class="postit-footer">
        <span class="postit-date">${n.date}</span>
        <div class="postit-actions" style="position:relative;">
          <button class="postit-move" onclick="toggleMoveMenu(${n.id},event)" title="Déplacer">${icon('arrowUpDown',14)}</button>
          <button class="postit-delete" onclick="deleteNote(${n.id})" title="Supprimer">${icon('x',14)}</button>
          ${showMenu ? `<div class="move-dropdown">
            ${otherCats.map(c=>`<div class="move-option" onclick="moveNote(${n.id},'${c.id}')">
              ${icon(c.iconName,13)} ${c.label}
            </div>`).join('')}
          </div>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

// ===== ACCROCHES =====
function setNotesView(view) {
  notesView = view;
  const btnNotes     = document.getElementById('notesViewNotes');
  const btnAccroches = document.getElementById('notesViewAccroches');
  const btnStan      = document.getElementById('notesViewStan');
  const inputArea    = document.querySelector('.note-input-area');
  const catTabs      = document.getElementById('notesCatTabs');
  const wall         = document.getElementById('notesWall');
  const accSection   = document.getElementById('accrocheSection');
  const stanSection  = document.getElementById('stanSection');

  if(btnNotes)     btnNotes.classList.toggle('active',     view === 'notes');
  if(btnAccroches) btnAccroches.classList.toggle('active', view === 'accroches');
  if(btnStan)      btnStan.classList.toggle('active',      view === 'stan');

  if(inputArea)  inputArea.style.display  = view === 'notes' ? '' : 'none';
  if(catTabs)    catTabs.style.display    = view === 'notes' ? '' : 'none';
  if(wall)       wall.style.display       = view === 'notes' ? '' : 'none';
  if(accSection) accSection.style.display = view === 'accroches' ? 'block' : 'none';
  if(stanSection) stanSection.style.display = view === 'stan' ? 'block' : 'none';

  if(view === 'accroches') renderAccroches();
  if(view === 'stan' && typeof loadStanSpace === 'function') loadStanSpace();
}

async function getAccroches() {
  if(!selectedBrand) return [];
  const key = 'accroches-' + selectedBrand;
  try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : []; } catch(e) { return []; }
}

async function deleteAccroche(id) {
  const key = 'accroches-' + selectedBrand;
  let accroches = await getAccroches();
  accroches = accroches.filter(a => a.id !== id);
  try { await window.storage.set(key, JSON.stringify(accroches)); } catch(e) {}
  renderAccroches();
}

async function copyAccroche(id) {
  const accroches = await getAccroches();
  const a = accroches.find(a => a.id === id);
  if(!a) return;
  try {
    await navigator.clipboard.writeText(a.text);
    const btn = document.querySelector(`.accroche-copy[data-id="${id}"]`);
    if(btn) { btn.innerHTML = icon('checkCircle',14); setTimeout(() => { btn.innerHTML = icon('copy',14); }, 1500); }
  } catch(e) {}
}

function filterAccroches(platform) {
  activeAccrochePlatform = platform;
  document.querySelectorAll('.accroche-filter-btn').forEach(b => b.classList.remove('active'));
  const active = document.querySelector(`.accroche-filter-btn[data-plat="${platform}"]`);
  if(active) active.classList.add('active');
  renderAccroches();
}

async function renderAccroches() {
  const section = document.getElementById('accrocheSection');
  if(!section) return;

  const all = await getAccroches();

  if(!selectedBrand) {
    section.innerHTML = '<div class="empty-state">Choisis une marque pour voir tes accroches</div>';
    return;
  }

  const platforms = [...new Set(all.map(a => a.platform))].filter(Boolean);
  const filtered  = activeAccrochePlatform === 'all' ? all : all.filter(a => a.platform === activeAccrochePlatform);

  // Use _platIcon from cm-historique.js (loaded before)

  const filtersHtml = `
    <div class="accroche-filters">
      <button class="accroche-filter-btn${activeAccrochePlatform==='all'?' active':''}" data-plat="all" onclick="filterAccroches('all')">Toutes</button>
      ${platforms.map(p => `<button class="accroche-filter-btn${activeAccrochePlatform===p?' active':''}" data-plat="${p}" onclick="filterAccroches('${p}')">${_platIcon(p)||'•'} ${p}</button>`).join('')}
    </div>
    <div class="accroche-count">${filtered.length} accroche${filtered.length !== 1 ? 's' : ''}</div>
  `;

  const listHtml = filtered.length
    ? `<div class="accroche-list">${filtered.map(a => `
        <div class="accroche-item">
          <div class="accroche-meta">
            <span class="accroche-plat">${_platIcon(a.platform)||'•'} ${a.platform}</span>
            <span class="accroche-date">${a.date}</span>
          </div>
          <div class="accroche-text">${a.text.replace(/</g,'&lt;')}</div>
          <div class="accroche-actions">
            <button class="accroche-copy" data-id="${a.id}" onclick="copyAccroche(${a.id})" title="Copier">${icon('copy',14)}</button>
            <button class="accroche-delete" onclick="deleteAccroche(${a.id})" title="Supprimer">${icon('x',14)}</button>
          </div>
        </div>`).join('')}
      </div>`
    : '<div class="empty-state">Aucune accroche sauvegardée</div>';

  section.innerHTML = filtersHtml + listHtml;
}
