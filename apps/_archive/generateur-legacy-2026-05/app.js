// ============================================================
//  ZONE TOTAL SPORT — SAÉ GENERATOR
//  Glassmorphism · Luckiest Guy + Bangers + Schoolbell
//  4 LANGUES : FR · EN · ES · 中文
//  PART 1 OF 2 — Sections 1-8
// ============================================================

// ============================================================
//  SECTION 1: I18N SYSTEM (4 languages)
// ============================================================

const LANG = { current: 'fr' };

const I18N = {
  // Loading
  loading: { fr: 'CHARGEMENT...', en: 'LOADING...', es: 'CARGANDO...', zh: '加载中...' },
  // Header
  statSae: { fr: 'SAÉ', en: 'LSA', es: 'SEA', zh: 'SAÉ' },
  statJeux: { fr: 'JEUX', en: 'GAMES', es: 'JUEGOS', zh: '游戏' },
  statMesSae: { fr: 'MES SAÉ', en: 'MY LSA', es: 'MIS SEA', zh: '我的SAÉ' },
  // Tabs
  tabBanque: { fr: 'BANQUE SAÉ', en: 'SAÉ BANK', es: 'BANCO SEA', zh: 'SAÉ库' },
  tabCreateur: { fr: 'CRÉER UNE SAÉ', en: 'CREATE LSA', es: 'CREAR SEA', zh: '创建SAÉ' },
  tabMesSae: { fr: 'MES SAÉ', en: 'MY LSA', es: 'MIS SEA', zh: '我的SAÉ' },
  tabMachine: { fr: 'MACHINE À DÉFIS', en: 'CHALLENGE MACHINE', es: 'MÁQUINA DE RETOS', zh: '挑战机' },
  tabJeux: { fr: 'JEUX', en: 'GAMES', es: 'JUEGOS', zh: '游戏' },
  tabEducatifs: { fr: 'ÉDUCATIFS', en: 'DRILLS', es: 'EDUCATIVOS', zh: '训练' },
  tabMusique: { fr: 'MUSIQUE', en: 'MUSIC', es: 'MÚSICA', zh: '音乐' },
  // Heroes
  heroBanqueTitle: { fr: 'BANQUE MONDIALE DE SAÉ', en: 'WORLD SAÉ BANK', es: 'BANCO MUNDIAL DE SEA', zh: '世界SAÉ库' },
  heroBanqueSub: { fr: '1000+ Situations d\'Apprentissage et d\'Évaluation · PFEQ Québec · Maternelle → Secondaire 5', en: '1000+ Learning & Assessment Situations · PFEQ Quebec · K-11', es: '1000+ Situaciones de Aprendizaje y Evaluación · PFEQ Quebec', zh: '1000+ 学习与评估情境 · PFEQ 魁北克' },
  heroCreateurTitle: { fr: 'CRÉER UNE SAÉ PERSONNALISÉE', en: 'CREATE A CUSTOM LSA', es: 'CREAR UNA SEA PERSONALIZADA', zh: '创建自定义SAÉ' },
  heroCreateurSub: { fr: 'Concevez votre situation d\'apprentissage sur mesure · Conforme au PFEQ', en: 'Design your custom learning situation · PFEQ compliant', es: 'Diseñe su situación de aprendizaje · Conforme al PFEQ', zh: '设计你的定制学习情境 · 符合PFEQ' },
  heroMesSaeTitle: { fr: 'MES SAÉ SAUVEGARDÉES', en: 'MY SAVED LSA', es: 'MIS SEA GUARDADAS', zh: '我保存的SAÉ' },
  heroMesSaeSub: { fr: 'Retrouvez, modifiez et exportez vos créations', en: 'Find, edit and export your creations', es: 'Encuentre, edite y exporte sus creaciones', zh: '查找、编辑和导出您的创作' },
  heroMachineTitle: { fr: 'MACHINE À DÉFIS SPORTIFS', en: 'SPORTS CHALLENGE MACHINE', es: 'MÁQUINA DE RETOS DEPORTIVOS', zh: '体育挑战机' },
  heroMachineSub: { fr: 'Tire au sort une SAÉ aléatoire · Effet slot machine!', en: 'Draw a random SAÉ · Slot machine effect!', es: 'Sortea una SEA aleatoria · ¡Efecto tragamonedas!', zh: '随机抽取SAÉ · 老虎机效果！' },
  heroJeuxTitle: { fr: 'BANQUE DE JEUX SPORTIFS MONDIAUX', en: 'WORLD SPORTS GAME BANK', es: 'BANCO MUNDIAL DE JUEGOS', zh: '世界体育游戏库' },
  heroJeuxSub: { fr: '1000+ jeux de partout sur la planète', en: '1000+ games from around the world', es: '1000+ juegos de todo el mundo', zh: '1000+ 来自世界各地的游戏' },
  heroEduTitle: { fr: 'BANQUE D\'ÉDUCATIFS', en: 'DRILLS BANK', es: 'BANCO DE EDUCATIVOS', zh: '训练库' },
  heroEduSub: { fr: '1000+ éducatifs par moyens d\'action', en: '1000+ drills by action means', es: '1000+ educativos por medios de acción', zh: '1000+ 按行动手段分类的训练' },
  heroMusiqueTitle: { fr: 'BIBLIOTHÈQUE MUSICALE', en: 'MUSIC LIBRARY', es: 'BIBLIOTECA MUSICAL', zh: '音乐库' },
  heroMusiqueSub: { fr: 'Musiques libres de droits pour l\'ÉPS', en: 'Royalty-free music for PE', es: 'Música libre de derechos para EF', zh: '体育教育免版税音乐' },
  // Filters
  searchSae: { fr: '🔍 Rechercher une SAÉ...', en: '🔍 Search LSA...', es: '🔍 Buscar SEA...', zh: '🔍 搜索SAÉ...' },
  allCycles: { fr: 'Tous les cycles', en: 'All cycles', es: 'Todos los ciclos', zh: '所有周期' },
  allMoyens: { fr: 'Tous les moyens d\'action', en: 'All action means', es: 'Todos los medios', zh: '所有行动手段' },
  allCompetences: { fr: 'Toutes les compétences', en: 'All competencies', es: 'Todas las competencias', zh: '所有能力' },
  moyensTitle: { fr: '⚡ FILTRER PAR MOYEN D\'ACTION', en: '⚡ FILTER BY ACTION MEAN', es: '⚡ FILTRAR POR MEDIO', zh: '⚡ 按行动手段筛选' },
  favFilter: { fr: '☆ Favoris', en: '☆ Favorites', es: '☆ Favoritos', zh: '☆ 收藏' },
  // Creator
  btnSave: { fr: '💾 SAUVEGARDER MA SAÉ', en: '💾 SAVE MY LSA', es: '💾 GUARDAR MI SEA', zh: '💾 保存我的SAÉ' },
  btnPreview: { fr: '👁️ PRÉVISUALISER', en: '👁️ PREVIEW', es: '👁️ PREVISUALIZAR', zh: '👁️ 预览' },
  btnReset: { fr: '🗑️ RÉINITIALISER', en: '🗑️ RESET', es: '🗑️ REINICIAR', zh: '🗑️ 重置' },
  btnExportAll: { fr: '📤 Exporter tout (JSON)', en: '📤 Export all (JSON)', es: '📤 Exportar todo (JSON)', zh: '📤 导出全部(JSON)' },
  btnImport: { fr: '📥 Importer', en: '📥 Import', es: '📥 Importar', zh: '📥 导入' },
  noSaeSaved: { fr: 'Aucune SAÉ sauvegardée', en: 'No saved LSA', es: 'Ninguna SEA guardada', zh: '没有保存的SAÉ' },
  noSaeSavedSub: { fr: 'Créez votre première SAÉ ou dupliquez-en une depuis la banque!', en: 'Create your first LSA or duplicate one from the bank!', es: '¡Cree su primera SEA o duplique una del banco!', zh: '创建你的第一个SAÉ或从库中复制一个！' },
  slotLabel: { fr: '🎯 PRÊT À RELEVER LE DÉFI?', en: '🎯 READY FOR A CHALLENGE?', es: '🎯 ¿LISTO PARA EL RETO?', zh: '🎯 准备好迎接挑战了吗？' },
  slotBtn: { fr: '🎰 TIRER AU SORT!', en: '🎰 SPIN!', es: '🎰 ¡GIRAR!', zh: '🎰 旋转！' },
  uploadText: { fr: 'Glissez vos fichiers ici ou cliquez pour parcourir', en: 'Drop files here or click to browse', es: 'Arrastre archivos aquí o haga clic', zh: '将文件拖到这里或点击浏览' },
  back: { fr: 'Retour', en: 'Back', es: 'Volver', zh: '返回' },
  close: { fr: '✕ FERMER', en: '✕ CLOSE', es: '✕ CERRAR', zh: '✕ 关闭' },
  linkCopied: { fr: 'Lien copié !', en: 'Link copied!', es: '¡Enlace copiado!', zh: '链接已复制！' },
  saeSaved: { fr: 'SAÉ sauvegardée !', en: 'LSA saved!', es: '¡SEA guardada!', zh: 'SAÉ已保存！' },
  saeDeleted: { fr: 'SAÉ supprimée', en: 'LSA deleted', es: 'SEA eliminada', zh: 'SAÉ已删除' },
  confirmDelete: { fr: 'Supprimer cette SAÉ ?', en: 'Delete this LSA?', es: '¿Eliminar esta SEA?', zh: '删除这个SAÉ？' },
  previewEmpty: { fr: 'Commencez à remplir le formulaire...', en: 'Start filling the form...', es: 'Empiece a llenar el formulario...', zh: '开始填写表单...' },
  // Modal section labels
  mIntentions: { fr: '🎯 Intentions pédagogiques', en: '🎯 Pedagogical intentions', es: '🎯 Intenciones pedagógicas', zh: '🎯 教学目标' },
  mContexte: { fr: '📖 Mise en contexte', en: '📖 Context', es: '📖 Contexto', zh: '📖 背景' },
  mMiseEnTrain: { fr: '🏃 Phase 1 — Échauffement', en: '🏃 Phase 1 — Warm-up', es: '🏃 Fase 1 — Calentamiento', zh: '🏃 第1阶段 — 热身' },
  mPartie1: { fr: '⚡ Phase 2 — Développement', en: '⚡ Phase 2 — Development', es: '⚡ Fase 2 — Desarrollo', zh: '⚡ 第2阶段 — 发展' },
  mPartie2: { fr: '🔄 Phase 3 — Réinvestissement', en: '🔄 Phase 3 — Reinvestment', es: '🔄 Fase 3 — Reinversión', zh: '🔄 第3阶段 — 再投入' },
  mRetour: { fr: '🧘 Phase 4 — Retour au calme', en: '🧘 Phase 4 — Cool-down', es: '🧘 Fase 4 — Vuelta a la calma', zh: '🧘 第4阶段 — 放松' },
  mEvaluation: { fr: '📊 Évaluation', en: '📊 Assessment', es: '📊 Evaluación', zh: '📊 评估' },
  mAdaptations: { fr: '♿ Adaptations HDAA', en: '♿ Special needs adaptations', es: '♿ Adaptaciones NEE', zh: '♿ 特殊需求适应' },
  mVariantes: { fr: '🔀 Variantes', en: '🔀 Variations', es: '🔀 Variantes', zh: '🔀 变体' },
  mMateriel: { fr: '🎒 Matériel', en: '🎒 Equipment', es: '🎒 Material', zh: '🎒 设备' },
  mValeurs: { fr: '❤️ Valeurs éducatives', en: '❤️ Educational values', es: '❤️ Valores educativos', zh: '❤️ 教育价值' },
  duplicateSae: { fr: '📋 Dupliquer comme modèle', en: '📋 Duplicate as template', es: '📋 Duplicar como plantilla', zh: '📋 复制为模板' },
  // Extra labels used in modals / rendering
  niveau: { fr: 'NIVEAU', en: 'LEVEL', es: 'NIVEL', zh: '级别' },
  duree: { fr: 'DURÉE', en: 'DURATION', es: 'DURACIÓN', zh: '时长' },
  competence: { fr: 'COMPÉTENCE', en: 'COMPETENCY', es: 'COMPETENCIA', zh: '能力' },
  moyenAction: { fr: 'MOYEN D\'ACTION', en: 'ACTION MEAN', es: 'MEDIO DE ACCIÓN', zh: '行动手段' },
  espace: { fr: 'ESPACE', en: 'SPACE', es: 'ESPACIO', zh: '空间' },
  nbEleves: { fr: 'ÉLÈVES', en: 'STUDENTS', es: 'ALUMNOS', zh: '学生' },
  print: { fr: '🖨️ Imprimer', en: '🖨️ Print', es: '🖨️ Imprimir', zh: '🖨️ 打印' },
  share: { fr: '🔗 Partager', en: '🔗 Share', es: '🔗 Compartir', zh: '🔗 分享' },
  noResults: { fr: '🔍 AUCUN RÉSULTAT', en: '🔍 NO RESULTS', es: '🔍 SIN RESULTADOS', zh: '🔍 没有结果' },
  eduTaxTitle: { fr: 'CHOISIR UN MOYEN D\'ACTION', en: 'CHOOSE AN ACTION MEAN', es: 'ELEGIR UN MEDIO DE ACCIÓN', zh: '选择行动手段' },
  seeGame: { fr: '👉 VOIR LE JEU', en: '👉 SEE THE GAME', es: '👉 VER EL JUEGO', zh: '👉 查看游戏' },
  seeSae: { fr: '👉 VOIR LA SAÉ', en: '👉 SEE THE LSA', es: '👉 VER LA SEA', zh: '👉 查看SAÉ' },
  templateLabel: { fr: '📋 Partir d\'un modèle existant :', en: '📋 Start from a template:', es: '📋 Partir de una plantilla:', zh: '📋 从模板开始：' },
  orBlank: { fr: 'ou créer à partir de zéro', en: 'or create from scratch', es: 'o crear desde cero', zh: '或从零开始' },
  formInfoTitle: { fr: '📋 Informations générales', en: '📋 General information', es: '📋 Información general', zh: '📋 基本信息' },
  formDeroulementTitle: { fr: '🏃 Déroulement de la SAÉ', en: '🏃 SAÉ Steps', es: '🏃 Desarrollo de la SEA', zh: '🏃 SAÉ流程' },
  formEvalTitle: { fr: '📊 Évaluation', en: '📊 Assessment', es: '📊 Evaluación', zh: '📊 评估' },
  formAdaptTitle: { fr: '♿ Adaptations et Variantes', en: '♿ Adaptations & Variations', es: '♿ Adaptaciones y Variantes', zh: '♿ 适应与变体' },
  formFilesTitle: { fr: '📎 Fichiers joints', en: '📎 Attached files', es: '📎 Archivos adjuntos', zh: '📎 附件' },
  previewTitle: { fr: '👁️ PRÉVISUALISATION EN DIRECT', en: '👁️ LIVE PREVIEW', es: '👁️ PREVISUALIZACIÓN EN VIVO', zh: '👁️ 实时预览' },
};

function t(key) {
  return I18N[key]?.[LANG.current] || I18N[key]?.fr || key;
}

function setLang(lang) {
  LANG.current = lang;
  document.getElementById('htmlRoot').lang = lang;

  // Update language buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const isActive = btn.dataset.lang === lang;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  // Update all data-i18n elements (textContent)
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (I18N[key]) {
      el.textContent = t(key);
    }
  });

  // Update all data-i18n-placeholder elements
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (I18N[key]) {
      el.placeholder = t(key);
    }
  });

  // Re-render all visible content
  if (allSAE.length > 0) {
    renderSAE();
    renderMoyensBrowser();
  }
  if (allJeux.length > 0) {
    renderJeux();
  }
  renderMesSae();
  updateXPDisplay();
  updateHeaderStats();
}


// ============================================================
//  SECTION 2: DATA SOURCES
// ============================================================

const SAE_SOURCES = [
  'data/sae/prescolaire.json',
  'data/sae/primaire.json',
  'data/sae/secondaire.json',
  'data/sae/cooperation.json',
  'data/sae/collectifs.json',
  'data/sae/opposition.json',
  'data/sae/dodgeball.json',
  'data/sae/locomotion.json',
  'data/sae/mobilite.json',
  'data/sae/poursuite.json',
  'data/sae/duel.json',
  'data/sae/conditionnement.json',
  'data/sae/expression_corporelle.json',
  'data/sae/sports_collectifs_sae.json',
  'data/sae/manipulation_new.json',
  'data/sae/locomotion_new.json',
  'data/sae/expression_artistique.json',
  'data/sae/adresse_individuel.json',
  'data/sae/cooperation_gen.json',
  'data/sae/poursuite_gen.json',
  'data/sae/prescolaire_primaire_gen.json',
  'data/sae/individuelles_part8.json',
];

const JEUX_SOURCES = [
  'data/jeux/ballon_chasseur.json',
  'data/jeux/cooperation.json',
  'data/jeux/exterieur.json',
  'data/jeux/jeux_afrique_asie_oceanie.json',
  'data/jeux/jeux_ameriques_europe.json',
  'data/jeux/jeux_autochtones.json',
  'data/jeux/jeux_avec_materiel.json',
  'data/jeux/jeux_olympiques_paralympiques.json',
  'data/jeux/jeux_prescolaire.json',
  'data/jeux/jeux_secondaire.json',
  'data/jeux/opposition.json',
  'data/jeux/poursuite.json',
  'data/jeux/sans_materiel.json',
  'data/jeux/sports_collectifs.json',
  'data/jeux/sports_individuels.json',
  'data/jeux/traditionnels_monde.json',
];

const MOYENS_ACTION = [
  {
    id: 'manipulation',
    icon: '🎯',
    color: '#00d4ff',
    labels: { fr: 'Manipulation d\'objets', en: 'Object manipulation', es: 'Manipulación de objetos', zh: '物体操控' },
    items: [
      { id: 'balle', icon: '⚾', labels: { fr: 'Balles', en: 'Balls', es: 'Pelotas', zh: '球' } },
      { id: 'ballon', icon: '⚽', labels: { fr: 'Ballons', en: 'Balls (large)', es: 'Balones', zh: '大球' } },
      { id: 'raquette', icon: '🏸', labels: { fr: 'Raquettes', en: 'Rackets', es: 'Raquetas', zh: '球拍' } },
      { id: 'baton', icon: '🏒', labels: { fr: 'Bâtons', en: 'Sticks', es: 'Bastones', zh: '棍棒' } },
      { id: 'corde', icon: '🪢', labels: { fr: 'Cordes', en: 'Ropes', es: 'Cuerdas', zh: '绳子' } },
      { id: 'cerceau', icon: '⭕', labels: { fr: 'Cerceaux', en: 'Hoops', es: 'Aros', zh: '圈' } },
      { id: 'frisbee', icon: '🥏', labels: { fr: 'Frisbee', en: 'Frisbee', es: 'Frisbee', zh: '飞盘' } },
      { id: 'cirque', icon: '🎪', labels: { fr: 'Cirque', en: 'Circus', es: 'Circo', zh: '马戏' } },
    ]
  },
  {
    id: 'locomotion',
    icon: '🏃',
    color: '#ffd700',
    labels: { fr: 'Locomotion', en: 'Locomotion', es: 'Locomoción', zh: '运动' },
    items: [
      { id: 'courir', icon: '🏃', labels: { fr: 'Courir', en: 'Running', es: 'Correr', zh: '跑步' } },
      { id: 'sauter', icon: '🦘', labels: { fr: 'Sauter', en: 'Jumping', es: 'Saltar', zh: '跳跃' } },
      { id: 'ramper', icon: '🐛', labels: { fr: 'Ramper/Rouler', en: 'Crawl/Roll', es: 'Reptar/Rodar', zh: '爬行/翻滚' } },
      { id: 'grimper', icon: '🧗', labels: { fr: 'Grimper', en: 'Climbing', es: 'Trepar', zh: '攀爬' } },
      { id: 'esquiver', icon: '💨', labels: { fr: 'Esquiver', en: 'Dodging', es: 'Esquivar', zh: '闪避' } },
    ]
  },
  {
    id: 'stabilisation',
    icon: '⚖️',
    color: '#ff6b6b',
    labels: { fr: 'Stabilisation', en: 'Stabilization', es: 'Estabilización', zh: '稳定' },
    items: [
      { id: 'equilibre', icon: '⚖️', labels: { fr: 'Équilibre', en: 'Balance', es: 'Equilibrio', zh: '平衡' } },
      { id: 'souplesse', icon: '🤸', labels: { fr: 'Souplesse', en: 'Flexibility', es: 'Flexibilidad', zh: '柔韧' } },
      { id: 'gainage', icon: '💪', labels: { fr: 'Gainage', en: 'Core training', es: 'Core', zh: '核心训练' } },
      { id: 'coordination', icon: '🎯', labels: { fr: 'Coordination', en: 'Coordination', es: 'Coordinación', zh: '协调' } },
    ]
  },
  {
    id: 'opposition',
    icon: '⚔️',
    color: '#ff4757',
    labels: { fr: 'Opposition', en: 'Opposition', es: 'Oposición', zh: '对抗' },
    items: [
      { id: 'lutte', icon: '🤼', labels: { fr: 'Lutte', en: 'Wrestling', es: 'Lucha', zh: '摔跤' } },
      { id: 'duel', icon: '⚔️', labels: { fr: 'Duel', en: 'Duel', es: 'Duelo', zh: '决斗' } },
      { id: 'territoire', icon: '🏰', labels: { fr: 'Territoire', en: 'Territory', es: 'Territorio', zh: '领地' } },
    ]
  },
  {
    id: 'cooperation',
    icon: '🤝',
    color: '#2ed573',
    labels: { fr: 'Coopération', en: 'Cooperation', es: 'Cooperación', zh: '合作' },
    items: [
      { id: 'communication', icon: '📣', labels: { fr: 'Communication', en: 'Communication', es: 'Comunicación', zh: '沟通' } },
      { id: 'strategie', icon: '♟️', labels: { fr: 'Stratégie', en: 'Strategy', es: 'Estrategia', zh: '策略' } },
      { id: 'construction', icon: '🏗️', labels: { fr: 'Construction', en: 'Building', es: 'Construcción', zh: '建造' } },
    ]
  },
  {
    id: 'expression',
    icon: '💃',
    color: '#a55eea',
    labels: { fr: 'Expression', en: 'Expression', es: 'Expresión', zh: '表达' },
    items: [
      { id: 'danse', icon: '💃', labels: { fr: 'Danse', en: 'Dance', es: 'Danza', zh: '舞蹈' } },
      { id: 'mime', icon: '🎭', labels: { fr: 'Mime', en: 'Mime', es: 'Mimo', zh: '哑剧' } },
      { id: 'acrosport', icon: '🤸', labels: { fr: 'Acrosport', en: 'Acrosport', es: 'Acrosport', zh: '技巧体操' } },
    ]
  },
];


// ============================================================
//  SECTION 3: GLOBAL STATE + INIT
// ============================================================

let allSAE = [];
let allJeux = [];
let filteredSAE = [];
let filteredJeux = [];
let saeCurrentPage = 0;
let jeuxCurrentPage = 0;
let favFilterActive = false;
const ITEMS_PER_PAGE = 30;
let currentEditId = null;
let uploadedFiles = [];
let activeMoyenFilter = null;
let searchDebounceTimer = null;

const safetyTimer = setTimeout(hideLoading, 12000);

// Utility: escape HTML to prevent XSS
function escapeHtml(str) {
  if (str == null) return '';
  const s = String(str);
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(s));
  return div.innerHTML;
}

// Utility: truncate text
function truncate(str, len) {
  if (!str) return '';
  const s = String(str);
  return s.length > len ? s.substring(0, len) + '...' : s;
}

// Utility: show toast notification
function showToast(msg, duration) {
  duration = duration || 3000;
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// Utility: format text blocks — handles strings, arrays, and objects
function formatTextBlock(val) {
  if (!val) return '';
  if (typeof val === 'string') return escapeHtml(val).replace(/\n/g, '<br>');
  if (Array.isArray(val)) {
    return '<ul>' + val.map(v => {
      if (typeof v === 'object' && v !== null) {
        const title = v.titre || v.nom || v.etape || v.name || '';
        const desc = v.description || v.consignes || v.details || v.texte || '';
        return '<li><strong>' + escapeHtml(title) + '</strong>' + (desc ? ': ' + escapeHtml(desc) : '') + '</li>';
      }
      return '<li>' + escapeHtml(String(v)) + '</li>';
    }).join('') + '</ul>';
  }
  if (typeof val === 'object') {
    let html = '';
    for (const [k, v] of Object.entries(val)) {
      if (v) {
        html += '<p><strong>' + escapeHtml(k.replace(/_/g, ' ')) + ':</strong> ';
        html += typeof v === 'string' ? escapeHtml(v) : formatTextBlock(v);
        html += '</p>';
      }
    }
    return html;
  }
  return escapeHtml(String(val));
}

// Hide loading screen
function hideLoading() {
  clearTimeout(safetyTimer);
  const loading = document.getElementById('loading');
  const app = document.getElementById('app');
  if (loading) {
    loading.style.opacity = '0';
    loading.style.pointerEvents = 'none';
    setTimeout(() => { loading.style.display = 'none'; }, 500);
  }
  if (app) app.classList.remove('hidden');
}

// Update loading progress bar
function updateLoadingProgress(loaded, total) {
  const pct = Math.round((loaded / total) * 100);
  const bar = document.getElementById('loadProgress');
  if (bar) bar.style.width = pct + '%';
  const loadingBar = bar?.parentElement;
  if (loadingBar) {
    loadingBar.setAttribute('aria-valuenow', pct);
  }
}

// Update header stat counts
function updateHeaderStats() {
  const savedSae = getMesSae();
  const mesSaeNum = document.getElementById('statMesSaeNum');
  if (mesSaeNum) mesSaeNum.textContent = savedSae.length;
}

// Animate counter from 0 to target
function animateCounter(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const duration = 1500;
  const start = performance.now();
  const from = 0;
  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (target - from) * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// initCanvas is handled by initBlobCanvas in Part 2
function initCanvas() {
  // Placeholder — replaced by GSAP blob canvas in Part 2
}

// initPhysics is handled by initPhysicsEmojis in Part 2
function initPhysics() {
  // Placeholder — replaced by enhanced Matter.js in Part 2
}

// Check deep links (e.g., #tab=jeux or #sae=some-id)
function checkDeepLinks() {
  const hash = window.location.hash.replace('#', '');
  if (!hash) return;
  const params = new URLSearchParams(hash);
  const tab = params.get('tab');
  if (tab) switchTab(tab);
  const saeId = params.get('sae');
  if (saeId) {
    const sae = allSAE.find(s => getSaeId(s) === saeId);
    if (sae) setTimeout(() => openSaeModal(sae), 500);
  }
}

// DOMContentLoaded — main init
document.addEventListener('DOMContentLoaded', async function() {
  // Init canvas backgrounds
  initCanvas();

  // Delayed physics init (wait for Matter.js to load)
  setTimeout(initPhysics, 1000);

  // Setup language selector
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });

  // Setup tab navigation
  setupTabNavigation();

  // Load all data
  const totalSources = SAE_SOURCES.length + JEUX_SOURCES.length;
  let loadedCount = 0;

  const onFileLoaded = () => {
    loadedCount++;
    updateLoadingProgress(loadedCount, totalSources);
  };

  await Promise.all([
    loadAllSAE(onFileLoaded),
    loadAllJeux(onFileLoaded)
  ]);

  // Deduplicate SAE by title
  const seen = new Set();
  allSAE = allSAE.filter(sae => {
    const key = (sae.titre || sae.nom || sae.title || '').toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Initial renders
  filteredSAE = [...allSAE];
  filteredJeux = [...allJeux];
  renderMoyensBrowser();
  renderSAE();
  renderJeux();
  renderMesSae();
  updateXPDisplay();
  updateHeaderStats();

  // Setup filter event listeners
  setupFilterListeners();

  // Animate header counters
  animateCounter('statSaeNum', allSAE.length);
  animateCounter('statJeuxNum', allJeux.length);

  // Hide loading
  hideLoading();

  // Check deep links
  checkDeepLinks();

  // Listen to hashchange
  window.addEventListener('hashchange', checkDeepLinks);
});


// ============================================================
//  SECTION 4: DATA LOADING
// ============================================================

async function loadAllSAE(onFileLoaded) {
  const SAE_VERSION = '20260509a';
  const results = await Promise.allSettled(
    SAE_SOURCES.map(src =>
      fetch(src + '?v=' + SAE_VERSION)
        .then(r => {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(data => {
          if (onFileLoaded) onFileLoaded();
          return data;
        })
        .catch(err => {
          console.warn('SAE load failed:', src, err.message);
          if (onFileLoaded) onFileLoaded();
          return null;
        })
    )
  );

  for (const result of results) {
    if (result.status !== 'fulfilled' || !result.value) continue;
    const data = result.value;
    const extracted = extractSaeItems(data);
    allSAE.push(...extracted);
  }
}

function extractSaeItems(data) {
  if (!data) return [];
  const items = [];

  // If it's already an array of SAE items
  if (Array.isArray(data)) {
    for (const item of data) {
      if (isSaeItem(item)) items.push(normalizeSae(item));
    }
    return items;
  }

  // If it's an object
  if (typeof data === 'object') {
    // Direct SAE properties: {saes: [...]} or {sae: [...]}
    if (Array.isArray(data.saes)) {
      for (const item of data.saes) {
        if (isSaeItem(item)) items.push(normalizeSae(item));
      }
      return items;
    }
    if (Array.isArray(data.sae)) {
      for (const item of data.sae) {
        if (isSaeItem(item)) items.push(normalizeSae(item));
      }
      return items;
    }
    // Check if root object IS a single SAE
    if (isSaeItem(data)) {
      items.push(normalizeSae(data));
      return items;
    }
    // Iterate over all values — find arrays of SAE items
    for (const val of Object.values(data)) {
      if (Array.isArray(val)) {
        for (const item of val) {
          if (isSaeItem(item)) items.push(normalizeSae(item));
        }
      } else if (typeof val === 'object' && val !== null) {
        // Recurse one level: sub-objects might contain arrays
        if (Array.isArray(val.saes)) {
          for (const item of val.saes) {
            if (isSaeItem(item)) items.push(normalizeSae(item));
          }
        } else if (Array.isArray(val.sae)) {
          for (const item of val.sae) {
            if (isSaeItem(item)) items.push(normalizeSae(item));
          }
        } else {
          // Check nested object values for arrays
          for (const subVal of Object.values(val)) {
            if (Array.isArray(subVal)) {
              for (const item of subVal) {
                if (isSaeItem(item)) items.push(normalizeSae(item));
              }
            }
          }
        }
      }
    }
  }

  return items;
}

function isSaeItem(obj) {
  if (!obj || typeof obj !== 'object') return false;
  // Must have a title-like field and at least one content field
  return !!(obj.titre || obj.nom || obj.title || obj.titre_sae || obj.nom_sae);
}

function normalizeSae(sae) {
  // Normalize common field names so we can access them uniformly
  return {
    ...sae,
    titre: sae.titre || sae.nom || sae.title || sae.titre_sae || sae.nom_sae || 'Sans titre',
    niveau: sae.niveau || sae.niveau_scolaire || sae.cycle || sae.niveaux || '',
    duree: sae.duree || sae.duree_totale || sae.nombre_periodes || sae.durée || '',
    competence: sae.competence || sae.competence_pfeq || sae.competences || sae.reference_pfeq || '',
    moyen_action: sae.moyen_action || sae.moyen || sae.moyens_action || sae.categorie || sae.domaine || '',
    description: sae.description || sae.resume || sae.contexte || sae.mise_en_contexte || sae.situation_depart || '',
  };
}

async function loadAllJeux(onFileLoaded) {
  const results = await Promise.allSettled(
    JEUX_SOURCES.map(src =>
      fetch(src)
        .then(r => {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(data => {
          if (onFileLoaded) onFileLoaded();
          return data;
        })
        .catch(err => {
          console.warn('Jeux load failed:', src, err.message);
          if (onFileLoaded) onFileLoaded();
          return null;
        })
    )
  );

  const seen = new Set();
  for (const result of results) {
    if (result.status !== 'fulfilled' || !result.value) continue;
    const data = result.value;
    const extracted = extractJeuxItems(data);
    for (const jeu of extracted) {
      const key = (jeu.nom || jeu.titre || jeu.name || '').toLowerCase().trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        allJeux.push(jeu);
      }
    }
  }
}

function extractJeuxItems(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data.filter(isJeuItem);
  if (typeof data === 'object') {
    if (Array.isArray(data.jeux)) return data.jeux.filter(isJeuItem);
    if (Array.isArray(data.games)) return data.games.filter(isJeuItem);
    // Check all values for arrays
    for (const val of Object.values(data)) {
      if (Array.isArray(val) && val.length > 0 && isJeuItem(val[0])) {
        return val.filter(isJeuItem);
      }
    }
    // Single item
    if (isJeuItem(data)) return [data];
  }
  return [];
}

function isJeuItem(obj) {
  if (!obj || typeof obj !== 'object') return false;
  return !!(obj.nom || obj.titre || obj.name);
}


// ============================================================
//  SECTION 5: TAB NAVIGATION
// ============================================================

function setupTabNavigation() {
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab) switchTab(tab);
    });
  });
}

function switchTab(tabName) {
  // Hide all tab sections
  document.querySelectorAll('.tab-section').forEach(sec => {
    sec.classList.remove('active');
    sec.style.display = 'none';
  });

  // Deactivate all nav tabs
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-selected', 'false');
  });

  // Show the target section
  const targetSection = document.getElementById('tab-' + tabName);
  if (targetSection) {
    targetSection.style.display = '';
    targetSection.classList.add('active');

    // GSAP fade in
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(targetSection, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
    }
  }

  // Activate matching nav tab
  const matchingBtn = document.querySelector('.nav-tab[data-tab="' + tabName + '"]');
  if (matchingBtn) {
    matchingBtn.classList.add('active');
    matchingBtn.setAttribute('aria-selected', 'true');
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update hash without triggering hashchange
  history.replaceState(null, '', '#tab=' + tabName);

  // Tab-specific rendering
  if (tabName === 'mes-sae') renderMesSae();
  if (tabName === 'machine') initSlotReel();

  // XP for exploring
  addXP(1);
}


// ============================================================
//  SECTION 6: SAE BANK — RENDERING + FILTERING
// ============================================================

function renderSAE() {
  const grid = document.getElementById('sae-grid');
  if (!grid) return;

  const startIdx = saeCurrentPage * ITEMS_PER_PAGE;
  const pageItems = filteredSAE.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  if (pageItems.length === 0) {
    grid.innerHTML = '<div class="no-results glass"><h3>' + t('noResults') + '</h3></div>';
    const pagination = document.getElementById('sae-pagination');
    if (pagination) pagination.innerHTML = '';
    updateSaeCount();
    return;
  }

  let html = '';
  for (let i = 0; i < pageItems.length; i++) {
    const sae = pageItems[i];
    const id = getSaeId(sae);
    const fav = isFavori(sae);
    const titre = escapeHtml(sae.titre || 'Sans titre');
    // BUT du cours : intentions/objectif d'abord, sinon description courte
    const butRaw = sae.intentions || sae.intentions_pedagogiques || sae.objectifs || sae.objectif || sae.description || '';
    const butStr = Array.isArray(butRaw) ? butRaw.join(' · ') : (typeof butRaw === 'object' ? Object.values(butRaw).join(' · ') : String(butRaw));
    const but = escapeHtml(truncate(butStr, 110));
    // NB cours : prioriser sae.cours.length (réalité), fallback duree/nombre_periodes
    let nbCours = '';
    if (Array.isArray(sae.cours) && sae.cours.length > 0) {
      nbCours = sae.cours.length + ' cours';
    } else {
      const nbRaw = sae.duree || sae.duree_totale || sae.nombre_periodes || '';
      const nbStr = String(nbRaw).match(/\d+/) ? String(nbRaw).match(/\d+/)[0] : (nbRaw ? String(nbRaw) : '');
      if (nbStr) nbCours = nbStr + ' cours';
    }
    const icon = getSaeIcon(sae);

    html += '<div class="card" data-id="' + escapeHtml(id) + '" data-index="' + i + '">' +
      '<button class="card-fav ' + (fav ? 'active' : '') + '" aria-label="Favori" data-sae-id="' + escapeHtml(id) + '">'+
      (fav ? '★' : '☆') + '</button>' +
      '<div class="card-header">' +
        '<span class="card-icon">' + icon + '</span>' +
        '<h4 class="card-title">' + titre + '</h4>' +
      '</div>' +
      '<div class="card-body">' +
        (nbCours ? '<span class="card-pill-duree">⏱️ ' + escapeHtml(nbCours) + '</span>' : '') +
        (but ? '<p class="card-but"><strong>BUT :</strong> ' + but + '</p>' : '') +
      '</div>' +
    '</div>';
  }

  grid.innerHTML = html;

  // Event delegation for cards
  grid.onclick = function(e) {
    // Check for fav button click
    const favBtn = e.target.closest('.card-fav');
    if (favBtn) {
      e.stopPropagation();
      const saeId = favBtn.dataset.saeId;
      const sae = allSAE.find(s => getSaeId(s) === saeId);
      if (sae) {
        toggleFavori(sae);
        const nowFav = isFavori(sae);
        favBtn.textContent = nowFav ? '★' : '☆';
        favBtn.classList.toggle('active', nowFav);
        if (favFilterActive) {
          filterSAE();
        }
      }
      return;
    }

    // Check for card click
    const card = e.target.closest('.card');
    if (card) {
      const idx = parseInt(card.dataset.index);
      const sae = pageItems[idx];
      if (sae) openSaeModal(sae);
    }
  };

  // GSAP stagger animation
  if (typeof gsap !== 'undefined') {
    const cards = grid.querySelectorAll('.card');
    gsap.fromTo(cards, { opacity: 0, y: 30, scale: 0.95 }, {
      opacity: 1, y: 0, scale: 1, duration: 0.3, stagger: 0.03, ease: 'power2.out'
    });
  }

  // Pagination
  const totalPages = Math.ceil(filteredSAE.length / ITEMS_PER_PAGE);
  renderPagination('sae-pagination', saeCurrentPage, totalPages, function(page) {
    saeCurrentPage = page;
    renderSAE();
    const section = document.getElementById('tab-banque');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  updateSaeCount();
}

function updateSaeCount() {
  const countEl = document.getElementById('sae-count');
  if (countEl) countEl.textContent = filteredSAE.length + ' SAÉ';

  const moyenLabel = document.getElementById('sae-moyen-active');
  if (moyenLabel) {
    if (activeMoyenFilter) {
      moyenLabel.style.display = '';
      moyenLabel.textContent = activeMoyenFilter;
    } else {
      moyenLabel.style.display = 'none';
    }
  }
}

function getSaeIcon(sae) {
  const moyen = (sae.moyen_action || sae.categorie || sae.domaine || '').toLowerCase();
  if (moyen.includes('manipulation') || moyen.includes('balle') || moyen.includes('ballon')) return '🎯';
  if (moyen.includes('locomotion') || moyen.includes('courir')) return '🏃';
  if (moyen.includes('opposition') || moyen.includes('duel') || moyen.includes('lutte')) return '⚔️';
  if (moyen.includes('coopération') || moyen.includes('cooperation') || moyen.includes('collectif')) return '🤝';
  if (moyen.includes('expression') || moyen.includes('danse') || moyen.includes('artistique')) return '💃';
  if (moyen.includes('stabilisation') || moyen.includes('équilibre') || moyen.includes('gainage')) return '⚖️';
  if (moyen.includes('dodgeball') || moyen.includes('chasseur')) return '🎯';
  if (moyen.includes('poursuite')) return '🏃';
  if (moyen.includes('conditionnement')) return '💪';

  const niveau = (sae.niveau || '').toLowerCase();
  if (niveau.includes('préscolaire') || niveau.includes('maternelle')) return '🌱';
  if (niveau.includes('secondaire')) return '🎓';
  return '📚';
}

function filterSAE() {
  const searchEl = document.getElementById('sae-search');
  const cycleEl = document.getElementById('sae-cycle');
  const moyenEl = document.getElementById('sae-moyen');
  const compEl = document.getElementById('sae-competence');
  const nbCoursEl = document.getElementById('sae-nbcours');
  const dureeEl = document.getElementById('sae-duree');

  const search = (searchEl?.value || '').toLowerCase().trim();
  const cycle = cycleEl?.value || '';
  const moyen = moyenEl?.value || '';
  const comp = compEl?.value || '';
  const nbCoursFilter = parseInt(nbCoursEl?.value || '0', 10) || 0;
  const dureeFilter = parseInt(dureeEl?.value || '0', 10) || 0;

  filteredSAE = allSAE.filter(sae => {
    // Search filter
    if (search) {
      const haystack = [
        sae.titre, sae.description, sae.niveau, sae.moyen_action,
        sae.competence, sae.tags, sae.domaine, sae.sous_domaine
      ].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    // Cycle filter
    if (cycle) {
      const niv = (sae.niveau || '').toLowerCase();
      const cycleL = cycle.toLowerCase();
      if (cycleL === 'préscolaire') {
        if (!niv.includes('préscolaire') && !niv.includes('maternelle') && !niv.includes('prescolaire')) return false;
      } else if (cycleL === '1er cycle') {
        if (!niv.includes('1er cycle') && !niv.includes('1er') && !niv.includes('primaire 1') && !niv.includes('6-7')) return false;
      } else if (cycleL === '2e cycle') {
        if (!niv.includes('2e cycle') && !niv.includes('2e') && !niv.includes('primaire 2') && !niv.includes('8-9')) return false;
      } else if (cycleL === '3e cycle') {
        if (!niv.includes('3e cycle') && !niv.includes('3e') && !niv.includes('primaire 3') && !niv.includes('10-11')) return false;
      } else if (cycleL === 'secondaire') {
        if (!niv.includes('secondaire')) return false;
      }
    }

    // Moyen d'action filter
    if (moyen) {
      const moyenStr = [sae.moyen_action, sae.domaine, sae.sous_domaine, sae.categorie, sae.titre, sae.tags]
        .filter(Boolean).join(' ').toLowerCase();
      if (!moyenStr.includes(moyen.toLowerCase())) return false;
    }

    // Competence filter
    if (comp) {
      const compStr = (sae.competence || '').toLowerCase();
      if (!compStr.includes(comp.toLowerCase())) return false;
    }

    // Nombre de cours filter (exact)
    if (nbCoursFilter) {
      const nb = Array.isArray(sae.cours) ? sae.cours.length : 0;
      if (nb !== nbCoursFilter) return false;
    }

    // Durée par cours filter (≤ X min)
    if (dureeFilter) {
      let d = 0;
      if (Array.isArray(sae.cours) && sae.cours.length && sae.cours[0].duree_min) {
        d = parseInt(sae.cours[0].duree_min, 10) || 0;
      } else {
        const m = String(sae.duree_par_periode || sae.duree || '').match(/\d+/);
        d = m ? parseInt(m[0], 10) : 0;
      }
      if (!d || d > dureeFilter) return false;
    }

    // Favorites filter
    if (favFilterActive) {
      if (!isFavori(sae)) return false;
    }

    return true;
  });

  saeCurrentPage = 0;
  renderSAE();
}

function setupFilterListeners() {
  const searchEl = document.getElementById('sae-search');
  if (searchEl) {
    searchEl.addEventListener('input', function() {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(filterSAE, 300);
    });
  }

  const cycleEl = document.getElementById('sae-cycle');
  if (cycleEl) cycleEl.addEventListener('change', filterSAE);

  const moyenEl = document.getElementById('sae-moyen');
  if (moyenEl) moyenEl.addEventListener('change', function() {
    activeMoyenFilter = moyenEl.value ? moyenEl.options[moyenEl.selectedIndex].textContent : null;
    filterSAE();
  });

  const compEl = document.getElementById('sae-competence');
  if (compEl) compEl.addEventListener('change', filterSAE);

  const nbCoursEl = document.getElementById('sae-nbcours');
  if (nbCoursEl) nbCoursEl.addEventListener('change', filterSAE);

  const dureeEl = document.getElementById('sae-duree');
  if (dureeEl) dureeEl.addEventListener('change', filterSAE);

  const favBtn = document.getElementById('favFilterBtn');
  if (favBtn) {
    favBtn.addEventListener('click', function() {
      favFilterActive = !favFilterActive;
      favBtn.classList.toggle('active', favFilterActive);
      favBtn.textContent = favFilterActive ? '★ Favoris' : '☆ Favoris';
      filterSAE();
    });
  }

  // Jeux filters
  const jeuxSearchEl = document.getElementById('jeux-search');
  if (jeuxSearchEl) {
    jeuxSearchEl.addEventListener('input', function() {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(filterJeux, 300);
    });
  }
  const jeuxCatEl = document.getElementById('jeux-category');
  if (jeuxCatEl) jeuxCatEl.addEventListener('change', filterJeux);
  const jeuxNivEl = document.getElementById('jeux-niveau');
  if (jeuxNivEl) jeuxNivEl.addEventListener('change', filterJeux);
}

function renderPagination(containerId, currentPage, totalPages, callback) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  // Previous button
  html += '<button class="page-btn" ' + (currentPage === 0 ? 'disabled' : '') +
    ' data-page="' + (currentPage - 1) + '">&laquo;</button>';

  // Page numbers (show max 7 pages around current)
  const maxVisible = 7;
  let startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(0, endPage - maxVisible + 1);
  }

  if (startPage > 0) {
    html += '<button class="page-btn" data-page="0">1</button>';
    if (startPage > 1) html += '<span class="page-dots">...</span>';
  }

  for (let i = startPage; i <= endPage; i++) {
    html += '<button class="page-btn ' + (i === currentPage ? 'active' : '') +
      '" data-page="' + i + '">' + (i + 1) + '</button>';
  }

  if (endPage < totalPages - 1) {
    if (endPage < totalPages - 2) html += '<span class="page-dots">...</span>';
    html += '<button class="page-btn" data-page="' + (totalPages - 1) + '">' + totalPages + '</button>';
  }

  // Next button
  html += '<button class="page-btn" ' + (currentPage >= totalPages - 1 ? 'disabled' : '') +
    ' data-page="' + (currentPage + 1) + '">&raquo;</button>';

  container.innerHTML = html;

  container.onclick = function(e) {
    const btn = e.target.closest('.page-btn');
    if (btn && !btn.disabled) {
      const page = parseInt(btn.dataset.page);
      if (!isNaN(page) && page >= 0 && page < totalPages) {
        callback(page);
      }
    }
  };
}

function renderMoyensBrowser() {
  const grid = document.getElementById('moyensGrid');
  if (!grid) return;

  let html = '';
  for (const cat of MOYENS_ACTION) {
    const label = cat.labels[LANG.current] || cat.labels.fr;
    html += '<div class="moyen-category">';
    html += '<div class="moyen-cat-header" style="border-color: ' + cat.color + '">';
    html += '<span class="moyen-cat-icon">' + cat.icon + '</span>';
    html += '<span class="moyen-cat-label">' + escapeHtml(label) + '</span>';
    html += '</div>';
    html += '<div class="moyen-items">';
    for (const item of cat.items) {
      const itemLabel = item.labels[LANG.current] || item.labels.fr;
      html += '<button class="moyen-item" data-moyen="' + escapeHtml(item.id) + '" ' +
        'style="--moyen-color: ' + cat.color + '" title="' + escapeHtml(itemLabel) + '">' +
        '<span class="moyen-item-icon">' + item.icon + '</span>' +
        '<span class="moyen-item-label">' + escapeHtml(itemLabel) + '</span>' +
        '</button>';
    }
    html += '</div></div>';
  }

  grid.innerHTML = html;

  // Click handler for moyen items
  grid.onclick = function(e) {
    const btn = e.target.closest('.moyen-item');
    if (!btn) return;
    const moyen = btn.dataset.moyen;

    // Update the select filter
    const moyenSelect = document.getElementById('sae-moyen');
    if (moyenSelect) {
      // Find matching option
      const option = Array.from(moyenSelect.options).find(o => o.value === moyen);
      if (option) {
        moyenSelect.value = moyen;
        activeMoyenFilter = option.textContent;
      } else {
        moyenSelect.value = moyen;
        activeMoyenFilter = btn.title;
      }
    }

    // Highlight active moyen button
    grid.querySelectorAll('.moyen-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    filterSAE();

    // Scroll down to results
    const controlsBar = document.querySelector('.controls-bar');
    if (controlsBar) controlsBar.scrollIntoView({ behavior: 'smooth' });
  };
}

// Jeux rendering (basic — will be expanded in Part 2)
function renderJeux() {
  const grid = document.getElementById('jeux-grid');
  if (!grid) return;

  const startIdx = jeuxCurrentPage * ITEMS_PER_PAGE;
  const pageItems = filteredJeux.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  if (pageItems.length === 0) {
    grid.innerHTML = '<div class="no-results glass"><h3>' + t('noResults') + '</h3></div>';
    const pagination = document.getElementById('jeux-pagination');
    if (pagination) pagination.innerHTML = '';
    const countEl = document.getElementById('jeux-count');
    if (countEl) countEl.textContent = '0 jeux';
    return;
  }

  let html = '';
  for (let i = 0; i < pageItems.length; i++) {
    const jeu = pageItems[i];
    const nom = escapeHtml(jeu.nom || jeu.titre || jeu.name || 'Sans nom');
    const desc = escapeHtml(truncate(jeu.description || jeu.regles || '', 120));
    const cat = escapeHtml(jeu.categorie || jeu.type || '');
    const niv = escapeHtml(jeu.niveau || jeu.age || '');
    const icon = getJeuIcon(jeu);

    html += '<div class="card" data-jeu-index="' + i + '">' +
      '<div class="card-badge">' + escapeHtml(jeu.origine || jeu.pays || 'JEU') + '</div>' +
      '<div class="card-header">' +
        '<span class="card-icon">' + icon + '</span>' +
        '<h4 class="card-title">' + nom + '</h4>' +
      '</div>' +
      '<p class="card-desc">' + desc + '</p>' +
      '<div class="card-tags">' +
        (cat ? '<span class="card-tag">' + cat + '</span>' : '') +
        (niv ? '<span class="card-tag">' + niv + '</span>' : '') +
      '</div>' +
    '</div>';
  }

  grid.innerHTML = html;

  grid.onclick = function(e) {
    const card = e.target.closest('.card');
    if (card) {
      const idx = parseInt(card.dataset.jeuIndex);
      const jeu = pageItems[idx];
      if (jeu) openJeuModal(jeu);
    }
  };

  // GSAP stagger
  if (typeof gsap !== 'undefined') {
    gsap.fromTo(grid.querySelectorAll('.card'), { opacity: 0, y: 30, scale: 0.95 }, {
      opacity: 1, y: 0, scale: 1, duration: 0.3, stagger: 0.03, ease: 'power2.out'
    });
  }

  const totalPages = Math.ceil(filteredJeux.length / ITEMS_PER_PAGE);
  renderPagination('jeux-pagination', jeuxCurrentPage, totalPages, function(page) {
    jeuxCurrentPage = page;
    renderJeux();
  });

  const countEl = document.getElementById('jeux-count');
  if (countEl) countEl.textContent = filteredJeux.length + ' jeux';
}

function getJeuIcon(jeu) {
  const cat = (jeu.categorie || jeu.type || '').toLowerCase();
  if (cat.includes('ballon') || cat.includes('chasseur')) return '🎯';
  if (cat.includes('poursuite')) return '🏃';
  if (cat.includes('cooperation') || cat.includes('coopération')) return '🤝';
  if (cat.includes('opposition')) return '⚔️';
  if (cat.includes('collectif')) return '🏅';
  if (cat.includes('exterieur') || cat.includes('extérieur')) return '🌿';
  if (cat.includes('monde') || cat.includes('tradition')) return '🌍';
  if (cat.includes('autochtone')) return '🪶';
  if (cat.includes('olympique')) return '🥇';
  if (cat.includes('individuel')) return '🏋️';
  return '🎮';
}

function filterJeux() {
  const search = (document.getElementById('jeux-search')?.value || '').toLowerCase().trim();
  const cat = document.getElementById('jeux-category')?.value || '';
  const niv = document.getElementById('jeux-niveau')?.value || '';

  filteredJeux = allJeux.filter(jeu => {
    if (search) {
      const haystack = [jeu.nom, jeu.titre, jeu.name, jeu.description, jeu.regles, jeu.categorie, jeu.tags]
        .filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (cat) {
      const jeuCat = (jeu.categorie || jeu.type || jeu.source_file || '').toLowerCase();
      if (!jeuCat.includes(cat.toLowerCase())) return false;
    }
    if (niv) {
      const jeuNiv = (jeu.niveau || jeu.age || jeu.tranche_age || '').toLowerCase();
      if (!jeuNiv.includes(niv)) return false;
    }
    return true;
  });

  jeuxCurrentPage = 0;
  renderJeux();
}

function openJeuModal(jeu) {
  const nom = escapeHtml(jeu.nom || jeu.titre || jeu.name || 'Sans nom');
  let html = '<div class="modal-header">' +
    '<h2 class="modal-title">' + getJeuIcon(jeu) + ' ' + nom + '</h2>' +
    '<button class="modal-close" onclick="closeModal()">' + t('close') + '</button>' +
    '</div>';

  // Meta badges
  html += '<div class="modal-meta">';
  if (jeu.categorie) html += '<span class="meta-badge">' + escapeHtml(jeu.categorie) + '</span>';
  if (jeu.niveau || jeu.age) html += '<span class="meta-badge">' + escapeHtml(jeu.niveau || jeu.age) + '</span>';
  if (jeu.joueurs || jeu.nb_joueurs) html += '<span class="meta-badge">' + escapeHtml(jeu.joueurs || jeu.nb_joueurs) + '</span>';
  if (jeu.espace || jeu.lieu) html += '<span class="meta-badge">' + escapeHtml(jeu.espace || jeu.lieu) + '</span>';
  if (jeu.origine || jeu.pays) html += '<span class="meta-badge">🌍 ' + escapeHtml(jeu.origine || jeu.pays) + '</span>';
  html += '</div>';

  // Sections
  const sections = [
    { label: '📖 Description', val: jeu.description },
    { label: '📜 Règles', val: jeu.regles || jeu.regles_du_jeu },
    { label: '🎒 Matériel', val: jeu.materiel },
    { label: '🔀 Variantes', val: jeu.variantes },
    { label: '♿ Adaptations', val: jeu.adaptations },
    { label: '🏷️ Tags', val: jeu.tags },
  ];

  for (const sec of sections) {
    if (!sec.val) continue;
    html += '<div class="modal-section"><h3>' + sec.label + '</h3>';
    html += '<div class="modal-content">' + formatTextBlock(sec.val) + '</div></div>';
  }

  showModal(html);
  addXP(2);
}


// ============================================================
//  SECTION 7: SAE MODAL — ULTRA DETAILED
// ============================================================

function openSaeModal(sae) {
  const titre = escapeHtml(sae.titre || 'Sans titre');
  const icon = getSaeIcon(sae);

  // ── TOUJOURS passer par la fiche ZTS Premium ──
  return openSaeModalEnriched(sae);

  let html = '';

  // Header
  html += '<div class="modal-header">';
  html += '<h2 class="modal-title">' + icon + ' ' + titre + '</h2>';
  html += '<button class="modal-close" onclick="closeModal()">' + t('close') + '</button>';
  html += '</div>';

  // Meta badges
  html += '<div class="modal-meta">';
  const metaFields = [
    { label: t('niveau'), val: sae.niveau || sae.niveau_scolaire },
    { label: t('duree'), val: sae.duree || sae.duree_totale || sae.nombre_periodes },
    { label: t('competence'), val: sae.competence || sae.competence_pfeq },
    { label: t('moyenAction'), val: sae.moyen_action || sae.moyen || sae.categorie },
    { label: t('espace'), val: sae.espace || sae.lieu || sae.environnement },
    { label: t('nbEleves'), val: sae.nb_eleves || sae.nombre_eleves || sae.effectif },
  ];
  for (const m of metaFields) {
    if (m.val) {
      const valStr = Array.isArray(m.val) ? m.val.join(', ') : String(m.val);
      html += '<span class="meta-badge"><strong>' + escapeHtml(m.label) + ':</strong> ' + escapeHtml(valStr) + '</span>';
    }
  }
  html += '</div>';

  // Action buttons
  const saeId = getSaeId(sae);
  const fav = isFavori(sae);
  html += '<div class="modal-actions">';
  html += '<button class="action-btn ' + (fav ? 'active' : '') + '" id="modalFavBtn" onclick="toggleFavoriModal(\'' + escapeHtml(saeId).replace(/'/g, "\\'") + '\')">' + (fav ? '★' : '☆') + ' Favori</button>';
  html += '<button class="action-btn" onclick="printSae()">' + t('print') + '</button>';
  html += '<button class="action-btn" onclick="shareSae(\'' + escapeHtml(saeId).replace(/'/g, "\\'") + '\')">' + t('share') + '</button>';
  html += '<button class="action-btn" onclick="duplicateSae(\'' + escapeHtml(saeId).replace(/'/g, "\\'") + '\')">' + t('duplicateSae') + '</button>';
  html += '</div>';

  // ── SECTION: Intentions pédagogiques ──
  const intentions = sae.intentions || sae.intentions_pedagogiques || sae.objectifs || sae.objectif;
  if (intentions) {
    html += buildModalSection(t('mIntentions'), intentions);
  }

  // ── SECTION: Mise en contexte ──
  const contexte = sae.contexte || sae.mise_en_contexte || sae.situation_depart || sae.description;
  if (contexte) {
    html += buildModalSection(t('mContexte'), contexte);
  }

  // ── DEROULEMENT (groupé) : phases 1-4 + variantes dans UNE seule carte ──
  const deroulement = sae.deroulement || sae.déroulement;
  let phases = []; // [{title, content}]
  if (deroulement) {
    if (typeof deroulement === 'string' || Array.isArray(deroulement)) {
      phases.push({title: '📋 ' + t('mDeroulement') || '📋 Déroulement', content: deroulement});
    } else if (typeof deroulement === 'object') {
      const p1 = deroulement.mise_en_train || deroulement.echauffement || deroulement.phase1 || deroulement.preparation;
      if (p1) phases.push({title: '🏃 ' + t('mMiseEnTrain'), content: p1});
      const p2 = deroulement.partie_principale_1 || deroulement.tache_complexe || deroulement.developpement || deroulement.partie_principale || deroulement.phase2 || deroulement.realisation;
      if (p2) phases.push({title: '⚡ ' + t('mPartie1'), content: p2});
      const p3 = deroulement.partie_principale_2 || deroulement.reinvestissement || deroulement.phase3 || deroulement.integration || deroulement.jeu;
      if (p3) phases.push({title: '🔄 ' + t('mPartie2'), content: p3});
      const p4 = deroulement.retour_au_calme || deroulement.retour || deroulement.bilan || deroulement.phase4;
      if (p4) phases.push({title: '🧘 ' + t('mRetour'), content: p4});
      const used = ['mise_en_train','echauffement','phase1','preparation','partie_principale_1','tache_complexe','developpement','partie_principale','phase2','realisation','partie_principale_2','reinvestissement','phase3','integration','jeu','retour_au_calme','retour','bilan','phase4'];
      for (const [k,v] of Object.entries(deroulement)) {
        if (!used.includes(k) && v) phases.push({title: '📌 ' + escapeHtml(k.replace(/_/g,' ')), content: v});
      }
    }
  } else {
    const p1 = sae.mise_en_train || sae.echauffement;
    if (p1) phases.push({title: '🏃 ' + t('mMiseEnTrain'), content: p1});
    const p2 = sae.partie_principale_1 || sae.tache_complexe || sae.developpement || sae.partie_principale;
    if (p2) phases.push({title: '⚡ ' + t('mPartie1'), content: p2});
    const p3 = sae.partie_principale_2 || sae.reinvestissement;
    if (p3) phases.push({title: '🔄 ' + t('mPartie2'), content: p3});
    const p4 = sae.retour_au_calme || sae.retour || sae.bilan;
    if (p4) phases.push({title: '🧘 ' + t('mRetour'), content: p4});
  }
  // Ajouter Variantes comme dernier sous-bloc du déroulement
  const variantesRaw = sae.variantes || sae.variantes_progressions || sae.progressions;
  if (variantesRaw) phases.push({title: '🔀 ' + t('mVariantes'), content: variantesRaw});

  if (phases.length > 0) {
    html += '<div class="modal-section"><h3>🏃 Déroulement</h3><div class="phases-wrap">';
    for (const ph of phases) {
      html += '<div class="phase-block">' +
        '<h4 class="phase-block-title">' + ph.title + '</h4>' +
        '<div class="phase-block-content">' + formatTextBlock(ph.content) + '</div>' +
      '</div>';
    }
    html += '</div></div>';
  }

  // ── SECTION: Matériel ──
  const materiel = sae.materiel || sae.matériel || sae.materiel_requis;
  if (materiel) {
    html += buildModalSection(t('mMateriel'), materiel);
  }

  // ── SECTION: Évaluation ──
  const evaluation = sae.evaluation || sae.évaluation || sae.criteres_evaluation;
  if (evaluation) {
    let evalContent = '';
    if (typeof evaluation === 'object' && !Array.isArray(evaluation)) {
      // Could have criteres, grille, etc.
      const criteres = evaluation.criteres || evaluation.critères;
      if (criteres) {
        evalContent += '<h4>Critères</h4>' + formatTextBlock(criteres);
      }
      const grille = evaluation.grille || evaluation.niveaux;
      if (grille) {
        if (typeof grille === 'object' && !Array.isArray(grille)) {
          evalContent += '<div class="eval-grid">';
          const levels = [
            { key: 'tres_bien', label: '🟢 Très bien (A)', alt: ['A', 'excellent', 'très_bien'] },
            { key: 'bien', label: '🟡 Bien (B)', alt: ['B', 'satisfaisant'] },
            { key: 'en_developpement', label: '🟠 En développement (C)', alt: ['C', 'en_développement', 'acceptable'] },
          ];
          for (const lev of levels) {
            const val = grille[lev.key] || lev.alt.reduce((found, k) => found || grille[k], null);
            if (val) {
              evalContent += '<div class="eval-level"><strong>' + lev.label + '</strong><p>' + formatTextBlock(val) + '</p></div>';
            }
          }
          evalContent += '</div>';
          // Any remaining keys
          const usedKeys = ['tres_bien', 'bien', 'en_developpement', 'A', 'B', 'C', 'excellent', 'très_bien', 'satisfaisant', 'en_développement', 'acceptable'];
          for (const [k, v] of Object.entries(grille)) {
            if (!usedKeys.includes(k) && v) {
              evalContent += '<p><strong>' + escapeHtml(k) + ':</strong> ' + formatTextBlock(v) + '</p>';
            }
          }
        } else {
          evalContent += '<h4>Grille</h4>' + formatTextBlock(grille);
        }
      }
      // Any other eval keys
      const usedEvalKeys = ['criteres', 'critères', 'grille', 'niveaux'];
      for (const [k, v] of Object.entries(evaluation)) {
        if (!usedEvalKeys.includes(k) && v) {
          evalContent += '<p><strong>' + escapeHtml(k.replace(/_/g, ' ')) + ':</strong> ' + formatTextBlock(v) + '</p>';
        }
      }
    } else {
      evalContent = formatTextBlock(evaluation);
    }
    if (evalContent) {
      html += '<div class="modal-section"><h3>' + t('mEvaluation') + '</h3><div class="modal-content">' + evalContent + '</div></div>';
    }
  }

  // ── SECTION: Adaptations HDAA (rectangle wide) ──
  const adaptations = sae.adaptations || sae.adaptations_hdaa || sae.differenciation || sae.inclusion;
  if (adaptations) {
    html += buildModalSection(t('mAdaptations'), adaptations, 'tile-wide');
  }

  // ── SECTION: Variantes — déjà incluse dans Déroulement (groupage) ──

  // ── SECTION: Valeurs éducatives (carré) ──
  const valeurs = sae.valeurs || sae.valeurs_educatives || sae.valeurs_pedagogiques;
  if (valeurs) {
    html += buildModalSection(t('mValeurs'), valeurs, 'tile-square');
  }

  // ── SECTION: Tags ──
  const tags = sae.tags || sae.mots_cles;
  if (tags) {
    let tagsHtml = '';
    if (Array.isArray(tags)) {
      tagsHtml = tags.map(tag => '<span class="card-tag">' + escapeHtml(tag) + '</span>').join(' ');
    } else if (typeof tags === 'string') {
      tagsHtml = tags.split(',').map(tag => '<span class="card-tag">' + escapeHtml(tag.trim()) + '</span>').join(' ');
    }
    if (tagsHtml) {
      html += '<div class="modal-section"><h3>🏷️ Tags</h3><div class="modal-content modal-tags">' + tagsHtml + '</div></div>';
    }
  }

  // ── PFEQ reference ──
  const refPfeq = sae.reference_pfeq || sae.ref_pfeq;
  if (refPfeq && refPfeq !== sae.competence) {
    html += buildModalSection('📎 Référence PFEQ', refPfeq);
  }

  showModal(html);
  addXP(2);
}

// ── Mode enrichi : FICHE ZTS PREMIUM (style shadowbox) ──
function openSaeModalEnriched(sae) {
  const html = buildFicheZTSHtml(sae);
  showModal(html);
  // Délai 500ms pour laisser GSAP finir l'animation (350ms + marge)
  setTimeout(() => {
    const box = document.querySelector('.modal-box');
    if (box) {
      box.classList.add('fiche-mode');
      // Utilise setProperty avec priority 'important' — n'écrase pas les transforms GSAP
      box.style.setProperty('max-width', '98vw', 'important');
      box.style.setProperty('width', '1400px', 'important');
      box.style.setProperty('background', '#f8f9fa', 'important');
      box.style.setProperty('border', '4px solid #000', 'important');
      box.style.setProperty('border-radius', '24px', 'important');
      box.style.setProperty('padding', '0', 'important');
      box.style.setProperty('max-height', '95vh', 'important');
      const body = box.querySelector('#modalBody');
      if (body) {
        body.style.setProperty('padding', '32px', 'important');
        body.style.setProperty('width', '100%', 'important');
        body.style.setProperty('box-sizing', 'border-box', 'important');
        body.style.setProperty('color', '#111', 'important');
      }
    }
    const modal = document.getElementById('modal');
    if (modal) modal.style.padding = '10px';
    initFicheHandlers(sae);
  }, 500);
  addXP(2);
}

// SVG icons inline (Lucide-style)
function ficheIcons() {
  return '<svg width="0" height="0" style="position:absolute"><defs>' +
    '<symbol id="fi-trophy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></symbol>' +
    '<symbol id="fi-package" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/></symbol>' +
    '<symbol id="fi-map" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/></symbol>' +
    '<symbol id="fi-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></symbol>' +
    '<symbol id="fi-shuffle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 14 4 4-4 4"/><path d="m18 2 4 4-4 4"/><path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22"/><path d="M2 6h1.972a4 4 0 0 1 3.6 2.2"/><path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"/></symbol>' +
    '<symbol id="fi-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></symbol>' +
    '<symbol id="fi-grad" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></symbol>' +
    '<symbol id="fi-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></symbol>' +
    '<symbol id="fi-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></symbol>' +
    '<symbol id="fi-print" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></symbol>' +
  '</defs></svg>';
}

function ficheTuile(opts) {
  const { title, iconId, bandColor, bgGradient, defaultIcon, content } = opts;
  return '<div class="group relative bg-black border-[4px] border-black rounded-3xl flex flex-col overflow-hidden cursor-pointer shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 h-72">' +
    '<div class="flex-1 relative overflow-hidden" style="background:' + bgGradient + '">' +
      '<div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/95 opacity-90 group-hover:opacity-100"></div>' +
      '<div class="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity">' +
        '<svg width="72" height="72" style="color:white;filter:drop-shadow(0 4px 4px rgba(0,0,0,1))"><use href="#' + (defaultIcon || iconId) + '"/></svg>' +
      '</div>' +
      '<div class="absolute inset-0 flex items-center justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">' + content + '</div>' +
    '</div>' +
    '<div class="px-4 py-3 border-t-[4px] border-black flex items-center justify-between" style="background:' + bandColor + '">' +
      '<span class="ff-lucky text-xl uppercase tracking-widest" style="text-shadow:2px 2px 0 rgba(255,255,255,0.4)">' + title + '</span>' +
      '<div class="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center border-2 border-black/30"><svg width="20" height="20" class="-rotate-90 group-hover:rotate-0 transition-transform"><use href="#fi-chev"/></svg></div>' +
    '</div>' +
  '</div>';
}

function fichePhase(c) {
  const phases = [];
  if (c.echauffement) {
    const e = c.echauffement;
    phases.push({
      icon: '🔥', emoji: '🔥', color: 'orange', bgBtn: 'bg-orange-400',
      label: 'Échauffement', duree: e.duree_min,
      desc: escapeHtml(e.description || ''),
      detail: (e.description ? escapeHtml(e.description) + '<br>' : '') +
              (Array.isArray(e.exercices) ? '<ul class="list-disc pl-5 mt-1">' + e.exercices.map(x => '<li>' + escapeHtml(x) + '</li>').join('') + '</ul>' : '')
    });
  }
  if (Array.isArray(c.educatifs) && c.educatifs.length) {
    const totalDuree = c.educatifs.reduce((s, ed) => s + (ed.duree_min || 0), 0);
    phases.push({
      icon: '🎓', emoji: '🎓', color: 'cyan', bgBtn: 'bg-cyan-400',
      label: 'Éducatifs', duree: totalDuree,
      desc: c.educatifs.map(ed => escapeHtml(ed.nom || '')).join(' · '),
      detail: c.educatifs.map(ed => '<div class="mb-2"><strong>' + escapeHtml(ed.nom || '') + (ed.duree_min ? ' (' + ed.duree_min + ' min)' : '') + '</strong>' + (ed.description ? '<br>' + escapeHtml(ed.description) : '') + (ed.consignes ? '<br><em>Consignes :</em> ' + escapeHtml(ed.consignes) : '') + '</div>').join('')
    });
  }
  if (c.activite_principale) {
    const a = c.activite_principale;
    phases.push({
      icon: '⚡', emoji: '⚡', color: 'yellow', bgBtn: 'bg-yellow-400',
      label: 'Activité principale', duree: a.duree_min,
      desc: escapeHtml(a.description || '').slice(0, 120) + '...',
      detail: (a.description ? escapeHtml(a.description) : '') +
              (a.organisation ? '<br><br><strong>📐 Organisation :</strong> ' + escapeHtml(a.organisation) : '') +
              (a.consignes_cles ? '<br><br><strong>📌 Consignes clés :</strong> ' + escapeHtml(a.consignes_cles) : '')
    });
  }
  if (c.retour_au_calme) {
    const r = c.retour_au_calme;
    phases.push({
      icon: '🧘', emoji: '🧘', color: 'green', bgBtn: 'bg-green-400',
      label: 'Retour au calme', duree: r.duree_min,
      desc: escapeHtml(r.description || ''),
      detail: (r.description ? escapeHtml(r.description) : '') +
              (Array.isArray(r.exercices) ? '<ul class="list-disc pl-5 mt-1">' + r.exercices.map(x => '<li>' + escapeHtml(x) + '</li>').join('') + '</ul>' : '')
    });
  }
  return phases;
}

function buildCoursPaneHtml(sae, c, idx, hideCoursHeader) {
  const titre = escapeHtml(c.titre || ('Cours ' + (c.numero || idx+1)));
  const obj = escapeHtml(c.objectif || '');
  const duree = c.duree_min || 0;
  const cycle = escapeHtml(sae.cycle || '');
  const isC2 = idx > 0;
  const headerGrad = isC2 ? '#FF6B9D 0%,#5F0F40 100%' : '#00C4FF 0%,#004A61 100%';
  const ballGrad = isC2 ? 'from-pink-300 to-purple-500' : 'from-yellow-300 to-orange-400';
  const terrainBg = isC2 ? '#9d174d' : '#00a896';
  const terrainOuter = isC2 ? '#5F0F40' : '#004A61';
  const shadowColor = isC2 ? '#FF6B9D' : '#00C4FF';

  // Tuiles: matériel, objectif, organisation
  const matItems = (Array.isArray(c.materiel_specifique) && c.materiel_specifique.length)
    ? c.materiel_specifique
    : (Array.isArray(sae.materiel) ? sae.materiel.slice(0, 8) : []);
  const matContent = '<ul class="text-left space-y-1 text-white text-sm font-bold" style="text-shadow:0 2px 4px rgba(0,0,0,1)">' +
    matItems.map(m => '<li>🔸 ' + escapeHtml(m) + '</li>').join('') + '</ul>';
  const objContent = '<p class="text-base text-white font-bold leading-tight text-center" style="text-shadow:0 2px 4px rgba(0,0,0,1)">' + obj + '</p>';
  const org = c.activite_principale && c.activite_principale.organisation ? escapeHtml(c.activite_principale.organisation) : 'Organisation à préciser';
  const orgContent = '<p class="text-sm text-white font-bold leading-tight text-center" style="text-shadow:0 2px 4px rgba(0,0,0,1)">' + org + '</p>';

  // Plan de match : phases dynamiques
  const phases = fichePhase(c);
  const positions = [
    'top-[15%] left-[18%]', 'top-[40%] right-[15%]',
    'bottom-[28%] left-[12%]', 'bottom-[14%] right-[20%]'
  ];
  const animClasses = ['animate-bounce', 'animate-pulse', 'animate-bounce', 'animate-bounce'];

  let terrainDefault = '<div id="terrain-' + idx + '-default" class="absolute inset-0 flex items-center justify-center z-20">';
  phases.forEach((p, i) => {
    if (i < 4) {
      terrainDefault += '<button data-step="' + i + '" data-cours="' + idx + '" class="fiche-step-btn ff-lucky absolute ' + positions[i] + ' w-14 h-14 ' + p.bgBtn + ' border-[3px] border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-125 hover:bg-yellow-300 transition-all text-3xl flex items-center justify-center ' + animClasses[i] + '">' + (i+1) + '</button>';
    }
  });
  terrainDefault += '<span class="absolute bottom-6 bg-yellow-300 text-black px-4 py-2 rounded-full font-black text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-[3px] border-black uppercase tracking-wider animate-pulse">👆 Cliquez !</span>';
  terrainDefault += '</div>';

  let stepPanels = '';
  phases.forEach((p, i) => {
    if (i < 4) {
      const colors = { orange: 'orange-300|orange-400', cyan: 'cyan-300|cyan-400', yellow: 'yellow-300|yellow-400', green: 'green-300|green-400' };
      const [tc, bc] = (colors[p.color] || 'cyan-300|cyan-400').split('|');
      stepPanels += '<div data-step-panel="' + i + '" data-cours="' + idx + '" class="fiche-step-panel absolute inset-0 flex items-center justify-center opacity-0 z-0 pointer-events-none transition-opacity duration-300 cursor-pointer">' +
        '<div class="text-center"><div class="text-7xl mb-3 animate-pulse">' + p.emoji + '</div>' +
        '<div class="bg-black/90 text-' + tc + ' px-5 py-3 rounded-xl font-bold text-sm border-2 border-' + bc + ' max-w-md mx-auto">' +
        '<strong class="block ff-lucky text-base mb-1">' + p.label + (p.duree ? ' — ' + p.duree + ' min' : '') + '</strong>' +
        p.detail +
        '</div></div></div>';
    }
  });

  let consignes = '';
  phases.forEach((p, i) => {
    if (i < 4) {
      consignes += '<div class="fiche-consigne flex gap-4 items-start p-4 rounded-2xl border-[3px] border-transparent bg-white/5 hover:bg-white/10 cursor-pointer transition-all" data-consigne="' + i + '" data-cours="' + idx + '">' +
        '<div class="num ff-lucky w-10 h-10 rounded-full border-[3px] border-black flex items-center justify-center ' + p.bgBtn + ' shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xl">' + (i+1) + '</div>' +
        '<div><div class="ff-lucky text-' + p.color + '-300 text-sm uppercase tracking-wider">' + p.icon + ' ' + p.label + (p.duree ? ' — ' + p.duree + ' min' : '') + '</div>' +
        '<p class="text-white font-bold text-sm leading-tight mt-1">' + p.detail + '</p></div></div>';
    }
  });

  // Variantes/Sécurité du cours
  const variantesList = (c.educatifs || []).filter(e => e.variante).map(e => '<li class="flex items-start gap-2"><div class="w-3 h-3 bg-black rounded-full mt-2 shrink-0"></div> <strong>' + escapeHtml(e.nom || '') + '</strong> : ' + escapeHtml(e.variante) + '</li>').join('') ||
    (Array.isArray(sae.variantes) ? sae.variantes.map(v => '<li class="flex items-start gap-2"><div class="w-3 h-3 bg-black rounded-full mt-2 shrink-0"></div>' + escapeHtml(typeof v === 'string' ? v : (v.description || '')) + '</li>').join('') : '<li>Aucune variante spécifiée</li>');
  const securiteText = c.consignes_securite || (c.activite_principale && c.activite_principale.consignes_cles) || 'Respect des règles de sécurité de base.';
  const securiteLines = String(securiteText).split(/[.;]\s+/).filter(s => s.trim()).map(s => '<li class="flex items-start gap-2"><div class="w-3 h-3 bg-black rounded-full mt-2 shrink-0"></div>' + escapeHtml(s.trim()) + '</li>').join('');

  const headerHtml = hideCoursHeader ? '' :
    '<div class="relative mt-12">' +
      '<div class="absolute -top-6 left-8 z-30 flex items-center gap-2 px-4 py-2 bg-white border-[4px] border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-6">' +
        '<div class="p-1.5 rounded-full bg-yellow-400 border-2 border-black"><svg width="16" height="16"><use href="#fi-grad"/></svg></div>' +
        '<span class="ff-lucky text-sm uppercase tracking-wider">' + (cycle || 'Cycle') + '</span>' +
      '</div>' +
      '<div class="absolute -top-4 left-44 z-30 flex items-center gap-2 px-4 py-2 bg-white border-[4px] border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-3">' +
        '<div class="p-1.5 rounded-full bg-pink-400 border-2 border-black"><svg width="16" height="16"><use href="#fi-clock"/></svg></div>' +
        '<span class="ff-lucky text-sm uppercase tracking-wider">' + duree + ' min</span>' +
      '</div>' +
      '<header class="relative rounded-[40px] border-[6px] border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] overflow-hidden">' +
        '<div class="absolute inset-0" style="background:radial-gradient(circle at top right,' + headerGrad + ')"></div>' +
        '<div class="relative p-8 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 pt-12">' +
          '<div class="flex-1 text-center md:text-left z-10">' +
            '<div class="inline-block px-4 py-1 bg-black text-white rounded-full font-black text-xs uppercase tracking-widest mb-4">Cours ' + (c.numero || idx+1) + '</div>' +
            '<h1 class="ff-lucky text-4xl md:text-6xl text-white uppercase leading-none" style="text-shadow:4px 4px 0 rgba(0,0,0,1)">' + titre + '</h1>' +
            '<p class="mt-4 text-cyan-100 font-bold text-lg max-w-md">' + obj + '</p>' +
          '</div>' +
          '<div class="shrink-0">' +
            '<div class="w-40 h-40 bg-gradient-to-br ' + ballGrad + ' rounded-full border-[12px] border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">' +
              '<svg width="64" height="64" style="color:white;filter:drop-shadow(4px 4px 0 rgba(0,0,0,0.3))"><use href="#fi-trophy"/></svg>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</header>' +
    '</div>';
  return '<div class="fiche-pane ' + (idx === 0 ? 'active' : '') + '" id="fiche-pane-c' + idx + '">' +
    headerHtml +
    // TUILES
    '<section class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">' +
      ficheTuile({ title: 'Le Matériel', iconId: 'fi-package', defaultIcon: 'fi-package', bandColor: '#00C4FF', bgGradient: 'linear-gradient(135deg,#0891b2,#164e63)', content: matContent }) +
      ficheTuile({ title: "L'Objectif", iconId: 'fi-trophy', defaultIcon: 'fi-trophy', bandColor: '#FFEA00', bgGradient: 'linear-gradient(135deg,#fbbf24,#d97706)', content: objContent }) +
      ficheTuile({ title: 'Organisation', iconId: 'fi-map', defaultIcon: 'fi-map', bandColor: '#ec4899', bgGradient: 'linear-gradient(135deg,#ec4899,#9d174d)', content: orgContent }) +
    '</section>' +
    // PLAN DE MATCH
    '<section class="relative mt-10">' +
      '<div class="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black text-white px-8 py-2 rounded-xl z-20 border-[4px] border-black" style="box-shadow:6px 6px 0 ' + shadowColor + '">' +
        '<h2 class="ff-lucky text-3xl uppercase tracking-widest">Plan de Match</h2>' +
      '</div>' +
      '<div class="border-[12px] border-white rounded-[40px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 pt-12" style="background:' + terrainOuter + '">' +
        '<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">' +
          '<div class="rounded-2xl border-[6px] border-black shadow-inner p-4 court-pattern relative min-h-[400px] flex items-center justify-center overflow-hidden" style="background:' + terrainBg + '" data-terrain="' + idx + '">' +
            '<div class="absolute top-4 left-4 right-4 bottom-4 border-4 border-white/50 border-dashed rounded-lg pointer-events-none"></div>' +
            terrainDefault + stepPanels +
          '</div>' +
          '<div class="flex flex-col justify-center gap-3">' + consignes + '</div>' +
        '</div>' +
      '</div>' +
    '</section>' +
    // VARIANTES + SÉCURITÉ
    '<section class="flex flex-col md:flex-row gap-6 mt-10">' +
      '<div class="flex-1 flex flex-col gap-4">' +
        '<button class="fiche-toggle-panel w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-orange-500 hover:bg-orange-400 transition-all" data-target="var-c' + idx + '">' +
          '<svg width="28" height="28" style="color:white"><use href="#fi-shuffle"/></svg>' +
          '<span class="ff-lucky text-2xl text-white uppercase tracking-widest">Variantes</span>' +
        '</button>' +
        '<div id="panel-var-c' + idx + '" class="hidden bg-orange-100 border-[4px] border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 fiche-fade">' +
          '<h3 class="ff-lucky text-2xl text-orange-600 mb-4 uppercase">Pour complexifier :</h3>' +
          '<ul class="space-y-2 font-bold text-gray-800 text-base">' + variantesList + '</ul>' +
        '</div>' +
      '</div>' +
      '<div class="flex-1 flex flex-col gap-4">' +
        '<button class="fiche-toggle-panel w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-green-500 hover:bg-green-400 transition-all" data-target="sec-c' + idx + '">' +
          '<svg width="28" height="28" style="color:white"><use href="#fi-shield"/></svg>' +
          '<span class="ff-lucky text-2xl text-white uppercase tracking-widest">Sécurité</span>' +
        '</button>' +
        '<div id="panel-sec-c' + idx + '" class="hidden bg-green-100 border-[4px] border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 fiche-fade">' +
          '<h3 class="ff-lucky text-2xl text-green-600 mb-4 uppercase">Points d\'attention :</h3>' +
          '<ul class="space-y-2 font-bold text-gray-800 text-base">' + securiteLines + '</ul>' +
        '</div>' +
      '</div>' +
    '</section>' +
  '</div>';
}

function buildEvalPaneHtml(sae) {
  const grille = sae.grille_imprimable || {};
  const criteres = Array.isArray(grille.criteres) ? grille.criteres : [];
  const echelle = grille.echelle || {};
  const niveaux = Object.keys(echelle).length ? Object.keys(echelle) : ['A','B','C','D'];
  const niveauHeaders = { A: 'A — Très bien', B: 'B — Bien', C: 'C — Acceptable', D: 'D — En développ.', tres_bien: 'Très bien', bien: 'Bien', en_developpement: 'En développ.' };
  const niveauColors = ['bg-green-600', 'bg-yellow-500 text-black', 'bg-orange-500', 'bg-red-500'];
  const critereColors = ['bg-cyan-50', 'bg-orange-50', 'bg-pink-50', 'bg-green-50'];

  let critereCards = '';
  criteres.forEach((cr, i) => {
    const colors = ['cyan-600', 'orange-600', 'pink-600', 'green-600'];
    const emojis = ['🗣️', '🔄', '📣', '🛡️'];
    critereCards += '<div class="bg-white border-[4px] border-black rounded-2xl p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">' +
      '<div class="ff-lucky text-2xl text-' + colors[i % 4] + ' uppercase mb-2">' + emojis[i % 4] + ' ' + escapeHtml(cr.nom || '') + '</div>' +
      '<p class="font-bold text-gray-700 leading-tight">' + escapeHtml(cr.description || '') + '</p>' +
    '</div>';
  });

  let tableHead = '<tr class="bg-black text-white ff-lucky uppercase tracking-wider text-base"><th class="p-3 text-left border-r-[3px] border-white">Critère</th>';
  niveaux.forEach((n, i) => {
    tableHead += '<th class="p-3 ' + niveauColors[i % 4] + ' border-r-[3px] border-white">' + escapeHtml(niveauHeaders[n] || n) + '</th>';
  });
  tableHead += '</tr>';

  let tableBody = '';
  criteres.forEach((cr, i) => {
    tableBody += '<tr class="border-b-[3px] border-black' + (i % 2 ? ' bg-gray-50' : '') + '">' +
      '<td class="p-3 align-top ' + critereColors[i % 4] + ' border-r-[3px] border-black"><strong>' + escapeHtml(cr.nom || '') + '</strong><br><span class="text-xs font-normal">' + escapeHtml(cr.description || '') + '</span></td>';
    niveaux.forEach(n => {
      tableBody += '<td class="p-3 align-top border-r-[2px] border-gray-300">' + escapeHtml(echelle[n] || '') + '<br><span class="text-2xl">☐</span></td>';
    });
    tableBody += '</tr>';
  });

  return '<div class="fiche-pane" id="fiche-pane-eval">' +
    '<div class="relative mt-12">' +
      '<header class="relative rounded-[40px] border-[6px] border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] overflow-hidden">' +
        '<div class="absolute inset-0" style="background:radial-gradient(circle at top right,#A78BFA 0%,#3B0764 100%)"></div>' +
        '<div class="relative p-8 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 pt-12">' +
          '<div class="flex-1 text-center md:text-left z-10">' +
            '<div class="inline-block px-4 py-1 bg-black text-white rounded-full font-black text-xs uppercase tracking-widest mb-4">Grille d\'évaluation imprimable</div>' +
            '<h1 class="ff-lucky text-4xl md:text-6xl text-white uppercase leading-none" style="text-shadow:4px 4px 0 rgba(0,0,0,1)">Évaluer <span style="color:#FFFC00">la SAÉ</span></h1>' +
            '<p class="mt-4 text-purple-100 font-bold text-lg max-w-md">' + criteres.length + ' critères × ' + niveaux.length + ' niveaux. Une ligne par élève.</p>' +
          '</div>' +
          '<div class="shrink-0">' +
            '<div class="w-40 h-40 bg-gradient-to-br from-purple-300 to-pink-400 rounded-full border-[12px] border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center"><span class="text-7xl">📊</span></div>' +
          '</div>' +
        '</div>' +
      '</header>' +
    '</div>' +
    (criteres.length ? '<section class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">' + critereCards + '</section>' : '') +
    (criteres.length ? '<section class="mt-10"><div class="bg-white border-[4px] border-black rounded-2xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden"><table class="w-full text-sm"><thead>' + tableHead + '</thead><tbody class="font-bold text-gray-800">' + tableBody + '</tbody></table></div></section>' : '<p class="mt-8 text-center text-gray-600">Aucune grille structurée disponible.</p>') +
    '<section class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">' +
      '<div class="bg-yellow-100 border-[4px] border-black rounded-2xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"><div class="ff-lucky text-yellow-700 text-lg uppercase mb-2">📝 Élève</div><div class="border-b-[3px] border-black h-8"></div></div>' +
      '<div class="bg-cyan-100 border-[4px] border-black rounded-2xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"><div class="ff-lucky text-cyan-700 text-lg uppercase mb-2">📅 Date</div><div class="border-b-[3px] border-black h-8"></div></div>' +
      '<div class="bg-pink-100 border-[4px] border-black rounded-2xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"><div class="ff-lucky text-pink-700 text-lg uppercase mb-2">🏆 Note globale</div><div class="border-b-[3px] border-black h-8"></div></div>' +
    '</section>' +
    '<section class="mt-6 bg-white border-[4px] border-black rounded-2xl p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">' +
      '<div class="ff-lucky text-xl text-purple-700 uppercase mb-3">💬 Observations / Forces / Pistes</div>' +
      '<div class="space-y-3"><div class="border-b-2 border-dashed border-gray-400 h-6"></div><div class="border-b-2 border-dashed border-gray-400 h-6"></div><div class="border-b-2 border-dashed border-gray-400 h-6"></div><div class="border-b-2 border-dashed border-gray-400 h-6"></div></div>' +
    '</section>' +
  '</div>';
}

function synthesizeCoursFromSae(sae) {
  // Construire un pseudo-cours à partir des champs top-level si sae.cours absent
  const d = sae.deroulement || {};
  const echauffement = d.mise_en_train ? {
    duree_min: 10,
    description: typeof d.mise_en_train === 'string' ? d.mise_en_train : (d.mise_en_train.description || ''),
    exercices: Array.isArray(d.mise_en_train) ? d.mise_en_train : (Array.isArray(d.mise_en_train && d.mise_en_train.exercices) ? d.mise_en_train.exercices : [])
  } : null;
  const educatifs = [];
  Object.keys(d).forEach(k => {
    if (k.startsWith('partie_principale') && d[k]) {
      educatifs.push({
        nom: k.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()),
        description: typeof d[k] === 'string' ? d[k] : (d[k].description || JSON.stringify(d[k]).slice(0, 200))
      });
    }
  });
  const activite = sae.tache_complexe ? {
    duree_min: 20,
    description: sae.tache_complexe,
    organisation: sae.espace || '',
    consignes_cles: Array.isArray(sae.criteres_evaluation) ? sae.criteres_evaluation.join(' · ') : ''
  } : null;
  const retour = d.retour_calme || d.retour_au_calme ? {
    duree_min: 5,
    description: typeof (d.retour_calme || d.retour_au_calme) === 'string' ? (d.retour_calme || d.retour_au_calme) : ((d.retour_calme || d.retour_au_calme).description || '')
  } : { duree_min: 5, description: 'Retour au calme et bilan de la séance.' };

  return [{
    numero: 1,
    titre: sae.titre || 'Séance',
    objectif: sae.intentions_pedagogiques || sae.intentions || '',
    duree_min: parseInt(sae.duree_par_periode) || 45,
    echauffement: echauffement,
    educatifs: educatifs.length ? educatifs : (Array.isArray(sae.educatifs) ? sae.educatifs : []),
    activite_principale: activite,
    retour_au_calme: retour,
    materiel_specifique: Array.isArray(sae.materiel) ? sae.materiel : [],
    consignes_securite: sae.consignes_securite || (Array.isArray(sae.adaptations) ? sae.adaptations.join(' ') : '')
  }];
}

function buildFicheZTSHtml(sae) {
  // Synthétiser cours[] si absent
  if (!Array.isArray(sae.cours) || sae.cours.length === 0) {
    sae = Object.assign({}, sae, { cours: synthesizeCoursFromSae(sae) });
  }
  const singleCours = (sae.cours || []).length === 1;
  const titre = escapeHtml(sae.titre || 'Sans titre');
  const cycle = escapeHtml(sae.cycle || '');
  const niveau = escapeHtml(sae.niveau || sae.niveau_scolaire || '');
  const moyen = escapeHtml(sae.moyen_action || sae.categorie || '');
  const totalDuree = (sae.cours || []).reduce((s, c) => s + (c.duree_min || 0), 0);
  const intentions = escapeHtml(sae.intentions_pedagogiques || sae.intentions || '');
  const situation = escapeHtml(sae.situation_depart || '');
  const tache = escapeHtml(sae.tache_complexe || '');
  const competence = escapeHtml(sae.competence_pfeq || sae.competence || '');
  const composante = escapeHtml(sae.composante || '');

  // Tabs (cacher tabs cours si un seul cours, garder seulement Évaluation)
  let tabs = '';
  if (!singleCours) {
    (sae.cours || []).forEach((c, i) => {
      tabs += '<button class="fiche-tab tab-btn ' + (i === 0 ? 'active' : 'bg-white') + ' px-4 py-2 rounded-xl border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider text-sm" data-pane="c' + i + '">Cours ' + (c.numero || i+1) + '</button>';
    });
  } else {
    tabs += '<button class="fiche-tab tab-btn active px-4 py-2 rounded-xl border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider text-sm" data-pane="c0">📋 Séance</button>';
  }
  tabs += '<button class="fiche-tab bg-white px-4 py-2 rounded-xl border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider text-sm" data-pane="eval">📊 Évaluation</button>';

  // Panes
  let panes = '';
  (sae.cours || []).forEach((c, i) => { panes += buildCoursPaneHtml(sae, c, i, singleCours); });
  panes += buildEvalPaneHtml(sae);

  // Sections communes
  const adapt = sae.adaptations;
  const inter = sae.interdisciplinarite;
  const valeurs = Array.isArray(sae.valeurs) ? sae.valeurs : [];
  const notes = sae.notes_enseignant;
  const prettyAdaptKey = (k) => {
    const map = { besoins_speciaux: 'Besoins spéciaux', avances: 'Élèves avancés', difficulte: 'Élèves en difficulté', hdaa: 'HDAA', tdah: 'TDAH', autisme: 'Autisme', dys: 'Dys', moteur: 'Limitations motrices' };
    return map[k] || k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' ');
  };
  const isNumericKey = (k) => /^\d+$/.test(String(k));
  const adaptHtml = adapt ? (typeof adapt === 'string' ? '<p class="font-bold text-gray-700 text-sm">' + escapeHtml(adapt) + '</p>' : '<ul class="space-y-1 font-bold text-gray-700 text-sm">' + Object.entries(adapt).map(([k,v]) => {
    const val = typeof v === 'string' ? v : JSON.stringify(v);
    return isNumericKey(k) ? '<li>• ' + escapeHtml(val) + '</li>' : '<li>• <strong>' + escapeHtml(prettyAdaptKey(k)) + '</strong> : ' + escapeHtml(val) + '</li>';
  }).join('') + '</ul>') : '';
  const interHtml = inter ? (typeof inter === 'string' ? '<p class="font-bold text-gray-700 text-sm">' + escapeHtml(inter) + '</p>' : '<ul class="space-y-1 font-bold text-gray-700 text-sm">' + Object.entries(inter).map(([k,v]) => {
    const val = typeof v === 'string' ? v : JSON.stringify(v);
    return isNumericKey(k) ? '<li>• ' + escapeHtml(val) + '</li>' : '<li>• <strong>' + escapeHtml(prettyAdaptKey(k)) + '</strong> : ' + escapeHtml(val) + '</li>';
  }).join('') + '</ul>') : '';
  const valColors = ['bg-pink-200', 'bg-cyan-200', 'bg-yellow-200', 'bg-green-200', 'bg-orange-200'];
  const valHtml = valeurs.length ? '<div class="flex flex-wrap gap-2">' + valeurs.map((v,i) => '<span class="' + valColors[i % 5] + ' border-2 border-black px-3 py-1 rounded-full text-sm font-bold">' + escapeHtml(v) + '</span>').join('') + '</div>' : '';

  return ficheIcons() +
  '<button class="fiche-modal-close" onclick="closeModal()" aria-label="Fermer">✕</button>' +
  '<div class="space-y-10" style="width:100%;max-width:100%;display:block">' +
    // Bannière SAÉ
    '<div class="bg-white border-[4px] border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5" style="width:100%;display:block;box-sizing:border-box">' +
      '<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">' +
        '<div>' +
          '<div class="text-xs font-black uppercase tracking-widest text-gray-500">SAÉ — ' + (sae.cours || []).length + ' cours · ' + totalDuree + ' min total</div>' +
          '<div class="ff-lucky text-3xl">' + titre + '</div>' +
          '<div class="text-sm text-gray-600 font-bold mt-1">' + [niveau, moyen].filter(Boolean).join(' · ') + '</div>' +
        '</div>' +
        '<div class="flex gap-2 flex-wrap">' + tabs + '</div>' +
      '</div>' +
      (intentions || situation || tache ? '<div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">' +
        (intentions ? '<div class="bg-cyan-50 border-[3px] border-black rounded-xl p-3"><div class="ff-lucky text-cyan-700 text-sm uppercase tracking-wider mb-1">🎯 Intentions</div><p class="text-sm font-bold leading-tight">' + intentions + '</p></div>' : '') +
        (situation ? '<div class="bg-yellow-50 border-[3px] border-black rounded-xl p-3"><div class="ff-lucky text-yellow-700 text-sm uppercase tracking-wider mb-1">📖 Situation de départ</div><p class="text-sm font-bold leading-tight">' + situation + '</p></div>' : '') +
        (tache ? '<div class="bg-pink-50 border-[3px] border-black rounded-xl p-3"><div class="ff-lucky text-pink-700 text-sm uppercase tracking-wider mb-1">🏆 Tâche complexe</div><p class="text-sm font-bold leading-tight">' + tache + '</p></div>' : '') +
      '</div>' : '') +
      (competence ? '<div class="mt-4 bg-black text-white rounded-xl p-3 border-[3px] border-black"><div class="text-xs ff-lucky text-yellow-300 uppercase tracking-wider mb-1">Compétence PFEQ' + (composante ? ' — Composante' : '') + '</div><p class="text-sm font-bold">' + competence + (composante ? ' · ' + composante : '') + '</p></div>' : '') +
    '</div>' +
    // Panes
    panes +
    // Sections communes bas
    (adaptHtml || interHtml || valHtml || notes ? '<section class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">' +
      (adaptHtml ? '<div class="bg-white border-[4px] border-black rounded-2xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"><div class="ff-lucky text-xl text-purple-600 uppercase mb-2">♿ Adaptations</div>' + adaptHtml + '</div>' : '') +
      (interHtml ? '<div class="bg-white border-[4px] border-black rounded-2xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"><div class="ff-lucky text-xl text-cyan-600 uppercase mb-2">🌍 Interdisciplinarité</div>' + interHtml + '</div>' : '') +
      (valHtml ? '<div class="bg-white border-[4px] border-black rounded-2xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"><div class="ff-lucky text-xl text-pink-600 uppercase mb-2">💎 Valeurs</div>' + valHtml + '</div>' : '') +
      (notes ? '<div class="bg-white border-[4px] border-black rounded-2xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"><div class="ff-lucky text-xl text-green-600 uppercase mb-2">📌 Notes enseignant</div><p class="font-bold text-gray-700 text-sm leading-tight">' + escapeHtml(notes) + '</p></div>' : '') +
    '</section>' : '') +
    // Boutons
    '<div class="flex flex-col sm:flex-row justify-center gap-6 pb-12 mt-10 no-print">' +
      '<button onclick="window.print()" class="flex items-center justify-center gap-3 bg-yellow-300 hover:bg-yellow-400 text-black px-8 py-4 rounded-2xl border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all"><svg width="28" height="28"><use href="#fi-print"/></svg><span class="ff-lucky tracking-widest uppercase text-xl">Imprimer tout</span></button>' +
    '</div>' +
  '</div>';
}

function initFicheHandlers(sae) {
  const root = document.querySelector('.modal-box.fiche-mode');
  if (!root) return;

  // Tabs
  root.querySelectorAll('.fiche-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.pane;
      root.querySelectorAll('.fiche-tab').forEach(t => { t.classList.remove('active'); t.classList.add('bg-white'); });
      tab.classList.add('active'); tab.classList.remove('bg-white');
      root.querySelectorAll('.fiche-pane').forEach(p => p.classList.remove('active'));
      const pane = root.querySelector('#fiche-pane-' + target);
      if (pane) pane.classList.add('active');
      root.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Step buttons (terrain)
  root.querySelectorAll('.fiche-step-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const step = parseInt(btn.dataset.step);
      const cours = btn.dataset.cours;
      ficheSetStep(root, cours, step);
    });
  });

  // Step panels click to close
  root.querySelectorAll('.fiche-step-panel').forEach(p => {
    p.addEventListener('click', () => {
      const cours = p.dataset.cours;
      ficheSetStep(root, cours, null);
    });
  });

  // Consignes click
  root.querySelectorAll('.fiche-consigne').forEach(c => {
    c.addEventListener('click', () => {
      const step = parseInt(c.dataset.consigne);
      const cours = c.dataset.cours;
      ficheSetStep(root, cours, step);
    });
  });

  // Toggle panels (variantes/sécurité)
  root.querySelectorAll('.fiche-toggle-panel').forEach(btn => {
    btn.addEventListener('click', () => {
      const tgt = btn.dataset.target;
      const panel = root.querySelector('#panel-' + tgt);
      if (panel) panel.classList.toggle('hidden');
    });
  });
}

function ficheSetStep(root, cours, n) {
  const def = root.querySelector('#terrain-' + cours + '-default');
  if (def) {
    if (n === null) { def.style.opacity='1'; def.style.zIndex='20'; def.style.pointerEvents='auto'; }
    else { def.style.opacity='0'; def.style.zIndex='0'; def.style.pointerEvents='none'; }
  }
  root.querySelectorAll('.fiche-step-panel[data-cours="' + cours + '"]').forEach(p => {
    const m = parseInt(p.dataset.stepPanel) === n;
    p.style.opacity = m ? '1' : '0';
    p.style.zIndex = m ? '10' : '0';
    p.style.pointerEvents = m ? 'auto' : 'none';
  });
  root.querySelectorAll('.fiche-consigne[data-cours="' + cours + '"]').forEach(c => {
    const m = parseInt(c.dataset.consigne) === n;
    c.classList.toggle('bg-white', m);
    c.classList.toggle('!border-black', m);
    c.classList.toggle('shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]', m);
    c.classList.toggle('scale-[1.02]', m);
    c.classList.toggle('translate-x-2', m);
    c.classList.toggle('bg-white/5', !m);
    c.classList.toggle('border-transparent', !m);
  });
}

// ── ANCIENNE fonction (gardée pour compat / non-utilisée) ──
function openSaeModalEnrichedLegacy(sae) {
  const titre = escapeHtml(sae.titre || 'Sans titre');
  const icon = getSaeIcon(sae);
  const saeId = getSaeId(sae);
  const fav = isFavori(sae);
  const moyen = escapeHtml(sae.moyen_action || sae.moyen || sae.categorie || '');
  const niveau = escapeHtml(sae.niveau || sae.niveau_scolaire || '');
  const cycle = escapeHtml(sae.cycle || '');
  const competence = escapeHtml(sae.competence_pfeq || sae.competence || '');
  const nbCours = sae.cours.length;

  let html = '';

  // HEADER
  html += '<div class="modal-header">' +
    '<h2 class="modal-title">' + icon + ' ' + titre + '</h2>' +
    '<button class="modal-close" onclick="closeModal()">' + t('close') + '</button>' +
  '</div>';

  // META BADGES
  html += '<div class="modal-meta">';
  if (moyen) html += '<span class="meta-badge"><strong>Moyen :</strong> ' + moyen + '</span>';
  if (niveau) html += '<span class="meta-badge"><strong>Niveau :</strong> ' + niveau + '</span>';
  if (cycle) html += '<span class="meta-badge"><strong>Cycle :</strong> ' + cycle + '</span>';
  html += '<span class="meta-badge"><strong>Cours :</strong> ' + nbCours + '</span>';
  if (competence) html += '<span class="meta-badge"><strong>Compétence :</strong> ' + competence + '</span>';
  html += '</div>';

  // ACTIONS
  html += '<div class="modal-actions">' +
    '<button class="action-btn ' + (fav ? 'active' : '') + '" id="modalFavBtn" onclick="toggleFavoriModal(\'' + escapeHtml(saeId).replace(/\'/g, "\\'") + '\')">' + (fav ? '★' : '☆') + ' Favori</button>' +
    '<button class="action-btn" onclick="printSae()">' + t('print') + '</button>' +
    '<button class="action-btn" onclick="printGrilleEvaluation()">🖨️ Imprimer grille</button>' +
    '<button class="action-btn" onclick="duplicateSae(\'' + escapeHtml(saeId).replace(/\'/g, "\\'") + '\')">' + t('duplicateSae') + '</button>' +
  '</div>';

  // INTENTIONS pédagogiques (toujours visible en haut)
  const intentions = sae.intentions_pedagogiques || sae.intentions || sae.objectifs;
  if (intentions) {
    html += '<div class="modal-section"><h3>🎯 Intentions pédagogiques</h3>' +
      '<div class="modal-content">' + formatTextBlock(intentions) + '</div></div>';
  }

  // ONGLETS Cours 1..N + Évaluation
  html += '<div class="cours-tabs-wrap">';
  // tab buttons
  html += '<div class="cours-tabs-nav">';
  for (let i = 0; i < nbCours; i++) {
    const c = sae.cours[i];
    const numero = c.numero || (i+1);
    html += '<button class="cours-tab' + (i===0 ? ' active' : '') + '" data-cours-tab="' + i + '">📖 Cours ' + numero + '</button>';
  }
  html += '<button class="cours-tab cours-tab-eval" data-cours-tab="eval">📊 Évaluation</button>';
  html += '</div>';

  // tab panels
  html += '<div class="cours-tabs-panels">';
  for (let i = 0; i < nbCours; i++) {
    html += '<div class="cours-tab-panel' + (i===0 ? ' active' : '') + '" data-cours-panel="' + i + '">' +
      buildCoursPanel(sae.cours[i]) +
    '</div>';
  }
  // Évaluation panel
  html += '<div class="cours-tab-panel" data-cours-panel="eval">' +
    buildEvalPanel(sae) +
  '</div>';
  html += '</div></div>';

  showModal(html);
  addXP(2);

  // Bind tab clicks
  setTimeout(() => {
    const nav = document.querySelector('.cours-tabs-nav');
    if (!nav) return;
    nav.addEventListener('click', (e) => {
      const btn = e.target.closest('.cours-tab');
      if (!btn) return;
      const key = btn.dataset.coursTab;
      document.querySelectorAll('.cours-tab').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.cours-tab-panel').forEach(p => p.classList.toggle('active', p.dataset.coursPanel === key));
    });
  }, 0);
}

function buildCoursPanel(c) {
  let h = '';
  const numero = c.numero || '';
  const titre = escapeHtml(c.titre || ('Cours ' + numero));
  const obj = escapeHtml(c.objectif || '');
  const duree = c.duree_min ? c.duree_min + ' min' : '';

  h += '<div class="cours-header">' +
    '<h3 class="cours-titre">📖 Cours ' + escapeHtml(String(numero)) + ' — ' + titre + '</h3>' +
    (duree ? '<span class="cours-duree">⏱️ ' + escapeHtml(duree) + '</span>' : '') +
  '</div>';
  if (obj) h += '<div class="cours-objectif"><strong>🎯 OBJECTIF :</strong> ' + obj + '</div>';

  // Échauffement
  if (c.echauffement) {
    const e = c.echauffement;
    h += '<div class="cours-block cours-block-echauffement">' +
      '<h4 class="cours-block-title">🔥 Échauffement' + (e.duree_min ? ' (' + e.duree_min + ' min)' : '') + '</h4>' +
      (e.description ? '<p>' + escapeHtml(e.description) + '</p>' : '') +
      (Array.isArray(e.exercices) ? '<ul>' + e.exercices.map(x => '<li>' + escapeHtml(x) + '</li>').join('') + '</ul>' : '') +
    '</div>';
  }

  // Éducatifs
  if (Array.isArray(c.educatifs) && c.educatifs.length) {
    h += '<div class="cours-block cours-block-educatifs">' +
      '<h4 class="cours-block-title">🎓 Éducatifs</h4>';
    for (const ed of c.educatifs) {
      h += '<div class="educatif-card">' +
        '<h5>' + escapeHtml(ed.nom || '') + (ed.duree_min ? ' <span class="educatif-duree">' + ed.duree_min + ' min</span>' : '') + '</h5>' +
        (ed.description ? '<p>' + escapeHtml(ed.description) + '</p>' : '') +
        (ed.consignes ? '<p class="educatif-consignes"><strong>Consignes :</strong> ' + escapeHtml(ed.consignes) + '</p>' : '') +
        (ed.variante ? '<p class="educatif-variante"><strong>Variante :</strong> ' + escapeHtml(ed.variante) + '</p>' : '') +
      '</div>';
    }
    h += '</div>';
  }

  // Activité principale
  if (c.activite_principale) {
    const a = c.activite_principale;
    h += '<div class="cours-block cours-block-activite">' +
      '<h4 class="cours-block-title">⚡ Activité principale' + (a.duree_min ? ' (' + a.duree_min + ' min)' : '') + '</h4>' +
      (a.description ? '<p>' + escapeHtml(a.description) + '</p>' : '') +
      (a.organisation ? '<p><strong>📐 Organisation :</strong> ' + escapeHtml(a.organisation) + '</p>' : '') +
      (a.consignes_cles ? '<p><strong>📌 Consignes clés :</strong> ' + escapeHtml(a.consignes_cles) + '</p>' : '') +
    '</div>';
  }

  // Retour au calme
  if (c.retour_au_calme) {
    const r = c.retour_au_calme;
    h += '<div class="cours-block cours-block-retour">' +
      '<h4 class="cours-block-title">🧘 Retour au calme' + (r.duree_min ? ' (' + r.duree_min + ' min)' : '') + '</h4>' +
      (r.description ? '<p>' + escapeHtml(r.description) + '</p>' : '') +
      (Array.isArray(r.exercices) ? '<ul>' + r.exercices.map(x => '<li>' + escapeHtml(x) + '</li>').join('') + '</ul>' : '') +
    '</div>';
  }

  // Matériel + Sécurité (rangée 2 colonnes)
  if (c.materiel_specifique || c.consignes_securite) {
    h += '<div class="cours-row-2col">';
    if (Array.isArray(c.materiel_specifique) && c.materiel_specifique.length) {
      h += '<div class="cours-block cours-block-materiel">' +
        '<h4 class="cours-block-title">🎒 Matériel</h4>' +
        '<ul>' + c.materiel_specifique.map(x => '<li>' + escapeHtml(x) + '</li>').join('') + '</ul>' +
      '</div>';
    }
    if (c.consignes_securite) {
      h += '<div class="cours-block cours-block-securite">' +
        '<h4 class="cours-block-title">🛡️ Sécurité</h4>' +
        '<p>' + escapeHtml(c.consignes_securite) + '</p>' +
      '</div>';
    }
    h += '</div>';
  }

  return h;
}

function buildEvalPanel(sae) {
  const grille = sae.grille_imprimable || sae.grille_evaluation;
  let h = '';
  h += '<div class="eval-panel-header">' +
    '<h3>📊 Grille d\'évaluation imprimable</h3>' +
    '<button class="eval-print-btn" onclick="printGrilleEvaluation()">🖨️ Imprimer la grille</button>' +
  '</div>';

  if (!grille) {
    h += '<p>Aucune grille structurée disponible pour cette SAÉ.</p>';
    if (Array.isArray(sae.criteres_evaluation)) {
      h += '<ul>' + sae.criteres_evaluation.map(c => '<li>' + escapeHtml(typeof c === 'string' ? c : (c.nom || JSON.stringify(c))) + '</li>').join('') + '</ul>';
    }
    return h;
  }

  // Critères + échelle
  const criteres = Array.isArray(grille.criteres) ? grille.criteres : (Array.isArray(sae.criteres_evaluation) ? sae.criteres_evaluation.map(s => ({nom: typeof s === 'string' ? s.split(/[\s—\-:]/)[0] : '', description: typeof s === 'string' ? s : ''})) : []);
  const echelle = grille.echelle || {};
  const niveaux = Object.keys(echelle).length ? Object.keys(echelle) : ['tres_bien','bien','en_developpement'];
  const niveauLabels = {A:'A — Très bien', B:'B — Bien', C:'C — Acceptable', D:'D — En dévelop.', tres_bien:'🟢 Très bien', bien:'🟡 Bien', en_developpement:'🟠 En dévelop.'};

  h += '<div class="eval-grille-print" id="evalGrillePrint">';
  h += '<table class="eval-grille-table"><thead><tr><th>Critère</th>';
  for (const n of niveaux) h += '<th>' + escapeHtml(niveauLabels[n] || n) + '</th>';
  h += '<th>Note élève</th></tr></thead><tbody>';
  for (const cr of criteres) {
    const nom = escapeHtml(cr.nom || '');
    const desc = escapeHtml(cr.description || cr.nom || (typeof cr === 'string' ? cr : ''));
    h += '<tr><td><strong>' + nom + '</strong><br><span class="critere-desc">' + desc + '</span></td>';
    for (const n of niveaux) {
      h += '<td class="eval-cell"><span class="eval-cell-desc">' + escapeHtml(echelle[n] || '') + '</span><br><span class="eval-checkbox">☐</span></td>';
    }
    h += '<td class="eval-note-cell">_____</td></tr>';
  }
  h += '</tbody></table>';
  h += '</div>';

  return h;
}

window.printGrilleEvaluation = function() {
  const grille = document.getElementById('evalGrillePrint');
  if (!grille) { alert('Ouvrir l\'onglet Évaluation d\'abord.'); return; }
  const w = window.open('', '_blank');
  w.document.write('<!DOCTYPE html><html><head><title>Grille d\'évaluation</title>' +
    '<style>body{font-family:Arial,sans-serif;padding:24px}h1{font-size:1.4rem}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:2px solid #000;padding:10px;vertical-align:top;text-align:left;font-size:.9rem}th{background:#FFFC00;font-weight:700}.critere-desc{font-weight:400;font-size:.85rem;color:#444}.eval-cell-desc{font-size:.8rem;color:#333;display:block;margin-bottom:6px}.eval-checkbox{font-size:1.6rem}.eval-note-cell{font-size:1.4rem;text-align:center}@media print{body{padding:0}}</style>' +
    '</head><body>' +
    '<h1>Grille d\'évaluation — ' + (document.querySelector('.modal-title')?.textContent || 'SAÉ') + '</h1>' +
    grille.innerHTML +
    '<p style="margin-top:24px">Élève : _________________________  Groupe : _______  Date : _______</p>' +
    '</body></html>');
  w.document.close();
  setTimeout(() => w.print(), 300);
};

function buildModalSection(title, content, layoutClass) {
  if (!content) return '';
  const cls = layoutClass ? ' ' + layoutClass : '';
  return '<div class="modal-section' + cls + '"><h3>' + title + '</h3>' +
    '<div class="modal-content">' + formatTextBlock(content) + '</div></div>';
}

function showModal(html) {
  const modal = document.getElementById('modal');
  const body = document.getElementById('modalBody');
  if (!modal || !body) return;

  body.innerHTML = html;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Close on backdrop click
  const backdrop = document.getElementById('modalBackdrop');
  if (backdrop) {
    backdrop.onclick = closeModal;
  }

  // Close on Escape key
  document.addEventListener('keydown', handleModalEscape);

  // GSAP animation
  if (typeof gsap !== 'undefined') {
    const box = modal.querySelector('.modal-box');
    if (box) {
      gsap.fromTo(box, { opacity: 0, scale: 0.9, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(1.5)' });
    }
  }
}

function closeModal() {
  const modal = document.getElementById('modal');
  if (!modal) return;

  if (typeof gsap !== 'undefined') {
    const box = modal.querySelector('.modal-box');
    if (box) {
      gsap.to(box, {
        opacity: 0, scale: 0.9, y: 30, duration: 0.2, ease: 'power2.in',
        onComplete: function() {
          modal.classList.remove('active');
          modal.setAttribute('aria-hidden', 'true');
          document.body.style.overflow = '';
        }
      });
      return;
    }
  }

  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', handleModalEscape);
}

function handleModalEscape(e) {
  if (e.key === 'Escape') closeModal();
}

// Modal action helpers
window.toggleFavoriModal = function(saeId) {
  const sae = allSAE.find(s => getSaeId(s) === saeId);
  if (!sae) return;
  toggleFavori(sae);
  const btn = document.getElementById('modalFavBtn');
  if (btn) {
    const fav = isFavori(sae);
    btn.textContent = (fav ? '★' : '☆') + ' Favori';
    btn.classList.toggle('active', fav);
  }
  // Update the card in the grid as well
  const cardFav = document.querySelector('.card-fav[data-sae-id="' + CSS.escape(saeId) + '"]');
  if (cardFav) {
    const fav = isFavori(sae);
    cardFav.textContent = fav ? '★' : '☆';
    cardFav.classList.toggle('active', fav);
  }
};

window.printSae = function() {
  const modalBody = document.getElementById('modalBody');
  if (!modalBody) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write('<!DOCTYPE html><html><head><title>SAÉ — Zone Total Sport</title>');
  printWindow.document.write('<style>body{font-family:Schoolbell,cursive;max-width:800px;margin:0 auto;padding:20px;color:#222}');
  printWindow.document.write('h2,h3{margin-top:1.5em}h2{border-bottom:2px solid #00d4ff;padding-bottom:8px}');
  printWindow.document.write('.meta-badge{display:inline-block;background:#f0f0f0;padding:4px 10px;border-radius:12px;margin:4px;font-size:0.85em}');
  printWindow.document.write('.modal-actions,.modal-close{display:none!important}');
  printWindow.document.write('.card-tag{display:inline-block;background:#e8f4ff;padding:2px 8px;border-radius:8px;margin:2px;font-size:0.8em}');
  printWindow.document.write('.eval-grid{margin:10px 0}.eval-level{margin:8px 0;padding:8px;background:#f9f9f9;border-radius:8px}');
  printWindow.document.write('ul{padding-left:20px}li{margin:4px 0}');
  printWindow.document.write('@media print{body{font-size:11pt}}');
  printWindow.document.write('</style></head><body>');
  printWindow.document.write(modalBody.innerHTML);
  printWindow.document.write('<hr><p style="text-align:center;color:#999;font-size:0.8em">Zone Total Sport &mdash; zonetotalsport.com</p>');
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

window.shareSae = function(saeId) {
  const url = window.location.origin + window.location.pathname + '#sae=' + encodeURIComponent(saeId);
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => showToast(t('linkCopied')));
  } else {
    // Fallback
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast(t('linkCopied'));
  }
};

window.duplicateSae = function(saeId) {
  const sae = allSAE.find(s => getSaeId(s) === saeId);
  if (!sae) return;

  // Fill the creator form with this SAE's data
  closeModal();
  switchTab('createur');

  setTimeout(() => {
    const fields = {
      'cr-titre': (sae.titre || '') + ' (copie)',
      'cr-intentions': sae.intentions || sae.intentions_pedagogiques || sae.objectifs || '',
      'cr-niveau': sae.niveau || '',
      'cr-duree': sae.duree || '',
      'cr-competence': sae.competence || '',
      'cr-moyen': sae.moyen_action || '',
      'cr-espace': sae.espace || 'Gymnase',
      'cr-materiel': typeof sae.materiel === 'string' ? sae.materiel : (Array.isArray(sae.materiel) ? sae.materiel.join(', ') : ''),
      'cr-contexte': sae.contexte || sae.mise_en_contexte || sae.description || '',
      'cr-adaptations': typeof sae.adaptations === 'string' ? sae.adaptations : '',
      'cr-variantes': typeof sae.variantes === 'string' ? sae.variantes : '',
      'cr-valeurs': typeof sae.valeurs === 'string' ? sae.valeurs : (Array.isArray(sae.valeurs) ? sae.valeurs.join(', ') : ''),
      'cr-tags': Array.isArray(sae.tags) ? sae.tags.join(', ') : (sae.tags || ''),
    };

    // Handle deroulement
    const d = sae.deroulement || sae.déroulement || {};
    if (typeof d === 'object' && !Array.isArray(d)) {
      fields['cr-mise-en-train'] = extractText(d.mise_en_train || d.echauffement || '');
      fields['cr-partie1'] = extractText(d.partie_principale_1 || d.tache_complexe || d.developpement || '');
      fields['cr-partie2'] = extractText(d.partie_principale_2 || d.reinvestissement || '');
      fields['cr-retour'] = extractText(d.retour_au_calme || d.retour || d.bilan || '');
    }

    // Handle evaluation
    const ev = sae.evaluation || sae.évaluation || {};
    if (typeof ev === 'object' && !Array.isArray(ev)) {
      fields['cr-criteres'] = extractText(ev.criteres || ev.critères || '');
      const grille = ev.grille || ev.niveaux || {};
      if (typeof grille === 'object') {
        fields['cr-grille-tb'] = extractText(grille.tres_bien || grille.A || grille.excellent || '');
        fields['cr-grille-b'] = extractText(grille.bien || grille.B || grille.satisfaisant || '');
        fields['cr-grille-ed'] = extractText(grille.en_developpement || grille.C || grille.acceptable || '');
      }
    }

    for (const [id, val] of Object.entries(fields)) {
      const el = document.getElementById(id);
      if (el && val) {
        const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
        el.value = valStr;
      }
    }

    currentEditId = null; // It's a new SAE (duplicate)
    showToast(t('duplicateSae'));
  }, 300);
};

function extractText(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map(v => typeof v === 'object' ? (v.description || v.consignes || v.titre || JSON.stringify(v)) : String(v)).join('\n');
  if (typeof val === 'object') return Object.entries(val).map(([k, v]) => k + ': ' + (typeof v === 'string' ? v : JSON.stringify(v))).join('\n');
  return String(val);
}

// Expose closeModal globally for onclick handlers
window.closeModal = closeModal;


// ============================================================
//  SECTION 8: FAVORIS + GAMIFICATION
// ============================================================

// ── Favoris ──
const FAVORIS_KEY = 'favoris-sae-generator';

function getFavoris() {
  try {
    return JSON.parse(localStorage.getItem(FAVORIS_KEY)) || [];
  } catch { return []; }
}

function setFavoris(favs) {
  localStorage.setItem(FAVORIS_KEY, JSON.stringify(favs));
}

function getSaeId(sae) {
  if (!sae) return '';
  return sae.id || sae.titre || sae.nom || sae.title || '';
}

function isFavori(sae) {
  const id = getSaeId(sae);
  if (!id) return false;
  return getFavoris().includes(id);
}

function toggleFavori(sae) {
  const id = getSaeId(sae);
  if (!id) return;
  let favs = getFavoris();
  const idx = favs.indexOf(id);
  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    favs.push(id);
  }
  setFavoris(favs);
}

// ── Gamification / XP System ──
const XP_KEY = 'zts-xp';
const XP_PER_LEVEL = 50;

function getXP() {
  return parseInt(localStorage.getItem(XP_KEY)) || 0;
}

function setXP(xp) {
  localStorage.setItem(XP_KEY, String(xp));
}

function getLevel(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

function addXP(amount) {
  const oldXP = getXP();
  const oldLevel = getLevel(oldXP);
  const newXP = oldXP + amount;
  setXP(newXP);
  const newLevel = getLevel(newXP);

  updateXPDisplay();

  // Level up!
  if (newLevel > oldLevel) {
    showToast('🎉 Niveau ' + newLevel + ' atteint!', 4000);
    // Confetti
    if (typeof confetti !== 'undefined') {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#00d4ff', '#ffd700', '#ff6b6b', '#2ed573', '#a55eea']
      });
    }
  }
}

function updateXPDisplay() {
  const xp = getXP();
  const level = getLevel(xp);
  const xpInLevel = xp % XP_PER_LEVEL;
  const pct = (xpInLevel / XP_PER_LEVEL) * 100;

  const fill = document.getElementById('xpFill');
  if (fill) fill.style.width = pct + '%';

  const text = document.getElementById('xpText');
  if (text) text.textContent = xpInLevel + ' / ' + XP_PER_LEVEL + ' XP';

  const badge = document.getElementById('levelBadge');
  if (badge) badge.textContent = 'Niv. ' + level;

  const xpBar = fill?.parentElement;
  if (xpBar) xpBar.setAttribute('aria-valuenow', Math.round(pct));
}

// ── Mes SAÉ (saved SAÉs in localStorage) ──
const MES_SAE_KEY = 'mes-sae-generator';

function getMesSae() {
  try {
    return JSON.parse(localStorage.getItem(MES_SAE_KEY)) || [];
  } catch { return []; }
}

function setMesSae(list) {
  localStorage.setItem(MES_SAE_KEY, JSON.stringify(list));
  updateHeaderStats();
}

function renderMesSae() {
  const grid = document.getElementById('mes-sae-grid');
  const empty = document.getElementById('mesSaeEmpty');
  if (!grid) return;

  const mesSae = getMesSae();
  const searchVal = (document.getElementById('mes-sae-search')?.value || '').toLowerCase().trim();

  let filtered = mesSae;
  if (searchVal) {
    filtered = mesSae.filter(sae => {
      const haystack = [sae.titre, sae.description, sae.niveau, sae.moyen_action, sae.tags]
        .filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(searchVal);
    });
  }

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.style.display = mesSae.length === 0 ? '' : 'none';
    return;
  }

  if (empty) empty.style.display = 'none';

  let html = '';
  for (let i = 0; i < filtered.length; i++) {
    const sae = filtered[i];
    const titre = escapeHtml(sae.titre || 'Sans titre');
    const desc = escapeHtml(truncate(sae.description || '', 100));
    const icon = getSaeIcon(sae);
    const date = sae._savedAt ? new Date(sae._savedAt).toLocaleDateString('fr-CA') : '';

    html += '<div class="card" data-mes-sae-index="' + i + '">' +
      '<div class="card-badge">PERSO</div>' +
      '<div class="card-header">' +
        '<span class="card-icon">' + icon + '</span>' +
        '<h4 class="card-title">' + titre + '</h4>' +
      '</div>' +
      '<p class="card-desc">' + desc + '</p>' +
      (date ? '<div class="card-tags"><span class="card-tag">' + date + '</span></div>' : '') +
      '<div class="card-actions">' +
        '<button class="action-btn small" data-action="edit" data-idx="' + i + '">✏️</button>' +
        '<button class="action-btn small" data-action="delete" data-idx="' + i + '">🗑️</button>' +
        '<button class="action-btn small" data-action="export" data-idx="' + i + '">📤</button>' +
      '</div>' +
    '</div>';
  }

  grid.innerHTML = html;

  // Event delegation
  grid.onclick = function(e) {
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
      const action = actionBtn.dataset.action;
      const idx = parseInt(actionBtn.dataset.idx);
      const sae = filtered[idx];
      if (!sae) return;

      if (action === 'edit') {
        editMySae(sae);
      } else if (action === 'delete') {
        if (confirm(t('confirmDelete'))) {
          const all = getMesSae();
          const realIdx = all.findIndex(s => s._id === sae._id);
          if (realIdx >= 0) {
            all.splice(realIdx, 1);
            setMesSae(all);
            renderMesSae();
            showToast(t('saeDeleted'));
          }
        }
      } else if (action === 'export') {
        exportSingleSae(sae);
      }
      return;
    }

    // Click card to view
    const card = e.target.closest('.card');
    if (card) {
      const idx = parseInt(card.dataset.mesSaeIndex);
      const sae = filtered[idx];
      if (sae) openSaeModal(sae);
    }
  };

  // GSAP
  if (typeof gsap !== 'undefined') {
    gsap.fromTo(grid.querySelectorAll('.card'), { opacity: 0, y: 20 }, {
      opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: 'power2.out'
    });
  }
}

function editMySae(sae) {
  closeModal();
  switchTab('createur');
  currentEditId = sae._id;

  setTimeout(() => {
    const fields = {
      'cr-titre': sae.titre || '',
      'cr-intentions': extractText(sae.intentions || sae.intentions_pedagogiques || ''),
      'cr-niveau': sae.niveau || '',
      'cr-duree': sae.duree || '',
      'cr-competence': sae.competence || '',
      'cr-moyen': sae.moyen_action || '',
      'cr-espace': sae.espace || 'Gymnase',
      'cr-materiel': extractText(sae.materiel || ''),
      'cr-contexte': sae.contexte || sae.description || '',
      'cr-mise-en-train': extractText(sae.deroulement?.mise_en_train || sae.mise_en_train || ''),
      'cr-partie1': extractText(sae.deroulement?.partie_principale_1 || sae.partie_principale_1 || ''),
      'cr-partie2': extractText(sae.deroulement?.partie_principale_2 || sae.partie_principale_2 || ''),
      'cr-retour': extractText(sae.deroulement?.retour_au_calme || sae.retour_au_calme || ''),
      'cr-criteres': extractText(sae.evaluation?.criteres || sae.criteres || ''),
      'cr-grille-tb': extractText(sae.evaluation?.grille?.tres_bien || ''),
      'cr-grille-b': extractText(sae.evaluation?.grille?.bien || ''),
      'cr-grille-ed': extractText(sae.evaluation?.grille?.en_developpement || ''),
      'cr-adaptations': extractText(sae.adaptations || ''),
      'cr-variantes': extractText(sae.variantes || ''),
      'cr-valeurs': extractText(sae.valeurs || ''),
      'cr-tags': Array.isArray(sae.tags) ? sae.tags.join(', ') : (sae.tags || ''),
    };

    for (const [id, val] of Object.entries(fields)) {
      const el = document.getElementById(id);
      if (el) el.value = String(val);
    }
  }, 200);
}

function exportSingleSae(sae) {
  const blob = new Blob([JSON.stringify(sae, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (sae.titre || 'sae').replace(/[^a-zA-Z0-9àâéèêëïîôùûüÿçÀÂÉÈÊËÏÎÔÙÛÜŸÇ _-]/g, '') + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Slot reel init helper (basic — full implementation in Part 2)
function initSlotReel() {
  const reel = document.getElementById('slotReel');
  if (!reel || reel.children.length > 0) return;
  const emojis = ['⚽', '🏀', '🏈', '🎾', '🏐', '🥏', '🏸', '🎯', '🤸', '💪', '🏃', '🤝'];
  let html = '';
  for (const emoji of emojis) {
    html += '<div class="slot-item">' + emoji + '</div>';
  }
  reel.innerHTML = html;
}

// === CONTINUED IN PART 2 ===


// ============================================================
//  PART 2 OF 2 — Sections 9-14
// ============================================================


// ============================================================
//  SECTION 9: SAÉ CREATOR — Form + Live Preview + File Upload
// ============================================================

function setupCreatorForm() {
  // Live preview on all form fields
  const formFieldIds = [
    'cr-titre', 'cr-intentions', 'cr-niveau', 'cr-duree', 'cr-duree-periode',
    'cr-competence', 'cr-moyen', 'cr-espace', 'cr-materiel',
    'cr-contexte', 'cr-mise-en-train', 'cr-partie1', 'cr-partie2', 'cr-retour',
    'cr-criteres-custom', 'cr-grille-tb', 'cr-grille-b', 'cr-grille-ed',
    'cr-adaptations', 'cr-variantes', 'cr-valeurs', 'cr-tags'
  ];

  for (const id of formFieldIds) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateLivePreview);
    }
  }

  // Eval checkboxes -> live preview
  document.querySelectorAll('.eval-cb').forEach(function(cb) {
    cb.addEventListener('change', updateLivePreview);
  });

  // Template selector
  const templateSelect = document.getElementById('templateSelect');
  if (templateSelect) {
    populateTemplateDropdown(templateSelect);
    templateSelect.addEventListener('change', function() {
      const val = templateSelect.value;
      if (val) {
        loadTemplate(val);
      }
    });
  }

  // File upload setup
  setupFileUpload();

  // Save button
  const btnSave = document.getElementById('btnSaveSae');
  if (btnSave) {
    btnSave.addEventListener('click', function() {
      const sae = collectFormData();
      if (!sae.titre || sae.titre.trim() === '') {
        showToast('Veuillez entrer un titre');
        return;
      }
      saveSaeToDB(sae);
    });
  }

  // Reset button
  const btnReset = document.getElementById('btnResetForm');
  if (btnReset) {
    btnReset.addEventListener('click', resetCreatorForm);
  }

  // Preview button
  const btnPreview = document.getElementById('btnPreviewSae');
  if (btnPreview) {
    btnPreview.addEventListener('click', function() {
      updateLivePreview();
      const preview = document.getElementById('creatorPreview');
      if (preview) preview.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Export all button
  const btnExportAll = document.getElementById('btnExportAll');
  if (btnExportAll) {
    btnExportAll.addEventListener('click', exportAllSaes);
  }

  // Import button
  const btnImport = document.getElementById('btnImportSae');
  if (btnImport) {
    btnImport.addEventListener('click', function() {
      const importInput = document.getElementById('importInput');
      if (importInput) importInput.click();
    });
  }
  const importInput = document.getElementById('importInput');
  if (importInput) {
    importInput.addEventListener('change', function() {
      if (importInput.files && importInput.files[0]) {
        importSaes(importInput.files[0]);
        importInput.value = '';
      }
    });
  }

  // Initial preview state
  updateLivePreview();
}

function populateTemplateDropdown(select) {
  // Clear existing options except the first (placeholder)
  while (select.options.length > 1) {
    select.remove(1);
  }

  // Add first 50 SAÉ titles as templates
  const count = Math.min(allSAE.length, 50);
  for (let i = 0; i < count; i++) {
    const sae = allSAE[i];
    const titre = sae.titre || sae.nom || 'Sans titre';
    const opt = document.createElement('option');
    opt.value = getSaeId(sae);
    opt.textContent = truncate(titre, 60);
    select.appendChild(opt);
  }
}

function updateLivePreview() {
  const previewContent = document.getElementById('previewContent');
  if (!previewContent) return;

  const titre = document.getElementById('cr-titre')?.value || '';
  const intentions = document.getElementById('cr-intentions')?.value || '';
  const niveau = document.getElementById('cr-niveau')?.value || '';
  const duree = document.getElementById('cr-duree')?.value || '';
  const dureePeriode = document.getElementById('cr-duree-periode')?.value || '';
  const competence = document.getElementById('cr-competence')?.value || '';
  const moyen = document.getElementById('cr-moyen')?.value || '';
  const espace = document.getElementById('cr-espace')?.value || '';
  const materiel = document.getElementById('cr-materiel')?.value || '';
  const contexte = document.getElementById('cr-contexte')?.value || '';
  const miseEnTrain = document.getElementById('cr-mise-en-train')?.value || '';
  const partie1 = document.getElementById('cr-partie1')?.value || '';
  const partie2 = document.getElementById('cr-partie2')?.value || '';
  const retour = document.getElementById('cr-retour')?.value || '';
  var criteresArr = [];
  document.querySelectorAll('.eval-cb:checked').forEach(function(cb) { criteresArr.push(cb.value); });
  var customCritVal = document.getElementById('cr-criteres-custom')?.value || '';
  if (customCritVal.trim()) customCritVal.split(',').forEach(function(c) { if (c.trim()) criteresArr.push(c.trim()); });
  const criteres = criteresArr.join(', ');
  const grilleTB = document.getElementById('cr-grille-tb')?.value || '';
  const grilleB = document.getElementById('cr-grille-b')?.value || '';
  const grilleED = document.getElementById('cr-grille-ed')?.value || '';
  const adaptations = document.getElementById('cr-adaptations')?.value || '';
  const variantes = document.getElementById('cr-variantes')?.value || '';
  const valeurs = document.getElementById('cr-valeurs')?.value || '';
  const tags = document.getElementById('cr-tags')?.value || '';

  // Check if anything is filled
  if (!titre && !contexte && !miseEnTrain && !partie1) {
    previewContent.innerHTML = '<p class="preview-empty">' + t('previewEmpty') + '</p>';
    return;
  }

  let html = '';

  // Title
  if (titre) {
    html += '<h3 class="preview-title">' + escapeHtml(titre) + '</h3>';
  }

  // Meta badges
  const badges = [];
  if (niveau) badges.push(escapeHtml(niveau));
  if (duree) badges.push(escapeHtml(duree) + (dureePeriode ? ' x ' + escapeHtml(dureePeriode) + ' min' : ''));
  if (competence) badges.push(escapeHtml(competence));
  if (moyen) badges.push(escapeHtml(moyen));
  if (espace) badges.push(escapeHtml(espace));
  if (badges.length > 0) {
    html += '<div class="preview-meta">' +
      badges.map(function(b) { return '<span class="meta-badge">' + b + '</span>'; }).join('') +
    '</div>';
  }

  // Intentions
  if (intentions) {
    html += '<div class="preview-section"><h4>' + t('mIntentions') + '</h4><p>' + escapeHtml(intentions).replace(/\n/g, '<br>') + '</p></div>';
  }

  // Contexte
  if (contexte) {
    html += '<div class="preview-section"><h4>' + t('mContexte') + '</h4><p>' + escapeHtml(contexte).replace(/\n/g, '<br>') + '</p></div>';
  }

  // Déroulement phases
  if (miseEnTrain) {
    html += '<div class="preview-section"><h4>' + t('mMiseEnTrain') + '</h4><p>' + escapeHtml(miseEnTrain).replace(/\n/g, '<br>') + '</p></div>';
  }
  if (partie1) {
    html += '<div class="preview-section"><h4>' + t('mPartie1') + '</h4><p>' + escapeHtml(partie1).replace(/\n/g, '<br>') + '</p></div>';
  }
  if (partie2) {
    html += '<div class="preview-section"><h4>' + t('mPartie2') + '</h4><p>' + escapeHtml(partie2).replace(/\n/g, '<br>') + '</p></div>';
  }
  if (retour) {
    html += '<div class="preview-section"><h4>' + t('mRetour') + '</h4><p>' + escapeHtml(retour).replace(/\n/g, '<br>') + '</p></div>';
  }

  // Matériel
  if (materiel) {
    html += '<div class="preview-section"><h4>' + t('mMateriel') + '</h4><p>' + escapeHtml(materiel).replace(/\n/g, '<br>') + '</p></div>';
  }

  // Évaluation
  if (criteres || grilleTB || grilleB || grilleED) {
    html += '<div class="preview-section"><h4>' + t('mEvaluation') + '</h4>';
    if (criteres) html += '<p>' + escapeHtml(criteres).replace(/\n/g, '<br>') + '</p>';
    if (grilleTB) html += '<div class="eval-level"><strong>🟢 Très bien (A)</strong><p>' + escapeHtml(grilleTB).replace(/\n/g, '<br>') + '</p></div>';
    if (grilleB) html += '<div class="eval-level"><strong>🟡 Bien (B)</strong><p>' + escapeHtml(grilleB).replace(/\n/g, '<br>') + '</p></div>';
    if (grilleED) html += '<div class="eval-level"><strong>🟠 En développement (C)</strong><p>' + escapeHtml(grilleED).replace(/\n/g, '<br>') + '</p></div>';
    html += '</div>';
  }

  // Adaptations
  if (adaptations) {
    html += '<div class="preview-section"><h4>' + t('mAdaptations') + '</h4><p>' + escapeHtml(adaptations).replace(/\n/g, '<br>') + '</p></div>';
  }

  // Variantes
  if (variantes) {
    html += '<div class="preview-section"><h4>' + t('mVariantes') + '</h4><p>' + escapeHtml(variantes).replace(/\n/g, '<br>') + '</p></div>';
  }

  // Valeurs
  if (valeurs) {
    html += '<div class="preview-section"><h4>' + t('mValeurs') + '</h4><p>' + escapeHtml(valeurs).replace(/\n/g, '<br>') + '</p></div>';
  }

  // Tags
  if (tags) {
    const tagList = tags.split(',').map(function(tag) { return tag.trim(); }).filter(Boolean);
    html += '<div class="preview-section"><div class="preview-tags">' +
      tagList.map(function(tag) { return '<span class="card-tag">' + escapeHtml(tag) + '</span>'; }).join(' ') +
    '</div></div>';
  }

  // Uploaded files
  if (uploadedFiles.length > 0) {
    html += '<div class="preview-section"><h4>' + t('formFilesTitle') + '</h4>';
    html += '<p>' + uploadedFiles.length + ' fichier(s) joint(s)</p></div>';
  }

  previewContent.innerHTML = html;
}

function loadTemplate(saeId) {
  const sae = allSAE.find(function(s) { return getSaeId(s) === saeId; });
  if (!sae) return;

  const d = sae.deroulement || sae.déroulement || {};
  const ev = sae.evaluation || sae.évaluation || {};

  const fields = {
    'cr-titre': sae.titre || '',
    'cr-intentions': extractText(sae.intentions || sae.intentions_pedagogiques || sae.objectifs || ''),
    'cr-niveau': sae.niveau || '',
    'cr-duree': sae.duree || '',
    'cr-duree-periode': sae.duree_par_periode || '',
    'cr-competence': sae.competence || sae.competence_pfeq || '',
    'cr-moyen': sae.moyen_action || '',
    'cr-espace': sae.espace || 'Gymnase',
    'cr-materiel': extractText(sae.materiel || ''),
    'cr-contexte': sae.contexte || sae.mise_en_contexte || sae.situation_depart || sae.description || '',
    'cr-criteres': extractText(ev.criteres || ev.critères || sae.criteres_evaluation || ''),
    'cr-adaptations': extractText(sae.adaptations || ''),
    'cr-variantes': extractText(sae.variantes || ''),
    'cr-valeurs': extractText(sae.valeurs || ''),
    'cr-tags': Array.isArray(sae.tags) ? sae.tags.join(', ') : (sae.tags || ''),
  };

  // Handle deroulement — both flat and nested
  if (typeof d === 'object' && !Array.isArray(d)) {
    fields['cr-mise-en-train'] = extractText(d.mise_en_train || d.echauffement || d.phase1 || d.preparation || '');
    fields['cr-partie1'] = extractText(d.partie_principale_1 || d.tache_complexe || d.developpement || d.partie_principale || d.phase2 || d.realisation || '');
    fields['cr-partie2'] = extractText(d.partie_principale_2 || d.reinvestissement || d.phase3 || d.integration || d.jeu || '');
    fields['cr-retour'] = extractText(d.retour_au_calme || d.retour || d.bilan || d.phase4 || '');
  } else if (typeof d === 'string') {
    fields['cr-mise-en-train'] = d;
  }

  // Flat deroulement fields
  if (!fields['cr-mise-en-train']) fields['cr-mise-en-train'] = extractText(sae.mise_en_train || sae.echauffement || '');
  if (!fields['cr-partie1']) fields['cr-partie1'] = extractText(sae.partie_principale_1 || sae.tache_complexe || sae.developpement || '');
  if (!fields['cr-partie2']) fields['cr-partie2'] = extractText(sae.partie_principale_2 || sae.reinvestissement || '');
  if (!fields['cr-retour']) fields['cr-retour'] = extractText(sae.retour_au_calme || sae.retour || sae.bilan || '');

  // Grille
  const grille = ev.grille || ev.niveaux || {};
  if (typeof grille === 'object' && !Array.isArray(grille)) {
    fields['cr-grille-tb'] = extractText(grille.tres_bien || grille.A || grille.excellent || '');
    fields['cr-grille-b'] = extractText(grille.bien || grille.B || grille.satisfaisant || '');
    fields['cr-grille-ed'] = extractText(grille.en_developpement || grille.C || grille.acceptable || '');
  }

  for (const [id, val] of Object.entries(fields)) {
    const el = document.getElementById(id);
    if (el) el.value = String(val);
  }

  currentEditId = null;
  showToast('Modèle chargé');
  updateLivePreview();
}

function collectFormData() {
  const titre = (document.getElementById('cr-titre')?.value || '').trim();
  const niveau = (document.getElementById('cr-niveau')?.value || '').trim();
  const tags = (document.getElementById('cr-tags')?.value || '').trim();

  // Determine cycle from niveau
  let cycle = '';
  const nivLower = niveau.toLowerCase();
  if (nivLower.includes('préscolaire') || nivLower.includes('maternelle')) cycle = 'Préscolaire';
  else if (nivLower.includes('1er')) cycle = '1er cycle';
  else if (nivLower.includes('2e')) cycle = '2e cycle';
  else if (nivLower.includes('3e')) cycle = '3e cycle';
  else if (nivLower.includes('secondaire')) cycle = 'Secondaire';

  return {
    id: currentEditId || ('user-' + Date.now()),
    _id: currentEditId || ('user-' + Date.now()),
    titre: titre,
    intentions_pedagogiques: (document.getElementById('cr-intentions')?.value || '').trim(),
    niveau: niveau,
    cycle: cycle,
    duree_periodes: (document.getElementById('cr-duree')?.value || '').trim(),
    duree_par_periode: (document.getElementById('cr-duree-periode')?.value || '').trim(),
    duree: (document.getElementById('cr-duree')?.value || '').trim(),
    competence_pfeq: (document.getElementById('cr-competence')?.value || '').trim(),
    competence: (document.getElementById('cr-competence')?.value || '').trim(),
    moyen_action: (document.getElementById('cr-moyen')?.value || '').trim(),
    espace: (document.getElementById('cr-espace')?.value || '').trim(),
    materiel: (document.getElementById('cr-materiel')?.value || '').trim(),
    situation_depart: (document.getElementById('cr-contexte')?.value || '').trim(),
    description: (document.getElementById('cr-contexte')?.value || '').trim(),
    contexte: (document.getElementById('cr-contexte')?.value || '').trim(),
    deroulement: {
      mise_en_train: (document.getElementById('cr-mise-en-train')?.value || '').trim(),
      partie_principale_1: (document.getElementById('cr-partie1')?.value || '').trim(),
      partie_principale_2: (document.getElementById('cr-partie2')?.value || '').trim(),
      retour_au_calme: (document.getElementById('cr-retour')?.value || '').trim()
    },
    criteres_evaluation: criteres,
    evaluation: {
      criteres: criteres,
      grille: {
        tres_bien: (document.getElementById('cr-grille-tb')?.value || '').trim(),
        bien: (document.getElementById('cr-grille-b')?.value || '').trim(),
        en_developpement: (document.getElementById('cr-grille-ed')?.value || '').trim()
      }
    },
    grille_evaluation: {
      tres_bien: (document.getElementById('cr-grille-tb')?.value || '').trim(),
      bien: (document.getElementById('cr-grille-b')?.value || '').trim(),
      en_developpement: (document.getElementById('cr-grille-ed')?.value || '').trim()
    },
    adaptations: (document.getElementById('cr-adaptations')?.value || '').trim(),
    variantes: (document.getElementById('cr-variantes')?.value || '').trim(),
    valeurs: (document.getElementById('cr-valeurs')?.value || '').trim(),
    tags: tags ? tags.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : [],
    fichiers: uploadedFiles.map(function(f) {
      return { name: f.name, type: f.type, size: f.size, data: f.data };
    }),
    created_at: new Date().toISOString(),
    modified_at: new Date().toISOString(),
    _source: 'user',
    _savedAt: new Date().toISOString()
  };
}

function resetCreatorForm() {
  const formFieldIds = [
    'cr-titre', 'cr-intentions', 'cr-niveau', 'cr-duree', 'cr-duree-periode',
    'cr-competence', 'cr-moyen', 'cr-espace', 'cr-materiel',
    'cr-contexte', 'cr-mise-en-train', 'cr-partie1', 'cr-partie2', 'cr-retour',
    'cr-criteres-custom', 'cr-grille-tb', 'cr-grille-b', 'cr-grille-ed',
    'cr-adaptations', 'cr-variantes', 'cr-valeurs', 'cr-tags'
  ];

  for (const id of formFieldIds) {
    const el = document.getElementById(id);
    if (el) el.value = '';
  }

  const templateSelect = document.getElementById('templateSelect');
  if (templateSelect) templateSelect.selectedIndex = 0;

  uploadedFiles = [];
  renderUploadedFiles();
  currentEditId = null;
  updateLivePreview();
}


// ── File Upload ──

function setupFileUpload() {
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  if (!uploadZone || !fileInput) return;

  // Click to browse
  uploadZone.addEventListener('click', function() {
    fileInput.click();
  });

  // Drag & drop
  uploadZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadZone.classList.add('drag-over');
  });

  uploadZone.addEventListener('dragleave', function(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadZone.classList.remove('drag-over');
  });

  uploadZone.addEventListener('drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadZone.classList.remove('drag-over');
    if (e.dataTransfer && e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  });

  // File input change
  fileInput.addEventListener('change', function() {
    if (fileInput.files) {
      processFiles(fileInput.files);
      fileInput.value = '';
    }
  });
}

function processFiles(fileList) {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];

    if (file.size > MAX_SIZE) {
      showToast('Fichier trop volumineux (max 5 Mo) : ' + file.name);
      continue;
    }

    var reader = new FileReader();
    reader.onload = (function(f) {
      return function(e) {
        uploadedFiles.push({
          name: f.name,
          type: f.type,
          size: f.size,
          data: e.target.result
        });
        renderUploadedFiles();
        updateLivePreview();
      };
    })(file);
    reader.readAsDataURL(file);
  }
}

function renderUploadedFiles() {
  const container = document.getElementById('uploadedFiles');
  if (!container) return;

  if (uploadedFiles.length === 0) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  for (let i = 0; i < uploadedFiles.length; i++) {
    var f = uploadedFiles[i];
    var icon = '📝';
    if (f.type && f.type.startsWith('image/')) icon = '📷';
    else if (f.type === 'application/pdf') icon = '📄';
    else if (f.type && (f.type.includes('word') || f.type.includes('docx'))) icon = '📝';

    var sizeStr = f.size < 1024 ? f.size + ' B'
      : f.size < 1024 * 1024 ? (f.size / 1024).toFixed(1) + ' KB'
      : (f.size / (1024 * 1024)).toFixed(1) + ' MB';

    var nameDisplay = f.name.length > 25 ? f.name.substring(0, 22) + '...' : f.name;

    html += '<div class="uploaded-file">';

    // Image thumbnail
    if (f.type && f.type.startsWith('image/') && f.data) {
      html += '<img class="file-thumb" src="' + f.data + '" alt="' + escapeHtml(f.name) + '">';
    } else {
      html += '<span class="file-icon">' + icon + '</span>';
    }

    html += '<span class="file-name" title="' + escapeHtml(f.name) + '">' + escapeHtml(nameDisplay) + '</span>';
    html += '<span class="file-size">' + sizeStr + '</span>';
    html += '<button class="file-remove" onclick="removeFile(' + i + ')" title="Supprimer">❌</button>';
    html += '</div>';
  }

  container.innerHTML = html;
}

window.removeFile = function(index) {
  uploadedFiles.splice(index, 1);
  renderUploadedFiles();
  updateLivePreview();
};


// ============================================================
//  SECTION 10: IndexedDB Storage
// ============================================================

var DB_NAME = 'ZTSSaeDB';
var DB_VERSION = 1;
var DB_STORE = 'mes_saes';

function openDB() {
  return new Promise(function(resolve, reject) {
    var request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = function(e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = function(e) {
      resolve(e.target.result);
    };

    request.onerror = function(e) {
      console.error('IndexedDB open error:', e.target.error);
      reject(e.target.error);
    };
  });
}

function saveSaeToDB(sae) {
  openDB().then(function(db) {
    var tx = db.transaction(DB_STORE, 'readwrite');
    var store = tx.objectStore(DB_STORE);
    store.put(sae);

    tx.oncomplete = function() {
      // Also save to localStorage for backward compatibility
      var mesSae = getMesSae();
      var existIdx = mesSae.findIndex(function(s) { return s._id === sae.id || s.id === sae.id; });
      if (existIdx >= 0) {
        mesSae[existIdx] = sae;
      } else {
        mesSae.push(sae);
      }
      setMesSae(mesSae);

      showToast(t('saeSaved'));
      addXP(10);
      updateHeaderStats();
      renderMesSae();
    };

    tx.onerror = function(e) {
      console.error('IndexedDB save error:', e.target.error);
      // Fallback to localStorage only
      var mesSae = getMesSae();
      var saeForLS = Object.assign({}, sae);
      // Remove heavy file data for localStorage (size limit)
      delete saeForLS.fichiers;
      var existIdx = mesSae.findIndex(function(s) { return s._id === sae.id || s.id === sae.id; });
      if (existIdx >= 0) {
        mesSae[existIdx] = saeForLS;
      } else {
        mesSae.push(saeForLS);
      }
      setMesSae(mesSae);
      showToast(t('saeSaved') + ' (localStorage)');
      addXP(10);
      updateHeaderStats();
      renderMesSae();
    };
  }).catch(function(err) {
    console.error('IndexedDB error, fallback to localStorage:', err);
    var mesSae = getMesSae();
    var saeForLS = Object.assign({}, sae);
    delete saeForLS.fichiers;
    mesSae.push(saeForLS);
    setMesSae(mesSae);
    showToast(t('saeSaved') + ' (localStorage)');
    addXP(10);
    updateHeaderStats();
    renderMesSae();
  });
}

function getAllSaesFromDB() {
  return openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(DB_STORE, 'readonly');
      var store = tx.objectStore(DB_STORE);
      var request = store.getAll();

      request.onsuccess = function() {
        resolve(request.result || []);
      };
      request.onerror = function(e) {
        console.error('IndexedDB getAll error:', e.target.error);
        reject(e.target.error);
      };
    });
  }).catch(function() {
    // Fallback: return localStorage data
    return getMesSae();
  });
}

function deleteSaeFromDB(id) {
  return openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(DB_STORE, 'readwrite');
      var store = tx.objectStore(DB_STORE);
      store.delete(id);

      tx.oncomplete = function() {
        // Also remove from localStorage
        var mesSae = getMesSae();
        var filtered = mesSae.filter(function(s) { return s.id !== id && s._id !== id; });
        setMesSae(filtered);
        resolve();
      };
      tx.onerror = function(e) {
        reject(e.target.error);
      };
    });
  }).catch(function() {
    // Fallback: just remove from localStorage
    var mesSae = getMesSae();
    var filtered = mesSae.filter(function(s) { return s.id !== id && s._id !== id; });
    setMesSae(filtered);
  });
}

function exportAllSaes() {
  getAllSaesFromDB().then(function(allSaved) {
    if (allSaved.length === 0) {
      // Try localStorage
      allSaved = getMesSae();
    }
    if (allSaved.length === 0) {
      showToast('Aucune SAÉ à exporter');
      return;
    }

    var dateStr = new Date().toISOString().split('T')[0];
    var blob = new Blob([JSON.stringify(allSaved, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'mes-sae-export-' + dateStr + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export terminé (' + allSaved.length + ' SAÉ)');
  });
}

function importSaes(jsonFile) {
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = JSON.parse(e.target.result);
      var saes = Array.isArray(data) ? data : [data];
      var count = 0;

      var mesSae = getMesSae();
      for (var i = 0; i < saes.length; i++) {
        var sae = saes[i];
        if (!sae.id) sae.id = 'imported-' + Date.now() + '-' + i;
        if (!sae._id) sae._id = sae.id;
        if (!sae._savedAt) sae._savedAt = new Date().toISOString();
        if (!sae._source) sae._source = 'imported';

        // Save to IndexedDB
        (function(s) {
          openDB().then(function(db) {
            var tx = db.transaction(DB_STORE, 'readwrite');
            tx.objectStore(DB_STORE).put(s);
          }).catch(function() { /* ignore */ });
        })(sae);

        // Save to localStorage
        var existIdx = mesSae.findIndex(function(s) { return s.id === sae.id; });
        var saeForLS = Object.assign({}, sae);
        delete saeForLS.fichiers; // don't bloat localStorage
        if (existIdx >= 0) {
          mesSae[existIdx] = saeForLS;
        } else {
          mesSae.push(saeForLS);
        }
        count++;
      }

      setMesSae(mesSae);
      renderMesSae();
      updateHeaderStats();
      showToast(count + ' SAÉ importée(s)');
      addXP(5);
    } catch (err) {
      console.error('Import error:', err);
      showToast('Erreur d\'import: fichier JSON invalide');
    }
  };
  reader.readAsText(jsonFile);
}


// ============================================================
//  SECTION 11: MES SAÉ Section (enhanced)
// ============================================================

// The main renderMesSae() is in Part 1 (Section 8).
// Here we add the loadForEdit function and enhance Mes SAÉ interactions.

function loadForEdit(sae) {
  closeModal();
  switchTab('createur');
  currentEditId = sae.id || sae._id;

  setTimeout(function() {
    var fields = {
      'cr-titre': sae.titre || '',
      'cr-intentions': extractText(sae.intentions_pedagogiques || sae.intentions || sae.objectifs || ''),
      'cr-niveau': sae.niveau || '',
      'cr-duree': sae.duree || sae.duree_periodes || '',
      'cr-duree-periode': sae.duree_par_periode || '',
      'cr-competence': sae.competence || sae.competence_pfeq || '',
      'cr-moyen': sae.moyen_action || '',
      'cr-espace': sae.espace || 'Gymnase',
      'cr-materiel': extractText(sae.materiel || ''),
      'cr-contexte': sae.contexte || sae.situation_depart || sae.description || '',
      'cr-mise-en-train': extractText(sae.deroulement?.mise_en_train || sae.mise_en_train || ''),
      'cr-partie1': extractText(sae.deroulement?.partie_principale_1 || sae.partie_principale_1 || ''),
      'cr-partie2': extractText(sae.deroulement?.partie_principale_2 || sae.partie_principale_2 || ''),
      'cr-retour': extractText(sae.deroulement?.retour_au_calme || sae.retour_au_calme || ''),
      'cr-criteres': extractText(sae.evaluation?.criteres || sae.criteres_evaluation || ''),
      'cr-grille-tb': extractText(sae.evaluation?.grille?.tres_bien || sae.grille_evaluation?.tres_bien || ''),
      'cr-grille-b': extractText(sae.evaluation?.grille?.bien || sae.grille_evaluation?.bien || ''),
      'cr-grille-ed': extractText(sae.evaluation?.grille?.en_developpement || sae.grille_evaluation?.en_developpement || ''),
      'cr-adaptations': extractText(sae.adaptations || ''),
      'cr-variantes': extractText(sae.variantes || ''),
      'cr-valeurs': extractText(sae.valeurs || ''),
      'cr-tags': Array.isArray(sae.tags) ? sae.tags.join(', ') : (sae.tags || '')
    };

    for (var id in fields) {
      var el = document.getElementById(id);
      if (el) el.value = String(fields[id]);
    }

    // Load files if any
    if (sae.fichiers && Array.isArray(sae.fichiers)) {
      uploadedFiles = sae.fichiers.slice();
      renderUploadedFiles();
    } else {
      uploadedFiles = [];
      renderUploadedFiles();
    }

    updateLivePreview();
    showToast('SAÉ chargée pour modification');
  }, 200);
}


// ============================================================
//  SECTION 12: SLOT MACHINE
// ============================================================

function setupSlotMachine() {
  var reel = document.getElementById('slotReel');
  if (!reel) return;

  // Populate reel with SAÉ titles (repeated for scroll effect)
  var html = '';
  var titles = allSAE.map(function(sae) { return sae.titre || 'SAÉ'; });
  // Repeat the list 3 times for seamless scroll
  for (var rep = 0; rep < 3; rep++) {
    for (var i = 0; i < titles.length; i++) {
      html += '<div class="slot-item">' + escapeHtml(truncate(titles[i], 40)) + '</div>';
    }
  }
  reel.innerHTML = html;

  var slotBtn = document.getElementById('slotBtn');
  if (slotBtn) {
    slotBtn.addEventListener('click', spinSlot);
  }
}

function spinSlot() {
  var slotBtn = document.getElementById('slotBtn');
  var reel = document.getElementById('slotReel');
  var result = document.getElementById('slotResult');
  if (!slotBtn || !reel || allSAE.length === 0) return;

  // Disable button during spin
  slotBtn.disabled = true;
  slotBtn.classList.add('spinning');
  if (result) result.innerHTML = '';

  // Pick random SAÉ
  var randomIdx = Math.floor(Math.random() * allSAE.length);
  var selectedSae = allSAE[randomIdx];

  // Calculate target position
  var itemHeight = 50; // approximate height of each slot-item
  var items = reel.querySelectorAll('.slot-item');
  if (items.length === 0) {
    slotBtn.disabled = false;
    slotBtn.classList.remove('spinning');
    return;
  }

  // Measure actual item height
  if (items[0]) {
    itemHeight = items[0].offsetHeight || 50;
  }

  // Target: scroll to the position of the selected item (in the second repetition for centered look)
  var targetIdx = allSAE.length + randomIdx;
  var targetY = -(targetIdx * itemHeight);

  // Reset position
  reel.style.transition = 'none';
  reel.style.transform = 'translateY(0)';

  // Force reflow
  reel.offsetHeight;

  // Animate with CSS transition
  reel.style.transition = 'transform 3.5s cubic-bezier(0.15, 0.85, 0.35, 1)';
  reel.style.transform = 'translateY(' + targetY + 'px)';

  // On complete
  setTimeout(function() {
    slotBtn.disabled = false;
    slotBtn.classList.remove('spinning');

    // Show result
    if (result && selectedSae) {
      var icon = getSaeIcon(selectedSae);
      var saeId = getSaeId(selectedSae);
      result.innerHTML =
        '<div class="slot-result-card glass">' +
          '<h3>' + icon + ' ' + escapeHtml(selectedSae.titre || 'SAÉ') + '</h3>' +
          '<div class="card-tags">' +
            (selectedSae.niveau ? '<span class="card-tag">' + escapeHtml(selectedSae.niveau) + '</span>' : '') +
            (selectedSae.moyen_action ? '<span class="card-tag">' + escapeHtml(selectedSae.moyen_action) + '</span>' : '') +
          '</div>' +
          '<p>' + escapeHtml(truncate(selectedSae.description || '', 150)) + '</p>' +
          '<button class="action-btn" onclick="openSaeModal(allSAE[' + randomIdx + '])">' + t('seeSae') + '</button>' +
        '</div>';

      // GSAP result animation
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(result.querySelector('.slot-result-card'),
          { opacity: 0, scale: 0.8, y: 20 },
          { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.5)' }
        );
      }
    }

    // Fire confetti
    if (typeof confetti !== 'undefined') {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#00d4ff', '#ffd700', '#ff6b6b', '#2ed573', '#a55eea']
      });
    }

    addXP(5);
  }, 3600);
}

// Make openSaeModal available globally for slot machine result button
window.openSaeModal = openSaeModal;


// ============================================================
//  SECTION 13: ÉDUCATIFS SECTION (Taxonomy browser)
// ============================================================

function renderEduTaxonomy() {
  var container = document.getElementById('eduTaxonomy');
  if (!container) return;

  renderEduLevel1(container);
}

function renderEduLevel1(container) {
  var html = '<h3 class="taxonomy-title">' + t('eduTaxTitle') + '</h3>';
  html += '<div class="taxonomy-grid">';

  for (var i = 0; i < MOYENS_ACTION.length; i++) {
    var cat = MOYENS_ACTION[i];
    var label = cat.labels[LANG.current] || cat.labels.fr;
    html += '<div class="taxonomy-card" data-cat-idx="' + i + '" style="--cat-color: ' + cat.color + '">' +
      '<span class="taxonomy-icon">' + cat.icon + '</span>' +
      '<h4>' + escapeHtml(label) + '</h4>' +
      '<span class="taxonomy-count">' + cat.items.length + ' sous-catégories</span>' +
    '</div>';
  }

  html += '</div>';
  container.innerHTML = html;

  // Animate with GSAP
  if (typeof gsap !== 'undefined') {
    gsap.fromTo(container.querySelectorAll('.taxonomy-card'),
      { opacity: 0, y: 30, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.08, ease: 'back.out(1.5)' }
    );
  }

  // Click handler
  container.onclick = function(e) {
    var card = e.target.closest('.taxonomy-card');
    if (card) {
      var catIdx = parseInt(card.dataset.catIdx);
      if (!isNaN(catIdx) && MOYENS_ACTION[catIdx]) {
        renderEduLevel2(container, MOYENS_ACTION[catIdx]);
      }
    }
  };
}

function renderEduLevel2(container, category) {
  var label = category.labels[LANG.current] || category.labels.fr;
  var html = '<button class="back-btn glass" id="eduBackL2">' + t('back') + '</button>';
  html += '<h3 class="taxonomy-title">' + category.icon + ' ' + escapeHtml(label) + '</h3>';
  html += '<div class="taxonomy-grid">';

  for (var i = 0; i < category.items.length; i++) {
    var item = category.items[i];
    var itemLabel = item.labels[LANG.current] || item.labels.fr;

    // Count matching SAÉ for this item
    var matchCount = allSAE.filter(function(sae) {
      var haystack = [sae.moyen_action, sae.titre, sae.categorie, sae.domaine, sae.tags]
        .filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(item.id.toLowerCase()) || haystack.includes(itemLabel.toLowerCase());
    }).length;

    html += '<div class="taxonomy-card" data-item-idx="' + i + '" style="--cat-color: ' + category.color + '">' +
      '<span class="taxonomy-icon">' + item.icon + '</span>' +
      '<h4>' + escapeHtml(itemLabel) + '</h4>' +
      '<span class="taxonomy-count">' + matchCount + ' SAÉ</span>' +
    '</div>';
  }

  html += '</div>';
  container.innerHTML = html;

  // Animate
  if (typeof gsap !== 'undefined') {
    gsap.fromTo(container.querySelectorAll('.taxonomy-card'),
      { opacity: 0, x: 50 },
      { opacity: 1, x: 0, duration: 0.3, stagger: 0.06, ease: 'power2.out' }
    );
  }

  // Back button
  var backBtn = document.getElementById('eduBackL2');
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      renderEduLevel1(container);
    });
  }

  // Click handler for items
  container.onclick = function(e) {
    if (e.target.closest('#eduBackL2')) return;
    var card = e.target.closest('.taxonomy-card');
    if (card) {
      var itemIdx = parseInt(card.dataset.itemIdx);
      if (!isNaN(itemIdx) && category.items[itemIdx]) {
        renderEduLevel3(container, category, category.items[itemIdx]);
      }
    }
  };
}

function renderEduLevel3(container, category, item) {
  var itemLabel = item.labels[LANG.current] || item.labels.fr;
  var catLabel = category.labels[LANG.current] || category.labels.fr;

  // Find matching SAÉs
  var matchingSae = allSAE.filter(function(sae) {
    var haystack = [sae.moyen_action, sae.titre, sae.categorie, sae.domaine, sae.tags, sae.description]
      .filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(item.id.toLowerCase()) || haystack.includes(itemLabel.toLowerCase());
  });

  var html = '<button class="back-btn glass" id="eduBackL3">' + t('back') + '</button>';
  html += '<h3 class="taxonomy-title">' + item.icon + ' ' + escapeHtml(itemLabel) + '</h3>';
  html += '<p class="taxonomy-subtitle">' + escapeHtml(catLabel) + ' → ' + escapeHtml(itemLabel) + ' — ' + matchingSae.length + ' SAÉ</p>';

  if (matchingSae.length === 0) {
    html += '<div class="no-results glass"><h3>' + t('noResults') + '</h3></div>';
  } else {
    html += '<div class="taxonomy-results">';
    var maxShow = Math.min(matchingSae.length, 20);
    for (var i = 0; i < maxShow; i++) {
      var sae = matchingSae[i];
      var icon = getSaeIcon(sae);
      html += '<div class="card taxonomy-result-card" data-sae-match-idx="' + i + '">' +
        '<div class="card-header">' +
          '<span class="card-icon">' + icon + '</span>' +
          '<h4 class="card-title">' + escapeHtml(sae.titre || 'Sans titre') + '</h4>' +
        '</div>' +
        '<p class="card-desc">' + escapeHtml(truncate(sae.description || '', 100)) + '</p>' +
        '<div class="card-tags">' +
          (sae.niveau ? '<span class="card-tag">' + escapeHtml(sae.niveau) + '</span>' : '') +
        '</div>' +
      '</div>';
    }
    if (matchingSae.length > maxShow) {
      html += '<p class="taxonomy-more">+ ' + (matchingSae.length - maxShow) + ' autres SAÉ</p>';
    }
    html += '</div>';
  }

  container.innerHTML = html;

  // Animate
  if (typeof gsap !== 'undefined') {
    gsap.fromTo(container.querySelectorAll('.taxonomy-result-card'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.3, stagger: 0.04, ease: 'power2.out' }
    );
  }

  // Back button
  var backBtn = document.getElementById('eduBackL3');
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      renderEduLevel2(container, category);
    });
  }

  // Click on result cards
  container.onclick = function(e) {
    if (e.target.closest('#eduBackL3')) return;
    var card = e.target.closest('.taxonomy-result-card');
    if (card) {
      var idx = parseInt(card.dataset.saeMatchIdx);
      if (!isNaN(idx) && matchingSae[idx]) {
        openSaeModal(matchingSae[idx]);
      }
    }
  };
}


// ============================================================
//  SECTION 14: MUSIQUE + GSAP BLOBS + MAGNETIC BUTTONS + PHYSICS
// ============================================================

// ── Musique Section ──

function renderMusique() {
  var container = document.getElementById('musique-content');
  if (!container) return;

  var html = '<div class="musique-guide glass">';

  // BPM Reference Table
  html += '<div class="musique-section">';
  html += '<h3>🎵 Guide BPM pour l\'ÉPS</h3>';
  html += '<table class="bpm-table">';
  html += '<thead><tr><th>Phase du cours</th><th>BPM recommandé</th><th>Genre musical</th></tr></thead>';
  html += '<tbody>';
  html += '<tr><td>🧘 Retour au calme</td><td>60-80 BPM</td><td>Ambient, Lo-fi, Classique</td></tr>';
  html += '<tr><td>📖 Consignes / Explication</td><td>80-100 BPM</td><td>Instrumental calme, Acoustic</td></tr>';
  html += '<tr><td>🏃 Échauffement</td><td>100-120 BPM</td><td>Pop, Indie, Funk léger</td></tr>';
  html += '<tr><td>⚡ Activité principale</td><td>120-140 BPM</td><td>Pop dynamique, Hip-Hop, Rock</td></tr>';
  html += '<tr><td>🔥 Haute intensité</td><td>140-170 BPM</td><td>EDM, Drum & Bass, Techno</td></tr>';
  html += '<tr><td>🎉 Célébration / Victoire</td><td>120-140 BPM</td><td>Party, Épique, Upbeat</td></tr>';
  html += '</tbody></table>';
  html += '</div>';

  // Free Music Sources
  html += '<div class="musique-section">';
  html += '<h3>🆓 Sources de musiques libres de droits</h3>';
  html += '<div class="musique-sources">';

  var sources = [
    { name: 'YouTube Audio Library', url: 'https://studio.youtube.com/channel/UC/music', desc: 'Gratuit, vaste choix, filtres par genre/humeur/BPM' },
    { name: 'Free Music Archive (FMA)', url: 'https://freemusicarchive.org/', desc: 'Archives musicales libres, Creative Commons' },
    { name: 'Pixabay Music', url: 'https://pixabay.com/music/', desc: 'Musiques 100% gratuites, aucune attribution requise' },
    { name: 'Incompetech (Kevin MacLeod)', url: 'https://incompetech.com/', desc: 'Classiques libres de droits, très utilisées en éducation' },
    { name: 'Mixkit', url: 'https://mixkit.co/free-stock-music/', desc: 'Musiques gratuites, licence libre' },
    { name: 'ccMixter', url: 'http://ccmixter.org/', desc: 'Remixes et originaux sous Creative Commons' },
    { name: 'Bensound', url: 'https://www.bensound.com/', desc: 'Musiques originales, licence gratuite avec attribution' },
    { name: 'SoundCloud (CC)', url: 'https://soundcloud.com/search/sounds?filter.license=to_share', desc: 'Filtrer par licence Creative Commons' }
  ];

  for (var i = 0; i < sources.length; i++) {
    var src = sources[i];
    html += '<a href="' + escapeHtml(src.url) + '" target="_blank" rel="noopener" class="source-card glass">' +
      '<h4>' + escapeHtml(src.name) + '</h4>' +
      '<p>' + escapeHtml(src.desc) + '</p>' +
    '</a>';
  }

  html += '</div></div>';

  // Quick Genre Guide
  html += '<div class="musique-section">';
  html += '<h3>🎶 Guide rapide des genres pour l\'ÉPS</h3>';
  html += '<div class="genre-grid">';

  var genres = [
    { icon: '🧘', name: 'Ambient / Lo-fi', use: 'Retour au calme, étirements, yoga' },
    { icon: '🎹', name: 'Classique / Instrumental', use: 'Consignes, expression corporelle, danse créative' },
    { icon: '🎸', name: 'Pop / Rock', use: 'Échauffement, activités dynamiques' },
    { icon: '🥁', name: 'Hip-Hop / Funk', use: 'Danse, circuits d\'entraînement' },
    { icon: '🎧', name: 'EDM / Électro', use: 'Haute intensité, crossfit, intervalles' },
    { icon: '🌍', name: 'Musiques du monde', use: 'Jeux culturels, danses folkloriques' },
    { icon: '🎺', name: 'Fanfare / Épique', use: 'Cérémonies, célébrations, relais' },
    { icon: '🪘', name: 'Percussions', use: 'Rythme, coordination, signaux' }
  ];

  for (var g = 0; g < genres.length; g++) {
    var genre = genres[g];
    html += '<div class="genre-card glass">' +
      '<span class="genre-icon">' + genre.icon + '</span>' +
      '<h4>' + escapeHtml(genre.name) + '</h4>' +
      '<p>' + escapeHtml(genre.use) + '</p>' +
    '</div>';
  }

  html += '</div></div>';
  html += '</div>';

  container.innerHTML = html;

  // GSAP animation
  if (typeof gsap !== 'undefined') {
    gsap.fromTo(container.querySelectorAll('.musique-section'),
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.15, ease: 'power2.out' }
    );
  }
}


// ── GSAP Background Blobs ──

function initBlobCanvas() {
  if (typeof gsap === 'undefined') return;

  var canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  var mouseX = window.innerWidth / 2;
  var mouseY = window.innerHeight / 2;

  document.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  var blobs = [];
  var blobColors = ['rgba(0, 229, 255, 0.10)', 'rgba(255, 215, 0, 0.09)', 'rgba(76, 175, 80, 0.08)',
                    'rgba(255, 152, 0, 0.09)', 'rgba(0, 188, 212, 0.08)', 'rgba(139, 195, 74, 0.07)'];

  for (var i = 0; i < 6; i++) {
    blobs.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 100 + Math.random() * 200,
      color: blobColors[i % blobColors.length],
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      phase: Math.random() * Math.PI * 2
    });
  }

  // Animate blobs with GSAP ticker
  gsap.ticker.add(function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < blobs.length; i++) {
      var blob = blobs[i];

      // Slow movement
      blob.x += blob.vx;
      blob.y += blob.vy;
      blob.phase += 0.005;

      // Bounce off edges
      if (blob.x < -blob.radius) blob.x = canvas.width + blob.radius;
      if (blob.x > canvas.width + blob.radius) blob.x = -blob.radius;
      if (blob.y < -blob.radius) blob.y = canvas.height + blob.radius;
      if (blob.y > canvas.height + blob.radius) blob.y = -blob.radius;

      // Parallax: react slightly to mouse
      var parallaxX = (mouseX - canvas.width / 2) * 0.01 * (i % 3 === 0 ? 1 : -0.5);
      var parallaxY = (mouseY - canvas.height / 2) * 0.01 * (i % 2 === 0 ? 1 : -0.5);

      // Scale pulsation
      var scale = 1 + Math.sin(blob.phase) * 0.15;
      var drawRadius = blob.radius * scale;

      ctx.beginPath();
      ctx.arc(blob.x + parallaxX, blob.y + parallaxY, drawRadius, 0, Math.PI * 2);
      ctx.fillStyle = blob.color;
      ctx.fill();
    }
  });
}


// ── Magnetic Buttons ──

function initMagneticButtons() {
  if (typeof gsap === 'undefined') return;

  var buttons = document.querySelectorAll('.mag-btn');

  buttons.forEach(function(btn) {
    var rect, btnX, btnY;

    btn.addEventListener('mouseenter', function() {
      rect = btn.getBoundingClientRect();
      btnX = rect.left + rect.width / 2;
      btnY = rect.top + rect.height / 2;
    });

    btn.addEventListener('mousemove', function(e) {
      if (!rect) {
        rect = btn.getBoundingClientRect();
        btnX = rect.left + rect.width / 2;
        btnY = rect.top + rect.height / 2;
      }

      var dx = e.clientX - btnX;
      var dy = e.clientY - btnY;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 100) {
        var strength = (100 - dist) / 100;
        gsap.to(btn, {
          x: dx * strength * 0.3,
          y: dy * strength * 0.3,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    });

    btn.addEventListener('mouseleave', function() {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)'
      });
      rect = null;
    });
  });
}


// ── Physics Emojis (Matter.js) ──

function initPhysicsEmojis() {
  if (typeof Matter === 'undefined') return;

  var canvas = document.getElementById('physicsCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  var engine = Matter.Engine.create({ gravity: { x: 0, y: 0.3 } });
  var world = engine.world;

  var emojis = ['🏀', '⚽', '🎾', '🏸', '🏐', '🎯', '⚾', '🏒', '🥏', '🤸',
                '🏈', '🥅', '🏋️', '🤾', '⛹️', '🧗', '🏄', '🤿', '🚴', '🏊'];

  var bodies = [];
  var emojiMap = [];

  // Add emoji bodies
  var numBodies = Math.min(20, emojis.length);
  for (var i = 0; i < numBodies; i++) {
    var x = 50 + Math.random() * (canvas.width - 100);
    var y = -30 - Math.random() * 400;
    var body = Matter.Bodies.circle(x, y, 18, {
      restitution: 0.7,
      friction: 0.05,
      frictionAir: 0.01,
      density: 0.001
    });
    body._emoji = emojis[i % emojis.length];
    Matter.Composite.add(world, body);
    bodies.push(body);
    emojiMap.push(emojis[i % emojis.length]);
  }

  // Walls and floor
  var thickness = 60;
  var floor = Matter.Bodies.rectangle(canvas.width / 2, canvas.height + thickness / 2, canvas.width * 3, thickness, { isStatic: true });
  var ceiling = Matter.Bodies.rectangle(canvas.width / 2, -thickness / 2, canvas.width * 3, thickness, { isStatic: true });
  var wallL = Matter.Bodies.rectangle(-thickness / 2, canvas.height / 2, thickness, canvas.height * 3, { isStatic: true });
  var wallR = Matter.Bodies.rectangle(canvas.width + thickness / 2, canvas.height / 2, thickness, canvas.height * 3, { isStatic: true });
  Matter.Composite.add(world, [floor, ceiling, wallL, wallR]);

  // Mouse constraint for dragging
  var mouse = Matter.Mouse.create(canvas);
  var mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.2,
      render: { visible: false }
    }
  });
  Matter.Composite.add(world, mouseConstraint);

  // Resize handler
  window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    Matter.Body.setPosition(floor, { x: canvas.width / 2, y: canvas.height + thickness / 2 });
    Matter.Body.setPosition(wallR, { x: canvas.width + thickness / 2, y: canvas.height / 2 });
  });

  // Render loop
  function renderPhysics() {
    Matter.Engine.update(engine, 1000 / 60);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      ctx.save();
      ctx.translate(b.position.x, b.position.y);
      ctx.rotate(b.angle);
      ctx.font = '26px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.15;
      ctx.fillText(b._emoji, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(renderPhysics);
  }
  renderPhysics();
}


// ============================================================
//  FINAL: Event Listeners & Initialization of Part 2 features
// ============================================================

(function initPart2() {
  // Wait for DOM to be ready — if already loaded, run immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPart2Features);
  } else {
    // DOMContentLoaded already fired, but allSAE might not be loaded yet
    // Use a short delay to let Part 1 init complete
    setTimeout(initPart2Features, 500);
  }
})();

function initPart2Features() {
  // Setup creator form (with all listeners)
  setupCreatorForm();

  // Setup slot machine — wait for data to load
  var slotInterval = setInterval(function() {
    if (allSAE.length > 0) {
      clearInterval(slotInterval);
      setupSlotMachine();
      // Re-populate template dropdown now that data is available
      var templateSelect = document.getElementById('templateSelect');
      if (templateSelect) populateTemplateDropdown(templateSelect);
    }
  }, 500);

  // Clear interval after 15 seconds regardless
  setTimeout(function() { clearInterval(slotInterval); }, 15000);

  // Render éducatifs taxonomy when tab is shown
  var eduRendered = false;
  var origSwitchTab = switchTab;
  // We override switchTab to hook into tab changes for lazy rendering
  window._origSwitchTab = switchTab;
  window.switchTab = function(tabName) {
    window._origSwitchTab(tabName);

    if (tabName === 'educatifs' && !eduRendered && allSAE.length > 0) {
      eduRendered = true;
      renderEduTaxonomy();
    }
    if (tabName === 'musique') {
      renderMusique();
    }
  };

  // Init GSAP blobs (enhanced background)
  initBlobCanvas();

  // Init magnetic buttons
  initMagneticButtons();

  // Init physics emojis (delayed to allow Matter.js to load)
  setTimeout(function() {
    initPhysicsEmojis();
  }, 2000);

  // ── Global keyboard shortcuts ──
  document.addEventListener('keydown', function(e) {
    // Escape closes modal (already handled in Part 1, but ensuring it works)
    if (e.key === 'Escape') {
      closeModal();
    }
  });

  // ── Modal backdrop click (already handled in showModal, but extra safety) ──
  var modalBackdrop = document.getElementById('modalBackdrop');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', closeModal);
  }

  // ── Window resize handlers for canvases ──
  window.addEventListener('resize', function() {
    var bgCanvas = document.getElementById('bgCanvas');
    if (bgCanvas) {
      bgCanvas.width = window.innerWidth;
      bgCanvas.height = window.innerHeight;
    }
  });

  // ── Mes SAÉ search listener ──
  var mesSaeSearch = document.getElementById('mes-sae-search');
  if (mesSaeSearch) {
    mesSaeSearch.addEventListener('input', function() {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(renderMesSae, 300);
    });
  }

  // ── Print button in modal ──
  // (Already handled via window.printSae in Part 1)

  // ── Share button in modal ──
  // (Already handled via window.shareSae in Part 1)

  // ── Help modal (Comment ça marche?) ──
  var helpModal = document.getElementById('helpModal');
  var btnHelp = document.getElementById('btnHelp');
  var helpModalClose = document.getElementById('helpModalClose');
  if (btnHelp && helpModal) {
    btnHelp.addEventListener('click', function() {
      helpModal.style.display = 'flex';
    });
    helpModalClose.addEventListener('click', function() {
      helpModal.style.display = 'none';
    });
    helpModal.addEventListener('click', function(e) {
      if (e.target === helpModal) helpModal.style.display = 'none';
    });
  }

  // ── Collapsible form sections ──
  document.querySelectorAll('.form-section-toggle').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var targetId = btn.getAttribute('data-section');
      var body = document.getElementById(targetId);
      if (body) {
        var isOpen = body.classList.contains('active');
        body.classList.toggle('active', !isOpen);
        btn.classList.toggle('active', !isOpen);
      }
    });
  });

  // ── CRITÈRES PFEQ PAR COMPÉTENCE ──
  var CRITERES_PFEQ = {
    'Agir dans divers contextes de pratique d\'activités physiques': [
      'Exécution motrice (qualité des actions)',
      'Efficacité des actions motrices',
      'Enchaînement et fluidité des mouvements',
      'Ajustement des actions selon la situation',
      'Variété des actions motrices utilisées',
      'Application des principes d\'équilibre',
      'Coordination motrice',
      'Utilisation adéquate de l\'espace',
      'Application des règles de sécurité',
      'Planification de sa démarche'
    ],
    'Interagir dans divers contextes de pratique d\'activités physiques': [
      'Coopération avec les partenaires',
      'Communication motrice et verbale',
      'Élaboration de stratégies offensives',
      'Élaboration de stratégies défensives',
      'Application des stratégies planifiées',
      'Synchronisation des actions avec les pairs',
      'Adaptation aux actions des adversaires',
      'Respect des règles du jeu',
      'Esprit sportif et fairplay',
      'Rôles et responsabilités dans l\'équipe'
    ],
    'Adopter un mode de vie sain et actif': [
      'Pratique régulière d\'activités physiques',
      'Gestion de l\'effort physique',
      'Connaissance des effets de l\'activité sur le corps',
      'Application de règles d\'hygiène et sécurité',
      'Identification de ses forces et défis',
      'Choix d\'activités selon ses capacités',
      'Habitudes de vie saines et actives',
      'Éthique en activité physique',
      'Persévérance et engagement',
      'Auto-évaluation de ses habitudes'
    ],
    '': [
      'Exécution motrice',
      'Coordination',
      'Coopération',
      'Communication',
      'Stratégie',
      'Respect des règles',
      'Esprit sportif',
      'Effort et engagement',
      'Sécurité',
      'Autonomie'
    ]
  };

  // ── Render eval criteria based on competence ──
  function renderEvalCriteria() {
    var grid = document.getElementById('evalChecksGrid');
    if (!grid) return;
    var comp = document.getElementById('cr-competence')?.value || '';
    var criteres = CRITERES_PFEQ[comp] || CRITERES_PFEQ[''];
    grid.innerHTML = '';
    criteres.forEach(function(c) {
      var label = document.createElement('label');
      label.className = 'eval-check';
      label.innerHTML = '<input type="checkbox" class="eval-cb" value="' + c + '"> ' + c;
      grid.appendChild(label);
    });
    // Re-attach change listeners
    grid.querySelectorAll('.eval-cb').forEach(function(cb) {
      cb.addEventListener('change', updateLivePreview);
    });
  }

  // Listen for competence change -> update criteria
  var compSelect = document.getElementById('cr-competence');
  if (compSelect) {
    compSelect.addEventListener('change', renderEvalCriteria);
  }
  renderEvalCriteria(); // initial render

  // ── INTENTIONS PÉDAGOGIQUES PAR MOYEN D'ACTION (PFEQ) ──
  var INTENTIONS_PFEQ = {
    '': [
      'Développer sa motricité globale à travers des activités variées',
      'Améliorer sa condition physique par la pratique régulière',
      'Apprendre à coopérer avec ses pairs en contexte sportif',
      'Découvrir et respecter les règles du jeu',
      'Développer sa confiance en soi par le mouvement',
      'Adopter des comportements sécuritaires en activité physique'
    ],
    'Manipulation d\'objets': [
      'Développer la coordination œil-main par la manipulation de ballons',
      'Améliorer la précision des lancers et des réceptions',
      'Exécuter des passes variées (à deux mains, à une main, par-dessous)',
      'Contrôler un objet en mouvement (dribble, jonglerie)',
      'Adapter la force et la trajectoire selon la distance',
      'Manipuler différents objets (ballons, poches, anneaux, raquettes)',
      'Développer la latéralité par la manipulation bilatérale',
      'Enchaîner des actions motrices avec un objet (lancer-attraper-courir)'
    ],
    'Locomotion': [
      'Développer les actions locomotrices fondamentales (courir, sauter, ramper)',
      'Varier les déplacements selon l\'espace et les obstacles',
      'Améliorer l\'endurance cardiovasculaire par la course',
      'Enchaîner des sauts variés (en longueur, en hauteur, à cloche-pied)',
      'Se déplacer efficacement dans un parcours à obstacles',
      'Ajuster sa vitesse et sa direction selon la situation',
      'Développer l\'agilité par des changements rapides de direction',
      'Explorer différentes formes de déplacements (galop, pas chassés, quadrupédie)'
    ],
    'Stabilisation': [
      'Maintenir son équilibre dans différentes positions (statique et dynamique)',
      'Développer la conscience corporelle et le schéma corporel',
      'Exécuter des rotations et des renversements de façon contrôlée',
      'Améliorer la souplesse par des exercices d\'étirement',
      'Développer le gainage et la force musculaire de base',
      'Réaliser des figures d\'équilibre seul et avec un partenaire',
      'Enchaîner des éléments gymniques simples avec fluidité',
      'Ajuster sa posture selon la tâche demandée'
    ],
    'Opposition': [
      'Développer des stratégies d\'attaque et de défense',
      'Respecter l\'adversaire et les règles du fairplay en duel',
      'Adapter ses actions en fonction des réactions de l\'adversaire',
      'Apprendre à gagner et à perdre avec esprit sportif',
      'Identifier les forces et les faiblesses de l\'adversaire',
      'Utiliser des feintes et des changements de rythme',
      'Maîtriser l\'espace de jeu en situation d\'opposition',
      'Développer la combativité dans le respect de l\'intégrité physique'
    ],
    'Coopération': [
      'Collaborer avec ses coéquipiers pour atteindre un objectif commun',
      'Communiquer efficacement pendant l\'activité (verbal et non-verbal)',
      'Élaborer et appliquer des stratégies collectives',
      'Assumer différents rôles au sein de l\'équipe',
      'Synchroniser ses actions avec celles de ses partenaires',
      'Résoudre des problèmes en équipe par l\'entraide',
      'Développer le sens des responsabilités envers le groupe',
      'Accepter les idées des autres et faire des compromis'
    ],
    'Expression corporelle': [
      'S\'exprimer par le mouvement et la gestuelle créative',
      'Créer une séquence de mouvements sur un thème donné',
      'Interpréter un rythme musical par le corps',
      'Développer la créativité et l\'originalité dans le mouvement',
      'Communiquer des émotions et des idées par la danse ou le mime',
      'Enchaîner des mouvements avec fluidité et expressivité',
      'Collaborer à la création d\'une chorégraphie collective',
      'Apprécier et respecter les prestations des autres'
    ]
  };

  function renderIntentions() {
    var sel = document.getElementById('cr-intentions-select');
    if (!sel) return;
    var moyen = document.getElementById('cr-moyen')?.value || '';
    var intentions = INTENTIONS_PFEQ[moyen] || INTENTIONS_PFEQ[''];
    var current = sel.value;
    sel.innerHTML = '<option value="">Choisir une intention...</option>';
    intentions.forEach(function(intent) {
      var opt = document.createElement('option');
      opt.value = intent;
      opt.textContent = intent;
      if (intent === current) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  // When moyen d'action changes -> update intentions
  var moyenSelect = document.getElementById('cr-moyen');
  if (moyenSelect) {
    moyenSelect.addEventListener('change', renderIntentions);
  }
  renderIntentions();

  // When intention selected -> fill textarea
  var intentionSelect = document.getElementById('cr-intentions-select');
  if (intentionSelect) {
    intentionSelect.addEventListener('change', function() {
      var textarea = document.getElementById('cr-intentions');
      if (textarea && intentionSelect.value) {
        textarea.value = intentionSelect.value;
        updateLivePreview();
      }
    });
  }

  // ── Render scale cards based on scale type ──
  var SCALES = {
    'abc': [
      { key: 'a', label: 'A — Excellent', icon: '⭐', color: '#4CAF50' },
      { key: 'b', label: 'B — Très bien', icon: '👍', color: '#8BC34A' },
      { key: 'c', label: 'C — Bien', icon: '👌', color: '#FFD700' },
      { key: 'd', label: 'D — En développement', icon: '📈', color: '#FF9800' },
      { key: 'e', label: 'E — Débutant', icon: '🌱', color: '#FF5722' }
    ],
    '12345': [
      { key: '5', label: '5 — Excellent', icon: '⭐', color: '#4CAF50' },
      { key: '4', label: '4 — Très bien', icon: '👍', color: '#8BC34A' },
      { key: '3', label: '3 — Bien', icon: '👌', color: '#FFD700' },
      { key: '2', label: '2 — En développement', icon: '📈', color: '#FF9800' },
      { key: '1', label: '1 — Débutant', icon: '🌱', color: '#FF5722' }
    ],
    'abc3': [
      { key: 'a', label: 'A — Très bien', icon: '⭐', color: '#4CAF50' },
      { key: 'b', label: 'B — Bien', icon: '👍', color: '#FFD700' },
      { key: 'c', label: 'C — En développement', icon: '📈', color: '#FF9800' }
    ]
  };

  function renderEvalScale() {
    var container = document.getElementById('evalScaleContainer');
    if (!container) return;
    var type = document.getElementById('cr-echelle-type')?.value || 'abc';
    var scale = SCALES[type] || SCALES['abc'];
    var html = '<div class="eval-scale-grid-dynamic">';
    scale.forEach(function(s) {
      html += '<div class="eval-scale-card-dyn" style="border-color:' + s.color + '30;background:' + s.color + '15">';
      html += '<div class="eval-scale-header-dyn" style="color:' + s.color + '">' + s.icon + ' ' + s.label + '</div>';
      html += '<textarea class="form-textarea eval-scale-input" id="cr-grille-' + s.key + '" rows="1" placeholder="Description..."></textarea>';
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  var echelleSelect = document.getElementById('cr-echelle-type');
  if (echelleSelect) {
    echelleSelect.addEventListener('change', renderEvalScale);
  }
  renderEvalScale(); // initial render

  // ── Collect eval data helper ──
  function collectEvalData() {
    var titre = document.getElementById('cr-titre').value || 'SAÉ sans titre';
    var niveau = document.getElementById('cr-niveau').value || '';
    var compText = document.getElementById('cr-competence')?.value || '';
    var criteres = [];
    document.querySelectorAll('.eval-cb:checked').forEach(function(cb) {
      criteres.push(cb.value);
    });
    var customCrit = document.getElementById('cr-criteres-custom');
    if (customCrit && customCrit.value.trim()) {
      customCrit.value.split(',').forEach(function(c) {
        if (c.trim()) criteres.push(c.trim());
      });
    }
    var nbEleves = parseInt(document.getElementById('cr-nb-eleves')?.value) || 30;
    var scaleType = document.getElementById('cr-echelle-type')?.value || 'abc';
    var scale = SCALES[scaleType] || SCALES['abc'];
    var scaleDescs = [];
    scale.forEach(function(s) {
      var el = document.getElementById('cr-grille-' + s.key);
      scaleDescs.push({ label: s.label, icon: s.icon, color: s.color, desc: el ? el.value : '' });
    });
    return { titre: titre, niveau: niveau, compText: compText, criteres: criteres, nbEleves: nbEleves, scaleDescs: scaleDescs };
  }

  // ── Build grid HTML ──
  function buildGridHTML(data, forPreview) {
    var html = '';
    if (!forPreview) {
      html += '<!DOCTYPE html><html><head><meta charset="UTF-8">';
      html += '<title>Grille d\'évaluation — ' + data.titre + '</title>';
      html += '<style>';
      html += 'body{font-family:Schoolbell,cursive;padding:24px;color:#222;font-size:11px}';
      html += 'h1{font-size:20px;margin-bottom:2px}';
      html += '.meta{font-size:13px;color:#555;margin-bottom:12px}';
      html += 'table{width:100%;border-collapse:collapse;margin-bottom:16px}';
      html += 'th,td{border:1.5px solid #333;padding:6px 8px;text-align:center}';
      html += 'th{background:#00ACC1;color:white;font-size:10px;font-weight:bold}';
      html += 'th.nom{text-align:left;width:180px;font-size:12px}';
      html += 'td.nom{text-align:left}';
      html += '.legend{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px}';
      html += '.legend-item{display:flex;align-items:center;gap:4px;font-size:12px}';
      html += '.legend-dot{width:14px;height:14px;border-radius:3px;display:inline-block}';
      html += '.footer{font-size:10px;color:#999;text-align:center;margin-top:12px}';
      html += '@media print{body{padding:10px}@page{size:landscape;margin:1cm}}';
      html += '</style></head><body>';
    }

    html += '<h1 style="' + (forPreview ? 'color:#fff;font-size:1.1rem;margin-bottom:4px' : '') + '">Grille d\'évaluation — ' + data.titre + '</h1>';
    html += '<div class="meta" style="' + (forPreview ? 'color:#aaa;font-size:0.85rem;margin-bottom:10px' : '') + '">' + data.niveau;
    if (data.compText) html += ' | ' + data.compText;
    html += '</div>';

    // Legend
    html += '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">';
    data.scaleDescs.forEach(function(s) {
      html += '<span style="display:inline-flex;align-items:center;gap:4px;font-size:' + (forPreview ? '0.75rem' : '12px') + ';' + (forPreview ? 'color:#ccc' : '') + '">';
      html += '<span style="width:12px;height:12px;border-radius:3px;display:inline-block;background:' + s.color + '"></span>';
      html += '<strong>' + s.label + '</strong>';
      if (s.desc) html += ' : ' + s.desc;
      html += '</span>';
    });
    html += '</div>';

    // Table
    var borderColor = forPreview ? '#555' : '#333';
    var thBg = forPreview ? '#00838F' : '#00ACC1';
    html += '<table style="width:100%;border-collapse:collapse;font-size:' + (forPreview ? '0.7rem' : '11px') + '">';
    html += '<tr><th style="background:' + thBg + ';color:white;border:1.5px solid ' + borderColor + ';padding:5px 6px;text-align:left;width:140px">Nom</th>';
    data.criteres.forEach(function(c) {
      html += '<th style="background:' + thBg + ';color:white;border:1.5px solid ' + borderColor + ';padding:5px 4px;font-size:' + (forPreview ? '0.65rem' : '9px') + '">' + c + '</th>';
    });
    html += '<th style="background:' + thBg + ';color:white;border:1.5px solid ' + borderColor + ';padding:5px 4px;width:45px">Note</th></tr>';

    var rowCount = forPreview ? Math.min(data.nbEleves, 5) : data.nbEleves;
    for (var i = 0; i < rowCount; i++) {
      html += '<tr><td style="border:1.5px solid ' + borderColor + ';padding:4px;height:20px;' + (forPreview ? 'background:rgba(255,255,255,0.03)' : '') + '"></td>';
      data.criteres.forEach(function() { html += '<td style="border:1.5px solid ' + borderColor + ';padding:4px"></td>'; });
      html += '<td style="border:1.5px solid ' + borderColor + ';padding:4px"></td></tr>';
    }
    if (forPreview && data.nbEleves > 5) {
      html += '<tr><td colspan="' + (data.criteres.length + 2) + '" style="text-align:center;color:#888;padding:6px;font-style:italic">... et ' + (data.nbEleves - 5) + ' autres élèves</td></tr>';
    }
    html += '</table>';

    if (!forPreview) {
      html += '<p class="footer">Zone Total Sport — generateur.zonetotalsport.ca</p>';
      html += '</body></html>';
    }
    return html;
  }

  // ── GENERATE button — show preview ──
  var btnGenEval = document.getElementById('btnGenEval');
  var btnPrintEval = document.getElementById('btnPrintEval');
  var evalPreview = document.getElementById('evalPreview');

  if (btnGenEval) {
    btnGenEval.addEventListener('click', function() {
      var data = collectEvalData();
      if (data.criteres.length === 0) {
        showToast('Cochez au moins un critère d\'évaluation!');
        return;
      }
      var previewHtml = buildGridHTML(data, true);
      evalPreview.innerHTML = previewHtml;
      evalPreview.style.display = 'block';
      btnPrintEval.style.display = '';
      showToast('Grille générée! Vous pouvez maintenant l\'imprimer.');
      evalPreview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  // ── PRINT button — open in new window and print ──
  if (btnPrintEval) {
    btnPrintEval.addEventListener('click', function() {
      var data = collectEvalData();
      if (data.criteres.length === 0) {
        showToast('Cochez au moins un critère d\'évaluation!');
        return;
      }
      var fullHtml = buildGridHTML(data, false);
      var printWin = window.open('', '_blank');
      printWin.document.write(fullHtml);
      printWin.document.close();
      printWin.focus();
      setTimeout(function() { printWin.print(); }, 300);
    });
  }
}
