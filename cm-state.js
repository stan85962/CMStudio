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
    tiktok: [
      {id:1, text:"Tu bosses 60h/semaine et t'es encore débordé ?"},
      {id:2, text:"L'IA a remplacé 3h de mon quotidien. Voilà comment."},
      {id:3, text:"Freelance en 2026 sans IA = taxi sans GPS"},
      {id:4, text:"Combien tu PERDS vraiment chaque semaine ?"},
      {id:5, text:"3 process que t'aurais dû automatiser il y a 2 ans"},
      {id:6, text:"Ton concurrent utilise l'IA. Toi pas encore ?"}
    ],
    linkedin: [
      {id:1, text:"J'ai perdu 800€ par mois pendant 2 ans. Voilà pourquoi."},
      {id:2, text:"L'IA ne va pas te remplacer. Elle va remplacer ceux qui ne l'utilisent pas."},
      {id:3, text:"3 automatisations qui m'ont sauvé 15h par semaine"},
      {id:4, text:"De 2 clients à 8 clients. Même temps de travail. L'IA."},
      {id:5, text:"Solopreneur en 2026 : scale sans embaucher"},
      {id:6, text:"Business sans IA en 2026 : une décision qui coûte cher"}
    ],
    instagram: [
      {id:1, text:"Avant : 3h de saisie. Après : 8 minutes. Merci l'IA."},
      {id:2, text:"Ce que l'IA fait en 2 minutes te prenait 2 heures"},
      {id:3, text:"Automatise ou reste à la traîne. C'est brutal mais vrai."},
      {id:4, text:"Mon business tourne même quand je suis en vacances"},
      {id:5, text:"1 outil IA = 1 salarié à temps partiel gratuit"},
      {id:6, text:"Le game changer que personne ne veut admettre"}
    ],
    facebook: [
      {id:1, text:"Combien d'heures perdez-vous en tâches répétitives ?"},
      {id:2, text:"Le vrai coût de ne PAS utiliser l'IA"},
      {id:3, text:"Freelance : et si l'IA était votre meilleur associé ?"},
      {id:4, text:"Témoignage : de débordé à serein grâce à l'IA"},
      {id:5, text:"Ce que vos concurrents automatisent déjà"},
      {id:6, text:"Automatisation : par où commencer quand on est seul ?"}
    ],
    gmb: [
      {id:1, text:"Automatisation IA pour freelances et indépendants"},
      {id:2, text:"Gagner du temps avec l'IA en 2026"},
      {id:3, text:"Process automatisés pour TPE/PME"},
      {id:4, text:"Formation IA entrepreneur — résultats concrets"},
      {id:5, text:"Solopreneur : scale ton activité avec l'IA"},
      {id:6, text:"Indépendant : arrête de tout faire à la main"}
    ],
    pinterest: [
      {id:1, text:"Infographie : combien coûte 1 semaine sans IA ?"},
      {id:2, text:"Checklist automatisation freelance 2026"},
      {id:3, text:"Schéma : une journée avec vs sans IA"},
      {id:4, text:"Les 5 outils IA indispensables en 2026"},
      {id:5, text:"Guide prospection automatisée pas à pas"},
      {id:6, text:"De 60h à 40h — comment l'IA change tout"}
    ],
    brevo: [
      {id:1, text:"Email : tu perds combien par semaine sans IA ?"},
      {id:2, text:"Newsletter : les automatisations du mois"},
      {id:3, text:"Email : 3 process à automatiser cette semaine"},
      {id:4, text:"Campagne : freelance, ton temps vaut combien ?"},
      {id:5, text:"Email : diagnostic gratuit — où tu perds du temps ?"},
      {id:6, text:"Campagne urgence : tes concurrents sont déjà là"}
    ],
    spotify: [
      {id:1, text:"L'IA m'a rendu 10h par semaine — voilà comment"},
      {id:2, text:"Freelance : automatise ou plafonne"},
      {id:3, text:"Mon stack IA complet — tout révéler"},
      {id:4, text:"Le vrai coût de ton temps en tant qu'indépendant"},
      {id:5, text:"3 automatisations qui changent tout"},
      {id:6, text:"Business en 2026 : sans IA t'es déjà en retard"}
    ],
    youtube: [
      {id:1, text:"J'ai automatisé mon business en 7 jours — résultats"},
      {id:2, text:"Freelance : combien tu perds vraiment sans IA ?"},
      {id:3, text:"Comment j'ai gagné 15h par semaine avec l'IA"},
      {id:4, text:"Les 5 outils IA qui ont changé mon business"},
      {id:5, text:"Automatisation no-code : le guide honnête"},
      {id:6, text:"Business sans IA en 2026 : une erreur fatale ?"}
    ]
  },
  doudelio: {
    tiktok: [
      {id:1,  text:"Journée type auxiliaire de puéricultrice"},
      {id:2,  text:"Geste qui calme un enfant qui pleure"},
      {id:3,  text:"Activité motricité 18 mois facile"},
      {id:4,  text:"Quand un tout-petit refuse de dormir"},
      {id:5,  text:"POV : ma première semaine en crèche"},
      {id:6,  text:"Coulisses : l'accueil du matin en crèche"},
      {id:7,  text:"Geste doux pour le change d'un bébé"},
      {id:8,  text:"Ton moment le plus difficile en crèche ?"},
      {id:9,  text:"1 éducatrice pour 5 bébés : la réalité"},
      {id:10, text:"Montessori en crèche : pour ou contre ?"},
      {id:11, text:"Ce jour qui m'a fait aimer ce métier"},
      {id:12, text:"Témoignage après formation Doudelio"},
      {id:13, text:"Activité sensorielle avec matériaux simples"},
      {id:14, text:"Découvrir les formations Doudelio"},
      {id:15, text:"Avant/après : coin lecture crèche transformé"}
    ],
    linkedin: [
      {id:1,  text:"Burn-out en crèche : parlons-en vraiment"},
      {id:2,  text:"Recrutement auxiliaire en 2026 : la galère"},
      {id:3,  text:"Formation continue en petite enfance"},
      {id:4,  text:"Management bienveillant en structure d'accueil"},
      {id:5,  text:"60% des équipes de crèche en sous-effectif"},
      {id:6,  text:"Diriger une crèche en 2026"},
      {id:7,  text:"Le CAP PE suffit-il vraiment sur le terrain ?"},
      {id:8,  text:"Comment gérez-vous le turn-over en crèche ?"},
      {id:9,  text:"POV directrice : 1 an après la réorganisation"},
      {id:10, text:"3 crèches formées, 0 rupture contractuelle"},
      {id:11, text:"Différence entre éducatrice et auxiliaire"},
      {id:12, text:"Diagnostic gratuit équipe de crèche"},
      {id:13, text:"Comment Doudelio forme les équipes"},
      {id:14, text:"Coût réel d'un recrutement raté en crèche"},
      {id:15, text:"La vraie cause du burn-out en crèche"}
    ],
    instagram: [
      {id:1,  text:"Carousel activité éveil 0-3 ans"},
      {id:2,  text:"Idée déco coin lecture crèche"},
      {id:3,  text:"Routine accueil matin en crèche"},
      {id:4,  text:"Tenue Doudelio pour les pros du terrain"},
      {id:5,  text:"5 activités sensorielles à moins de 5€"},
      {id:6,  text:"Le sourire qui efface tout"},
      {id:7,  text:"Votre activité préférée avec les tout-petits ?"},
      {id:8,  text:"Les couleurs d'une crèche Doudelio"},
      {id:9,  text:"3 000 auxiliaires formées par Doudelio"},
      {id:10, text:"Avant/après formation d'équipe"},
      {id:11, text:"Ma journée en crèche en images"},
      {id:12, text:"Télécharger notre guide activités gratuites"},
      {id:13, text:"Développement du langage 0-2 ans"},
      {id:14, text:"Faut-il tolérer les écrans en crèche ?"},
      {id:15, text:"Les petits moments de vrai bonheur en crèche"}
    ],
    gmb: [
      {id:1,  text:"Crèche bienveillante et pédagogie active"},
      {id:2,  text:"Formation auxiliaire petite enfance"},
      {id:3,  text:"Accompagnement équipe de crèche"},
      {id:4,  text:"Réglementation accueil collectif 2026"},
      {id:5,  text:"Formation obligatoire EAJE 2026"},
      {id:6,  text:"Gestion équipe crèche multi-sites"},
      {id:7,  text:"Pédagogie Montessori en crèche collective"},
      {id:8,  text:"Formation premiers secours petite enfance"},
      {id:9,  text:"Recrutement auxiliaire et fidélisation"},
      {id:10, text:"Accueil enfant en situation de handicap"},
      {id:11, text:"Formation continue auxiliaire puéricultrice"},
      {id:12, text:"Prévention burn-out équipe crèche"},
      {id:13, text:"Management bienveillant structure d'accueil"},
      {id:14, text:"Aménagement espace de vie crèche"},
      {id:15, text:"Formation CAP PE remise à niveau"}
    ],
    facebook: [
      {id:1,  text:"Question aux parents : ce que vous appréciez"},
      {id:2,  text:"Conseil du jour pour les pros de crèche"},
      {id:3,  text:"Partage expérience terrain auxiliaire"},
      {id:4,  text:"Événement formation petite enfance"},
      {id:5,  text:"Sondage : votre plus grande difficulté ?"},
      {id:6,  text:"Astuce du lundi pour les équipes"},
      {id:7,  text:"Une journée en crèche de l'intérieur"},
      {id:8,  text:"Comment gérez-vous les transitions difficiles ?"},
      {id:9,  text:"Nos formations en ligne disponibles maintenant"},
      {id:10, text:"Avant/après formation d'équipe"},
      {id:11, text:"Les parents en crèche : quelle place ?"},
      {id:12, text:"Les étapes du développement 0-3 ans"},
      {id:13, text:"Une session de formation Doudelio"},
      {id:14, text:"1 auxiliaire sur 3 sans formation depuis 3 ans"},
      {id:15, text:"Retour d'équipe après accompagnement Doudelio"}
    ],
    pinterest: [
      {id:1,  text:"Idées activités sensorielles bébé"},
      {id:2,  text:"Aménagement espace de vie crèche"},
      {id:3,  text:"Planning semaine type structure"},
      {id:4,  text:"Fiche technique soin nouveau-né"},
      {id:5,  text:"Activités motrices 6-18 mois"},
      {id:6,  text:"Aménager un coin lecture crèche"},
      {id:7,  text:"Checklist réglementation EAJE 2026"},
      {id:8,  text:"Développement langagier 0-3 ans"},
      {id:9,  text:"Gestes premiers secours nourrisson"},
      {id:10, text:"Guide formation continue auxiliaire"},
      {id:11, text:"Pédagogie bienveillante en crèche"},
      {id:12, text:"Checklist accueil enfant handicapé"},
      {id:13, text:"Schéma routine soin nouveau-né"},
      {id:14, text:"Signes de mal-être au travail en crèche"},
      {id:15, text:"Aménager une salle de motricité"}
    ],
    spotify: [
      {id:1,  text:"Épuisement professionnel en crèche"},
      {id:2,  text:"Témoignage : auxiliaire depuis 10 ans"},
      {id:3,  text:"Pédagogie Montessori en collectif"},
      {id:4,  text:"Accueil enfant handicapé en crèche"},
      {id:5,  text:"Directrice qui a transformé son équipe"},
      {id:6,  text:"Les erreurs qu'on fait tous en crèche"},
      {id:7,  text:"Montessori vs pédagogie classique en collectif"},
      {id:8,  text:"Burn-out : comment j'en suis sortie"},
      {id:9,  text:"Coulisses : conception d'une formation Doudelio"},
      {id:10, text:"Une auxiliaire qui a créé sa micro-crèche"},
      {id:11, text:"Réglementation crèche : on décrypte tout"},
      {id:12, text:"Ce qui m'a redonné envie ce matin"},
      {id:13, text:"Les outils qu'on garde pour nous en crèche"},
      {id:14, text:"Formation en ligne vs présentiel pour auxis"},
      {id:15, text:"Un pédiatre parle du quotidien en crèche"}
    ],
    brevo: [
      {id:1,  text:"Newsletter : nouveautés réglementation"},
      {id:2,  text:"Email : formation disponible en ligne"},
      {id:3,  text:"Campagne : journée portes ouvertes"},
      {id:4,  text:"Recap : conseils terrain de la semaine"},
      {id:5,  text:"Prête pour votre prochaine formation ?"},
      {id:6,  text:"Newsletter : retour terrain auxiliaire"},
      {id:7,  text:"Offre duo directrice et équipe"},
      {id:8,  text:"Email : guide activités gratuites en cadeau"},
      {id:9,  text:"Réactivation : 6 mois sans formation"},
      {id:10, text:"Newsletter : nouveauté pédagogique du trimestre"},
      {id:11, text:"Email bienvenue : votre parcours Doudelio"},
      {id:12, text:"Formation obligatoire EAJE avant l'été"},
      {id:13, text:"Email post-formation : vos prochaines étapes"},
      {id:14, text:"Newsletter : cas terrain du mois"},
      {id:15, text:"Checklist réglementation 2026 offerte"}
    ],
    youtube: [
      {id:1,  text:"Tuto : créer une routine CPF en crèche"},
      {id:2,  text:"Pourquoi la formation continue sauve des équipes"},
      {id:3,  text:"Interview directrice de crèche terrain"},
      {id:4,  text:"Replay webinaire : réglementation 2026"},
      {id:5,  text:"Aménager un espace motricité en crèche"},
      {id:6,  text:"Auxiliaire qui a créé sa propre crèche"},
      {id:7,  text:"Formations en ligne vs présentiel pour auxis"},
      {id:8,  text:"Live Q&A : questions réglementation EAJE"},
      {id:9,  text:"Peut-on vraiment appliquer Montessori en collectif ?"},
      {id:10, text:"Gestes premiers secours nourrisson"},
      {id:11, text:"Transformation d'une équipe en 3 mois"},
      {id:12, text:"Créer un planning semaine en crèche"},
      {id:13, text:"Une infirmière puéricultrice parle du terrain"},
      {id:14, text:"1 semaine dans une crèche Doudelio"},
      {id:15, text:"Animer une réunion d'équipe bienveillante"}
    ]
  }
};

const PLATFORM_EMO = {
  tiktok:'🎵',linkedin:'💼',instagram:'📸',gmb:'📍',
  facebook:'👤',pinterest:'📌',spotify:'🎧',brevo:'📧',youtube:'▶️'
};

const PLATFORMS_META = {
  tiktok:{label:'TikTok — Prompt Veo',icon:`<svg viewBox="0 0 24 24" fill="#010101" width="22" height="22"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>`},
  linkedin:{label:'LinkedIn',icon:`<svg viewBox="0 0 24 24" fill="#0A66C2" width="22" height="22"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`},
  instagram:{label:'Instagram',icon:`<svg viewBox="0 0 24 24" width="22" height="22"><defs><linearGradient id="ig2" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#f09433"/><stop offset="50%" style="stop-color:#dc2743"/><stop offset="100%" style="stop-color:#bc1888"/></linearGradient></defs><path fill="url(#ig2)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`},
  gmb:{label:'Google My Business',icon:`<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 0C8.07 0 4.5 3.13 4.5 7.5c0 5.25 7.5 16.5 7.5 16.5s7.5-11.25 7.5-16.5C19.5 3.13 15.93 0 12 0zm0 10.5a3 3 0 110-6 3 3 0 010 6z" fill="#4285F4"/></svg>`},
  facebook:{label:'Facebook',icon:`<svg viewBox="0 0 24 24" fill="#1877F2" width="22" height="22"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`},
  pinterest:{label:'Pinterest',icon:`<svg viewBox="0 0 24 24" fill="#E60023" width="22" height="22"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>`},
  spotify:{label:'Spotify — Podcast',icon:`<svg viewBox="0 0 24 24" fill="#1DB954" width="22" height="22"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>`},
  brevo:{label:'Brevo — Email',icon:`<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><rect width="24" height="24" rx="6" fill="#0092FF"/><path d="M6 7h5.5c2 0 3.5 1.2 3.5 3 0 1-.5 1.8-1.3 2.3C15 12.8 16 13.8 16 15.2 16 17.3 14.3 18 12 18H6V7zm2 4.5h3c.8 0 1.5-.5 1.5-1.3S11.8 9 11 9H8v2.5zm0 5H12c1 0 1.7-.5 1.7-1.4S13 13.5 12 13.5H8V16.5z" fill="white"/></svg>`},
  youtube:{label:'YouTube',icon:`<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#FF0000" d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>`}
};

// ===== PLATFORM DEFAULTS PER BRAND (first load only) =====
const PLATFORM_DEFAULTS_HIDDEN = {
  intelixa: ['tiktok', 'pinterest', 'spotify'],
  doudelio:  ['linkedin', 'gmb', 'spotify']
};

const BRAND_CONTEXT = {
  intelixa: {
    label: 'INTELIXA',
    desc: `Intelixa aide les freelances, solopreneurs, indépendants et TPE/PME à automatiser leurs process grâce à l'IA. Message central : l'IA n'est plus un luxe, c'est une arme. Ceux qui l'utilisent écrasent la concurrence. Ceux qui ignorent l'IA perdent du temps, de l'argent et des clients — chaque jour. Cible : freelance, solopreneur, indépendant, dirigeant TPE/PME. Angle : toujours partir de la douleur client (temps perdu, argent gaspillé, surcharge mentale, retard sur la concurrence), montrer la transformation concrète avec l'IA, chiffrer quand possible. Ton : direct, cash, provocateur mais jamais agressif. Comme un ami qui te dit ce que les autres n'osent pas. Pas de langue de bois. Pas de jargon inutile. Des faits, des chiffres, des transformations réelles. CPF : levier de financement secondaire, pas l'argument principal.`,
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
  spotify: () => `Génère une description d'épisode podcast Spotify de 150-250 mots :\n- Accroche forte dès la 1ère phrase\n- Résumé du thème\n- Ce que l'auditeur va apprendre\n- CTA : s'abonner, laisser un avis`,
  youtube: (b) => {
    if (b.label === 'INTELIXA') {
      return `Génère une description YouTube complète et optimisée SEO pour Intelixa sur le thème fourni.

Format vidéo cible : 8 à 15 minutes, ton expert et accessible, sur l'IA appliquée et la bureautique professionnelle.

À fournir :
1. TITRE YOUTUBE accrocheur (60-70 caractères max), orienté bénéfice, avec mot-clé principal
2. DESCRIPTION YOUTUBE (500-800 mots) :
   - Paragraphe d'intro (2-3 phrases percutantes qui expliquent pourquoi regarder)
   - Corps principal : valeur apportée, points clés abordés
   - Liens et ressources (placeholder : [LIEN])
   - CTA : s'abonner, commenter, partager
3. CHAPITRES SUGGÉRÉS (format 00:00 - Titre, au moins 5 chapitres)
4. TAGS YouTube (15-20 tags séparés par des virgules, mélange court et longue traîne)
5. HASHTAGS (5 hashtags)

Contraintes SEO : intégrer naturellement les mots-clés formation IA, bureautique professionnelle, automatisation, productivité, TPE, CPF. Titre et description doivent donner envie de cliquer.`;
    } else {
      return `Génère une description YouTube complète et optimisée SEO pour Doudelio sur le thème fourni.

Format vidéo cible : 8 à 15 minutes, ton humain et bienveillant, sur la petite enfance et les professionnels de crèche.

À fournir :
1. TITRE YOUTUBE accrocheur (60-70 caractères max), orienté terrain, avec mot-clé principal
2. DESCRIPTION YOUTUBE (500-800 mots) :
   - Paragraphe d'intro chaleureux, ancré dans le quotidien en crèche
   - Corps principal : ce que la vidéo apporte aux pros, points clés
   - Liens et ressources (placeholder : [LIEN])
   - CTA : s'abonner, commenter, partager avec un collègue
3. CHAPITRES SUGGÉRÉS (format 00:00 - Titre, au moins 5 chapitres)
4. TAGS YouTube (15-20 tags séparés par des virgules, mélange court et longue traîne)
5. HASHTAGS (5 hashtags)

Contraintes SEO : intégrer naturellement les mots-clés crèche, auxiliaire de puéricultrice, petite enfance, formation professionnelle, pédagogie. Ton positif, jamais culpabilisant.`;
    }
  }
};

// ===== PLANNING HEBDOMADAIRE =====
// 0=Lundi … 6=Dimanche
const PLANNING_HEBDO = {
  0: [
    "Publication Meta — 19h",
    "Google My Business Intelixa",
    "50 actions LinkedIn",
    "TikTok Doudelio — 1/jour"
  ],
  1: [
    "Story Meta (portrait formatrice ou prochaine session avec lien site)",
    "Publication LinkedIn — 11h30",
    "Google My Business Doudelio",
    "50 actions LinkedIn",
    "TikTok Doudelio — 1/jour"
  ],
  2: [
    "Publication Meta — soir",
    "Publication LinkedIn",
    "50 actions LinkedIn",
    "TikTok Doudelio — 1/jour",
    "Pinterest — 3x/semaine"
  ],
  3: [
    "Story Meta",
    "Publication LinkedIn — 11h30",
    "50 actions LinkedIn",
    "TikTok Doudelio — 1/jour"
  ],
  4: [
    "Publication Meta — matin ou midi",
    "50 actions LinkedIn",
    "TikTok Doudelio — 1/jour",
    "Pinterest — 3x/semaine"
  ],
  5: [],
  6: [
    "Newsletter (1x/mois)",
    "YouTube / Podcast (1x/semaine)",
    "Webinaire (1x/mois — dimanche/lundi soir)"
  ]
};

// ===== TÂCHES RÉCURRENTES =====
const TACHES_RECURRENTES = {
  quotidien: [
    { text: "50 interactions LinkedIn",       platforms: ["linkedin"] },
    { text: "TikTok Doudelio — 1 vidéo/jour", platforms: ["tiktok"] }
  ],
  hebdomadaire: [
    { text: "Changer la pub Facebook/Instagram", platforms: ["facebook", "instagram"] },
    { text: "Pinterest — 3 posts/semaine",        platforms: ["pinterest"] },
    { text: "Google My Business — 1 post/semaine",platforms: ["gmb"] }
  ],
  ponctuel: [
    { text: "Programmer un webinaire",         platforms: ["calendar"] },
    { text: "Enregistrer YouTube / Podcast",   platforms: ["youtube"] },
    { text: "Newsletter mensuelle",            platforms: ["brevo"] }
  ]
};
