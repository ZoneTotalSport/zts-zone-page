// ==========================================
// AGENDA SCOLAIRE EPS — Zone Total Sport
// ==========================================

// --- i18n TRANSLATIONS ---
var T = {
  fr: {
    appTitle:"AGENDA SCOLAIRE", tabMonthly:"MENSUEL", tabWeekly:"HEBDO", tabSequential:"SÉQUENTIEL", tabNotes:"NOTES",
    periods:"Périodes :", daySun:"DIM", dayMon:"LUN", dayTue:"MAR", dayWed:"MER", dayThu:"JEU", dayFri:"VEN", daySat:"SAM",
    weekNotes:"NOTES DE LA SEMAINE", weekNotesPlaceholder:"Tournois, rendez-vous, rappels...",
    seqTitle:"PLANIFICATION SÉQUENTIELLE", seqSub:"Crée tes séquences de cours en série!",
    seqCycle:"Cycle scolaire", seqNbCours:"Nombre de cours", seqTitre:"Titre de la séquence",
    seqTitrePh:"Ex: Basketball extrême...", seqObjBank:"BANQUE D'OBJECTIFS PFEQ",
    learns:"Apprend", masters:"Maîtrise", reuses:"Réutilise",
    cycle1:"1er Cycle (1re-2e)", cycle2:"2e Cycle (3e-4e)", cycle3:"3e Cycle (5e-6e)",
    myNotes:"MES NOTES", meetingNotes:"Notes de réunion / Générales", meetingNotesPh:"Notes de réunions, rappels importants...",
    footerTitle:"Agenda Scolaire EPS", footerRights:"Tous droits réservés.",
    specialNote:"Note spéciale", specialNotePh:"Ex: Journée pédagogique...", save:"ENREGISTRER",
    weekendNotePh:"Notes pour la fin de semaine...",
    addBlock:"Ajouter un bloc", group:"Groupe", groupName:"Nom du groupe", namePh:"Nom...",
    activity:"Activité", activityPh:"Ex: Ballon chasseur", add:"AJOUTER",
    seqMoyen:"Titre / Moyen d'action", date:"Date", specificObj:"Objectifs spécifiques",
    sequence:"Déroulement", list:"Liste", validateClose:"VALIDER & FERMER",
    weekN:"Sem. {n}", monthNames:["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"],
    dayNames:["Lundi","Mardi","Mercredi","Jeudi","Vendredi"],
    statusNormal:"Normal", statusConge:"Congé", statusPedago:"Pédago",
    addBtn:"+ Ajouter", courseN:"COURS {n}", editCourse:"ÉDITER LE COURS", titleGame:"Titre / Jeu",
    noObj:"Aucun objectif sélectionné.", confirmDelete:"Supprimer ce bloc?",
    importSuccess:"Importation réussie!", importError:"Erreur lors de l'importation.",
    confirmReset:"Effacer TOUTES les données de l'agenda?", editN:"Édition — Cours {n}",
    activityInput:"Activité...", libre:"Libre", autre:"Autre...",
    holidays:{'01-01':"Nouvel An",'02-14':"St-Valentin",'03-17':"St-Patrick",'04-01':"Poisson d'avril",'04-22':"Jour de la Terre",
      '06-24':"St-Jean-Baptiste",'07-01':"Fête du Canada",'10-31':"Halloween",'11-11':"Jour du Souvenir",'12-25':"Noël",
      '2025-04-20':"Pâques",'2025-04-21':"Lundi de Pâques",'2025-10-13':"Action de grâce",'2026-04-05':"Pâques",'2026-04-06':"Lundi de Pâques"},
    // PFEQ objectives
    c1Title:"C1: Agir", c2Title:"C2: Interagir", c3Title:"C3: Mode de vie sain",
    catKnowledge:"Connaissances", catSkills:"Savoir-faire", catStrategies:"Stratégies", catBeing:"Savoir-être", catHabits:"Habitudes",
    obj:{
      // C1 — Connaissances : le corps
      bodyParts:"Identifier les parties du corps",
      bodySegments:"Différencier segments et articulations",
      bodyAxes:"Reconnaître les axes du corps (vertical, horizontal)",
      bodyMuscles:"Identifier les principaux groupes musculaires",
      // C1 — Connaissances : l'espace
      bodySpace:"Situer son corps dans l'espace",
      spaceGeneral:"Distinguer espace personnel et espace général",
      levels:"Différencier les niveaux (haut, moyen, bas)",
      directions:"Différencier les directions (avant, arrière, côtés)",
      planes:"Reconnaître les plans (frontal, sagittal, horizontal)",
      trajectories:"Reconnaître les trajectoires (droite, courbe, zigzag)",
      distances:"Estimer les distances",
      // C1 — Connaissances : le temps
      speed:"Reconnaître la vitesse (lent, rapide)",
      rhythm:"Suivre un rythme régulier",
      duration:"Estimer une durée",
      simultaneity:"Coordonner des actions simultanées",
      succession:"Enchaîner des actions en succession",
      // C1 — Savoir-faire : actions de locomotion
      walkCrawl:"Marcher, ramper, gambader",
      runGallop:"Courir, galoper, sautiller",
      jumpVarious:"Sauter de différentes façons",
      jumpRope:"Sauter à la corde",
      climb:"Grimper",
      rollBody:"Rouler (avant, arrière, côté)",
      slide:"Glisser",
      swim:"Nager",
      skate:"Patiner",
      ski:"Skier",
      // C1 — Savoir-faire : actions de manipulation
      throwCatch:"Lancer et attraper",
      dribbleHand:"Dribbler avec la main",
      dribbleFoot:"Dribbler avec le pied",
      kick:"Botter (frapper du pied)",
      strikeHand:"Frapper avec la main",
      strikeImpl:"Frapper avec un instrument (bâton, raquette)",
      rollObject:"Faire rouler un objet",
      receive:"Recevoir un objet",
      pass:"Faire une passe",
      // C1 — Savoir-faire : actions de non-locomotion
      balance:"Maintenir l'équilibre statique",
      balanceDyn:"Maintenir l'équilibre dynamique",
      swing:"Se balancer",
      turn:"Tourner sur soi-même",
      suspend:"Se suspendre",
      carry:"Transporter un objet",
      stretchBody:"S'étirer",
      // C1 — Stratégies cognitives & psychomotrices
      analyzeTask:"Analyser la tâche à accomplir",
      planAction:"Planifier ses actions",
      regulate:"Réguler son action en cours",
      adjustResult:"Ajuster en fonction du résultat",
      anticipate:"Anticiper les conséquences",
      // C1 — Savoir-être
      persevere:"Persévérer dans l'effort",
      autonomy:"Faire preuve d'autonomie",
      riskMeasured:"Prendre des risques mesurés",
      selfConfidence:"Démontrer de la confiance en soi",
      // C2 — Connaissances : rôles & règles
      rolesGame:"Reconnaître les rôles (attaquant, défenseur)",
      rulesGame:"Comprendre les règles d'une activité",
      ethicsCode:"Appliquer un code d'éthique sportif",
      // C2 — Stratégies offensives
      attackGoal:"Attaquer le but / la cible adverse",
      getOpen:"Se démarquer",
      occupySpace:"Occuper les espaces libres",
      passSmart:"Passer à un partenaire démarqué",
      moveBall:"Faire progresser le ballon",
      // C2 — Stratégies défensives
      markOpp:"Marquer un adversaire",
      protectGoal:"Protéger son but / sa cible",
      protect:"Protéger son territoire",
      intercept:"Intercepter",
      recoverBall:"Récupérer le ballon",
      // C2 — Stratégies en duel
      feint:"Feinter",
      varyActions:"Varier ses actions",
      evade:"Esquiver",
      timingDuel:"Choisir le bon moment",
      // C2 — Savoir-être : coopération & respect
      communicate:"Communiquer avec ses partenaires",
      support:"Soutenir son équipe",
      encourage:"Encourager ses partenaires",
      helpPartner:"Aider son partenaire",
      respectRules:"Respecter les règles",
      respectOpp:"Respecter ses adversaires",
      respectOff:"Respecter les officiels",
      fairPlay:"Faire preuve d'esprit sportif",
      acceptLoss:"Accepter la défaite",
      acceptWin:"Accepter la victoire avec humilité",
      // C3 — Connaissances santé
      healthEffects:"Reconnaître les effets de l'activité physique sur la santé",
      benefits:"Nommer les bienfaits de l'activité physique",
      bodyChanges:"Reconnaître les changements corporels à l'effort",
      musclesRole:"Connaître le rôle des principaux groupes musculaires",
      // C3 — Habitudes vie saines
      hydrate:"S'hydrater",
      nutrition:"Adopter une saine alimentation",
      sleep:"Avoir un sommeil suffisant",
      hygiene:"Adopter de bonnes pratiques d'hygiène",
      screenTime:"Limiter le temps d'écran",
      activeTransport:"Privilégier le transport actif",
      // C3 — Sécurité
      safetyRules:"Respecter les règles de sécurité",
      safetyEquip:"Utiliser l'équipement de sécurité",
      safetyEnv:"Reconnaître les risques de l'environnement",
      clothing:"Adopter une tenue vestimentaire adéquate",
      // C3 — Préparation à l'effort
      warmUp:"S'échauffer correctement",
      coolDown:"Effectuer un retour au calme",
      stretchAfter:"S'étirer après l'effort",
      // C3 — Évaluer son effort
      heartRate:"Mesurer sa fréquence cardiaque",
      perceivedEffort:"Évaluer son effort perçu",
      breathRate:"Reconnaître sa fréquence respiratoire",
      selfCapacity:"Évaluer ses capacités physiques",
      // C3 — Engagement durable
      regularPractice:"Pratiquer une activité physique régulièrement",
      variedActivities:"Pratiquer des activités variées",
      planActivity:"Planifier ses activités physiques",
      personalGoals:"Se fixer des objectifs personnels",
      valueActivity:"Valoriser l'activité physique au quotidien"
    },
    // Presentation
    presTitle:"DÉCOUVREZ L'AGENDA SCOLAIRE EPS",
    presSub:"L'outil ultime pour les éducateurs physiques!",
    feat1Title:"Calendrier mensuel",feat1Desc:"Visualisez votre année scolaire d'un coup d'œil. Ajoutez des groupes, activités et notes pour chaque jour.",
    feat2Title:"Planificateur hebdomadaire",feat2Desc:"Organisez votre semaine période par période. Gérez les congés, journées pédagogiques et activités.",
    feat3Title:"Planification séquentielle",feat3Desc:"Créez des séquences de cours alignées avec le PFEQ. Objectifs, déroulement, tout y est!",
    feat4Title:"Notes & sauvegarde",feat4Desc:"Prenez des notes de réunion, exportez et importez vos données en un clic.",
    feat5Title:"4 langues",feat5Desc:"Disponible en français, anglais, mandarin et espagnol pour tous les éducateurs.",
    feat6Title:"100% gratuit",feat6Desc:"Aucun compte requis, aucun abonnement. Vos données restent sur votre appareil.",
    presStart:"COMMENCER MAINTENANT"
  },
  en: {
    appTitle:"SCHOOL AGENDA", tabMonthly:"MONTHLY", tabWeekly:"WEEKLY", tabSequential:"SEQUENTIAL", tabNotes:"NOTES",
    periods:"Periods:", daySun:"SUN", dayMon:"MON", dayTue:"TUE", dayWed:"WED", dayThu:"THU", dayFri:"FRI", daySat:"SAT",
    weekNotes:"WEEK NOTES", weekNotesPlaceholder:"Tournaments, appointments, reminders...",
    seqTitle:"SEQUENTIAL PLANNING", seqSub:"Create your lesson sequences in a series!",
    seqCycle:"School cycle", seqNbCours:"Number of lessons", seqTitre:"Sequence title",
    seqTitrePh:"Ex: Extreme Basketball...", seqObjBank:"PFEQ OBJECTIVES BANK",
    learns:"Learning", masters:"Mastery", reuses:"Reuse",
    cycle1:"Cycle 1 (Gr. 1-2)", cycle2:"Cycle 2 (Gr. 3-4)", cycle3:"Cycle 3 (Gr. 5-6)",
    myNotes:"MY NOTES", meetingNotes:"Meeting / General Notes", meetingNotesPh:"Meeting notes, important reminders...",
    footerTitle:"School Agenda PE", footerRights:"All rights reserved.",
    specialNote:"Special note", specialNotePh:"Ex: Professional development day...", save:"SAVE",
    weekendNotePh:"Weekend notes...",
    addBlock:"Add a block", group:"Group", groupName:"Group name", namePh:"Name...",
    activity:"Activity", activityPh:"Ex: Dodgeball", add:"ADD",
    seqMoyen:"Title / Action method", date:"Date", specificObj:"Specific objectives",
    sequence:"Lesson flow", list:"List", validateClose:"VALIDATE & CLOSE",
    weekN:"Wk. {n}", monthNames:["January","February","March","April","May","June","July","August","September","October","November","December"],
    dayNames:["Monday","Tuesday","Wednesday","Thursday","Friday"],
    statusNormal:"Normal", statusConge:"Day off", statusPedago:"PD Day",
    addBtn:"+ Add", courseN:"LESSON {n}", editCourse:"EDIT LESSON", titleGame:"Title / Game",
    noObj:"No objectives selected.", confirmDelete:"Delete this block?",
    importSuccess:"Import successful!", importError:"Error during import.",
    confirmReset:"Delete ALL agenda data?", editN:"Edit — Lesson {n}",
    activityInput:"Activity...", libre:"Free", autre:"Other...",
    holidays:{'01-01':"New Year",'02-14':"Valentine's Day",'03-17':"St. Patrick's",'04-01':"April Fools",'04-22':"Earth Day",
      '06-24':"St-Jean-Baptiste",'07-01':"Canada Day",'10-31':"Halloween",'11-11':"Remembrance Day",'12-25':"Christmas",
      '2025-04-20':"Easter",'2025-04-21':"Easter Monday",'2025-10-13':"Thanksgiving",'2026-04-05':"Easter",'2026-04-06':"Easter Monday"},
    c1Title:"C1: Act", c2Title:"C2: Interact", c3Title:"C3: Healthy lifestyle",
    catKnowledge:"Knowledge", catSkills:"Skills", catStrategies:"Strategies", catBeing:"Attitudes", catHabits:"Habits",
    obj:{
      bodyParts:"Identify body parts", bodySegments:"Differentiate segments and joints",
      bodyAxes:"Recognize body axes (vertical, horizontal)", bodyMuscles:"Identify main muscle groups",
      bodySpace:"Locate body in space", spaceGeneral:"Distinguish personal vs general space",
      levels:"Differentiate levels (high, mid, low)", directions:"Differentiate directions (front, back, sides)",
      planes:"Recognize planes (frontal, sagittal, horizontal)", trajectories:"Recognize trajectories (straight, curved, zigzag)",
      distances:"Estimate distances",
      speed:"Recognize speed (slow, fast)", rhythm:"Follow a steady rhythm",
      duration:"Estimate a duration", simultaneity:"Coordinate simultaneous actions",
      succession:"Sequence actions in succession",
      walkCrawl:"Walk, crawl, frolic", runGallop:"Run, gallop, skip",
      jumpVarious:"Jump in various ways", jumpRope:"Jump rope",
      climb:"Climb", rollBody:"Roll (forward, backward, side)",
      slide:"Slide", swim:"Swim", skate:"Skate", ski:"Ski",
      throwCatch:"Throw and catch", dribbleHand:"Dribble with hand",
      dribbleFoot:"Dribble with foot", kick:"Kick",
      strikeHand:"Strike with hand", strikeImpl:"Strike with an implement (stick, racquet)",
      rollObject:"Roll an object", receive:"Receive an object", pass:"Make a pass",
      balance:"Maintain static balance", balanceDyn:"Maintain dynamic balance",
      swing:"Swing", turn:"Turn on oneself", suspend:"Hang/suspend",
      carry:"Carry an object", stretchBody:"Stretch",
      analyzeTask:"Analyze the task", planAction:"Plan one's actions",
      regulate:"Regulate ongoing action", adjustResult:"Adjust based on result",
      anticipate:"Anticipate consequences",
      persevere:"Persevere through effort", autonomy:"Show autonomy",
      riskMeasured:"Take measured risks", selfConfidence:"Show self-confidence",
      rolesGame:"Recognize roles (attacker, defender)", rulesGame:"Understand activity rules",
      ethicsCode:"Apply a sportsmanship code",
      attackGoal:"Attack the opponent's goal/target", getOpen:"Get open",
      occupySpace:"Occupy free spaces", passSmart:"Pass to an open teammate",
      moveBall:"Advance the ball",
      markOpp:"Mark an opponent", protectGoal:"Protect own goal/target",
      protect:"Protect own territory", intercept:"Intercept", recoverBall:"Recover the ball",
      feint:"Feint", varyActions:"Vary actions", evade:"Evade",
      timingDuel:"Choose the right moment",
      communicate:"Communicate with partners", support:"Support teammates",
      encourage:"Encourage teammates", helpPartner:"Help partner",
      respectRules:"Respect the rules", respectOpp:"Respect opponents",
      respectOff:"Respect officials", fairPlay:"Show good sportsmanship",
      acceptLoss:"Accept defeat", acceptWin:"Accept victory humbly",
      healthEffects:"Recognize health effects of physical activity",
      benefits:"Name benefits of physical activity",
      bodyChanges:"Recognize body changes during effort",
      musclesRole:"Know the role of main muscle groups",
      hydrate:"Stay hydrated", nutrition:"Adopt healthy eating",
      sleep:"Get enough sleep", hygiene:"Practice good hygiene",
      screenTime:"Limit screen time", activeTransport:"Choose active transport",
      safetyRules:"Respect safety rules", safetyEquip:"Use safety equipment",
      safetyEnv:"Recognize environmental risks", clothing:"Wear appropriate clothing",
      warmUp:"Warm up properly", coolDown:"Perform cool-down",
      stretchAfter:"Stretch after effort",
      heartRate:"Measure heart rate", perceivedEffort:"Rate perceived effort",
      breathRate:"Recognize breathing rate", selfCapacity:"Assess physical capacities",
      regularPractice:"Practice regularly", variedActivities:"Practice varied activities",
      planActivity:"Plan physical activities", personalGoals:"Set personal goals",
      valueActivity:"Value daily physical activity"
    },
    presTitle:"DISCOVER THE PE SCHOOL AGENDA",
    presSub:"The ultimate tool for physical educators!",
    feat1Title:"Monthly calendar",feat1Desc:"View your entire school year at a glance. Add groups, activities and notes for each day.",
    feat2Title:"Weekly planner",feat2Desc:"Organize your week period by period. Manage holidays, PD days and activities.",
    feat3Title:"Sequential planning",feat3Desc:"Create lesson sequences aligned with PFEQ. Objectives, lesson flow, it's all there!",
    feat4Title:"Notes & backup",feat4Desc:"Take meeting notes, export and import your data with one click.",
    feat5Title:"4 languages",feat5Desc:"Available in French, English, Mandarin and Spanish for all educators.",
    feat6Title:"100% free",feat6Desc:"No account needed, no subscription. Your data stays on your device.",
    presStart:"START NOW"
  },
  zh: {
    appTitle:"学校日程表", tabMonthly:"月视图", tabWeekly:"周视图", tabSequential:"课程序列", tabNotes:"笔记",
    periods:"课时：", daySun:"日", dayMon:"一", dayTue:"二", dayWed:"三", dayThu:"四", dayFri:"五", daySat:"六",
    weekNotes:"本周笔记", weekNotesPlaceholder:"比赛、约会、提醒...",
    seqTitle:"课程序列规划", seqSub:"按顺序创建你的课程系列！",
    seqCycle:"学段", seqNbCours:"课程数量", seqTitre:"序列标题",
    seqTitrePh:"例：极限篮球...", seqObjBank:"PFEQ目标库",
    learns:"学习中", masters:"掌握中", reuses:"运用中",
    cycle1:"第一学段 (1-2年级)", cycle2:"第二学段 (3-4年级)", cycle3:"第三学段 (5-6年级)",
    myNotes:"我的笔记", meetingNotes:"会议/综合笔记", meetingNotesPh:"会议记录、重要提醒...",
    footerTitle:"学校体育日程表", footerRights:"版权所有。",
    specialNote:"特别备注", specialNotePh:"例：教师培训日...", save:"保存",
    weekendNotePh:"周末备注...",
    addBlock:"添加模块", group:"班级", groupName:"班级名称", namePh:"名称...",
    activity:"活动", activityPh:"例：躲避球", add:"添加",
    seqMoyen:"标题/教学手段", date:"日期", specificObj:"具体目标",
    sequence:"教学流程", list:"列表", validateClose:"确认并关闭",
    weekN:"第{n}周", monthNames:["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"],
    dayNames:["周一","周二","周三","周四","周五"],
    statusNormal:"正常", statusConge:"休息日", statusPedago:"培训日",
    addBtn:"+ 添加", courseN:"课程 {n}", editCourse:"编辑课程", titleGame:"标题/游戏",
    noObj:"未选择目标。", confirmDelete:"删除此模块？",
    importSuccess:"导入成功！", importError:"导入错误。",
    confirmReset:"清除所有日程数据？", editN:"编辑 — 课程 {n}",
    activityInput:"活动...", libre:"空闲", autre:"其他...",
    holidays:{'01-01':"元旦",'02-14':"情人节",'03-17':"圣帕特里克节",'04-01':"愚人节",'04-22':"地球日",
      '06-24':"圣让巴蒂斯特节",'07-01':"加拿大国庆",'10-31':"万圣节",'11-11':"阵亡将士纪念日",'12-25':"圣诞节",
      '2025-04-20':"复活节",'2025-04-21':"复活节周一",'2025-10-13':"感恩节",'2026-04-05':"复活节",'2026-04-06':"复活节周一"},
    c1Title:"C1：行动", c2Title:"C2：互动", c3Title:"C3：健康生活",
    catKnowledge:"知识", catSkills:"技能", catStrategies:"策略", catBeing:"态度", catHabits:"习惯",
    obj:{
      // C1 — Connaissances : le corps
      bodyParts:"Identifier les parties du corps",
      bodySegments:"Différencier segments et articulations",
      bodyAxes:"Reconnaître les axes du corps (vertical, horizontal)",
      bodyMuscles:"Identifier les principaux groupes musculaires",
      // C1 — Connaissances : l'espace
      bodySpace:"Situer son corps dans l'espace",
      spaceGeneral:"Distinguer espace personnel et espace général",
      levels:"Différencier les niveaux (haut, moyen, bas)",
      directions:"Différencier les directions (avant, arrière, côtés)",
      planes:"Reconnaître les plans (frontal, sagittal, horizontal)",
      trajectories:"Reconnaître les trajectoires (droite, courbe, zigzag)",
      distances:"Estimer les distances",
      // C1 — Connaissances : le temps
      speed:"Reconnaître la vitesse (lent, rapide)",
      rhythm:"Suivre un rythme régulier",
      duration:"Estimer une durée",
      simultaneity:"Coordonner des actions simultanées",
      succession:"Enchaîner des actions en succession",
      // C1 — Savoir-faire : actions de locomotion
      walkCrawl:"Marcher, ramper, gambader",
      runGallop:"Courir, galoper, sautiller",
      jumpVarious:"Sauter de différentes façons",
      jumpRope:"Sauter à la corde",
      climb:"Grimper",
      rollBody:"Rouler (avant, arrière, côté)",
      slide:"Glisser",
      swim:"Nager",
      skate:"Patiner",
      ski:"Skier",
      // C1 — Savoir-faire : actions de manipulation
      throwCatch:"Lancer et attraper",
      dribbleHand:"Dribbler avec la main",
      dribbleFoot:"Dribbler avec le pied",
      kick:"Botter (frapper du pied)",
      strikeHand:"Frapper avec la main",
      strikeImpl:"Frapper avec un instrument (bâton, raquette)",
      rollObject:"Faire rouler un objet",
      receive:"Recevoir un objet",
      pass:"Faire une passe",
      // C1 — Savoir-faire : actions de non-locomotion
      balance:"Maintenir l'équilibre statique",
      balanceDyn:"Maintenir l'équilibre dynamique",
      swing:"Se balancer",
      turn:"Tourner sur soi-même",
      suspend:"Se suspendre",
      carry:"Transporter un objet",
      stretchBody:"S'étirer",
      // C1 — Stratégies cognitives & psychomotrices
      analyzeTask:"Analyser la tâche à accomplir",
      planAction:"Planifier ses actions",
      regulate:"Réguler son action en cours",
      adjustResult:"Ajuster en fonction du résultat",
      anticipate:"Anticiper les conséquences",
      // C1 — Savoir-être
      persevere:"Persévérer dans l'effort",
      autonomy:"Faire preuve d'autonomie",
      riskMeasured:"Prendre des risques mesurés",
      selfConfidence:"Démontrer de la confiance en soi",
      // C2 — Connaissances : rôles & règles
      rolesGame:"Reconnaître les rôles (attaquant, défenseur)",
      rulesGame:"Comprendre les règles d'une activité",
      ethicsCode:"Appliquer un code d'éthique sportif",
      // C2 — Stratégies offensives
      attackGoal:"Attaquer le but / la cible adverse",
      getOpen:"Se démarquer",
      occupySpace:"Occuper les espaces libres",
      passSmart:"Passer à un partenaire démarqué",
      moveBall:"Faire progresser le ballon",
      // C2 — Stratégies défensives
      markOpp:"Marquer un adversaire",
      protectGoal:"Protéger son but / sa cible",
      protect:"Protéger son territoire",
      intercept:"Intercepter",
      recoverBall:"Récupérer le ballon",
      // C2 — Stratégies en duel
      feint:"Feinter",
      varyActions:"Varier ses actions",
      evade:"Esquiver",
      timingDuel:"Choisir le bon moment",
      // C2 — Savoir-être : coopération & respect
      communicate:"Communiquer avec ses partenaires",
      support:"Soutenir son équipe",
      encourage:"Encourager ses partenaires",
      helpPartner:"Aider son partenaire",
      respectRules:"Respecter les règles",
      respectOpp:"Respecter ses adversaires",
      respectOff:"Respecter les officiels",
      fairPlay:"Faire preuve d'esprit sportif",
      acceptLoss:"Accepter la défaite",
      acceptWin:"Accepter la victoire avec humilité",
      // C3 — Connaissances santé
      healthEffects:"Reconnaître les effets de l'activité physique sur la santé",
      benefits:"Nommer les bienfaits de l'activité physique",
      bodyChanges:"Reconnaître les changements corporels à l'effort",
      musclesRole:"Connaître le rôle des principaux groupes musculaires",
      // C3 — Habitudes vie saines
      hydrate:"S'hydrater",
      nutrition:"Adopter une saine alimentation",
      sleep:"Avoir un sommeil suffisant",
      hygiene:"Adopter de bonnes pratiques d'hygiène",
      screenTime:"Limiter le temps d'écran",
      activeTransport:"Privilégier le transport actif",
      // C3 — Sécurité
      safetyRules:"Respecter les règles de sécurité",
      safetyEquip:"Utiliser l'équipement de sécurité",
      safetyEnv:"Reconnaître les risques de l'environnement",
      clothing:"Adopter une tenue vestimentaire adéquate",
      // C3 — Préparation à l'effort
      warmUp:"S'échauffer correctement",
      coolDown:"Effectuer un retour au calme",
      stretchAfter:"S'étirer après l'effort",
      // C3 — Évaluer son effort
      heartRate:"Mesurer sa fréquence cardiaque",
      perceivedEffort:"Évaluer son effort perçu",
      breathRate:"Reconnaître sa fréquence respiratoire",
      selfCapacity:"Évaluer ses capacités physiques",
      // C3 — Engagement durable
      regularPractice:"Pratiquer une activité physique régulièrement",
      variedActivities:"Pratiquer des activités variées",
      planActivity:"Planifier ses activités physiques",
      personalGoals:"Se fixer des objectifs personnels",
      valueActivity:"Valoriser l'activité physique au quotidien"
    },
    presTitle:"探索学校体育日程表",
    presSub:"体育教育者的终极工具！",
    feat1Title:"月历视图",feat1Desc:"一览整个学年。为每一天添加班级、活动和备注。",
    feat2Title:"周计划表",feat2Desc:"按课时组织每周安排。管理假期、培训日和活动。",
    feat3Title:"课程序列规划",feat3Desc:"创建与PFEQ对齐的课程序列。目标、流程一应俱全！",
    feat4Title:"笔记与备份",feat4Desc:"记录会议笔记，一键导出和导入数据。",
    feat5Title:"四种语言",feat5Desc:"提供法语、英语、中文和西班牙语，服务全球教育者。",
    feat6Title:"完全免费",feat6Desc:"无需注册，无需订阅。数据保存在您的设备上。",
    presStart:"立即开始"
  },
  es: {
    appTitle:"AGENDA ESCOLAR", tabMonthly:"MENSUAL", tabWeekly:"SEMANAL", tabSequential:"SECUENCIAL", tabNotes:"NOTAS",
    periods:"Períodos:", daySun:"DOM", dayMon:"LUN", dayTue:"MAR", dayWed:"MIÉ", dayThu:"JUE", dayFri:"VIE", daySat:"SÁB",
    weekNotes:"NOTAS DE LA SEMANA", weekNotesPlaceholder:"Torneos, citas, recordatorios...",
    seqTitle:"PLANIFICACIÓN SECUENCIAL", seqSub:"¡Crea tus secuencias de clases en serie!",
    seqCycle:"Ciclo escolar", seqNbCours:"Número de clases", seqTitre:"Título de la secuencia",
    seqTitrePh:"Ej: Baloncesto extremo...", seqObjBank:"BANCO DE OBJETIVOS PFEQ",
    learns:"Aprende", masters:"Domina", reuses:"Reutiliza",
    cycle1:"1er Ciclo (1°-2°)", cycle2:"2° Ciclo (3°-4°)", cycle3:"3er Ciclo (5°-6°)",
    myNotes:"MIS NOTAS", meetingNotes:"Notas de reunión / Generales", meetingNotesPh:"Notas de reuniones, recordatorios importantes...",
    footerTitle:"Agenda Escolar EF", footerRights:"Todos los derechos reservados.",
    specialNote:"Nota especial", specialNotePh:"Ej: Día pedagógico...", save:"GUARDAR",
    weekendNotePh:"Notas del fin de semana...",
    addBlock:"Agregar un bloque", group:"Grupo", groupName:"Nombre del grupo", namePh:"Nombre...",
    activity:"Actividad", activityPh:"Ej: Quemados", add:"AGREGAR",
    seqMoyen:"Título / Medio de acción", date:"Fecha", specificObj:"Objetivos específicos",
    sequence:"Desarrollo", list:"Lista", validateClose:"VALIDAR Y CERRAR",
    weekN:"Sem. {n}", monthNames:["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
    dayNames:["Lunes","Martes","Miércoles","Jueves","Viernes"],
    statusNormal:"Normal", statusConge:"Feriado", statusPedago:"Pedagógico",
    addBtn:"+ Agregar", courseN:"CLASE {n}", editCourse:"EDITAR CLASE", titleGame:"Título / Juego",
    noObj:"Ningún objetivo seleccionado.", confirmDelete:"¿Eliminar este bloque?",
    importSuccess:"¡Importación exitosa!", importError:"Error durante la importación.",
    confirmReset:"¿Borrar TODOS los datos de la agenda?", editN:"Edición — Clase {n}",
    activityInput:"Actividad...", libre:"Libre", autre:"Otro...",
    holidays:{'01-01':"Año Nuevo",'02-14':"San Valentín",'03-17':"San Patricio",'04-01':"Día de los inocentes",'04-22':"Día de la Tierra",
      '06-24':"San Juan Bautista",'07-01':"Día de Canadá",'10-31':"Halloween",'11-11':"Día del Recuerdo",'12-25':"Navidad",
      '2025-04-20':"Pascua",'2025-04-21':"Lunes de Pascua",'2025-10-13':"Acción de Gracias",'2026-04-05':"Pascua",'2026-04-06':"Lunes de Pascua"},
    c1Title:"C1: Actuar", c2Title:"C2: Interactuar", c3Title:"C3: Estilo de vida saludable",
    catKnowledge:"Conocimientos", catSkills:"Habilidades", catStrategies:"Estrategias", catBeing:"Actitudes", catHabits:"Hábitos",
    obj:{
      // C1 — Connaissances : le corps
      bodyParts:"Identifier les parties du corps",
      bodySegments:"Différencier segments et articulations",
      bodyAxes:"Reconnaître les axes du corps (vertical, horizontal)",
      bodyMuscles:"Identifier les principaux groupes musculaires",
      // C1 — Connaissances : l'espace
      bodySpace:"Situer son corps dans l'espace",
      spaceGeneral:"Distinguer espace personnel et espace général",
      levels:"Différencier les niveaux (haut, moyen, bas)",
      directions:"Différencier les directions (avant, arrière, côtés)",
      planes:"Reconnaître les plans (frontal, sagittal, horizontal)",
      trajectories:"Reconnaître les trajectoires (droite, courbe, zigzag)",
      distances:"Estimer les distances",
      // C1 — Connaissances : le temps
      speed:"Reconnaître la vitesse (lent, rapide)",
      rhythm:"Suivre un rythme régulier",
      duration:"Estimer une durée",
      simultaneity:"Coordonner des actions simultanées",
      succession:"Enchaîner des actions en succession",
      // C1 — Savoir-faire : actions de locomotion
      walkCrawl:"Marcher, ramper, gambader",
      runGallop:"Courir, galoper, sautiller",
      jumpVarious:"Sauter de différentes façons",
      jumpRope:"Sauter à la corde",
      climb:"Grimper",
      rollBody:"Rouler (avant, arrière, côté)",
      slide:"Glisser",
      swim:"Nager",
      skate:"Patiner",
      ski:"Skier",
      // C1 — Savoir-faire : actions de manipulation
      throwCatch:"Lancer et attraper",
      dribbleHand:"Dribbler avec la main",
      dribbleFoot:"Dribbler avec le pied",
      kick:"Botter (frapper du pied)",
      strikeHand:"Frapper avec la main",
      strikeImpl:"Frapper avec un instrument (bâton, raquette)",
      rollObject:"Faire rouler un objet",
      receive:"Recevoir un objet",
      pass:"Faire une passe",
      // C1 — Savoir-faire : actions de non-locomotion
      balance:"Maintenir l'équilibre statique",
      balanceDyn:"Maintenir l'équilibre dynamique",
      swing:"Se balancer",
      turn:"Tourner sur soi-même",
      suspend:"Se suspendre",
      carry:"Transporter un objet",
      stretchBody:"S'étirer",
      // C1 — Stratégies cognitives & psychomotrices
      analyzeTask:"Analyser la tâche à accomplir",
      planAction:"Planifier ses actions",
      regulate:"Réguler son action en cours",
      adjustResult:"Ajuster en fonction du résultat",
      anticipate:"Anticiper les conséquences",
      // C1 — Savoir-être
      persevere:"Persévérer dans l'effort",
      autonomy:"Faire preuve d'autonomie",
      riskMeasured:"Prendre des risques mesurés",
      selfConfidence:"Démontrer de la confiance en soi",
      // C2 — Connaissances : rôles & règles
      rolesGame:"Reconnaître les rôles (attaquant, défenseur)",
      rulesGame:"Comprendre les règles d'une activité",
      ethicsCode:"Appliquer un code d'éthique sportif",
      // C2 — Stratégies offensives
      attackGoal:"Attaquer le but / la cible adverse",
      getOpen:"Se démarquer",
      occupySpace:"Occuper les espaces libres",
      passSmart:"Passer à un partenaire démarqué",
      moveBall:"Faire progresser le ballon",
      // C2 — Stratégies défensives
      markOpp:"Marquer un adversaire",
      protectGoal:"Protéger son but / sa cible",
      protect:"Protéger son territoire",
      intercept:"Intercepter",
      recoverBall:"Récupérer le ballon",
      // C2 — Stratégies en duel
      feint:"Feinter",
      varyActions:"Varier ses actions",
      evade:"Esquiver",
      timingDuel:"Choisir le bon moment",
      // C2 — Savoir-être : coopération & respect
      communicate:"Communiquer avec ses partenaires",
      support:"Soutenir son équipe",
      encourage:"Encourager ses partenaires",
      helpPartner:"Aider son partenaire",
      respectRules:"Respecter les règles",
      respectOpp:"Respecter ses adversaires",
      respectOff:"Respecter les officiels",
      fairPlay:"Faire preuve d'esprit sportif",
      acceptLoss:"Accepter la défaite",
      acceptWin:"Accepter la victoire avec humilité",
      // C3 — Connaissances santé
      healthEffects:"Reconnaître les effets de l'activité physique sur la santé",
      benefits:"Nommer les bienfaits de l'activité physique",
      bodyChanges:"Reconnaître les changements corporels à l'effort",
      musclesRole:"Connaître le rôle des principaux groupes musculaires",
      // C3 — Habitudes vie saines
      hydrate:"S'hydrater",
      nutrition:"Adopter une saine alimentation",
      sleep:"Avoir un sommeil suffisant",
      hygiene:"Adopter de bonnes pratiques d'hygiène",
      screenTime:"Limiter le temps d'écran",
      activeTransport:"Privilégier le transport actif",
      // C3 — Sécurité
      safetyRules:"Respecter les règles de sécurité",
      safetyEquip:"Utiliser l'équipement de sécurité",
      safetyEnv:"Reconnaître les risques de l'environnement",
      clothing:"Adopter une tenue vestimentaire adéquate",
      // C3 — Préparation à l'effort
      warmUp:"S'échauffer correctement",
      coolDown:"Effectuer un retour au calme",
      stretchAfter:"S'étirer après l'effort",
      // C3 — Évaluer son effort
      heartRate:"Mesurer sa fréquence cardiaque",
      perceivedEffort:"Évaluer son effort perçu",
      breathRate:"Reconnaître sa fréquence respiratoire",
      selfCapacity:"Évaluer ses capacités physiques",
      // C3 — Engagement durable
      regularPractice:"Pratiquer une activité physique régulièrement",
      variedActivities:"Pratiquer des activités variées",
      planActivity:"Planifier ses activités physiques",
      personalGoals:"Se fixer des objectifs personnels",
      valueActivity:"Valoriser l'activité physique au quotidien"
    },
    presTitle:"DESCUBRE EL AGENDA ESCOLAR DE EF",
    presSub:"¡La herramienta definitiva para educadores físicos!",
    feat1Title:"Calendario mensual",feat1Desc:"Visualiza tu año escolar de un vistazo. Agrega grupos, actividades y notas para cada día.",
    feat2Title:"Planificador semanal",feat2Desc:"Organiza tu semana período a período. Gestiona feriados, días pedagógicos y actividades.",
    feat3Title:"Planificación secuencial",feat3Desc:"Crea secuencias de clases alineadas con el PFEQ. ¡Objetivos, desarrollo, todo incluido!",
    feat4Title:"Notas y respaldo",feat4Desc:"Toma notas de reuniones, exporta e importa tus datos con un clic.",
    feat5Title:"4 idiomas",feat5Desc:"Disponible en francés, inglés, mandarín y español para todos los educadores.",
    feat6Title:"100% gratis",feat6Desc:"Sin cuenta, sin suscripción. Tus datos se quedan en tu dispositivo.",
    presStart:"EMPEZAR AHORA"
  }
};

var currentLang = localStorage.getItem('agenda_lang') || 'fr';

function t(key){ return T[currentLang][key] || T.fr[key] || key; }

function setLang(lang){
  currentLang = lang;
  localStorage.setItem('agenda_lang', lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
  // Update all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    var k = el.getAttribute('data-i18n');
    if(T[lang][k] !== undefined) el.textContent = T[lang][k];
  });
  // Update placeholders
  document.querySelectorAll('[data-i18n-ph]').forEach(function(el){
    var k = el.getAttribute('data-i18n-ph');
    if(T[lang][k] !== undefined) el.placeholder = T[lang][k];
  });
  // Update week select options
  var ws = document.getElementById('hebdo-week-select');
  for(var i=0;i<ws.options.length;i++){
    ws.options[i].textContent = t('weekN').replace('{n}', i+1);
  }
  // Update month select
  populateHebdoMonths();
  // Update lang buttons
  document.querySelectorAll('.lang-btn').forEach(function(b){
    b.classList.toggle('lang-active', b.textContent.trim() === ({fr:'FR',en:'EN',zh:'中文',es:'ES'})[lang]);
  });
  // Re-render dynamic content
  loadCalendar();
  renderHebdo();
  renderGlobalObjectives();
  generateGrid();
  renderPresentation();
}

// --- PRESENTATION ---
function renderPresentation(){
  var el = document.getElementById('presentation-section');
  if(!el) return;
  var feats = [
    {icon:'📅',tk:'feat1'},{icon:'🗓️',tk:'feat2'},{icon:'📝',tk:'feat3'},
    {icon:'💾',tk:'feat4'},{icon:'🌍',tk:'feat5'},{icon:'🎉',tk:'feat6'}
  ];
  var html = '<div class="pres-hero"><img src="img/bucheron-salut.png" alt="" class="pres-mascot"/>'+
    '<h2>'+t('presTitle')+'</h2><p class="pres-sub">'+t('presSub')+'</p></div><div class="pres-grid">';
  feats.forEach(function(f){
    html += '<div class="pres-card"><div class="pres-card-icon">'+f.icon+'</div>'+
      '<h3>'+t(f.tk+'Title')+'</h3><p>'+t(f.tk+'Desc')+'</p></div>';
  });
  html += '</div><div class="pres-cta"><button class="pres-start-btn" onclick="closePres()">'+t('presStart')+'</button></div>';
  el.innerHTML = html;
}

function closePres(){
  var el = document.getElementById('presentation-section');
  if(el){ el.style.display='none'; localStorage.setItem('agenda_pres_seen','1'); }
}

// --- DATA ---
var holidaysBase = {
  '01-01':{icon:"🎉",off:true},'02-14':{icon:"❤️"},'03-17':{icon:"☘️"},
  '04-01':{icon:"🐟"},'04-22':{icon:"🌍"},'06-24':{icon:"⚜️",off:true},
  '07-01':{icon:"🇨🇦",off:true},'10-31':{icon:"🎃"},'11-11':{icon:"🌺"},
  '12-25':{icon:"🎄",off:true},
  '2025-04-20':{icon:"🐰",off:true},'2025-04-21':{icon:"🐰",off:true},
  '2025-10-13':{icon:"🦃",off:true},
  '2026-04-05':{icon:"🐰",off:true},'2026-04-06':{icon:"🐰",off:true}
};

function getHoliday(key){
  var base = holidaysBase[key];
  if(!base) return null;
  var names = T[currentLang].holidays || T.fr.holidays;
  return {name: names[key]||key, icon: base.icon, off: base.off};
}

function generateGroups(){
  var g=[{id:'libre',name:t('libre'),color:'#555'},{id:'autre',name:t('autre'),color:'#888'}];
  var colors={0:'#FF924C',1:'#FF595E',2:'#8AC926',3:'#6A4C93',4:'#1982C4',5:'#FFCA3A',6:'#FF1744'};
  for(var grade=0;grade<=6;grade++){
    for(var i=1;i<=4;i++){
      var num=grade+'0'+i; var dn=grade===0?'00'+i:num;
      g.push({id:dn,name:'Gr. '+dn,color:colors[grade]||'#ccc'});
    }
    for(var i=1;i<=4;i++){
      var num=grade+'1'+i; var dn=grade===0?'01'+i:num;
      g.push({id:dn,name:'Gr. '+dn,color:colors[grade]||'#ccc'});
    }
  }
  return g;
}

var groups=generateGroups();
var periodsPerDay=parseInt(localStorage.getItem('agenda_periods')||'5');
var nav=0;
var clickedDate=null;
var events=JSON.parse(localStorage.getItem('agenda_events')||'{}');
var weeklyData=JSON.parse(localStorage.getItem('agenda_weekly')||'{}');
var currentHebdoKey=null;
var currentHebdoDayIndex=null;

// --- TABS ---
function switchTab(name){
  document.querySelectorAll('.view-section').forEach(function(s){s.classList.remove('view-active');});
  document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('tab-active');});
  document.getElementById('view-'+name).classList.add('view-active');
  document.querySelector('[data-tab="'+name+'"]').classList.add('tab-active');
  if(name==='hebdo') renderHebdo();
}

// --- INIT ---
document.getElementById('periodsCount').value=periodsPerDay;
var gNotes=localStorage.getItem('agenda_global_notes');
if(gNotes) document.getElementById('globalNotes').value=gNotes;

// --- CALENDAR ---
function loadCalendar(){
  var locale = currentLang==='zh'?'zh-CN':currentLang==='es'?'es-ES':currentLang==='en'?'en-CA':'fr-FR';
  var dt=new Date();
  if(nav!==0) dt.setMonth(new Date().getMonth()+nav);
  var month=dt.getMonth(), year=dt.getFullYear();
  var daysInMonth=new Date(year,month+1,0).getDate();
  var paddingDays=new Date(year,month,1).getDay();
  var mNames = t('monthNames');
  document.getElementById('monthDisplay').innerText=(mNames[month]+' '+year).toUpperCase();
  var cal=document.getElementById('calendarBody');
  cal.innerHTML='';
  for(var p=0;p<paddingDays;p++){
    var e=document.createElement('div'); e.className='cal-cell empty'; cal.appendChild(e);
  }
  var todayStr=new Date().toISOString().split('T')[0];
  for(var i=1;i<=daysInMonth;i++){
    var ds=year+'-'+String(month+1).padStart(2,'0')+'-'+String(i).padStart(2,'0');
    var dObj=new Date(ds+'T12:00:00');
    var dow=dObj.getDay();
    var isWE=(dow===0||dow===6);
    var cell=document.createElement('div');
    cell.className='cal-cell'+(isWE?' weekend':'')+(ds===todayStr?' today':'');
    var numDiv=document.createElement('div'); numDiv.className='cal-num'; numDiv.textContent=i;
    cell.appendChild(numDiv);
    var md=String(month+1).padStart(2,'0')+'-'+String(i).padStart(2,'0');
    var hol=getHoliday(md)||getHoliday(ds);
    if(hol){
      var hDiv=document.createElement('div'); hDiv.className='cal-holiday';
      hDiv.innerHTML='<div class="cal-holiday-icon">'+hol.icon+'</div><div class="cal-holiday-name">'+hol.name+'</div>';
      cell.appendChild(hDiv);
    }
    var ev=events[ds];
    if(ev){
      if(ev.note&&!isWE){
        var nDiv=document.createElement('div'); nDiv.className='cal-note'; nDiv.textContent=ev.note;
        cell.appendChild(nDiv);
      }
      if(isWE&&ev.weekendNote){
        var wDiv=document.createElement('div'); wDiv.className='cal-weekend-note'; wDiv.textContent=ev.weekendNote;
        cell.appendChild(wDiv);
      }
      if(!isWE&&ev.periods){
        var dotsDiv=document.createElement('div'); dotsDiv.className='cal-dots';
        ev.periods.forEach(function(pp){
          if(pp.groupId&&pp.groupId!=='libre'){
            var dot=document.createElement('div'); dot.className='cal-dot';
            var grp=groups.find(function(g){return g.id===pp.groupId;});
            dot.style.backgroundColor=grp?grp.color:'#ccc';
            dotsDiv.appendChild(dot);
          }
        });
        cell.appendChild(dotsDiv);
      }
    }
    (function(dateStr,weekend){
      cell.addEventListener('click',function(){
        if(weekend) openWeekendModal(dateStr); else openModal(dateStr);
      });
    })(ds,isWE);
    cal.appendChild(cell);
  }
}

function navMonth(dir){ nav+=dir; loadCalendar(); }
function changePeriodCount(){ periodsPerDay=parseInt(document.getElementById('periodsCount').value); localStorage.setItem('agenda_periods',periodsPerDay); loadCalendar(); }
function saveGlobalNotes(){ localStorage.setItem('agenda_global_notes',document.getElementById('globalNotes').value); }

// --- MODAL DAY ---
function openModal(ds){
  clickedDate=ds;
  var locale = currentLang==='zh'?'zh-CN':currentLang==='es'?'es-ES':currentLang==='en'?'en-CA':'fr-FR';
  var dObj=new Date(ds+'T12:00:00');
  document.getElementById('modalDateTitle').innerText=dObj.toLocaleDateString(locale,{weekday:'long',day:'numeric',month:'long'});
  var ev=events[clickedDate]||{note:'',periods:[]};
  document.getElementById('dayNote').value=ev.note||'';
  var pc=document.getElementById('periodsContainer'); pc.innerHTML='';
  groups = generateGroups(); // refresh group names
  for(var i=1;i<=periodsPerDay;i++){
    var pData=ev.periods?ev.periods.find(function(p){return p.id===i;}):null;
    var gId=pData?pData.groupId:'libre';
    var customG=pData?pData.customGroup:'';
    var act=pData?pData.activity:'';
    var row=document.createElement('div'); row.className='period-row';
    var lbl=document.createElement('div'); lbl.className='period-label'; lbl.textContent='P'+i;
    var sel=document.createElement('select'); sel.id='group-p'+i;
    groups.forEach(function(g){
      var opt=document.createElement('option'); opt.value=g.id; opt.textContent=g.name;
      if(g.id===gId) opt.selected=true; sel.appendChild(opt);
    });
    var custIn=document.createElement('input'); custIn.type='text'; custIn.id='custom-group-p'+i;
    custIn.placeholder=t('namePh'); custIn.value=customG; custIn.style.display=gId==='autre'?'block':'none';
    var actIn=document.createElement('input'); actIn.type='text'; actIn.id='act-p'+i;
    actIn.placeholder=t('activityInput'); actIn.value=act;
    sel.addEventListener('change',function(ci){return function(e){
      ci.style.display=e.target.value==='autre'?'block':'none';
      colorPeriodRow(e.target.closest('.period-row'),e.target.value);
    };}(custIn));
    row.appendChild(lbl); row.appendChild(sel); row.appendChild(custIn); row.appendChild(actIn);
    pc.appendChild(row);
    colorPeriodRow(row,gId);
  }
  document.getElementById('dayModal').classList.add('open');
}

function colorPeriodRow(row,gId){
  var grp=groups.find(function(g){return g.id===gId;});
  if(grp&&gId!=='libre'){
    row.style.borderLeft='4px solid '+grp.color;
    row.style.background='rgba('+hexToRgb(grp.color)+',0.08)';
  } else {
    row.style.borderLeft=''; row.style.background='';
  }
}

function hexToRgb(hex){
  hex=hex.replace('#','');
  if(hex.length===3) hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  var r=parseInt(hex.substring(0,2),16), g=parseInt(hex.substring(2,4),16), b=parseInt(hex.substring(4,6),16);
  return r+','+g+','+b;
}

function openWeekendModal(ds){
  clickedDate=ds;
  var locale = currentLang==='zh'?'zh-CN':currentLang==='es'?'es-ES':currentLang==='en'?'en-CA':'fr-FR';
  var dObj=new Date(ds+'T12:00:00');
  document.getElementById('weekendDateTitle').innerText=dObj.toLocaleDateString(locale,{weekday:'long',day:'numeric',month:'long'});
  document.getElementById('weekendNote').value=(events[clickedDate]||{}).weekendNote||'';
  document.getElementById('weekendModal').classList.add('open');
}

function closeModal(id){ document.getElementById(id).classList.remove('open'); clickedDate=null; }

function saveDay(){
  if(!clickedDate)return;
  var note=document.getElementById('dayNote').value;
  var pds=[];
  for(var i=1;i<=periodsPerDay;i++){
    var gId=document.getElementById('group-p'+i).value;
    var act=document.getElementById('act-p'+i).value;
    var cust=gId==='autre'?document.getElementById('custom-group-p'+i).value:'';
    if(gId!=='libre'||act.trim()) pds.push({id:i,groupId:gId,customGroup:cust,activity:act});
  }
  if(!note.trim()&&!pds.length) delete events[clickedDate];
  else events[clickedDate]={note:note,periods:pds};
  localStorage.setItem('agenda_events',JSON.stringify(events));
  closeModal('dayModal'); loadCalendar();
}

function saveWeekend(){
  if(!clickedDate)return;
  var txt=document.getElementById('weekendNote').value;
  if(!txt.trim()) delete events[clickedDate];
  else events[clickedDate]={weekendNote:txt};
  localStorage.setItem('agenda_events',JSON.stringify(events));
  closeModal('weekendModal'); loadCalendar();
}

// --- HEBDOMADAIRE ---
function populateHebdoMonths(){
  var hebdoMonthSel=document.getElementById('hebdo-month-select');
  var prevVal = hebdoMonthSel.value;
  hebdoMonthSel.innerHTML='';
  var mNames = t('monthNames');
  var academicStart=2025;
  [8,9,10,11,0,1,2,3,4,5].forEach(function(m){
    var y=m>7?academicStart:academicStart+1;
    var opt=document.createElement('option'); opt.value=y+'-'+m;
    opt.textContent=mNames[m]+' '+y;
    hebdoMonthSel.appendChild(opt);
  });
  if(prevVal) hebdoMonthSel.value = prevVal;
}
populateHebdoMonths();

// Init hebdo group select
var hbGroupSel=document.getElementById('hebdo-block-group');
groups.forEach(function(g){
  var opt=document.createElement('option'); opt.value=g.id; opt.textContent=g.name;
  hbGroupSel.appendChild(opt);
});
hbGroupSel.addEventListener('change',function(e){
  document.getElementById('hebdo-custom-wrap').style.display=e.target.value==='autre'?'block':'none';
});

function getMondayOfWeek(year,mIdx,wIdx){
  var first=new Date(year,mIdx,1);
  var dist=(first.getDay()+6)%7;
  var mon=new Date(first); mon.setDate(first.getDate()-dist);
  mon.setDate(mon.getDate()+(wIdx-1)*7);
  return mon;
}

function renderHebdo(){
  var mv=document.getElementById('hebdo-month-select').value;
  var wv=parseInt(document.getElementById('hebdo-week-select').value);
  var parts=mv.split('-').map(Number); var year=parts[0],mIdx=parts[1];
  var key=mv+'-W'+wv;
  currentHebdoKey=key;
  var wd=weeklyData[key]||{days:[[],[],[],[],[]],dayStatus:{},notes:''};
  if(!wd.dayStatus) wd.dayStatus={};
  document.getElementById('hebdoNotes').value=wd.notes||'';
  var grid=document.getElementById('hebdo-grid'); grid.innerHTML='';
  var dayNames=t('dayNames');
  var locale = currentLang==='zh'?'zh-CN':currentLang==='es'?'es-ES':currentLang==='en'?'en-CA':'fr-FR';
  var monday=getMondayOfWeek(year,mIdx,wv);
  var hdrColors=['#00E5FF','#FFD700','#FF9800','#4CAF50','#FF4081','#D500F9'];
  var hdrCol=hdrColors[mIdx%hdrColors.length];

  for(var i=0;i<5;i++){
    var curDate=new Date(monday);
    curDate.setDate(monday.getDate()+i);
    var dateStr=curDate.toLocaleDateString(locale,{day:'numeric',month:'long'});
    var md2=String(curDate.getMonth()+1).padStart(2,'0')+'-'+String(curDate.getDate()).padStart(2,'0');
    var fd2=curDate.getFullYear()+'-'+md2;
    var hol=getHoliday(fd2)||getHoliday(md2);
    var status=wd.dayStatus[i];
    if(!status&&hol&&hol.off) status='conge';
    if(!status) status='normal';
    var isDayOff=status==='conge'||status==='pedago';

    var col=document.createElement('div'); col.className='hebdo-col';
    var hdr=document.createElement('div'); hdr.className='hebdo-day-hdr';
    hdr.style.background='linear-gradient(135deg,'+hdrCol+','+hdrCol+'88)';
    hdr.style.color='#000';
    hdr.innerHTML='<h3>'+dayNames[i]+'</h3><div class="hebdo-date">'+dateStr+'</div>'+
      '<select onchange="updateHebdoDayStatus(\''+key+'\','+i+',this.value)">'+
      '<option value="normal"'+(status==='normal'?' selected':'')+'>'+t('statusNormal')+'</option>'+
      '<option value="conge"'+(status==='conge'?' selected':'')+'>'+t('statusConge')+'</option>'+
      '<option value="pedago"'+(status==='pedago'?' selected':'')+'>'+t('statusPedago')+'</option></select>';
    col.appendChild(hdr);

    var acts=document.createElement('div');
    acts.className='hebdo-activities'+(isDayOff?' day-off':'');
    if(hol){
      acts.innerHTML+='<div class="hebdo-holiday-disp"><div class="h-icon">'+hol.icon+'</div><div class="h-name">'+hol.name+'</div></div>';
    }
    if(wd.days[i]){
      wd.days[i].forEach(function(block,bIdx){
        var blk=document.createElement('div'); blk.className='hebdo-block';
        var gName=t('libre');
        if(block.groupId==='autre') gName=block.customGroup||t('autre');
        else if(block.groupId!=='libre'){
          var grp=groups.find(function(x){return x.id===block.groupId;});
          if(grp) gName=grp.name;
        }
        blk.innerHTML='<div class="hebdo-block-top"><span class="hebdo-group-badge">'+gName+'</span>'+
          '<span class="hebdo-del" onclick="deleteHebdoBlock(\''+key+'\','+i+','+bIdx+')">&times;</span></div>'+
          '<div class="hebdo-act-text">'+escHtml(block.activity)+'</div>';
        acts.appendChild(blk);
      });
    }
    var addBtn=document.createElement('button'); addBtn.className='hebdo-add-btn'; addBtn.textContent=t('addBtn');
    (function(k,idx){addBtn.onclick=function(){openAddBlockModal(k,idx);};})(key,i);
    acts.appendChild(addBtn);
    col.appendChild(acts);
    grid.appendChild(col);
  }
}

function saveHebdoNotes(){
  if(!weeklyData[currentHebdoKey]) weeklyData[currentHebdoKey]={days:[[],[],[],[],[]],dayStatus:{},notes:''};
  weeklyData[currentHebdoKey].notes=document.getElementById('hebdoNotes').value;
  localStorage.setItem('agenda_weekly',JSON.stringify(weeklyData));
}

window.updateHebdoDayStatus=function(key,dayIdx,status){
  if(!weeklyData[key]) weeklyData[key]={days:[[],[],[],[],[]],dayStatus:{},notes:''};
  if(!weeklyData[key].dayStatus) weeklyData[key].dayStatus={};
  weeklyData[key].dayStatus[dayIdx]=status;
  localStorage.setItem('agenda_weekly',JSON.stringify(weeklyData));
  renderHebdo();
};

function prevHebdoWeek(){
  var w=parseInt(document.getElementById('hebdo-week-select').value);
  var mi=document.getElementById('hebdo-month-select').selectedIndex;
  if(w>1) document.getElementById('hebdo-week-select').value=w-1;
  else if(mi>0){ document.getElementById('hebdo-month-select').selectedIndex=mi-1; document.getElementById('hebdo-week-select').value=5; }
  renderHebdo();
}
function nextHebdoWeek(){
  var w=parseInt(document.getElementById('hebdo-week-select').value);
  var mi=document.getElementById('hebdo-month-select').selectedIndex;
  var opts=document.getElementById('hebdo-month-select').options.length;
  if(w<5) document.getElementById('hebdo-week-select').value=w+1;
  else if(mi<opts-1){ document.getElementById('hebdo-month-select').selectedIndex=mi+1; document.getElementById('hebdo-week-select').value=1; }
  renderHebdo();
}

function openAddBlockModal(key,dayIdx){
  currentHebdoKey=key; currentHebdoDayIndex=dayIdx;
  document.getElementById('hebdo-block-activity').value='';
  document.getElementById('hebdo-block-custom').value='';
  document.getElementById('hebdo-block-group').value='libre';
  document.getElementById('hebdo-custom-wrap').style.display='none';
  document.getElementById('addBlockModal').classList.add('open');
}

function confirmAddBlock(){
  var gId=document.getElementById('hebdo-block-group').value;
  var act=document.getElementById('hebdo-block-activity').value;
  var cust=gId==='autre'?document.getElementById('hebdo-block-custom').value:'';
  if(!weeklyData[currentHebdoKey]) weeklyData[currentHebdoKey]={days:[[],[],[],[],[]],dayStatus:{},notes:''};
  weeklyData[currentHebdoKey].days[currentHebdoDayIndex].push({groupId:gId,customGroup:cust,activity:act});
  localStorage.setItem('agenda_weekly',JSON.stringify(weeklyData));
  closeModal('addBlockModal'); renderHebdo();
}

window.deleteHebdoBlock=function(key,dayIdx,blockIdx){
  if(confirm(t('confirmDelete'))){
    weeklyData[key].days[dayIdx].splice(blockIdx,1);
    localStorage.setItem('agenda_weekly',JSON.stringify(weeklyData));
    renderHebdo();
  }
};

// --- SÉQUENTIEL ---
// Objective keys mapped to translatable keys
var objKeys = [
  'bodyParts','bodySpace','levels','directions','speed',
  'walkCrawl','runGallop','jumpRope','throwCatch','dribble',
  'attackGoal','protect','getOpen',
  'respectRules','encourage','acceptLoss',
  'warmUp','hydrate','clothing'
];

function getSeqData(){
  var o = T[currentLang].obj;
  return {
    c1:{title:t('c1Title'),categories:{}},
    c2:{title:t('c2Title'),categories:{}},
    c3:{title:t('c3Title'),categories:{}}
  };
}

// Full structured seq data with translatable objectives
function buildSeqData(){
  var o = T[currentLang].obj;
  // Helper: lvl(start,end) => {start:"apprend", end:"maitrise"}
  function L(start,end){var x={};x[start]="apprend";if(end)x[end]="maitrise";return x;}
  return {
    c1:{title:t('c1Title'),categories:{
      [t('catKnowledge')]:[
        // Le corps
        {text:o.bodyParts,key:'bodyParts',levels:L(1,2)},
        {text:o.bodySegments,key:'bodySegments',levels:L(2,3)},
        {text:o.bodyAxes,key:'bodyAxes',levels:L(2,3)},
        {text:o.bodyMuscles,key:'bodyMuscles',levels:L(3)},
        // L'espace
        {text:o.bodySpace,key:'bodySpace',levels:L(1,2)},
        {text:o.spaceGeneral,key:'spaceGeneral',levels:L(1,2)},
        {text:o.levels,key:'levels',levels:L(1,2)},
        {text:o.directions,key:'directions',levels:L(1,2)},
        {text:o.planes,key:'planes',levels:L(2,3)},
        {text:o.trajectories,key:'trajectories',levels:L(2,3)},
        {text:o.distances,key:'distances',levels:L(2,3)},
        // Le temps
        {text:o.speed,key:'speed',levels:L(1,2)},
        {text:o.rhythm,key:'rhythm',levels:L(1,2)},
        {text:o.duration,key:'duration',levels:L(2,3)},
        {text:o.simultaneity,key:'simultaneity',levels:L(2,3)},
        {text:o.succession,key:'succession',levels:L(2,3)}
      ],
      [t('catSkills')]:[
        // Locomotion
        {text:o.walkCrawl,key:'walkCrawl',levels:{1:"maitrise",2:"reutilise"}},
        {text:o.runGallop,key:'runGallop',levels:L(1,2)},
        {text:o.jumpVarious,key:'jumpVarious',levels:L(1,2)},
        {text:o.jumpRope,key:'jumpRope',levels:L(2,3)},
        {text:o.climb,key:'climb',levels:L(1,3)},
        {text:o.rollBody,key:'rollBody',levels:L(1,2)},
        {text:o.slide,key:'slide',levels:L(2,3)},
        {text:o.swim,key:'swim',levels:L(2,3)},
        {text:o.skate,key:'skate',levels:L(2,3)},
        {text:o.ski,key:'ski',levels:L(2,3)},
        // Manipulation
        {text:o.throwCatch,key:'throwCatch',levels:L(1,2)},
        {text:o.dribbleHand,key:'dribbleHand',levels:L(2,3)},
        {text:o.dribbleFoot,key:'dribbleFoot',levels:L(2,3)},
        {text:o.kick,key:'kick',levels:L(1,2)},
        {text:o.strikeHand,key:'strikeHand',levels:L(2,3)},
        {text:o.strikeImpl,key:'strikeImpl',levels:L(2,3)},
        {text:o.rollObject,key:'rollObject',levels:L(1,2)},
        {text:o.receive,key:'receive',levels:L(1,2)},
        {text:o.pass,key:'pass',levels:L(2,3)},
        // Non-locomotion
        {text:o.balance,key:'balance',levels:L(1,2)},
        {text:o.balanceDyn,key:'balanceDyn',levels:L(2,3)},
        {text:o.swing,key:'swing',levels:L(1,2)},
        {text:o.turn,key:'turn',levels:L(1,2)},
        {text:o.suspend,key:'suspend',levels:L(2,3)},
        {text:o.carry,key:'carry',levels:L(1,2)},
        {text:o.stretchBody,key:'stretchBody',levels:L(1,3)}
      ],
      [t('catStrategies')]:[
        {text:o.analyzeTask,key:'analyzeTask',levels:L(2,3)},
        {text:o.planAction,key:'planAction',levels:L(2,3)},
        {text:o.regulate,key:'regulate',levels:L(2,3)},
        {text:o.adjustResult,key:'adjustResult',levels:L(2,3)},
        {text:o.anticipate,key:'anticipate',levels:L(3)}
      ],
      [t('catBeing')]:[
        {text:o.persevere,key:'persevere',levels:L(1,3)},
        {text:o.autonomy,key:'autonomy',levels:L(1,3)},
        {text:o.riskMeasured,key:'riskMeasured',levels:L(2,3)},
        {text:o.selfConfidence,key:'selfConfidence',levels:L(1,3)}
      ]
    }},
    c2:{title:t('c2Title'),categories:{
      [t('catKnowledge')]:[
        {text:o.rolesGame,key:'rolesGame',levels:L(1,2)},
        {text:o.rulesGame,key:'rulesGame',levels:L(1,2)},
        {text:o.ethicsCode,key:'ethicsCode',levels:L(2,3)}
      ],
      [t('catStrategies')]:[
        // Offensives
        {text:o.attackGoal,key:'attackGoal',levels:L(2,3)},
        {text:o.getOpen,key:'getOpen',levels:L(2,3)},
        {text:o.occupySpace,key:'occupySpace',levels:L(2,3)},
        {text:o.passSmart,key:'passSmart',levels:L(2,3)},
        {text:o.moveBall,key:'moveBall',levels:L(2,3)},
        // Défensives
        {text:o.markOpp,key:'markOpp',levels:L(2,3)},
        {text:o.protectGoal,key:'protectGoal',levels:L(2,3)},
        {text:o.protect,key:'protect',levels:L(2,3)},
        {text:o.intercept,key:'intercept',levels:L(2,3)},
        {text:o.recoverBall,key:'recoverBall',levels:L(2,3)},
        // Duel
        {text:o.feint,key:'feint',levels:L(2,3)},
        {text:o.varyActions,key:'varyActions',levels:L(2,3)},
        {text:o.evade,key:'evade',levels:L(1,2)},
        {text:o.timingDuel,key:'timingDuel',levels:L(3)}
      ],
      [t('catBeing')]:[
        {text:o.communicate,key:'communicate',levels:L(1,2)},
        {text:o.support,key:'support',levels:L(1,2)},
        {text:o.encourage,key:'encourage',levels:L(1,2)},
        {text:o.helpPartner,key:'helpPartner',levels:L(1,2)},
        {text:o.respectRules,key:'respectRules',levels:L(1,2)},
        {text:o.respectOpp,key:'respectOpp',levels:L(1,2)},
        {text:o.respectOff,key:'respectOff',levels:L(2,3)},
        {text:o.fairPlay,key:'fairPlay',levels:L(1,3)},
        {text:o.acceptLoss,key:'acceptLoss',levels:L(2,3)},
        {text:o.acceptWin,key:'acceptWin',levels:L(2,3)}
      ]
    }},
    c3:{title:t('c3Title'),categories:{
      [t('catKnowledge')]:[
        {text:o.healthEffects,key:'healthEffects',levels:L(2,3)},
        {text:o.benefits,key:'benefits',levels:L(2,3)},
        {text:o.bodyChanges,key:'bodyChanges',levels:L(2,3)},
        {text:o.musclesRole,key:'musclesRole',levels:L(3)}
      ],
      [t('catSkills')]:[
        {text:o.warmUp,key:'warmUp',levels:L(2,3)},
        {text:o.coolDown,key:'coolDown',levels:L(2,3)},
        {text:o.stretchAfter,key:'stretchAfter',levels:L(2,3)},
        {text:o.heartRate,key:'heartRate',levels:L(3)},
        {text:o.perceivedEffort,key:'perceivedEffort',levels:L(2,3)},
        {text:o.breathRate,key:'breathRate',levels:L(2,3)},
        {text:o.selfCapacity,key:'selfCapacity',levels:L(2,3)}
      ],
      [t('catHabits')]:[
        {text:o.hydrate,key:'hydrate',levels:L(1,2)},
        {text:o.nutrition,key:'nutrition',levels:L(1,3)},
        {text:o.sleep,key:'sleep',levels:L(1,3)},
        {text:o.hygiene,key:'hygiene',levels:L(1,3)},
        {text:o.screenTime,key:'screenTime',levels:L(2,3)},
        {text:o.activeTransport,key:'activeTransport',levels:L(2,3)},
        {text:o.safetyRules,key:'safetyRules',levels:L(1,2)},
        {text:o.safetyEquip,key:'safetyEquip',levels:L(1,2)},
        {text:o.safetyEnv,key:'safetyEnv',levels:L(2,3)},
        {text:o.clothing,key:'clothing',levels:L(1,2)},
        {text:o.regularPractice,key:'regularPractice',levels:L(2,3)},
        {text:o.variedActivities,key:'variedActivities',levels:L(2,3)},
        {text:o.planActivity,key:'planActivity',levels:L(3)},
        {text:o.personalGoals,key:'personalGoals',levels:L(2,3)},
        {text:o.valueActivity,key:'valueActivity',levels:L(2,3)}
      ]
    }}
  };
}

var planningSeqData={};
var currentEditingSeqId=null;
var globalSelectedObjectives=new Set(); // stores objective keys

function renderGlobalObjectives(){
  var seqData = buildSeqData();
  var cycle=parseInt(document.getElementById('niveau-scolaire').value);
  var html='';
  for(var ck in seqData){
    var comp=seqData[ck];
    for(var cat in comp.categories){
      html+='<div class="seq-obj-col"><h4>'+comp.title+' — '+cat+'</h4>';
      comp.categories[cat].forEach(function(item){
        var l1=cycle, l2=cycle+1;
        var st=item.levels[l1]||item.levels[l2]||'reutilise';
        var dotCls=st==='apprend'?'legend-apprend':st==='maitrise'?'legend-maitrise':'legend-reutilise';
        var chk=globalSelectedObjectives.has(item.key)?'checked':'';
        html+='<label><input type="checkbox" class="global-obj-cb" value="'+item.key+'" '+chk+'>'+
          '<span style="flex:1">'+escHtml(item.text)+'</span><span class="seq-obj-dot '+dotCls+'"></span></label>';
      });
      html+='</div>';
    }
  }
  document.getElementById('tab-contents').innerHTML=html;
  document.querySelectorAll('.global-obj-cb').forEach(function(cb){
    cb.addEventListener('change',function(e){
      if(e.target.checked) globalSelectedObjectives.add(e.target.value);
      else globalSelectedObjectives.delete(e.target.value);
    });
  });
}

function generateGrid(){
  var count=parseInt(document.getElementById('nombre-cours').value)||1;
  var container=document.getElementById('planning-grid-container');
  container.innerHTML='';
  var accentColors=['var(--cyan)','var(--yellow)','var(--orange)','var(--green)','var(--pink)','var(--purple)'];
  for(var i=1;i<=count;i++){
    if(!planningSeqData[i]) planningSeqData[i]={moyenAction:'',date:'',deroulement:'',objectifsSpecifiques:new Set()};
    var c=planningSeqData[i];
    var accent=accentColors[(i-1)%accentColors.length];
    var card=document.createElement('div'); card.className='seq-card';
    card.style.borderTopColor=accent; card.style.borderTopWidth='3px';
    card.innerHTML='<div class="seq-card-header"><span>'+t('courseN').replace('{n}',i)+'</span><span>'+(c.date||'...')+'</span></div>'+
      '<div class="seq-card-body"><label>'+t('date')+'</label><input type="date" class="grid-date-input" data-id="'+i+'" value="'+c.date+'">'+
      '<label>'+t('titleGame')+'</label><input type="text" class="grid-title-input" data-id="'+i+'" value="'+escAttr(c.moyenAction)+'" placeholder="Ex: Ballon chasseur">'+
      '<button class="seq-edit-btn" onclick="openSeqModal('+i+')">'+t('editCourse')+'</button></div>';
    container.appendChild(card);
  }
  document.querySelectorAll('.grid-date-input').forEach(function(inp){
    inp.addEventListener('input',function(e){ planningSeqData[e.target.dataset.id].date=e.target.value; generateGrid(); });
  });
  document.querySelectorAll('.grid-title-input').forEach(function(inp){
    inp.addEventListener('input',function(e){ planningSeqData[e.target.dataset.id].moyenAction=e.target.value; });
  });
}

window.openSeqModal=function(id){
  currentEditingSeqId=id;
  var d=planningSeqData[id];
  document.getElementById('modal-title').textContent=t('editN').replace('{n}',id);
  document.getElementById('modal-moyen-action').value=d.moyenAction;
  document.getElementById('modal-date').value=d.date;
  document.getElementById('modal-editor').innerHTML=d.deroulement;
  // Banque PFEQ complète groupée par compétence (C1/C2/C3) en <details> dépliables
  var seqData=buildSeqData();
  var cycle=parseInt(document.getElementById('niveau-scolaire').value)||1;
  var compColors={c1:'#00C4FF',c2:'#FF2A7A',c3:'#4ADE80'};
  var compEmojis={c1:'🏃',c2:'🤝',c3:'💪'};
  var html='';
  var totalChecked=d.objectifsSpecifiques.size;
  for(var ck in seqData){
    var comp=seqData[ck];
    var compChecked=0;
    var inner='';
    for(var cat in comp.categories){
      inner+='<div class="spec-obj-cat"><h5>'+escHtml(cat)+'</h5>';
      comp.categories[cat].forEach(function(item){
        var l1=cycle, l2=cycle+1;
        var st=item.levels[l1]||item.levels[l2]||'reutilise';
        var dotCls=st==='apprend'?'legend-apprend':st==='maitrise'?'legend-maitrise':'legend-reutilise';
        var chk=d.objectifsSpecifiques.has(item.key)?'checked':'';
        if(chk)compChecked++;
        inner+='<label><input type="checkbox" class="spec-obj-cb" value="'+escAttr(item.key)+'" '+chk+'>'
          +'<span style="flex:1">'+escHtml(item.text)+'</span>'
          +'<span class="seq-obj-dot '+dotCls+'"></span></label>';
      });
      inner+='</div>';
    }
    var openAttr=compChecked>0?' open':'';
    html+='<details class="spec-obj-details"'+openAttr+' style="--comp-color:'+compColors[ck]+'">'
      +'<summary><span class="spec-obj-emoji">'+compEmojis[ck]+'</span><span class="spec-obj-title">'+escHtml(comp.title)+'</span>'
      +'<span class="spec-obj-count">'+compChecked+'</span></summary>'
      +'<div class="spec-obj-body">'+inner+'</div></details>';
  }
  var objList=document.getElementById('modal-objectives-list');
  objList.innerHTML=html;
  // live update des compteurs au clic
  objList.querySelectorAll('.spec-obj-cb').forEach(function(cb){
    cb.addEventListener('change',function(e){
      var det=e.target.closest('.spec-obj-details');
      if(!det)return;
      var n=det.querySelectorAll('.spec-obj-cb:checked').length;
      var c=det.querySelector('.spec-obj-count');
      if(c)c.textContent=n;
    });
  });
  document.getElementById('course-modal').classList.add('open');
};

function closeSeqModal(){ document.getElementById('course-modal').classList.remove('open'); generateGrid(); }
function saveSeqData(){
  if(!currentEditingSeqId) return;
  var d=planningSeqData[currentEditingSeqId];
  d.moyenAction=document.getElementById('modal-moyen-action').value;
  d.date=document.getElementById('modal-date').value;
  d.deroulement=document.getElementById('modal-editor').innerHTML;
  d.objectifsSpecifiques.clear();
  document.querySelectorAll('.spec-obj-cb:checked').forEach(function(cb){ d.objectifsSpecifiques.add(cb.value); });
  closeSeqModal();
}

document.getElementById('close-modal').addEventListener('click',closeSeqModal);
document.getElementById('save-modal-btn').addEventListener('click',saveSeqData);
document.getElementById('niveau-scolaire').addEventListener('change',renderGlobalObjectives);
document.getElementById('nombre-cours').addEventListener('input',generateGrid);
document.querySelectorAll('.editor-btn').forEach(function(btn){
  btn.addEventListener('click',function(e){ e.preventDefault(); document.execCommand(btn.dataset.command,false,null); });
});

// --- SAVE / IMPORT / RESET ---
function downloadData(){
  var data={events:events,config:periodsPerDay,notes:document.getElementById('globalNotes').value,weekly:weeklyData};
  var a=document.createElement('a');
  a.href='data:text/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(data));
  a.download='agenda_scolaire_backup.json';
  document.body.appendChild(a); a.click(); a.remove();
}

function importData(input){
  var file=input.files[0]; if(!file)return;
  var reader=new FileReader();
  reader.onload=function(e){
    try {
      var data=JSON.parse(e.target.result);
      if(data.events){events=data.events;localStorage.setItem('agenda_events',JSON.stringify(events));}
      if(data.config){periodsPerDay=data.config;document.getElementById('periodsCount').value=periodsPerDay;localStorage.setItem('agenda_periods',periodsPerDay);}
      if(data.notes){document.getElementById('globalNotes').value=data.notes;localStorage.setItem('agenda_global_notes',data.notes);}
      if(data.weekly){weeklyData=data.weekly;localStorage.setItem('agenda_weekly',JSON.stringify(weeklyData));}
      alert(t('importSuccess')); loadCalendar(); renderHebdo();
    } catch(err){ alert(t('importError')); }
  };
  reader.readAsText(file);
}

function resetAll(){
  if(confirm(t('confirmReset'))){
    localStorage.removeItem('agenda_events');localStorage.removeItem('agenda_global_notes');
    localStorage.removeItem('agenda_weekly');localStorage.removeItem('agenda_periods');
    location.reload();
  }
}

// --- UTILS ---
function escHtml(s){ var d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function escAttr(s){ return s.replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

// --- INIT ---
// Apply saved language on load
setLang(currentLang);

// Show presentation if not seen
if(!localStorage.getItem('agenda_pres_seen')){
  var presEl = document.getElementById('presentation-section');
  if(presEl) presEl.style.display = 'block';
}
