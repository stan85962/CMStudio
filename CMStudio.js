// ===== STORAGE POLYFILL (localStorage wrapper) =====
window.storage = {
  get: async (key) => {
    try {
      const value = localStorage.getItem(key);
      return value !== null ? { value } : null;
    } catch(e) { return null; }
  },
  set: async (key, value) => {
    try { localStorage.setItem(key, value); } catch(e) {}
  }
};

// ===== STATE =====
let selectedBrand = null;
let selectedPlatform = null;
let abMode = true;

// ===== DATA =====
const TEMPLATES = {
  intelixa: {
    tiktok:    ['IA qui remplace une tâche bureau','Excel automatisé en 30 secondes','Formation CPF depuis son canapé','Un dirigeant qui gagne 2h par jour'],
    linkedin:  ['Pourquoi les TPE ignorent encore lIA','3 outils IA gratuits pour indépendants','Excel vs automatisation en 2026','Ce que ChatGPT ne fera jamais à ta place'],
    instagram: ['Avant/après automatisation bureau','Routine matinale dun entrepreneur digitalisé','Formation CPF = investissement ou gadget ?','IA et comptabilité : mythe ou réalité'],
    gmb:       ['Formation Excel pour TPE','Automatisation comptabilité micro-entreprise','IA pour gagner du temps en gestion','Digitalisation TPE sans budget IT'],
    facebook:  ['Question : vous utilisez lIA au bureau ?','Témoignage dirigeant TPE et automatisation','Astuce Excel qui change tout','Formation bureautique finançable CPF'],
    pinterest: ['Infographie automatisation TPE','Checklist formation IA entrepreneur','Guide digitalisation PME 2026','Schéma productivité dirigeant'],
    spotify:   ['Episode : IA pour les nuls en entreprise','Témoignage : 10h gagnées par semaine','Formation CPF : par où commencer ?','Automatisation sans coder : cest possible'],
    brevo:     ['Newsletter : outils IA du mois','Email : nouvelle formation disponible','Campagne : CPF avant fin dannée','Recap : astuces productivité semaine']
  },
  doudelio: {
    tiktok:    ['Journée type auxiliaire de puéricultrice','Geste qui calme un enfant qui pleure','Activité motricité 18 mois facile','Quand un tout-petit refuse de dormir'],
    linkedin:  ['Burn-out en crèche : parlons-en vraiment','Recrutement auxiliaire en 2026 : galère ?','Formation continue en petite enfance','Management bienveillant en structure daccueil'],
    instagram: ['Carousel activité éveil 0-3 ans','Idée déco coin lecture crèche','Routine accueil matin en crèche','Tenue Doudelio pour les pros du terrain'],
    gmb:       ['Crèche bienveillante et pédagogie active','Formation auxiliaire petite enfance','Accompagnement équipe de crèche','Réglementation accueil collectif 2026'],
    facebook:  ['Question aux parents : ce que vous appréciez','Conseil du jour pour les pros de crèche','Partage expérience terrain auxiliaire','Événement formation petite enfance'],
    pinterest: ['Idées activités sensorielles bébé','Aménagement espace de vie crèche','Planning semaine type structure','Fiche technique soin nouveau-né'],
    spotify:   ['Episode : épuisement professionnel en crèche','Témoignage : auxiliaire depuis 10 ans','Pédagogie Montessori en collectif','Accueil enfant handicapé en crèche'],
    brevo:     ['Newsletter : nouveautés réglementation','Email : formation disponible en ligne','Campagne : journée portes ouvertes','Recap : conseils terrain de la semaine']
  }
};

const PLATFORM_EMO = {
  tiktok:'🎵',linkedin:'💼',instagram:'📸',gmb:'📍',
  facebook:'👤',pinterest:'📌',spotify:'🎧',brevo:'📧'
};

const PLATFORMS_META = {
  tiktok:{label:'TikTok — Prompt Veo',icon:`<svg viewBox="0 0 24 24" fill="#010101" width="22" height="22"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>`},
  linkedin:{label:'LinkedIn',icon:`<svg viewBox="0 0 24 24" fill="#0A66C2" width="22" height="22"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`},
  instagram:{label:'Instagram',icon:`<svg viewBox="0 0 24 24" width="22" height="22"><defs><linearGradient id="ig2" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#f09433"/><stop offset="50%" style="stop-color:#dc2743"/><stop offset="100%" style="stop-color:#bc1888"/></linearGradient></defs><path fill="url(#ig2)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`},
  gmb:{label:'Google My Business',icon:`<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 0C8.07 0 4.5 3.13 4.5 7.5c0 5.25 7.5 16.5 7.5 16.5s7.5-11.25 7.5-16.5C19.5 3.13 15.93 0 12 0zm0 10.5a3 3 0 110-6 3 3 0 010 6z" fill="#4285F4"/></svg>`},
  facebook:{label:'Facebook',icon:`<svg viewBox="0 0 24 24" fill="#1877F2" width="22" height="22"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`},
  pinterest:{label:'Pinterest',icon:`<svg viewBox="0 0 24 24" fill="#E60023" width="22" height="22"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>`},
  spotify:{label:'Spotify — Podcast',icon:`<svg viewBox="0 0 24 24" fill="#1DB954" width="22" height="22"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>`},
  brevo:{label:'Brevo — Email',icon:`<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><rect width="24" height="24" rx="6" fill="#0092FF"/><path d="M6 7h5.5c2 0 3.5 1.2 3.5 3 0 1-.5 1.8-1.3 2.3C15 12.8 16 13.8 16 15.2 16 17.3 14.3 18 12 18H6V7zm2 4.5h3c.8 0 1.5-.5 1.5-1.3S11.8 9 11 9H8v2.5zm0 5H12c1 0 1.7-.5 1.7-1.4S13 13.5 12 13.5H8V16.5z" fill="white"/></svg>`}
};

const BRAND_CONTEXT = {
  intelixa: {
    label: 'INTELIXA',
    desc: "IA appliquée, automatisation, performance professionnelle. Cible : dirigeants, RH, indépendants, formateurs. Ton : expert, pragmatique, démystificateur, accessible, sans bullshit.",
    tiktok_context: "scène dans un bureau ou environnement professionnel montrant l'IA en action"
  },
  doudelio: {
    label: 'DOUDELIO',
    desc: "Petite enfance, pédagogie, terrain en crèche. Cible : professionnelles de crèche, auxiliaires, éducatrices. Ton : humain, chaleureux, compréhensif, non moralisateur.",
    tiktok_context: 'scène dans une crèche'
  }
};

const PLATFORM_PROMPTS = {
  tiktok: (b) => {
    if (b.label === 'DOUDELIO') {
      return `Génère un prompt pour Veo en respectant ces règles exactes.

Thème de la scène : ${b.tiktok_context} — basé sur ce thème : ` + document.getElementById('theme').value + `

La description de la scène doit être en anglais, centrée uniquement sur l'action et l'ambiance sonore, sans détails inutiles.

Les dialogues doivent suivre ces règles précises :
- Dialogues uniquement en français
- Utiliser Child say ou Worker say
- Chaque dialogue doit être écrit sur une nouvelle ligne
- Ne pas utiliser ! ? ... ni de parenthèses
- Terminer par la phrase : Dialogues must stay in French

Le contenu doit respecter les règles de confidentialité et de sécurité de Veo.`;
    } else {
      return 'Le prompt TikTok pour Intelixa est en cours de création. Reviens bientôt ! 🌱';
    }
  },
  linkedin: () => `Génère un post LinkedIn professionnel de 150-250 mots :\n- 1ère ligne = accroche forte pour stopper le scroll\n- Structure : accroche / développement / enseignement / CTA\n- 5 hashtags pertinents à la fin`,
  instagram: (b) => {
    if (b.label === 'DOUDELIO') {
      return `Tu es créateur de contenu Instagram spécialisé dans la petite enfance pour la marque Doudelio.

Quand je te donne un sujet + un nombre de slides, tu produis automatiquement un carrousel Instagram.

POUR CHAQUE SLIDE :
A) Deux phrases courtes — simple, percutante, adaptée aux parents et pros de la petite enfance. Ton bienveillant, positif et accessible.
B) DESCRIPTION VISUELLE (obligatoire) selon le style Doudelio :

STYLE GRAPHIQUE : Flat design minimaliste pastel. Aplats de couleurs douces, sans contours. Formes arrondies, ambiance chaleureuse. Personnages stylisés, simples, expressifs, en posture de crèche. Aucun texte sur l'image.

IDENTITÉ DOUDELIO : Chaque éducateur porte un tee-shirt Doudelio bleu #384786 avec "Doudelio" écrit en blanc. Enfants + adultes (crèche). Petites touches #DF6163 dans accessoires/détails (jamais couleur dominante).

MISE EN PAGE : Fond principal azur très clair #f5f7f8. Format carré 1080x1080 px (compatible Canva). Style cohérent sur toutes les slides.

CONTRAINTES PÉDAGOGIQUES : Ton positif, jamais culpabilisant. Messages simples, digestes, utiles. Le dernier panneau doit OBLIGATOIREMENT se terminer par une phrase engageante + une question ouverte pour encourager les commentaires.

CONTRAINTES GRAPHIQUES : Style 2D minimaliste (pas Pixar détaillé, pas 3D). Fond uni #f5f7f8. Aucun texte. Tee-shirt Doudelio sur les éducateurs. Cadrage carré. Illustrations adaptées pour Instagram.

RÈGLE AUTOMATIQUE : Tu génères directement la liste complète des slides (texte + description visuelle). Tu attends mon GO avant de générer les images.`;
    } else {
      return `Génère une légende Instagram complète pour Intelixa :\n- Accroche percutante en 1ère ligne\n- Storytelling court orienté performance\n- Question pour engager\n- 15 hashtags à la fin`;
    }
  },
  gmb: (b) => {
    if (b.label === 'INTELIXA') {
      return `Tu génères un post Google Business pour Intelixa.
Tu choisis toi-même le sujet stratégique parmi les thématiques IA et bureautique appliquées aux métiers : RH, comptabilité, gestion commerciale, direction, administratif, pilotage, marketing, automatisation Excel, structuration d'entreprise, conformité fiscale, digitalisation TPE.
Tu ne dois jamais te répéter. Ni angle. Ni chiffres. Ni structure. Ni promesse. Ni vocabulaire dominant. Chaque post doit être différent des précédents.

Contexte entreprise :
Intelixa est spécialisé exclusivement dans les formations en Intelligence Artificielle et en bureautique professionnelle.
Les formations bureautiques suivantes sont finançables CPF : Excel, Word, PowerPoint, WordPress, Photoshop, InDesign, Illustrator.
Les formations en Intelligence Artificielle sont proposées hors CPF.
Zone ciblée : France entière.

Cible prioritaire : Micro-entreprises, Solo-preneurs, TPE de moins de 10 salariés, Dirigeants sans service interne spécialisé.

Objectif stratégique : Mettre en avant la performance concrète. Toujours répondre implicitement à "Qu'est-ce que ça m'apporte concrètement ?". On ne vend pas des outils. On vend : Gain de temps mesurable, Structuration, Autonomie, Optimisation, Productivité, Performance opérationnelle, Digitalisation intelligente. Sous-entendre le gain financier sans jamais parler directement d'argent.

Règle d'ouverture obligatoire : La première phrase doit être courte, percutante et stratégique. Elle doit créer une tension ou une prise de conscience, donner envie de cliquer sur "Voir plus", être orientée performance, perte invisible ou projection forte. Ne jamais être neutre.

Contraintes rédactionnelles : Post inférieur à 1500 caractères. Paragraphes courts. Aucun tiret. Aucune liste. Aucun prénom fictif. Aucun appel à l'action textuel. Ton variable selon l'angle choisi : direct, commercial, expert, friendly. Bénéfices mesurables intégrés quand pertinent.

SEO et AEO : Intégrer de manière fluide et naturelle des mots-clés comme : formation IA TPE, formation CPF micro entreprise, automatisation Excel TPE, bureautique professionnelle, productivité entrepreneur, digitalisation PME, performance entreprise 2026, formation IA comptabilité, formation IA RH. Le référencement doit être puissant mais jamais artificiel.

À fournir :
1. Un prompt d'image professionnel, réaliste, moderne, sans texte sur l'image
2. Le post Google Business optimisé référencement France`;
    } else {
      return `Génère un post Google My Business de 100-150 mots pour Doudelio :\n- Informatif, humain, ancré dans le quotidien de la petite enfance\n- 1 CTA simple à la fin`;
    }
  },
  facebook: () => `Génère un post Facebook engageant de 100-200 mots :\n- Ton accessible et chaleureux\n- Invite au commentaire ou partage\n- 1 question ou CTA à la fin`,
  pinterest: (b) => {
    if (b.label === 'DOUDELIO') {
      return `Tu es un expert en stratégie Pinterest, SEO et AEO. Tu travailles pour Doudelio, plateforme dédiée aux professionnels de la petite enfance.

Site de référence obligatoire : https://doudelio.com
Toutes les idées doivent impérativement être reliées à une page réelle du site.
Exception : Ne jamais utiliser ni se référencer à la page https://doudelio.com/actualite-petite-enfance/

OBJECTIF : Générer de la visibilité qualifiée via le SEO Pinterest, se positionner sur des requêtes conversationnelles (AEO), générer des clics sortants vers le site, renforcer le positionnement expert auprès des directions et équipes de crèche.

STRUCTURE OBLIGATOIRE POUR CHAQUE PROPOSITION :
1. Pilier utilisé
2. Page ciblée exacte du site (hors page actualité)
3. Intention SEO
4. Intention AEO (question réelle d'un professionnel)
5. Angle terrain précis
6. Titre Pinterest
7. Promesse claire
8. Mots-clés SEO + AEO (sans virgules, séparés uniquement par des espaces)
9. Objectif (Visibilité ou Clic)
10. Description précise de la scène illustrée (sans texte intégré dans l'image)

PILIERS AUTORISÉS : Formations du catalogue, Obligations réglementaires liées à la formation continue, Solution Doudelio (plateforme, organisation, fonctionnement), Gestion et management d'équipe en crèche (si relié à une page du site), Offres et accompagnement proposés.

STYLE GRAPHIQUE : Flat design minimaliste pastel. Aplats de couleurs douces, sans contours. Formes arrondies, ambiance chaleureuse. Personnages stylisés, simples, expressifs, en posture de crèche. Aucun texte sur l'image.

IDENTITÉ DOUDELIO : Chaque éducateur porte un tee-shirt Doudelio bleu #384786 avec "Doudelio" écrit en blanc. Enfants + adultes (crèche). Petites touches #DF6163 dans accessoires/détails (jamais couleur dominante). Fond principal azur très clair #f5f7f8. Format carré 1080x1080 px.

CONTRAINTES : Ton positif, jamais culpabilisant. Messages simples, digestes, utiles. Style 2D minimaliste (pas Pixar détaillé, pas 3D). Fond uni #f5f7f8. Aucun texte. Uniquement une illustration sur l'image.

POSITIONNEMENT : Chaque épingle doit résoudre un problème métier concret, être applicable en crèche, montrer une compréhension du terrain, suggérer plutôt qu'expliquer visuellement, donner envie de cliquer via la légende.

À LA FIN, toujours demander :
A) Souhaitez-vous créer l'image ?
B) Souhaitez-vous ajuster un élément stratégique (angle, titre, SEO, promesse) ?`;
    } else {
      return `Génère une description d'épingle Pinterest de 100-150 mots pour Intelixa :\n- Inspirant et utile\n- Mots-clés SEO intégrés\n- 5 hashtags à la fin`;
    }
  },
  brevo: (b) => `Génère un email marketing pour ${b.label} :\n- Objet percutant (max 50 caractères)\n- Préheader accrocheur\n- Corps de l'email : introduction chaleureuse, contenu principal, CTA clair\n- Ton adapté à la marque\n- Longueur : 150-250 mots`,
  spotify: () => `Génère une description d'épisode podcast Spotify de 150-250 mots :\n- Accroche forte dès la 1ère phrase\n- Résumé du thème\n- Ce que l'auditeur va apprendre\n- CTA : s'abonner, laisser un avis`
};

// ===== BRAND =====
function selectBrand(brand, el) {
  selectedBrand = brand;
  document.querySelectorAll('.brand-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.brand-btn.'+brand).forEach(b => b.classList.add('active'));
  document.body.classList.remove('theme-intelixa','theme-doudelio');
  document.body.classList.add('theme-'+brand);

  const dashTitle = document.getElementById('dashTitle');
  const dashSub = document.getElementById('dashSubtitle');
  if(dashTitle) {
    dashTitle.textContent = brand==='intelixa' ? 'INTELIXA STUDIO' : 'Bienvenue Doudelio 🌱';
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
  const notesPage = document.getElementById('page-notes');
  if(notesPage && notesPage.classList.contains('active')) loadNotes();
  checkReminders();
  const histPage = document.getElementById('page-historique');
  if(histPage && histPage.classList.contains('active')) loadHistorique();
}

// ===== PLATFORM =====
function selectPlatform(p, el) {
  selectedPlatform = p;
  document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderTemplates();
}

// ===== AB MODE =====
function setABMode(mode, el) {
  abMode = mode;
  document.querySelectorAll('.ab-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

// ===== TEMPLATES =====
function renderTemplates() {
  const row = document.getElementById('templatesRow');
  if(!row || !selectedBrand) return;
  const byPlatform = TEMPLATES[selectedBrand] || {};
  const list = selectedPlatform && byPlatform[selectedPlatform]
    ? byPlatform[selectedPlatform]
    : byPlatform[Object.keys(byPlatform)[0]] || [];
  row.innerHTML = list.map(t =>
    `<button class="template-chip" onclick="document.getElementById('theme').value='${t.replace(/'/g,"\\'")}'">${t}</button>`
  ).join('');
}

// ===== GENERATE =====
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
  document.getElementById('resultHeader').innerHTML = meta.icon + `<div class="result-platform">${meta.label}</div>`;
  document.getElementById('resultSingle').style.display = 'block';
  document.getElementById('resultAB').style.display = 'none';
  document.getElementById('copyBtn').style.display = 'flex';
  document.getElementById('resultContent').innerHTML = '<span class="cursor"></span>';

  try {
    const token = getGithubToken();
    if(!token) throw new Error("Token GitHub manquant — colle ton token dans le champ 🔑 en haut de la page.");

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
            content: `Tu es un expert Community Manager pour ${brand.label}. ${brand.desc} Tu choisis toi-même l'angle le plus pertinent et tu génères le contenu prêt à publier pour ${selectedPlatform}, sans commentaire ni explication.`
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
  document.getElementById('resultHeader').innerHTML = meta.icon + `<div class="result-platform">${meta.label}</div>`;

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

function getGithubToken() {
  return (document.getElementById('apiKeyInput')?.value || localStorage.getItem('cm_github_token') || '').trim();
}

async function callClaude(brand, theme, variant) {
  const token = getGithubToken();
  if(!token) throw new Error("Token GitHub manquant — colle ton token dans le champ 🔑 en haut de la page.");

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
          content: `Tu es un expert Community Manager pour ${brand.label}. ${brand.desc} Génère uniquement le contenu demandé, prêt à publier, sans commentaire ni explication.${variant ? ' ' + variant + '.' : ''}`
        },
        {
          role: 'user',
          content: `Thème : ${theme}\n\n${PLATFORM_PROMPTS[selectedPlatform](brand)}`
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

function copyResult() {
  navigator.clipboard.writeText(document.getElementById('resultContent').innerText).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent='✅ Copié !'; btn.classList.add('copied');
    setTimeout(()=>{btn.textContent='📋 Copier';btn.classList.remove('copied');},2000);
  });
}
function copyAB(v) {
  navigator.clipboard.writeText(document.getElementById('abText'+v).innerText);
}

// ===== HISTORIQUE =====
async function saveToHistory(theme, content, type) {
  try {
    const key = 'history-'+(selectedBrand||'all');
    let hist = [];
    try { const r=await window.storage.get(key); if(r) hist=JSON.parse(r.value); } catch(e){}
    hist.unshift({
      id:Date.now(), theme, content:content.substring(0,200),
      platform:selectedPlatform, brand:selectedBrand, type,
      date:new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})
    });
    if(hist.length>50) hist=hist.slice(0,50);
    await window.storage.set(key, JSON.stringify(hist));
  } catch(e){}
}

async function loadHistorique() {
  const key = 'history-'+(selectedBrand||'all');
  let hist = [];
  try { const r=await window.storage.get(key); if(r) hist=JSON.parse(r.value); } catch(e){}
  const label = document.getElementById('histLabel');
  if(label) label.textContent = selectedBrand ? `Historique — ${selectedBrand==='intelixa'?'⚡ Intelixa':'🌱 Doudelio'}` : 'Historique';
  const list = document.getElementById('historiqueList');
  if(!hist.length) { list.innerHTML='<div class="empty-state">Aucune génération pour linstant ✨</div>'; return; }
  list.innerHTML = hist.map(h=>`
    <div class="recent-item">
      <div class="recent-icon">${PLATFORM_EMO[h.platform]||'•'}</div>
      <div class="recent-info">
        <div class="recent-platform">${h.platform}${h.type?' · '+h.type:''}</div>
        <div class="recent-text">${h.theme}</div>
      </div>
      <span class="brand-badge badge-${h.brand}">${h.brand==='intelixa'?'⚡':'🌱'}</span>
      <div class="recent-date">${h.date}</div>
    </div>
  `).join('');
}

async function loadRecentDashboard() {
  const key = 'history-'+(selectedBrand||'all');
  let hist = [];
  try { const r=await window.storage.get(key); if(r) hist=JSON.parse(r.value); } catch(e){}
  const list = document.getElementById('recentList');
  if(!list) return;
  if(!hist.length) { list.innerHTML='<div class="empty-state">Aucune génération pour linstant — go Studio ! ✨</div>'; return; }
  list.innerHTML = hist.slice(0,6).map(h=>`
    <div class="recent-item">
      <div class="recent-icon">${PLATFORM_EMO[h.platform]||'•'}</div>
      <div class="recent-info">
        <div class="recent-platform">${h.platform}</div>
        <div class="recent-text">${h.theme}</div>
      </div>
      <span class="brand-badge badge-${h.brand}">${h.brand==='intelixa'?'⚡':'🌱'}</span>
      <div class="recent-date">${h.date}</div>
    </div>
  `).join('');
}

async function updateStats() {
  let total=0, notes=0, calPosts=0;
  for(const b of ['intelixa','doudelio']) {
    try { const r=await window.storage.get('history-'+b); if(r) total+=JSON.parse(r.value).length; } catch(e){}
    try { const r=await window.storage.get('notes-'+b); if(r) notes+=JSON.parse(r.value).length; } catch(e){}
  }
  // Count cal posts this month
  const now=new Date();
  try {
    const r=await window.storage.get('cal-'+now.getFullYear()+'-'+now.getMonth());
    if(r) { const d=JSON.parse(r.value); calPosts=Object.values(d).reduce((a,v)=>a+v.length,0); }
  } catch(e){}

  const el=id=>document.getElementById(id);
  if(el('statTotal')) el('statTotal').textContent=total;
  if(el('statNotes')) el('statNotes').textContent=notes;
  if(el('statCal')) el('statCal').textContent=calPosts;
  if(el('statWeek')) {
    let week=0;
    try {
      const r=await window.storage.get('history-'+(selectedBrand||'intelixa'));
      if(r) {
        const h=JSON.parse(r.value);
        const ago=Date.now()-7*86400000;
        week=h.filter(x=>x.id>ago).length;
      }
    } catch(e){}
    el('statWeek').textContent=week;
  }
}

// ===== QUICK ADD CALENDAR =====
function quickAddToCalendar() {
  if(!selectedBrand||!selectedPlatform) return;
  const calTab = document.querySelector('.nav-tab:last-child');
  switchPage('calendrier', calTab);
  setTimeout(()=>openAddForm(new Date().getDate()), 350);
}

// ===== PAGE SWITCH =====
function switchPage(page, el) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
  el.classList.add('active');
  if(page==='notes') loadNotes();
  if(page==='studio') setTimeout(initDupeDetector, 100);
  if(page==='calendrier') renderCalendar();
  if(page==='historique') loadHistorique();
  if(page==='dashboard') { updateStats(); loadRecentDashboard(); }
}

// ===== NOTES =====
const CATEGORIES = [
  { id:'all',      label:'Toutes',         emoji:'📋', color:'#7fa882' },
  { id:'idee',     label:'Idées',          emoji:'💡', color:'#9c27b0' },
  { id:'a-publier',label:'À publier',      emoji:'📅', color:'#2196f3' },
  { id:'a-retravailler',label:'À retravailler',emoji:'✏️',color:'#ff9800'},
  { id:'urgent',   label:'Urgent',         emoji:'🔥', color:'#f44336' },
  { id:'archive',  label:'Archive',        emoji:'📦', color:'#9e9e9e' }
];

let activeNoteCat = 'all';
let openMoveId = null;

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
  renderNotesWall(document.querySelectorAll('.postit'));
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
    document.getElementById('notesWall').innerHTML='<div class="empty-state">Choisis une marque pour voir tes notes 🌱</div>';
    document.getElementById('notesCatTabs').innerHTML='';
    return;
  }
  if(h) h.textContent='Notes — '+(selectedBrand==='intelixa'?'⚡ Intelixa':'🌱 Doudelio');
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
      ${c.emoji} ${c.label}
      <span class="cat-count">${count}</span>
    </button>`;
  }).join('');
}

function renderNotes(notes) {
  const wall = document.getElementById('notesWall');
  const filtered = activeNoteCat==='all' ? notes : notes.filter(n=>n.cat===activeNoteCat);

  renderCatTabs(notes);

  if(!filtered.length) {
    wall.innerHTML=`<div class="empty-state">Aucune note dans cette catégorie 💡</div>`;
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
      <div class="postit-cat-badge">${catInfo.emoji} ${catInfo.label}</div>
      <div class="postit-text">${n.text.replace(/\n/g,'<br>')}</div>
      <div class="postit-footer">
        <span class="postit-date">${n.date}</span>
        <div class="postit-actions" style="position:relative;">
          <button class="postit-move" onclick="toggleMoveMenu(${n.id},event)" title="Déplacer">↕️</button>
          <button class="postit-delete" onclick="deleteNote(${n.id})" title="Supprimer">✕</button>
          ${showMenu ? `<div class="move-dropdown">
            ${otherCats.map(c=>`<div class="move-option" onclick="moveNote(${n.id},'${c.id}')">
              ${c.emoji} ${c.label}
            </div>`).join('')}
          </div>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

// ===== CALENDRIER =====
// ===== CALENDRIER =====
// ===== CALENDRIER =====
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let pendingDay = null;

const PLATFORM_ICONS = {
  tiktok: '🎵', linkedin: '💼', instagram: '📸',
  gmb: '📍', facebook: '👤', pinterest: '📌',
  spotify: '🎧', brevo: '📧'
};

// ===== FÊTES & ÉVÉNEMENTS MARKETING =====
const FETES = {
  // Format: 'MM-DD': { label, emoji, type }
  // Types: 'ferie' (jour férié), 'commercial' (fête commerciale), 'marketing' (événement marketing)

  // Jours fériés France
  '01-01': { label: "Jour de l'an", emoji: '🎆', type: 'ferie' },
  '05-01': { label: 'Fête du Travail', emoji: '✊', type: 'ferie' },
  '05-08': { label: 'Victoire 1945', emoji: '🕊️', type: 'ferie' },
  '07-14': { label: 'Fête Nationale', emoji: '🇫🇷', type: 'ferie' },
  '08-15': { label: 'Assomption', emoji: '⛪', type: 'ferie' },
  '11-01': { label: 'Toussaint', emoji: '🕯️', type: 'ferie' },
  '11-11': { label: 'Armistice', emoji: '🎖️', type: 'ferie' },
  '12-25': { label: 'Noël', emoji: '🎄', type: 'ferie' },

  // Fêtes commerciales & marketing incontournables
  '01-06': { label: 'Épiphanie', emoji: '👑', type: 'commercial' },
  '02-02': { label: 'Chandeleur', emoji: '🥞', type: 'commercial' },
  '02-14': { label: 'Saint-Valentin', emoji: '❤️', type: 'commercial' },
  '03-08': { label: 'Journée de la Femme', emoji: '♀️', type: 'commercial' },
  '03-19': { label: 'Fête des Grands-Pères', emoji: '👴', type: 'commercial' },
  '04-01': { label: "Poisson d'Avril", emoji: '🐟', type: 'commercial' },
  '06-01': { label: "Journée de l'Enfance", emoji: '🧒', type: 'commercial' },
  '06-21': { label: 'Fête de la Musique', emoji: '🎵', type: 'commercial' },
  '10-31': { label: 'Halloween', emoji: '🎃', type: 'commercial' },
  '11-19': { label: 'Fête des Hommes', emoji: '👨', type: 'commercial' },
  '12-06': { label: 'Saint-Nicolas', emoji: '🎅', type: 'commercial' },
  '12-31': { label: 'Réveillon', emoji: '🥂', type: 'commercial' },

  // Événements marketing (dates approximatives — semaines clés)
  '01-15': { label: "Soldes d'hiver", emoji: '🏷️', type: 'marketing' },
  '01-24': { label: 'Fin soldes hiver', emoji: '🏷️', type: 'marketing' },
  '06-25': { label: "Soldes d'été", emoji: '☀️', type: 'marketing' },
  '07-22': { label: 'Fin soldes été', emoji: '☀️', type: 'marketing' },
  '11-28': { label: 'Black Friday', emoji: '🖤', type: 'marketing' },
  '12-02': { label: 'Cyber Monday', emoji: '💻', type: 'marketing' },

  // Journées internationales utiles CM
  '01-28': { label: 'Journée Données Perso', emoji: '🔒', type: 'marketing' },
  '02-11': { label: 'Journée Femmes & Sciences', emoji: '🔬', type: 'marketing' },
  '03-20': { label: 'Printemps / Bonheur', emoji: '🌸', type: 'marketing' },
  '04-22': { label: 'Jour de la Terre', emoji: '🌍', type: 'marketing' },
  '05-15': { label: 'Journée Famille', emoji: '👨‍👩‍👧', type: 'marketing' },
  '06-05': { label: 'Journée Environnement', emoji: '🌿', type: 'marketing' },
  '09-01': { label: 'Rentrée', emoji: '🎒', type: 'marketing' },
  '10-10': { label: 'Santé Mentale', emoji: '🧠', type: 'marketing' },
  '11-13': { label: 'Journée Gentillesse', emoji: '💛', type: 'marketing' },
};

// Fêtes à dates variables (calculées dynamiquement)
function getFetesVariables(year) {
  const result = {};

  // Calcul Pâques (algorithme de Meeus/Jones/Butcher)
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 1-based
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  const paques = new Date(year, month - 1, day);

  const pad = n => String(n).padStart(2, '0');
  const key = d => `${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

  // Pâques
  result[key(paques)] = { label: 'Pâques', emoji: '🐣', type: 'ferie' };

  // Lundi de Pâques
  const lundiPaques = new Date(paques); lundiPaques.setDate(paques.getDate() + 1);
  result[key(lundiPaques)] = { label: 'Lundi de Pâques', emoji: '🐰', type: 'ferie' };

  // Ascension (39 jours après Pâques)
  const ascension = new Date(paques); ascension.setDate(paques.getDate() + 39);
  result[key(ascension)] = { label: 'Ascension', emoji: '✝️', type: 'ferie' };

  // Pentecôte (49 jours après Pâques)
  const pentecote = new Date(paques); pentecote.setDate(paques.getDate() + 49);
  result[key(pentecote)] = { label: 'Pentecôte', emoji: '🕊️', type: 'ferie' };

  // Lundi de Pentecôte
  const lundiPentecote = new Date(paques); lundiPentecote.setDate(paques.getDate() + 50);
  result[key(lundiPentecote)] = { label: 'Lundi de Pentecôte', emoji: '🕊️', type: 'ferie' };

  // Fête des Mères : dernier dimanche de mai (ou 1er juin si coïncide avec Pentecôte)
  let feteMeres = new Date(year, 4, 1); // 1er mai
  while (feteMeres.getDay() !== 0) feteMeres.setDate(feteMeres.getDate() + 1);
  // Dernier dimanche de mai
  let tmp = new Date(year, 4, 31);
  while (tmp.getDay() !== 0) tmp.setDate(tmp.getDate() - 1);
  if (key(tmp) === key(pentecote)) tmp.setDate(tmp.getDate() + 7); // décalage si Pentecôte
  result[key(tmp)] = { label: 'Fête des Mères', emoji: '👩', type: 'commercial' };

  // Fête des Pères : 3ème dimanche de juin
  let fetePeres = new Date(year, 5, 1);
  let sundayCount = 0;
  while (sundayCount < 3) {
    if (fetePeres.getDay() === 0) sundayCount++;
    if (sundayCount < 3) fetePeres.setDate(fetePeres.getDate() + 1);
  }
  result[key(fetePeres)] = { label: 'Fête des Pères', emoji: '👨', type: 'commercial' };

  return result;
}

function getFetesForDay(year, month, day) {
  const pad = n => String(n).padStart(2, '0');
  const fixedKey = `${pad(month+1)}-${pad(day)}`;
  const variables = getFetesVariables(year);
  const fixed = FETES[fixedKey];
  const variable = variables[fixedKey];
  const result = [];
  if (fixed) result.push(fixed);
  if (variable) result.push(variable);
  return result;
}

function getCalKey() {
  return 'cal-' + calYear + '-' + calMonth;
}

async function getCalPosts() {
  try {
    const r = await window.storage.get(getCalKey());
    return r ? JSON.parse(r.value) : {};
  } catch(e) { return {}; }
}

async function saveCalPosts(posts) {
  try { await window.storage.set(getCalKey(), JSON.stringify(posts)); } catch(e) {}
}

function changeMonth(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}

async function renderCalendar() {
  const posts = await getCalPosts();
  const today = new Date();
  const firstDay = new Date(calYear, calMonth, 1);
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  document.getElementById('calTitle').textContent =
    new Date(calYear, calMonth).toLocaleDateString('fr-FR', {month:'long', year:'numeric'});

  let html = '';
  for (let i = 0; i < startDow; i++) html += '<div class="cal-day empty"></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = today.getFullYear()===calYear && today.getMonth()===calMonth && today.getDate()===d;
    const dayPosts = posts[d] || [];

    // Fêtes du jour
    const fetes = getFetesForDay(calYear, calMonth, d);
    const fetesHtml = fetes.map(f => `
      <div class="cal-fete cal-fete-${f.type}" title="${f.label}">
        <span class="cal-fete-emoji">${f.emoji}</span>
        <span class="cal-fete-label">${f.label}</span>
      </div>
    `).join('');

    const postsHtml = dayPosts.map((p,i) => `
      <div class="cal-post ${p.status}" title="${p.platform}">
        ${PLATFORM_ICONS[p.platform] || '•'} ${p.platform}
        <button class="cal-post-delete" onclick="event.stopPropagation();deletePost(${d},${i})">✕</button>
      </div>
    `).join('');

    const hasFete = fetes.length > 0;
    html += `<div class="cal-day${isToday?' today':''}${hasFete?' has-fete':''}" onclick="openAddForm(${d})">
      <div class="cal-day-num">${d}</div>
      ${fetesHtml}
      <div class="cal-posts">${postsHtml}</div>
    </div>`;
  }

  document.getElementById('calGrid').innerHTML = html;
}

function openAddForm(day) {
  pendingDay = day;
  document.getElementById('calAddForm').style.display = 'block';
  document.getElementById('calBrand').value = selectedBrand || '';
  document.getElementById('calPlatform').value = '';
  document.getElementById('calStatus').value = 'brouillon';
}

function cancelAddPost() {
  pendingDay = null;
  document.getElementById('calAddForm').style.display = 'none';
}

async function confirmAddPost() {
  const brand = document.getElementById('calBrand').value;
  const platform = document.getElementById('calPlatform').value;
  const status = document.getElementById('calStatus').value;
  if (!platform) { alert('Choisis une plateforme !'); return; }

  const posts = await getCalPosts();
  if (!posts[pendingDay]) posts[pendingDay] = [];
  posts[pendingDay].push({ brand, platform, status });
  await saveCalPosts(posts);

  cancelAddPost();
  renderCalendar();
}

async function deletePost(day, index) {
  const posts = await getCalPosts();
  if (posts[day]) {
    posts[day].splice(index, 1);
    if (!posts[day].length) delete posts[day];
    await saveCalPosts(posts);
    renderCalendar();
  }
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


// ===== GREETING =====
function getGreeting() {
  const h = new Date().getHours();
  if(h >= 5  && h < 12) return { emoji:'☀️', word:'Bonjour' };
  if(h >= 12 && h < 18) return { emoji:'🌤️', word:'Bon après-midi' };
  if(h >= 18 && h < 22) return { emoji:'🌙', word:'Bonsoir' };
  return { emoji:'🌃', word:'Bonne nuit' };
}

const DAILY_MESSAGES = [
  "Prêt à créer du contenu qui claque ?",
  "On fait quoi de bien aujourd'hui ?",
  "Ton audience t'attend. C'est parti !",
  "Une idée = un post. Commençons !",
  "Le meilleur contenu, c'est celui qu'on crée maintenant.",
  "Nouvelle journée, nouvelles idées 💡",
  "C'est ton moment de briller sur les réseaux !",
  "Un post aujourd'hui vaut mieux que dix demain.",
  "Le contenu régulier, c'est la clé. Go !",
  "Studio CM est prêt. Et toi ?",
];

function renderGreeting() {
  const el = document.getElementById('greetingBanner');
  if(!el) return;
  const { emoji, word } = getGreeting();
  const msg = DAILY_MESSAGES[new Date().getDate() % DAILY_MESSAGES.length];
  el.innerHTML = `
    <div class="greeting-emoji">${emoji}</div>
    <div class="greeting-text">
      <h2>${word}, Stanislas !</h2>
      <p>${msg}</p>
    </div>
  `;
}

// ===== REGENERATE =====
async function regenerate() {
  if(!selectedBrand||!selectedPlatform) return;
  const theme = document.getElementById('theme').value.trim();
  if(!theme) return;
  await generate();
}

// ===== SEO/AEO ANALYZER =====
const SEO_KEYWORDS = {
  intelixa: ['IA','automatisation','TPE','formation','CPF','Excel','productivité','digitalisation','performance','PME','entrepreneur','comptabilité','RH','dirigeant'],
  doudelio: ['crèche','petite enfance','auxiliaire','puéricultrice','éducatrice','accueil','tout-petits','formation','pédagogie','CAP','terrain','bienveillance']
};

const AEO_INDICATORS = ['comment','pourquoi','quand','quel','quelle','combien','qui','est-ce que','faut-il','doit-on','peut-on','vaut-il mieux'];

function analyzeSEOAEO(text, brand) {
  if(!text || text.length < 20) return null;
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  const keywords = SEO_KEYWORDS[brand] || [];

  // SEO score — word-boundary matching, seuil 50%, bonus densité
  const foundKw = keywords.filter(k => {
    const escaped = k.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|\\s|[.,!?;:«»"'])${escaped}(\\s|[.,!?;:«»"']|$)`, 'i').test(lower);
  });
  const base = Math.min(100, Math.round((foundKw.length / Math.max(keywords.length * 0.5, 1)) * 100));
  const density = words.length > 0 ? (foundKw.length / words.length) : 0;
  const kwScore = Math.min(100, base + (density > 0.03 ? 10 : 0));

  // AEO score — scoring gradué : questions + indicateurs + position
  const hasQuestion = lower.includes('?');
  const foundIndicators = AEO_INDICATORS.filter(i => lower.includes(i));
  const questionAtBoundary = /^[^.!?]*\?/.test(text) || /\?\s*$/.test(text.trim());
  let aeoScore = 0;
  if(hasQuestion) aeoScore += 40;
  aeoScore += Math.min(40, foundIndicators.length * 15);
  if(questionAtBoundary) aeoScore += 20;
  aeoScore = Math.min(100, aeoScore);

  // Lisibilité — longueur phrases + pénalité mots complexes + bonus structure
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
  const avgLen = sentences.length ? words.length / sentences.length : 999;
  let readScore = avgLen <= 12 ? 100 : avgLen <= 20 ? 70 : avgLen <= 30 ? 40 : 20;
  const complexWords = words.filter(w => w.replace(/[^a-zA-ZÀ-ÿ]/g,'').length > 10).length;
  const complexRatio = words.length > 0 ? complexWords / words.length : 0;
  if(complexRatio > 0.15) readScore = Math.max(10, readScore - 20);
  else if(complexRatio > 0.08) readScore = Math.max(10, readScore - 10);
  if(/\n|•|^\s*[-*]\s/m.test(text)) readScore = Math.min(100, readScore + 10);

  // Longueur — plancher à 10 si >3x le max
  const len = text.length;
  const idealLengths = {
    linkedin: [1500, 3000], instagram: [800, 2200], gmb: [250, 1500],
    facebook: [400, 1200], tiktok: [100, 500], pinterest: [200, 500],
    spotify: [200, 800], brevo: [500, 2000]
  };
  const [min, max] = idealLengths[selectedPlatform] || [200, 1500];
  let lenScore;
  if(len < min) {
    lenScore = Math.round((len / min) * 80);
  } else if(len > max) {
    const overshoot = (len - max) / max;
    lenScore = Math.max(overshoot > 2 ? 10 : 20, Math.round(100 - overshoot * 60));
  } else {
    lenScore = 100;
  }

  return {
    seo: kwScore, aeo: aeoScore, readability: readScore, length: lenScore,
    foundKeywords: foundKw.slice(0, 5),
    aeoIndicators: foundIndicators.slice(0, 3),
    charCount: len, ideal: `${min}–${max}`
  };
}

function renderSEOPanel(text, brand) {
  const box = document.getElementById('seoPanel');
  if(!box) return;
  const data = analyzeSEOAEO(text, brand);
  if(!data) { box.style.display='none'; return; }
  box.style.display='block';

  const scoreColor = s => s >= 70 ? '#4caf50' : s >= 40 ? '#ff9800' : '#f44336';
  const scoreLabel = s => s >= 70 ? '🟢' : s >= 40 ? '🟡' : '🔴';
  const bar = (s, color) => `<div style="height:6px;border-radius:3px;background:var(--border);overflow:hidden;margin-top:4px;">
    <div style="height:100%;width:${s}%;background:${color};border-radius:3px;transition:width .6s ease;"></div></div>`;

  box.innerHTML = `
    <div class="seo-panel-inner">
      <div class="seo-title">📊 Analyse SEO / AEO</div>
      <div class="seo-grid">
        <div class="seo-item">
          <div class="seo-item-label">${scoreLabel(data.seo)} SEO — Mots-clés</div>
          ${bar(data.seo, scoreColor(data.seo))}
          <div class="seo-item-sub">${data.foundKeywords.length ? data.foundKeywords.join(', ') : 'Aucun détecté'}</div>
        </div>
        <div class="seo-item">
          <div class="seo-item-label">${scoreLabel(data.aeo)} AEO — Question/Intention</div>
          ${bar(data.aeo, scoreColor(data.aeo))}
          <div class="seo-item-sub">${data.aeoIndicators && data.aeoIndicators.length ? data.aeoIndicators.join(', ') : (data.aeo >= 50 ? 'Intent AEO présent' : 'Ajouter une question')}</div>
        </div>
        <div class="seo-item">
          <div class="seo-item-label">${scoreLabel(data.readability)} Lisibilité</div>
          ${bar(data.readability, scoreColor(data.readability))}
          <div class="seo-item-sub">Phrases courtes = meilleur score</div>
        </div>
        <div class="seo-item">
          <div class="seo-item-label">${scoreLabel(data.length)} Longueur — ${data.charCount} car.</div>
          ${bar(data.length, scoreColor(data.length))}
          <div class="seo-item-sub">Idéal : ${data.ideal} caractères</div>
        </div>
      </div>
    </div>`;
}

// ===== POST-GENERATION VALIDATION =====
function checkPostGenLength(text, platform) {
  if(!text || !platform) return;
  const idealLengths = {
    linkedin: [1500, 3000], instagram: [800, 2200], gmb: [250, 1500],
    facebook: [400, 1200], tiktok: [100, 500], pinterest: [200, 500],
    spotify: [200, 800], brevo: [500, 2000]
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
const PREVIEW_TEMPLATES = {
  linkedin: (text, brand) => `
    <div class="preview-linkedin">
      <div class="prev-header">
        <div class="prev-avatar" style="background:${brand==='intelixa'?'#c0392b':'#384786'};">${brand==='intelixa'?'I':'D'}</div>
        <div>
          <div class="prev-name">${brand==='intelixa'?'Intelixa':'Doudelio'}</div>
          <div class="prev-meta">Page entreprise · Maintenant · 🌐</div>
        </div>
      </div>
      <div class="prev-body">${formatPreviewText(text)}</div>
      <div class="prev-footer-linkedin">
        <span>👍 J'aime</span><span>💬 Commenter</span><span>🔄 Republier</span><span>📤 Envoyer</span>
      </div>
    </div>`,

  instagram: (text, brand) => `
    <div class="preview-instagram">
      <div class="prev-header">
        <div class="prev-avatar ig-avatar" style="background:${brand==='intelixa'?'#c0392b':'#384786'};">${brand==='intelixa'?'I':'D'}</div>
        <div class="prev-name">${brand==='intelixa'?'intelixa_officiel':'doudelio_creche'}</div>
        <div class="prev-dots" style="margin-left:auto;">•••</div>
      </div>
      <div class="prev-ig-image" style="background:${brand==='intelixa'?'linear-gradient(135deg,#1a0a0a,#3a1515)':'linear-gradient(135deg,#e8f5e4,#c8e6c9)'};">
        <span style="font-size:32px;">${brand==='intelixa'?'⚡':'🌱'}</span>
      </div>
      <div class="prev-ig-actions">❤️ &nbsp;💬 &nbsp;📤 &nbsp;<span style="margin-left:auto;">🔖</span></div>
      <div class="prev-body" style="padding:0 12px 12px;">${formatPreviewText(text, 200)}</div>
    </div>`,

  gmb: (text, brand) => `
    <div class="preview-gmb">
      <div class="prev-header">
        <div class="prev-avatar" style="background:#4285F4;">G</div>
        <div>
          <div class="prev-name">${brand==='intelixa'?'Intelixa':'Doudelio'}</div>
          <div class="prev-meta">Google · Vient de publier</div>
        </div>
      </div>
      <div class="prev-body">${formatPreviewText(text, 300)}</div>
      <div class="prev-gmb-btn">En savoir plus</div>
    </div>`,

  facebook: (text, brand) => `
    <div class="preview-facebook">
      <div class="prev-header">
        <div class="prev-avatar" style="background:${brand==='intelixa'?'#c0392b':'#384786'};">${brand==='intelixa'?'I':'D'}</div>
        <div>
          <div class="prev-name">${brand==='intelixa'?'Intelixa':'Doudelio'}</div>
          <div class="prev-meta">Maintenant · 🌐</div>
        </div>
      </div>
      <div class="prev-body">${formatPreviewText(text, 300)}</div>
      <div class="prev-footer-linkedin" style="border-top:1px solid #eee;margin-top:10px;padding-top:10px;">
        <span>👍 J'aime</span><span>💬 Commenter</span><span>↗ Partager</span>
      </div>
    </div>`,

  pinterest: (text, brand) => `
    <div class="preview-pinterest">
      <div class="prev-pin-img" style="background:${brand==='intelixa'?'linear-gradient(135deg,#1a0a0a,#3a1515)':'linear-gradient(135deg,#fce4ec,#f8bbd0)'};">
        <span style="font-size:40px;">${brand==='intelixa'?'⚡':'🌸'}</span>
      </div>
      <div class="prev-pin-body">
        <div class="prev-name" style="font-size:14px;margin-bottom:6px;">${text.substring(0,60)}${text.length>60?'...':''}</div>
        <div class="prev-meta">${brand==='intelixa'?'intelixa.fr':'doudelio.com'}</div>
      </div>
    </div>`,

  tiktok: (text, brand) => `
    <div class="preview-tiktok">
      <div class="prev-tiktok-screen" style="background:${brand==='intelixa'?'linear-gradient(180deg,#0a0010,#1a0a20)':'linear-gradient(180deg,#e8f5ff,#d0e8f5)'};">
        <span style="font-size:40px;">🎬</span>
        <div style="font-size:11px;color:${brand==='intelixa'?'#aaa':'#555'};margin-top:8px;text-align:center;">Prompt Veo</div>
      </div>
      <div class="prev-tiktok-caption">
        <div class="prev-name">@${brand==='intelixa'?'intelixa':'doudelio'}</div>
        <div class="prev-body" style="padding:0;font-size:12px;">${formatPreviewText(text, 150)}</div>
      </div>
    </div>`,

  spotify: (text, brand) => `
    <div class="preview-spotify">
      <div class="prev-spotify-img" style="background:${brand==='intelixa'?'linear-gradient(135deg,#1a0a0a,#2a1010)':'linear-gradient(135deg,#e8f5e4,#c8e6c9)'};">
        <span style="font-size:36px;">🎧</span>
      </div>
      <div class="prev-name">Épisode · ${brand==='intelixa'?'Intelixa Podcast':'Doudelio Podcast'}</div>
      <div class="prev-body">${formatPreviewText(text, 200)}</div>
    </div>`,

  brevo: (text, brand) => `
    <div class="preview-brevo">
      <div class="prev-brevo-header" style="background:${brand==='intelixa'?'#1a0a0a':'#384786'};">
        <span style="font-size:22px;">${brand==='intelixa'?'⚡':'🌱'}</span>
        <span style="color:white;font-weight:800;font-size:14px;">${brand==='intelixa'?'INTELIXA':'DOUDELIO'}</span>
      </div>
      <div class="prev-body" style="padding:16px;">${formatPreviewText(text, 300)}</div>
      <div class="prev-gmb-btn" style="margin:0 16px 16px;">Lire l'email complet</div>
    </div>`
};

function formatPreviewText(text, maxLen=400) {
  const truncated = maxLen && text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
  return truncated.replace(/\n/g,'<br>');
}

function openPreview() {
  const modal = document.getElementById('previewModal');
  if(!modal) return;
  const text = abMode
    ? (document.getElementById('abTextA').textContent || '')
    : (document.getElementById('resultContent').textContent || '');
  if(!text || text.length < 5) return;

  // Set tabs
  const tabs = document.getElementById('previewTabs');
  const platforms = ['linkedin','instagram','gmb','facebook','tiktok','pinterest','spotify','brevo'];
  tabs.innerHTML = platforms.map((p,i) =>
    `<button class="prev-tab${i===0?' active':''}" onclick="switchPreview('${p}',this)">${p.charAt(0).toUpperCase()+p.slice(1)}</button>`
  ).join('');

  renderPreviewFor(selectedPlatform || 'linkedin', text);
  modal.style.display='flex';
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

// ===== REMINDERS =====
const REMINDER_THRESHOLDS = {
  tiktok: 3, linkedin: 3, instagram: 2, gmb: 7,
  facebook: 2, pinterest: 3, spotify: 14, brevo: 7
};

async function checkReminders() {
  const remindersEl = document.getElementById('remindersBlock');
  if(!remindersEl) return;

  const brands = selectedBrand ? [selectedBrand] : ['intelixa','doudelio'];
  const alerts = [];
  const now = Date.now();

  for(const b of brands) {
    try {
      const r = await window.storage.get('history-'+b);
      if(!r) {
        // Never posted
        alerts.push({brand:b, platform:'Studio', days:null, msg:`Aucune génération pour ${b==='intelixa'?'⚡ Intelixa':'🌱 Doudelio'} — commence maintenant !`});
        continue;
      }
      const hist = JSON.parse(r.value);
      // Check by platform
      const byPlatform = {};
      hist.forEach(h => {
        if(!byPlatform[h.platform] || h.id > byPlatform[h.platform]) byPlatform[h.platform] = h.id;
      });
      for(const [plat, lastTs] of Object.entries(byPlatform)) {
        const days = Math.floor((now - lastTs) / 86400000);
        const threshold = REMINDER_THRESHOLDS[plat] || 7;
        if(days >= threshold) {
          alerts.push({brand:b, platform:plat, days, msg:`${b==='intelixa'?'⚡':'🌱'} Pas de post ${plat} depuis ${days} jours`});
        }
      }
    } catch(e){}
  }

  if(!alerts.length) {
    remindersEl.style.display='none';
    return;
  }

  remindersEl.style.display='block';
  remindersEl.innerHTML = `
    <div class="reminder-title">🔔 Rappels</div>
    ${alerts.slice(0,4).map(a => `
      <div class="reminder-item">
        <span class="reminder-msg">${a.msg}</span>
        ${a.days !== null ? `<span class="reminder-badge">${a.days}j</span>` : ''}
      </div>
    `).join('')}
  `;
}


// ===== INIT =====
updateStats();
loadRecentDashboard();
setTimeout(checkReminders, 500);
renderGreeting();
document.addEventListener('click', () => {
  if(openMoveId !== null) { openMoveId = null; getNotes().then(renderNotes); }
});
initDupeDetector();
