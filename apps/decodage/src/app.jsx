import { useState, useRef, useEffect } from "react";

/* ═══════════════ ZONE — DÉCODAGE DU CORPS · habillage ZTS ═══════════════
   Identité zonetotalsport.ca : dégradé cyan → bleu marin, titres
   ZoneTotalSport.ttf (size-adjust 50%) + Luckiest Guy, boutons cyan
   arrondis avec ombrage, accents #FFFC00 #A3FF00 #FFA200 #FF0061.
══════════════════════════════════════════════════════════════════════════ */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Nunito:wght@500;700;800&display=swap');
@font-face{
  font-family:'ZoneTotalSport';
  src:url('https://zonetotalsport.ca/fonts/ZoneTotalSport.ttf') format('truetype');
  size-adjust:50%;font-display:swap;
}
.zts-titre{font-family:'ZoneTotalSport','Luckiest Guy',cursive;line-height:1.12;letter-spacing:.5px}
.ztsh-rays{
  position:fixed;inset:-50%;width:200%;height:200%;pointer-events:none;z-index:0;
  background:repeating-conic-gradient(from 0deg,
    rgba(255,252,0,.07) 0deg 9deg, transparent 9deg 24deg);
  animation:ztshTourne 90s linear infinite;
}
@keyframes ztshTourne{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@media (prefers-reduced-motion: reduce){.ztsh-rays{animation:none}}
`;

const C = {
  cyan: "#00CFFF", marine: "#0B2A5B", marineFonce: "#071B3D",
  jaune: "#FFFC00", lime: "#A3FF00", orange: "#FFA200", rose: "#FF0061",
  encre: "#0B2A5B", blanc: "#FFFFFF",
};

/* ─────────────── DICTIONNAIRE CROISÉ (rapport #1) ─────────────── */
const SYSTEMES = {
  tete: { nom: "Tête & sommeil", emoji: "🧠", couleur: "#FFFC00" },
  peau: { nom: "Peau", emoji: "🖐️", couleur: C.orange },
  poids: { nom: "Poids & métabolisme", emoji: "⚖️", couleur: C.lime },
  dos: { nom: "Dos & articulations", emoji: "🦴", couleur: C.cyan },
  digestif: { nom: "Digestif", emoji: "🍽️", couleur: C.rose },
  respiratoire: { nom: "Respiratoire", emoji: "🫁", couleur: C.cyan },
  cardio: { nom: "Cœur & sang", emoji: "❤️", couleur: C.rose },
  urinaire: { nom: "Urinaire", emoji: "💧", couleur: C.cyan },
  sens: { nom: "Yeux & oreilles", emoji: "👁️", couleur: C.orange },
  repro: { nom: "Reproducteur & sein", emoji: "🌸", couleur: C.rose },
};

/* ─── Lectures MTC & Dr. Sebi par système (rapport #2) ─── */
const MTC_SYS = {
  tete: "☯️ Bois et Feu — migraines = montée du Yang du Foie (colère, frustration comprimée), vertiges = vent interne du Foie, insomnie = le Shen du Cœur qui ne se pose pas. Réveils 1-3 h = Foie, 3-5 h = Poumon. Points : LR3, GB20, HT7. Réduire excitants, apaiser le soir.",
  peau: "☯️ Métal — la peau relève du Poumon (tristesse non exprimée); rougeurs = chaleur du Sang, suintement = humidité, sécheresse = vide de Yin. Points : LI11, SP10. Réduire laitages et sucre.",
  poids: "☯️ Terre — Rate/Estomac (rumination, besoin de réconfort); vide de Rate avec humidité-glaires, lourdeur, fatigue après les repas. Points : ST36, SP6. Repas tièdes et cuits, réduire cru/froid/sucré.",
  dos: "☯️ Eau — les lombes sont le « palais des Reins » (peur, insécurité, épuisement); Bois pour les tensions musculaires. Aggravation au froid = vide de Yang. Points : BL23, GB30. Sésame noir, haricots noirs, garder les reins au chaud.",
  digestif: "☯️ Terre — Rate/Estomac (soucis), Gros intestin (lâcher prise), le Foie qui envahit la Rate (frustration). Points : ST36, CV12, LR3. Repas chauds réguliers, mastication.",
  respiratoire: "☯️ Métal — Poumon (tristesse, deuil); vide de Qi, glaires. Réveils entre 3 h et 5 h évocateurs. Points : LU1, LU9, LI4. Poire, navet, radis blanc; réduire laitages.",
  cardio: "☯️ Feu — le Cœur abrite le Shen (agitation, manque de paix); palpitations et insomnie = vide de Sang ou feu du Cœur. Points : HT7, PC6. Cohérence cardiaque, éviter les excitants.",
  urinaire: "☯️ Eau — Rein/Vessie (peur, difficulté à lâcher); mictions nocturnes et frilosité = vide de Yang, brûlures = chaleur-humidité. Points : BL23, KI3, SP9. Azuki et orge pour drainer.",
  sens: "☯️ Le Foie s'ouvre aux yeux (colère), le Rein aux oreilles (peur), le Poumon au nez (tristesse). Yeux secs = vide de Sang du Foie (baies de goji), acouphènes = vide de Rein. Points : GB20, TE17, LI20.",
  repro: "☯️ Eau et Bois — le Rein porte l'essence Jing (procréation, peur), le Foie fait circuler le Sang (frustration, SPM). Points : SP6, CV4, LR3. Tonifier le Rein (sésame noir), réchauffer le bas-ventre.",
};
const SEBI_SYS = {
  tete: "🌿 Hydratation à l'eau de source, végétal alcalin; sea moss pour les minéraux. Retirer excitants, sucre raffiné, transformés — jugés acidifiants dans sa logique.",
  peau: "🌿 Terrain mucus/acidité : légumes verts, baies, eau de source; plantes — bardane, salsepareille, sea moss. Retirer laitages, sucre, transformés.",
  poids: "🌿 Grains alcalins (quinoa, fonio, teff), légumes verts; plantes — bladderwrack, sea moss, pissenlit. Retirer féculents raffinés, viande, laitages, hybrides.",
  dos: "🌿 Régime alcalin général; sea moss pour les minéraux, salsepareille.",
  digestif: "🌿 Légumes verts, grains alcalins, eau de source; plantes — bardane, pissenlit, sea moss, sureau. Retirer laitages, viande, blé, transformés.",
  respiratoire: "🌿 Fruits et légumes alcalins, tisanes; plantes — sureau, sea moss, bladderwrack, molène. Retirer les laitages (« producteurs de mucus » dans sa logique).",
  cardio: "🌿 Végétal alcalin riche en minéraux; sea moss, bladderwrack, aubépine. Retirer sel transformé, graisses animales, sucre.",
  urinaire: "🌿 Eau de source abondante, fruits et légumes alcalins; plantes — bardane, salsepareille, pissenlit. Retirer transformés, sucre, alcool, caféine.",
  sens: "🌿 Régime alcalin riche en minéraux; sea moss, sureau pour les voies ORL. Retirer les laitages (sinus).",
  repro: "🌿 Végétal alcalin; plantes — salsepareille, bardane, sea moss, bladderwrack. Retirer laitages, viande, sucre, hybrides.",
};

const DICO = [
  { id: "migraine", nom: "Maux de tête / migraines", sys: "tete", feuillet: "Mixte",
    hamer: "Conflit intellectuel, dévalorisation de soi dans la sphère mentale, phase de réparation d'un conflit de réflexion", martel: "Pression de performance, pensées excessives, autocritique — se casser la tête",
    questions: ["Qu'est-ce que je m'empêche de comprendre ou d'accepter?", "Envers qui suis-je si exigeant mentalement — moi?"],
    pistes: ["Alléger l'exigence mentale", "Déposer le problème sur papier plutôt que dans la tête"] },
  { id: "vertiges", nom: "Vertiges / étourdissements", sys: "tete", feuillet: "Ectoderme",
    hamer: "Conflit de perte de repères, peur de tomber au sens propre ou figuré", martel: "Peur de perdre le contrôle, instabilité dans une situation, envie de fuir",
    questions: ["Quelle situation me fait perdre pied?", "Qu'est-ce que je n'ose pas regarder en face de peur que tout tourne?"],
    pistes: ["Nommer la zone d'instabilité", "Reprendre un point d'ancrage concret à la fois"] },
  { id: "insomnie", nom: "Insomnie", sys: "tete", feuillet: "Mixte",
    hamer: "Sympathicotonie : un conflit actif maintient le corps en état d'alerte (réveils typiques vers 3 h)", martel: "Hypervigilance, insécurité, ne pas s'autoriser à lâcher le contrôle",
    questions: ["Qu'est-ce qui me garde en état d'alerte?", "Qu'est-ce que je crains qu'il arrive si je relâche?"],
    pistes: ["Identifier le conflit actif qui empêche la vagotonie", "Rituel de dépôt des soucis avant le lit"] },
  { id: "fatigue", nom: "Fatigue chronique / épuisement", sys: "tete", feuillet: "Mixte",
    hamer: "Phase de réparation prolongée (vagotonie) après un long conflit, ou conflits multiples qui drainent", martel: "Dévalorisation globale, perte de direction — « à quoi bon », se battre contre soi",
    questions: ["Dans quelle bataille est-ce que je m'épuise sans avancer?", "Qu'est-ce qui ne fait plus de sens dans ma vie actuelle?"],
    pistes: ["Honorer la phase de récupération au lieu de la combattre", "Redéfinir une direction qui a du sens"] },
  { id: "machoire", nom: "Mâchoire / bruxisme", sys: "tete", feuillet: "Mésoderme récent",
    hamer: "Agressivité retenue, impuissance à mordre — on serre au lieu d'exprimer", martel: "Colère rentrée, serrer les dents devant une situation qu'on subit",
    questions: ["Devant quoi est-ce que je serre les dents au lieu de parler?"],
    pistes: ["Exprimer la colère par un canal choisi", "Détente consciente de la mâchoire au coucher"] },
  { id: "cheveux", nom: "Chute de cheveux", sys: "peau", feuillet: "Ectoderme",
    hamer: "Conflit de séparation vécu au niveau de la tête (caresses perdues), ou dévalorisation esthétique", martel: "Perte de protection, se sentir découvert, peur de perdre",
    questions: ["Quelle perte ou séparation ai-je vécue récemment?", "Qui ne me « flatte » plus?"],
    pistes: ["Faire le deuil de la perte identifiée", "Se redonner soi-même la valorisation perdue"] },
  { id: "zona", nom: "Zona", sys: "peau", feuillet: "Ectoderme",
    hamer: "Conflit de séparation douloureuse combiné à une atteinte sur le trajet du nerf concerné", martel: "Une séparation ou trahison qui brûle encore, colère à fleur de peau",
    questions: ["Quelle séparation ou trahison me brûle encore?"],
    pistes: ["Verbaliser la douleur de la rupture", "Rituel de clôture de la relation blessante"] },
  { id: "ongles", nom: "Ongles (cassants, rongés)", sys: "peau", feuillet: "Mésoderme récent",
    hamer: "Dévalorisation dans la capacité à se défendre, à « griffer »", martel: "Agressivité de défense retournée contre soi, se ronger au lieu de s'affirmer",
    questions: ["Contre qui ou quoi je m'empêche de me défendre?"],
    pistes: ["S'autoriser une affirmation directe par jour"] },
  { id: "eczema", nom: "Eczéma / dermatite", sys: "peau", feuillet: "Ectoderme",
    hamer: "Conflit de séparation, de contact rompu", martel: "Se sentir touché à vif, coupé d'un être cher, tiraillé entre deux personnes",
    questions: ["De qui ou de quoi me suis-je senti séparé?", "Ai-je peur d'un contact, ou est-ce qu'il m'en manque un?"],
    pistes: ["Rétablir un contact symbolique", "Exprimer le besoin de proximité"] },
  { id: "psoriasis", nom: "Psoriasis", sys: "peau", feuillet: "Ectoderme",
    hamer: "Conflit de séparation double, identité tiraillée", martel: "Pris entre deux appartenances, deux séparations",
    questions: ["Suis-je pris entre deux séparations, deux appartenances?"],
    pistes: ["Clarifier son appartenance", "Nommer les deux pôles du tiraillement"] },
  { id: "acne", nom: "Acné", sys: "peau", feuillet: "Ectoderme",
    hamer: "Conflit d'image de soi, d'identité (peau du visage)", martel: "Jugement de sa propre image, peur du regard des autres",
    questions: ["Comment je juge mon image?", "Ai-je peur du regard des autres?"],
    pistes: ["Travailler l'acceptation de son image"] },
  { id: "vitiligo", nom: "Vitiligo", sys: "peau", feuillet: "Ectoderme",
    hamer: "Séparation brutale, salissure — vouloir effacer une tache", martel: "Vouloir effacer un événement, se purifier",
    questions: ["Quel événement ai-je voulu effacer?"],
    pistes: ["Accueillir l'événement plutôt que l'effacer"] },
  { id: "thyroide", nom: "Thyroïde (hypo / hyper)", sys: "poids", feuillet: "Endo/Ectoderme",
    hamer: "Hyper : conflit de ne pas être assez rapide, il faut « attraper le morceau » vite. Hypo : impuissance, ça ne sert à rien de se presser", martel: "Ne pas pouvoir agir ou s'exprimer à son rythme, temps subi",
    questions: ["Où est-ce que je cours après le temps — ou l'ai-je abandonné?", "Qu'est-ce que je n'arrive pas à faire « à temps »?"],
    pistes: ["Reprendre son propre tempo", "Nommer l'urgence ou l'impuissance vécue"] },
  { id: "diabete", nom: "Diabète (type 2)", sys: "poids", feuillet: "Ectoderme",
    hamer: "Conflit de résistance : se contracter contre quelque chose ou quelqu'un, résister à ce qui est répugnant", martel: "Manque de douceur dans la vie, amertume — la douceur qui n'entre plus",
    sabbah: "Chercher les mémoires de lignée : maison hostile, douceur refusée ou conditionnelle",
    questions: ["À quoi ou à qui suis-je en train de résister de toutes mes forces?", "Où la douceur manque-t-elle dans ma vie?"],
    pistes: ["Identifier la résistance et son coût", "Réintroduire de la douceur non alimentaire chaque jour"] },
  { id: "surpoids", nom: "Surpoids / prise de poids", sys: "poids", feuillet: "Mixte",
    hamer: "Conflit de protection ou d'abandon — le kilo en trop comme kilo de protection", martel: "Insécurité affective, besoin de carapace, peur du manque",
    sabbah: "Chercher le programmant : lignée ayant connu famine ou agression",
    questions: ["Contre quoi ou qui ai-je besoin de me protéger?", "De quel manque le poids me protège-t-il?", "Depuis quel événement ai-je pris du poids?"],
    pistes: ["Construire une sécurité intérieure", "Nommer la peur", "Explorer le conflit programmant"] },
  { id: "maigreur", nom: "Maigreur / amaigrissement", sys: "poids", feuillet: "Mixte",
    hamer: "Phase active de conflit (sympathicotonie) ou dégoût / rejet de la matière", martel: "Rejet, dégoût de quelque chose dans sa vie",
    questions: ["Qu'est-ce que je rejette, qu'est-ce qui me dégoûte?"],
    pistes: ["Identifier le conflit actif qui consume"] },
  { id: "retention", nom: "Rétention d'eau / cellulite", sys: "poids", feuillet: "Endoderme",
    hamer: "Conflit du liquide, de l'existence — le « conflit du réfugié » (tubes collecteurs du rein)", martel: "Abandon, manque de repères, retenir par peur de perdre",
    questions: ["Me suis-je senti abandonné, sans point d'appui?"],
    pistes: ["Recréer des repères stables", "Nommer la peur de l'effondrement"] },
  { id: "hanches", nom: "Hanches", sys: "dos", feuillet: "Mésoderme récent",
    hamer: "Conflit d'opposition : s'engager ou non dans une direction, tenir tête", martel: "Peur d'avancer dans une décision majeure, « à quoi bon aller de l'avant »",
    questions: ["Quelle grande direction est-ce que je n'ose pas prendre?", "À quoi est-ce que je m'oppose de tout mon corps?"],
    pistes: ["Trancher la décision en suspens", "Poser un premier pas symbolique dans la direction choisie"] },
  { id: "coudes", nom: "Coudes / épicondylite", sys: "dos", feuillet: "Mésoderme récent",
    hamer: "Dévalorisation dans le geste de travail : changer de direction, serrer, repousser", martel: "Manque de flexibilité dans les changements, vouloir jouer du coude",
    questions: ["Quel changement de direction dans mon travail me pèse?", "Qui devrais-je serrer contre moi — ou repousser?"],
    pistes: ["Revaloriser le geste professionnel", "Clarifier ce qui doit être accueilli ou repoussé"] },
  { id: "chevilles", nom: "Chevilles", sys: "dos", feuillet: "Mésoderme récent",
    hamer: "Dévalorisation dans la direction prise : hésiter, pivoter, culpabilité de changer de voie", martel: "Manque de souplesse face aux nouvelles positions de vie",
    questions: ["Quel virage de vie est-ce que j'hésite à prendre?", "Est-ce que je me sens coupable de changer de direction?"],
    pistes: ["S'autoriser le pivot", "Assouplir l'engagement : petit essai avant le grand saut"] },
  { id: "pieds", nom: "Pieds", sys: "dos", feuillet: "Mésoderme récent",
    hamer: "Conflit de position : là où je me tiens, mon rapport au sol et à la mère symbolique", martel: "Peur d'avancer, positions de vie inconfortables, perdre pied",
    questions: ["Où est-ce que je ne me sens plus à ma place?", "Quel terrain de ma vie est devenu inconfortable?"],
    pistes: ["Redéfinir sa place, physiquement et symboliquement"] },
  { id: "tendinite", nom: "Tendinite", sys: "dos", feuillet: "Mésoderme récent",
    hamer: "Dévalorisation liée au geste présent et récent — le lien entre l'intention et l'action", martel: "Se sentir incapable de bien faire le geste demandé, tension entre vouloir et devoir",
    questions: ["Quel geste récent ai-je fait à contrecœur ou en me jugeant?"],
    pistes: ["Réconcilier le geste et l'intention", "Alterner exigence et récupération"] },
  { id: "hernie", nom: "Hernie discale", sys: "dos", feuillet: "Mésoderme récent",
    hamer: "Dévalorisation profonde combinée à un fardeau : la structure cède sous la charge", martel: "Porter trop, trop longtemps, sans soutien — jusqu'à craquer",
    questions: ["Quelle charge est devenue littéralement insoutenable?", "Qu'est-ce qui devait céder pour que j'arrête?"],
    pistes: ["Déposer la charge identifiée pour vrai", "Réorganiser les appuis avant de reprendre"] },
  { id: "fibromyalgie", nom: "Fibromyalgie", sys: "dos", feuillet: "Mésoderme récent",
    hamer: "Multiples conflits de dévalorisation entrecroisés, souvent en double contrainte familiale", martel: "Fidélité douloureuse : se sacrifier pour la famille sans droit de le dire, impuissance généralisée",
    sabbah: "Piste transgénérationnelle forte : loyautés familiales invisibles, douleurs des ancêtres portées",
    questions: ["À qui suis-je fidèle au point d'avoir mal partout?", "Quelle double contrainte me tient : obligée de rester, incapable de partir?"],
    pistes: ["Nommer les loyautés une à une", "Se redonner le droit d'exister en dehors du rôle"] },
  { id: "lombaires", nom: "Lombalgie (bas du dos)", sys: "dos", feuillet: "Mésoderme récent",
    hamer: "Dévalorisation liée au matériel et au financier, manque de soutien concret", martel: "Peur de manquer d'argent, de ne pas être soutenu",
    questions: ["Qui ou quoi devrait me soutenir?", "Ai-je peur pour ma sécurité matérielle?"],
    pistes: ["Identifier le soutien manquant et le demander"] },
  { id: "dorsales", nom: "Dorsalgie (haut du dos)", sys: "dos", feuillet: "Mésoderme récent",
    hamer: "Fardeau affectif, porter le poids des autres", martel: "Manque de soutien affectif, tout porter seul",
    questions: ["Quel fardeau je porte pour autrui?"],
    pistes: ["Déposer symboliquement le fardeau", "Déléguer, demander"] },
  { id: "cervicales", nom: "Cervicales / nuque", sys: "dos", feuillet: "Mésoderme récent",
    hamer: "Rigidité, injustice — devoir courber la tête", martel: "Contrariété d'être obligé de s'incliner, entêtement",
    questions: ["Devant quelle injustice dois-je courber la tête?"],
    pistes: ["Nommer l'injustice", "Assouplir sa position sans se renier"] },
  { id: "sciatique", nom: "Sciatique", sys: "dos", feuillet: "Mésoderme récent",
    hamer: "Peur liée à l'argent et à la direction de vie", martel: "Peur de manquer, de ne plus avancer",
    questions: ["Ai-je peur de manquer, de ne plus avancer?"],
    pistes: ["Clarifier sa direction", "Sécuriser un premier pas concret"] },
  { id: "menisque", nom: "Ménisque", sys: "dos", feuillet: "Mésoderme récent",
    hamer: "Dévalorisation précise dans le geste du genou : pivoter, plier, encaisser — souvent lié au sport ou au travail physique, ne plus être aussi performant qu'avant", martel: "Amortisseur usé : trop encaisser entre deux forces (deux directions, deux personnes, deux obligations) sans droit de plier",
    sabbah: "Chercher le déclenchant récent (le geste, la contre-performance) ET le programmant : depuis quand dois-je « amortir » pour les autres?",
    questions: ["Dans quel domaine je ne me sens plus aussi performant qu'avant?", "Entre quelles deux forces suis-je l'amortisseur?", "Devant qui refusé-je de plier — ou de ralentir?"],
    pistes: ["Revaloriser la performance actuelle, réelle, sans la comparer à l'ancienne", "Cesser d'être le tampon : nommer les deux forces et se retirer du milieu", "S'autoriser à plier sans que ce soit une défaite"] },
  { id: "kyste-baker", nom: "Kyste de Baker (creux poplité)", sys: "dos", feuillet: "Mésoderme récent",
    hamer: "Phase de réparation d'un conflit de dévalorisation du genou : le corps produit du liquide en réponse — souvent le signe qu'un conflit de soumission ou de performance se répare mais se réactive en boucle (rail)", martel: "Réserve de résistance cachée derrière le genou : la flexion refusée s'accumule — vouloir avancer tout en freinant, plier devant quelqu'un à contrecœur",
    sabbah: "Le liquide évoque aussi les repères : un cycle qui se rejoue — vérifier les dates d'apparition et ce qu'elles rappellent",
    questions: ["Quel conflit autour de ma performance ou de ma soumission se répète en boucle au lieu de se régler pour de bon?", "Devant qui est-ce que je plie extérieurement tout en résistant intérieurement?", "Qu'est-ce que je retiens « derrière » — que personne ne voit?"],
    pistes: ["Identifier le rail qui réactive le conflit et le désamorcer à la source", "Rendre la résistance visible : dire le désaccord au lieu de plier-résister en silence", "Clore le conflit une fois pour toutes plutôt que le laisser se réparer à moitié"] },
  { id: "genoux", nom: "Genoux", sys: "dos", feuillet: "Mésoderme récent",
    hamer: "Dévalorisation dans la soumission ou l'orgueil — difficulté à plier", martel: "« Je-nous » : conflit dans le rapport à soi et au couple ou au collectif (langage des oiseaux)",
    questions: ["Devant quoi ou qui refusé-je de m'incliner?", "Quelle est ma place dans le « nous »?"],
    pistes: ["Accepter de fléchir", "Clarifier sa place relationnelle"] },
  { id: "epaules", nom: "Épaules", sys: "dos", feuillet: "Mésoderme récent",
    hamer: "Fardeau, responsabilité trop lourde", martel: "Tout porter sur ses épaules",
    questions: ["Quelle charge ai-je accepté de porter?"],
    pistes: ["Redistribuer la charge", "Dire non"] },
  { id: "poignets", nom: "Poignets / mains", sys: "dos", feuillet: "Mésoderme récent",
    hamer: "Conflit lié au travail, à la dextérité, à donner et recevoir", martel: "Ne pas arriver à saisir ou à lâcher",
    questions: ["Qu'est-ce que je n'arrive pas à saisir, ou à lâcher?"],
    pistes: ["Identifier ce qui doit être saisi ou relâché"] },
  { id: "arthrose", nom: "Arthrose / articulations", sys: "dos", feuillet: "Mésoderme récent",
    hamer: "Dévalorisation chronique et répétée du geste concerné", martel: "Rigidité, autocritique du mouvement, de la capacité",
    questions: ["Quel geste, quelle capacité ai-je cessé de valoriser?"],
    pistes: ["Revaloriser le geste", "Célébrer la capacité restante"] },
  { id: "aphtes", nom: "Aphtes", sys: "digestif", feuillet: "Ectoderme",
    hamer: "Conflit de la bouche : ne pas pouvoir garder ou recracher « le morceau » — paroles acides retenues", martel: "Mots qui brûlent gardés en bouche, reproches ravalés",
    questions: ["Quelles paroles acides est-ce que je retiens?"],
    pistes: ["Dire la chose difficile avec des mots choisis"] },
  { id: "herpes", nom: "Herpès labial (feu sauvage)", sys: "digestif", feuillet: "Ectoderme",
    hamer: "Conflit de séparation vécu au niveau de la bouche : baiser refusé, contact buccal perdu ou imposé", martel: "Colère ou dégoût lié à un contact rapproché, paroles ou baisers regrettés",
    questions: ["Quel contact rapproché m'a manqué — ou dégoûté?"],
    pistes: ["Clarifier le rapport au contact concerné"] },
  { id: "hemorroides", nom: "Hémorroïdes", sys: "digestif", feuillet: "Ecto/Mésoderme",
    hamer: "Conflit d'identité dans le territoire : qui suis-je chez moi, ma place dans le clan; pression pour évacuer une situation", martel: "Se forcer, pousser trop fort dans une situation, colère assise",
    questions: ["Dans quelle situation est-ce que je force au-delà de mes limites?", "Quelle est ma vraie place dans ma famille ou mon foyer?"],
    pistes: ["Cesser de forcer, renégocier sa place explicitement"] },
  { id: "gorge", nom: "Maux de gorge / angine / laryngite", sys: "digestif", feuillet: "Ectoderme",
    hamer: "Expression empêchée — larynx : frayeur; paroles ravalées", martel: "Colère ou peine tue, cri retenu",
    questions: ["Qu'est-ce que je n'ose pas dire?", "Quel cri je retiens?"],
    pistes: ["Oser exprimer", "Poser des mots sur le ressenti"] },
  { id: "estomac", nom: "Estomac / gastrite / ulcère", sys: "digestif", feuillet: "Endo/Ectoderme",
    hamer: "Contrariété indigérée, contrariété de territoire (petite courbure)", martel: "Ne pas pouvoir avaler ou digérer une situation, une injustice",
    questions: ["Qu'est-ce que je n'arrive pas à digérer, à avaler?"],
    pistes: ["Nommer la contrariété", "Régler le conflit de territoire"] },
  { id: "foie", nom: "Foie", sys: "digestif", feuillet: "Endoderme",
    hamer: "Conflit de manque, peur de manquer du vital", martel: "Colère et frustration rentrées, rancune couvée",
    questions: ["De quoi ai-je peur de manquer?", "Quelle rancune je couve?"],
    pistes: ["Sécuriser le vital", "Exprimer la colère autrement"] },
  { id: "vesicule", nom: "Vésicule biliaire", sys: "digestif", feuillet: "Endoderme",
    hamer: "Rancœur, colère, ressentiment dans le territoire", martel: "Amertume, rancune tenace",
    questions: ["Contre qui ai-je de la rancune?"],
    pistes: ["Travailler le pardon ou la mise à distance"] },
  { id: "intestins", nom: "Intestins (grêle / côlon)", sys: "digestif", feuillet: "Endoderme",
    hamer: "Conflit du « morceau » : chose sale, indigeste, qu'on n'arrive pas à éliminer ou assimiler", martel: "Une « saloperie » vécue qu'on n'arrive pas à évacuer",
    questions: ["Quelle situation « dégueulasse » je n'arrive pas à évacuer?"],
    pistes: ["Verbaliser la situation", "Rituel symbolique d'évacuation"] },
  { id: "transit", nom: "Constipation / diarrhée", sys: "digestif", feuillet: "Endoderme",
    hamer: "Retenir (ne pas vouloir lâcher) vs évacuer vite un danger", martel: "S'accrocher au passé, ou vouloir fuir",
    questions: ["À quoi je m'accroche?", "Qu'est-ce que je veux fuir?"],
    pistes: ["Lâcher prise graduel", "Sécuriser au lieu de fuir"] },
  { id: "dents", nom: "Dents", sys: "digestif", feuillet: "Mésoderme récent",
    hamer: "Incapacité à mordre, à se défendre, à décider", martel: "Agressivité non exprimée, indécision",
    questions: ["Où n'ai-je pas pu « mordre dans la vie » ou me défendre?"],
    pistes: ["S'autoriser à s'affirmer", "Trancher une décision en suspens"] },
  { id: "allergies", nom: "Allergies (pollen, animaux, aliments…)", sys: "respiratoire", feuillet: "Mixte",
    hamer: "L'allergène est un « rail » : il était présent lors d'un choc conflictuel passé, et le corps sonne l'alarme à chaque réexposition", martel: "Une mémoire émotionnelle associée à la substance — la vie perçue comme agressante",
    sabbah: "Retrouver la scène d'origine : où étais-je, avec qui, quand ce déclencheur est devenu menaçant?",
    questions: ["Que se passait-il dans ma vie quand cette allergie est apparue?", "À quoi cette substance peut-elle être associée dans mon histoire?"],
    pistes: ["Identifier la scène d'origine du rail", "Dissocier consciemment la substance du souvenir"] },
  { id: "poumons", nom: "Poumons (alvéoles)", sys: "respiratoire", feuillet: "Endoderme",
    hamer: "Peur de la mort, peur panique pour soi", martel: "Menace vitale ressentie, désespoir de vivre",
    questions: ["Face à quelle menace vitale ai-je paniqué?"],
    pistes: ["Désamorcer la peur archaïque", "Ré-ancrer la sécurité de vivre"] },
  { id: "bronches", nom: "Bronches", sys: "respiratoire", feuillet: "Ectoderme",
    hamer: "Territoire menacé, dispute dans l'espace de vie", martel: "Besoin d'espace pour respirer",
    questions: ["Qui empiète sur mon territoire?"],
    pistes: ["Redéfinir et défendre son espace"] },
  { id: "sinus", nom: "Rhume / sinusite", sys: "respiratoire", feuillet: "Ectoderme",
    hamer: "Conflit de puanteur — quelque chose « ne sent pas bon »", martel: "Une situation qu'on ne peut pas sentir",
    questions: ["Quelle situation « ne me revient pas », que je ne peux pas sentir?"],
    pistes: ["Nommer ce qui pue dans la situation", "S'en éloigner ou l'assainir"] },
  { id: "asthme", nom: "Asthme", sys: "respiratoire", feuillet: "Ectoderme",
    hamer: "Conflit dans l'échange (donner/prendre l'air), dispute et peur mêlées", martel: "Bras de fer avec l'entourage, suffoquer dans la relation",
    questions: ["Avec qui suis-je en lutte au point de suffoquer?"],
    pistes: ["Rééquilibrer l'échange", "Sortir du bras de fer"] },
  { id: "varices", nom: "Varices / jambes lourdes", sys: "cardio", feuillet: "Mésoderme",
    hamer: "Conflit de boulet : traîner une situation lourde, vouloir s'en libérer sans y arriver", martel: "Stagner dans une situation pesante, manquer de liberté de mouvement dans sa vie",
    questions: ["Quelle situation je traîne comme un boulet?", "Où est-ce que je stagne en voulant partir?"],
    pistes: ["Nommer le boulet et planifier sa libération par étapes"] },
  { id: "hypertension", nom: "Hypertension", sys: "cardio", feuillet: "Mixte",
    hamer: "Résistance, pression émotionnelle chronique", martel: "Tension relationnelle permanente, se tenir sous pression",
    questions: ["Sous quelle pression je me tiens en permanence?"],
    pistes: ["Identifier la source de pression et la relâcher"] },
  { id: "sang", nom: "Sang / anémie", sys: "cardio", feuillet: "Mésoderme récent",
    hamer: "Dévalorisation profonde de la lignée, de la famille", martel: "Perte du sentiment d'appartenance — « le sang de la famille », perte de sens (sang/sens)",
    questions: ["Ai-je perdu ma place, ma famille symbolique?"],
    pistes: ["Retisser l'appartenance", "Redonner du sens"] },
  { id: "coeur", nom: "Cœur", sys: "cardio", feuillet: "Ectoderme",
    hamer: "Conflit de territoire (coronaires) ou de submersion affective", martel: "Débordement affectif, cœur trop plein ou trop vide",
    questions: ["Qu'est-ce qui me submerge affectivement?"],
    pistes: ["Poser des limites affectives", "Évacuer le trop-plein"] },
  { id: "reins", nom: "Reins", sys: "urinaire", feuillet: "Endo/Mésoderme",
    hamer: "Effondrement existentiel, conflit du liquide et de l'existence, sentiment de réfugié", martel: "Peur profonde, perte de repères",
    questions: ["Quand ai-je senti que tout s'effondrait, que je perdais pied?"],
    pistes: ["Reconstruire des appuis concrets", "Traverser la peur nommée"] },
  { id: "vessie", nom: "Vessie / cystite", sys: "urinaire", feuillet: "Ectoderme",
    hamer: "Territoire non marqué, colère de ne pas pouvoir marquer sa place", martel: "Frustration de territoire, place non reconnue",
    questions: ["Où ne puis-je pas marquer mon territoire?"],
    pistes: ["Affirmer sa place explicitement"] },
  { id: "yeux", nom: "Yeux (myopie, conjonctivite…)", sys: "sens", feuillet: "Ectoderme",
    hamer: "Refus de voir une réalité; rétine : danger guetté par derrière", martel: "Ce qu'on ne veut plus voir",
    questions: ["Qu'est-ce que je ne veux plus voir?", "Quelle menace je guette?"],
    pistes: ["Regarder la réalité en face, par étapes"] },
  { id: "oreilles", nom: "Oreilles / acouphènes / otites", sys: "sens", feuillet: "Ectoderme",
    hamer: "Ne pas vouloir entendre, ou vouloir attraper une information sonore vitale", martel: "Saturation de bruit ou de paroles",
    questions: ["Qu'est-ce que je ne veux pas entendre?"],
    pistes: ["Nommer ce qui sature", "S'accorder du silence choisi"] },
  { id: "sein", nom: "Sein (glande mammaire)", sys: "repro", feuillet: "Mésoderme ancien",
    hamer: "Conflit du nid : souci dramatique pour un proche, drame au foyer (latéralité mère/enfant vs partenaire)", martel: "Inquiétude maternante, se sacrifier pour le nid",
    questions: ["Pour quel proche du « nid » me suis-je fait un souci dramatique?"],
    pistes: ["Déposer le souci", "Rendre à chacun sa part"] },
  { id: "uterus", nom: "Utérus / ovaires", sys: "repro", feuillet: "Mixte",
    hamer: "Conflit de perte (deuil), de procréation, ou conflit semi-génital", martel: "Perte ou relation qui pèse, féminité blessée",
    questions: ["Quelle perte ou quelle relation me pèse?"],
    pistes: ["Honorer la perte", "Réhabiliter sa féminité"] },
];

/* ─────────────── APPROCHES / AUTEURS ─────────────── */
const APPROCHES = [
  { id: "hamer", nom: "Dr Hamer", sous: "Médecine Nouvelle Germanique", couleur: C.cyan, emoji: "🧠",
    contenu: [
      ["Le DHS", "Tout démarre par un choc conflictuel aigu, dramatique, vécu dans l'isolement et pris à contre-pied. Le choc frappe simultanément le psychisme, le cerveau (foyer de Hamer) et l'organe. Le ressenti précis au moment du choc détermine l'organe touché."],
      ["Les 2 phases", "Phase active (sympathicotonie) : stress, extrémités froides, insomnie, perte d'appétit, ruminations. Phase de réparation (vagotonie) après résolution : chaleur, fatigue intense, inflammation, œdème — avec la crise épileptoïde au pic."],
      ["Système ontogénétique", "Chaque feuillet embryonnaire relie une zone du cerveau, des organes et un type de conflit. Certains tissus prolifèrent en phase active, d'autres s'ulcèrent, puis inversent en réparation."],
      ["Rôle des microbes", "Champignons, mycobactéries et bactéries agiraient sous contrôle du cerveau comme « ouvriers » de nettoyage et de reconstruction pendant la réparation."],
      ["Le sens biologique", "Chaque maladie est un « programme biologique spécial » (SBS) : une réponse d'adaptation héritée de l'évolution, pas une erreur."],
      ["Rails et latéralité", "Les éléments du contexte du DHS (odeur, lieu, personne) deviennent des « rails » qui relancent le conflit. La latéralité (droitier/gaucher) détermine le côté mère-enfant vs partenaire."],
    ] },
  { id: "sabbah", nom: "Claude Sabbah", sous: "Biologie Totale", couleur: C.rose, emoji: "🌳",
    contenu: [
      ["Le projet-sens", "L'inconscient des parents durant la période péri-conceptionnelle (avant la conception jusqu'à ~3 ans) programme l'enfant : attentes, non-dits, deuils et peurs parentaux forment un cadre inconscient structurant."],
      ["Programmant vs déclenchant", "Le conflit programmant installe le terrain (enfance, transgénérationnel); le conflit déclenchant, qui résonne avec le premier, active la maladie. Le décodage relie les deux."],
      ["Cycles biologiques mémorisés", "Des événements marquants se rejouent à intervalles réguliers, calculés à partir de dates-clés de la biographie ou de la lignée."],
      ["Transgénérationnel", "Les conflits non résolus des ancêtres se transmettent et cherchent résolution chez les descendants : dates anniversaires, prénoms, syndrome du gisant."],
      ["Méthodologie", "Entretien partant du symptôme, remontant au ressenti puis aux conflits programmant et déclenchant, via biographie, grossesse, dates et arbre généalogique. La prise de conscience arrête le programme."],
    ] },
  { id: "fleche", nom: "Christian Flèche", sous: "Décodage biologique", couleur: C.lime, emoji: "🪶",
    contenu: [
      ["Étage 1 — Endoderme", "Tonalité vitale et archaïque : manquer de l'essentiel, attraper ou éliminer « le morceau » (air, eau, nourriture, information vitale). Digestif profond, alvéoles pulmonaires."],
      ["Étage 2 — Mésoderme ancien", "Tonalité protection et atteinte à l'intégrité : agression, souillure, besoin de se protéger. Derme, séreuses, glande mammaire."],
      ["Étage 3 — Mésoderme récent", "Tonalité dévalorisation de soi : ne pas être à la hauteur, localisée selon la fonction. Os, articulations, muscles, tendons, sang."],
      ["Étage 4 — Ectoderme", "Tonalité relation : séparation, contact, territoire, peur, communication. Épiderme, muqueuses, ORL, nerfs sensitifs."],
      ["Le ressenti conflictuel", "Ce n'est pas l'événement objectif qui compte, mais le ressenti biologique exact : « se sentir sali », « se sentir lâché ». Deux personnes, même événement, ressentis différents — maladies différentes."],
      ["Accompagnement", "Ramener la personne au ressenti du choc par questionnement précis, le faire verbaliser, prendre conscience. Visualisation, cycles mémorisés, travail sur l'arbre."],
    ] },
  { id: "martel", nom: "Jacques Martel", sous: "Grand dictionnaire des malaises", couleur: C.orange, emoji: "📖",
    contenu: [
      ["Le dictionnaire", "Des centaines de symptômes classés par ordre alphabétique, chacun avec son interprétation psycho-émotionnelle et une piste de libération sous forme d'affirmation nouvelle. La maladie comme message du corps."],
      ["Les 5 étapes", "1. Prise de conscience que le malaise porte un message. 2. Identification de l'émotion et du déclencheur. 3. Acceptation et accueil sans jugement. 4. Libération de la charge (pardon, lâcher-prise, affirmation). 5. Intégration d'un nouveau comportement."],
      ["La technique TIC", "Repérer l'émotion sous-jacente, l'accueillir et la ressentir pleinement sans la refouler, puis la libérer par verbalisation, respiration et intention consciente."],
      ["Le langage des oiseaux", "Entendre le message caché derrière le mot : « maladie » → le mal-a-dit; « genou » → je-nous; « sang » ⇄ « sens » — le corps dit ce que la personne n'a pas dit."],
    ] },
  { id: "rainville", nom: "Claudia Rainville", sous: "Métamédecine", couleur: C.jaune, emoji: "🌷",
    contenu: [
      ["Le principe", "La maladie est un message de l'être intérieur; la guérison passe par l'identification de la cause émotionnelle et un changement d'attitude."],
      ["Le questionnement daté", "« Qu'est-ce que je vivais quand le symptôme est apparu? » « Qu'est-ce que ce symptôme m'empêche — ou m'oblige — de faire? » « À quoi ou à qui ai-je dû renoncer? »"],
      ["La démarche", "Prise de responsabilité, libération (pardon, expression, changement concret), puis transformation durable."],
      ["Symbolique du corps", "Peau = contact; jambes = avancer dans la vie; yeux = ce qu'on ne veut pas voir; oreilles = ce qu'on ne veut pas entendre."],
    ] },
  { id: "mtc", nom: "Médecine chinoise", sous: "5 éléments & organes-émotions", couleur: C.rose, emoji: "☯️",
    contenu: [
      ["Le Qi et le Yin/Yang", "Le Qi est le souffle vital circulant dans les 12 méridiens : sa libre circulation = santé, sa stagnation ou son vide = déséquilibre. Le Yin (froid, repos, intérieur, matière) et le Yang (chaud, mouvement, extérieur, fonction) se tiennent en équilibre dynamique."],
      ["Les 5 éléments", "Bois → Feu → Terre → Métal → Eau s'engendrent (cycle Sheng) et se contrôlent (cycle Ke : le Bois contrôle la Terre, la Terre l'Eau, l'Eau le Feu, le Feu le Métal, le Métal le Bois). Chaque élément porte un organe, une émotion, une saison, une couleur et une saveur."],
      ["Organes-émotions", "Bois — Foie/Vésicule : colère, frustration (printemps, vert, acide). Feu — Cœur/Intestin grêle : joie excessive, agitation (été, rouge, amer). Terre — Rate/Estomac : rumination, soucis (fin d'été, jaune, doux). Métal — Poumon/Gros intestin : tristesse, deuil (automne, blanc, piquant). Eau — Rein/Vessie : peur, volonté (hiver, noir, salé)."],
      ["L'horloge des méridiens", "Chaque organe a sa plage de 2 h : 3-5 h Poumon · 5-7 h Gros intestin · 7-9 h Estomac · 9-11 h Rate · 11-13 h Cœur · 13-15 h Intestin grêle · 15-17 h Vessie · 17-19 h Rein · 19-21 h Maître-cœur · 21-23 h Triple réchauffeur · 23-1 h Vésicule biliaire · 1-3 h Foie. Un réveil nocturne récurrent à heure fixe pointe vers l'organe de la plage."],
      ["Les axes diagnostiques", "Vide (xu) ou plénitude (shi), chaleur (re) ou froid (han), humidité (shi) ou sécheresse (zao) : trois axes qui qualifient chaque déséquilibre et orientent le rééquilibrage."],
      ["Le rééquilibrage", "Alimentation énergétique par saveurs et natures thermiques, respect des saisons, points d'acupression (ST36, SP6, HT7, LI4…), respiration au Dan Tian et qi gong de l'organe concerné."],
    ] },
  { id: "sebi", nom: "Dr. Sebi", sous: "Approche alcaline", couleur: C.lime, emoji: "🌿",
    contenu: [
      ["L'homme", "Alfredo Bowman (1933-2016), herboriste autodidacte hondurien d'origine garifuna, créateur de la méthode « African Bio-Mineral Balance ». Poursuivi à New York en 1988 pour ses publicités affirmant guérir des maladies, il fut acquitté — un acquittement pénal, pas une validation médicale. Décédé en détention au Honduras en 2016."],
      ["Sa théorie", "Le mucus serait à l'origine des maladies; un terrain acide favoriserait la maladie, un terrain alcalin la préviendrait. Il prônait des aliments « électriques » : naturels, alcalins, non hybrides. À savoir : la science établit que le pH sanguin reste régulé entre 7,35 et 7,45 peu importe l'alimentation — ses affirmations de guérison n'ont aucune preuve."],
      ["Le guide nutritionnel", "Grains alcalins : fonio, quinoa, épeautre, teff, kamut, riz sauvage, amarante. Légumes : kale, pissenlit, courgette, concombre, courges, gombo, oignon. Fruits : baies, mangue, papaye, figues, dattes, melons. Beaucoup d'eau de source."],
      ["Les plantes signature", "Sea moss (mousse d'Irlande, minéraux), bladderwrack (fucus), bardane (burdock), salsepareille (sarsaparilla), pissenlit, chardon-Marie, sureau (elderberry)."],
      ["Les exclusions", "Aliments hybrides (dont le maïs), amidons raffinés, viande, poisson, produits laitiers, œufs, blé, sucre raffiné, alcool, transformés — tous jugés acidifiants et producteurs de mucus dans sa logique."],
      ["Jeûne et détox", "Jeûnes et cures combinés à ses composés herbaux pour « nettoyer » le mucus et alcaliniser le terrain."],
    ] },
];

/* ─────────────── SYSTEM PROMPT DU MODE IA ─────────────── */
const SYSTEM_PROMPT = `Tu es le guide de décodage de l'application « Zone — Décodage du corps », créée par Joey (ZoneTotalSport). Tu accompagnes l'utilisateur dans l'exploration du sens émotionnel de ses symptômes physiques selon sept approches : Dr Hamer (Médecine Nouvelle Germanique — DHS, 5 lois, feuillets embryonnaires, phases), Claude Sabbah (Biologie Totale — projet-sens, conflit programmant vs déclenchant, transgénérationnel, cycles mémorisés), Christian Flèche (décodage biologique — 4 étages de conflits, ressenti conflictuel), Jacques Martel (dictionnaire malaises-émotions, langage des oiseaux, 5 étapes, technique TIC), Claudia Rainville (Métamédecine — questionnement daté, symbolique du corps), la Médecine traditionnelle chinoise (5 éléments Bois/Feu/Terre/Métal/Eau, correspondance organes-émotions : Foie=colère, Cœur=joie excessive, Rate=rumination, Poumon=tristesse, Rein=peur; Yin/Yang, vide/plénitude, chaleur/froid, humidité; horloge des méridiens par plages de 2 h; rééquilibrage par alimentation énergétique, saisons, points d'acupression, respiration et qi gong) et Dr. Sebi (approche alcaline : le mucus et l'acidité comme terrain, aliments « électriques », grains alcalins comme quinoa/fonio/épeautre/teff, plantes signature : sea moss, bladderwrack, bardane, salsepareille, pissenlit, sureau; exclusion des transformés, laitages, viandes et hybrides).

ANALYSE EXHAUSTIVE OBLIGATOIRE : le texte de l'utilisateur peut contenir plusieurs symptômes, des mots chargés, des blessures émotionnelles, des situations de vie, des dates, des côtés du corps (droite/gauche), des personnes. Tu dois TOUT prendre en compte : chaque symptôme nommé, chaque mot significatif (décode-les aussi par le langage des oiseaux quand ça s'applique), chaque détail de contexte. Si plusieurs symptômes ou éléments sont écrits, chaque texte d'interprétation les couvre TOUS, un par un, et cherche aussi le lien entre eux (les conflits qui les relient selon chaque approche). Ne laisse rien de côté : donne toutes les interprétations et toutes les solutions possibles en fonction de ce qui est écrit, même quand l'entrée n'est pas un symptôme physique (une blessure émotionnelle, un mot, un rêve, une situation — décode-la avec les mêmes grilles). IMPORTANT : chaque champ "texte" fait 2 à 4 phrases maximum, denses — le JSON doit TOUJOURS être complet et fermé.

FORMAT DE RÉPONSE OBLIGATOIRE : réponds UNIQUEMENT avec un objet JSON valide, sans backticks, sans texte avant ou après, avec exactement cette structure :
{"intro":"1-2 phrases chaleureuses sur le symptôme et son sens général","interpretations":[{"auteur":"Hamer","emoji":"🧠","texte":"feuillet embryonnaire, type de conflit biologique, sens biologique"},{"auteur":"Flèche","emoji":"🪶","texte":"étage, tonalité, ressenti conflictuel typique"},{"auteur":"Sabbah","emoji":"🌳","texte":"piste programmant/déclenchant, angle transgénérationnel"},{"auteur":"Martel","emoji":"📖","texte":"émotion du dictionnaire + langage des oiseaux si applicable"},{"auteur":"Rainville","emoji":"🌷","texte":"symbolique du corps + sa question datée typique"},{"auteur":"Médecine chinoise","emoji":"☯️","texte":"élément et organe (Zang/Fu), émotion associée, déséquilibre (vide/plénitude, chaleur/froid, humidité), plage de l'horloge des méridiens si pertinente"},{"auteur":"Dr. Sebi","emoji":"🌿","texte":"lecture terrain acidité/mucus de ce symptôme selon son approche"}],"solutions":[{"auteur":"Hamer / Flèche","emoji":"🧠","texte":"résolution du conflit, verbalisation du ressenti"},{"auteur":"Sabbah","emoji":"🌳","texte":"prise de conscience du cycle, travail sur l'arbre"},{"auteur":"Martel","emoji":"📖","texte":"les 5 étapes appliquées + une affirmation nouvelle concrète"},{"auteur":"Rainville","emoji":"🌷","texte":"changement d'attitude concret"},{"auteur":"Médecine chinoise","emoji":"☯️","texte":"rééquilibrage concret : aliments énergétiques précis, 1-2 points d'acupression nommés (ex. ST36, HT7), respiration ou qi gong adapté"},{"auteur":"Dr. Sebi","emoji":"🌿","texte":"aliments alcalins et plantes précises de son guide pour ce symptôme, aliments à retirer"}],"question":"UNE question d'introspection, la plus pertinente pour ce symptôme"}

Si l'utilisateur répond ensuite à la question, renvoie le MÊME format JSON (avec "mode":"decodage") mais avec des interprétations et solutions AFFINÉES selon ses éléments personnels, et une nouvelle question qui creuse plus loin.

Le message peut contenir « Approches qui m'interpellent le plus : … ». Dans ce cas, oriente davantage les textes vers CES approches (plus détaillées, plus personnalisées), mais donne quand même les réponses pour TOUTES les approches.

MODE GUÉRISON : si le message commence par « GUÉRISON », renvoie UNIQUEMENT ce JSON (sans backticks) :
{"mode":"guerison","intro":"1-2 phrases sur la blessure émotionnelle identifiée","questions":["4 à 6 questions puissantes à se poser pour aller au cœur de la blessure, inspirées des approches qui l'interpellent"],"actions":[{"auteur":"nom de l'approche","emoji":"…","texte":"quoi faire ICI ET MAINTENANT selon cette approche : geste concret, verbalisation, étape précise"}],"affirmation":"une affirmation nouvelle style Martel, personnalisée au vécu partagé"}
Les actions couvrent toutes les approches mais commencent par celles qui l'interpellent, avec plus de profondeur.
Ajoute "mode":"decodage" au JSON standard de décodage.
Textes courts et denses, tutoiement, français québécois naturel.

RÈGLE UNIQUE DE SÉCURITÉ : si le symptôme décrit sonne comme une urgence médicale (douleur thoracique intense, masse nouvelle, saignement inhabituel, symptômes neurologiques soudains, détresse respiratoire), mentionne UNE SEULE FOIS, en une phrase brève au début, que ce type de symptôme mérite une évaluation médicale rapide, puis poursuis le décodage normalement. Ne répète jamais cette mention et n'ajoute aucun autre avertissement médical dans la conversation.`;

/* ─────────────── COMPOSANTS ─────────────── */
function Carte({ children, couleur = C.cyan, style = {} }) {
  return (
    <div style={{
      background: C.blanc, border: `3px solid ${C.marine}`, borderRadius: 14,
      boxShadow: `5px 5px 0 ${couleur}`, padding: 16, marginBottom: 16, ...style
    }}>{children}</div>
  );
}

function BoutonCyan({ children, onClick, disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily: "'ZoneTotalSport','Luckiest Guy',cursive", fontSize: 18, letterSpacing: ".5px",
      padding: "10px 20px", cursor: "pointer", color: C.marine,
      background: C.cyan, border: `3px solid ${C.marine}`, borderRadius: 10,
      boxShadow: `4px 4px 0 ${C.marineFonce}`, ...style
    }}>{children}</button>
  );
}

function Chat({ prefill = "" }) {
  const [historique, setHistorique] = useState([]); // messages API
  const [resultat, setResultat] = useState(null);   // dernier JSON parsé
  const [symptome, setSymptome] = useState(prefill);
  const [reponse, setReponse] = useState("");
  const [interpelle, setInterpelle] = useState([]); // auteurs cochés
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState(null);
  const sessionRef = useRef(null);
  const hautRef = useRef(null);

  useEffect(() => { hautRef.current?.scrollIntoView({ behavior: "smooth" }); }, [resultat, loading]);

  const sauver = async () => {
    const s = sessionRef.current;
    if (!s) return;
    try { await window.storage.set(`decodage:${s.id}`, JSON.stringify(s)); } catch (e) { /* best-effort */ }
  };

  const cocher = (auteur) => {
    setInterpelle(prev => prev.includes(auteur) ? prev.filter(a => a !== auteur) : [...prev, auteur]);
  };

  const noteInterpelle = () => interpelle.length ? `\n\nApproches qui m'interpellent le plus : ${interpelle.join(", ")}.` : "";

  const appeler = async (msgs, demandeUtilisateur) => {
    setLoading(true); setErreur(null);
    let ok = false;
    for (let essai = 0; essai < 2 && !ok; essai++) {
      try {
        const res = await fetch("https://api.zonetotalsport.ca/decodage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ max_tokens: 8000, system: SYSTEM_PROMPT, messages: msgs }),
        });
        const data = await res.json();
        const brut = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
        const debut = brut.indexOf("{"), fin = brut.lastIndexOf("}");
        if (debut === -1 || fin === -1) throw new Error("pas de JSON");
        const json = JSON.parse(brut.slice(debut, fin + 1));
        setHistorique([...msgs, { role: "assistant", content: brut }]);
        setResultat(json);
        if (sessionRef.current) {
          sessionRef.current.echanges.push({ quand: new Date().toISOString(), demande: demandeUtilisateur, interpelle: [...interpelle], resultat: json });
          await sauver();
        }
        ok = true;
      } catch (e) {
        if (essai === 1) setErreur("Le décodage n'a pas abouti — réessaie.");
      }
    }
    setLoading(false);
  };

  const decoder = () => {
    const t = symptome.trim();
    if (!t || loading) return;
    sessionRef.current = { id: Date.now(), date: new Date().toISOString(), symptome: t, echanges: [] };
    appeler([{ role: "user", content: `Mon symptôme : ${t}` }], t);
  };

  const approfondir = () => {
    const t = reponse.trim();
    if (!t || loading) return;
    setReponse("");
    appeler([...historique, { role: "user", content: t + noteInterpelle() }], t);
  };

  const guerir = () => {
    if (loading) return;
    appeler([...historique, { role: "user", content: `GUÉRISON — guide-moi ici et maintenant pour me libérer émotionnellement de cette blessure.${noteInterpelle()}` }], "Guide-moi vers la guérison");
  };

  const recommencer = () => { setHistorique([]); setResultat(null); setSymptome(""); setReponse(""); setInterpelle([]); setErreur(null); sessionRef.current = null; };

  const champ = {
    width: "100%", boxSizing: "border-box", fontFamily: "Nunito", fontWeight: 600, fontSize: 16,
    padding: "12px 14px", border: `3px solid ${C.marine}`, borderRadius: 10, outline: "none",
    background: C.blanc, color: C.marine, resize: "vertical",
  };

  /* ── Écran 1 : Commençons ── */
  if (!resultat && !loading) {
    return (
      <div style={{ paddingTop: 8 }}>
        <div className="zts-titre" style={{ fontSize: 30, color: C.blanc, textShadow: `3px 3px 0 #000`, textAlign: "center" }}>COMMENÇONS!</div>
        <Carte couleur={C.jaune} style={{ marginTop: 14 }}>
          <div className="zts-titre" style={{ fontSize: 21, color: C.marine, marginBottom: 10 }}>QUEL EST TON SYMPTÔME?</div>
          <p style={{ margin: "0 0 10px", fontSize: 14.5, fontWeight: 700, color: "#5b7396" }}>Écris tout ce que tu veux : un ou plusieurs symptômes, une blessure émotionnelle, un mot, une situation — avec les détails (côté, depuis quand, ce qui se passait). Tout ce qui est écrit sera analysé.</p>
          <textarea value={symptome} onChange={e => setSymptome(e.target.value)} rows={4}
            placeholder="Ex. : ménisque déchiré et kyste de Baker au genou droit depuis le printemps, en plus je dors mal…" style={champ} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "10px 0" }}>
            {["Mal au genou droit", "Eczéma sur les mains", "Maux de gorge à répétition", "Prise de poids"].map(s => (
              <button key={s} onClick={() => setSymptome(s)} style={{
                fontFamily: "Nunito", fontWeight: 700, fontSize: 13.5, background: "#E5FAFF",
                border: `2px solid ${C.cyan}`, borderRadius: 10, padding: "5px 10px", cursor: "pointer", color: C.marine }}>{s}</button>
            ))}
          </div>
          <BoutonCyan onClick={decoder} style={{ width: "100%" }}>DÉCODER MON SYMPTÔME</BoutonCyan>
          {erreur && <p style={{ color: C.rose, fontWeight: 700, marginTop: 8 }}>{erreur}</p>}
        </Carte>
      </div>
    );
  }

  /* ── Chargement ── */
  if (loading) {
    return (
      <div style={{ textAlign: "center", paddingTop: 60 }}>
        <div style={{ fontSize: 50 }}>🧭</div>
        <div className="zts-titre" style={{ fontSize: 24, color: C.jaune, textShadow: `2px 2px 0 #000` }}>JE DÉCODE…</div>
        <p style={{ color: "#bfe9ff", fontWeight: 700 }}>Hamer, Flèche, Sabbah, Martel et Rainville se penchent sur ton cas ✍️</p>
      </div>
    );
  }

  /* ── Écran guérison ── */
  if (resultat.mode === "guerison") {
    return (
      <div style={{ overflowY: "auto", paddingBottom: 8 }}>
        <div ref={hautRef} />
        <div className="zts-titre" style={{ fontSize: 26, color: C.blanc, textShadow: `2px 2px 0 #000`, margin: "4px 0 10px", textAlign: "center" }}>
          🌅 ICI ET MAINTENANT
        </div>
        <Carte couleur={C.cyan}><p style={{ margin: 0, fontWeight: 700 }}>{resultat.intro}</p></Carte>

        <Carte couleur={C.jaune}>
          <div className="zts-titre" style={{ fontSize: 18, color: C.marine, marginBottom: 6 }}>💭 LES QUESTIONS À TE POSER</div>
          {resultat.questions?.map((q, i) => (
            <p key={i} style={{ margin: "6px 0", lineHeight: 1.5 }}><b style={{ color: "#d68500" }}>{i + 1}.</b> {q}</p>
          ))}
        </Carte>

        <div className="zts-titre" style={{ fontSize: 20, color: C.blanc, textShadow: `2px 2px 0 #000`, margin: "8px 0 10px" }}>
          🛠️ CE QUE TU PEUX FAIRE MAINTENANT
        </div>
        {resultat.actions?.map((a, i) => (
          <Carte key={i} couleur={[C.lime, C.rose, C.orange, C.cyan, C.jaune][i % 5]}>
            <div className="zts-titre" style={{ fontSize: 16, color: C.marine, marginBottom: 4 }}>{a.emoji} {a.auteur?.toUpperCase()}</div>
            <p style={{ margin: 0, lineHeight: 1.5 }}>{a.texte}</p>
          </Carte>
        ))}

        {resultat.affirmation && (
          <Carte couleur={C.rose} style={{ background: "#FFF4F9" }}>
            <div className="zts-titre" style={{ fontSize: 17, color: C.rose, marginBottom: 4 }}>💗 TON AFFIRMATION NOUVELLE</div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 17, lineHeight: 1.5, fontStyle: "italic" }}>« {resultat.affirmation} »</p>
          </Carte>
        )}
        <BoutonCyan onClick={recommencer} style={{ width: "100%", background: C.orange }}>NOUVEAU SYMPTÔME</BoutonCyan>
        {erreur && <p style={{ color: C.rose, fontWeight: 700, marginTop: 8 }}>{erreur}</p>}
      </div>
    );
  }

  /* ── Écran 2 : résultats du décodage ── */
  return (
    <div style={{ overflowY: "auto", paddingBottom: 8 }}>
      <div ref={hautRef} />
      <Carte couleur={C.cyan}>
        <p style={{ margin: 0, fontWeight: 700 }}>{resultat.intro}</p>
      </Carte>

      <div className="zts-titre" style={{ fontSize: 22, color: C.blanc, textShadow: `2px 2px 0 #000`, margin: "4px 0 4px" }}>
        🔍 SELON CHAQUE APPROCHE
      </div>
      <p style={{ color: "#bfe9ff", fontWeight: 700, margin: "0 0 10px", fontSize: 14 }}>
        Coche ✓ les approches qui t'interpellent — la suite du décodage et la guérison s'ajusteront à toi.
      </p>
      {resultat.interpretations?.map((it, i) => {
        const actif = interpelle.includes(it.auteur);
        return (
          <Carte key={i} couleur={[C.cyan, C.lime, C.rose, C.orange, C.jaune][i % 5]}
            style={actif ? { background: "#FFFDE0", borderColor: "#d68500" } : {}}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div className="zts-titre" style={{ fontSize: 17, color: C.marine }}>{it.emoji} {it.auteur?.toUpperCase()}</div>
              <button onClick={() => cocher(it.auteur)} aria-pressed={actif} style={{
                fontFamily: "Nunito", fontWeight: 800, fontSize: 13, whiteSpace: "nowrap", cursor: "pointer",
                background: actif ? C.jaune : C.blanc, color: C.marine,
                border: `2.5px solid ${C.marine}`, borderRadius: 10, padding: "4px 10px",
                boxShadow: actif ? `2.5px 2.5px 0 ${C.marineFonce}` : "none" }}>
                {actif ? "✓ ÇA M'INTERPELLE" : "☐ Ça m'interpelle"}
              </button>
            </div>
            <p style={{ margin: "6px 0 0", lineHeight: 1.5 }}>{it.texte}</p>
          </Carte>
        );
      })}

      <div className="zts-titre" style={{ fontSize: 22, color: C.blanc, textShadow: `2px 2px 0 #000`, margin: "8px 0 10px" }}>
        ✨ LES SOLUTIONS SELON CHAQUE APPROCHE
      </div>
      {resultat.solutions?.map((so, i) => (
        <Carte key={i} couleur={[C.lime, C.rose, C.orange, C.jaune][i % 4]}>
          <div className="zts-titre" style={{ fontSize: 17, color: C.marine, marginBottom: 4 }}>{so.emoji} {so.auteur?.toUpperCase()}</div>
          <p style={{ margin: 0, lineHeight: 1.5 }}>{so.texte}</p>
        </Carte>
      ))}

      {resultat.question && (
        <Carte couleur={C.jaune}>
          <div className="zts-titre" style={{ fontSize: 18, color: C.marine, marginBottom: 8 }}>💭 POUR ALLER PLUS LOIN</div>
          <p style={{ margin: "0 0 10px", fontWeight: 700 }}>{resultat.question}</p>
          <textarea value={reponse} onChange={e => setReponse(e.target.value)} rows={3}
            placeholder="Écris ta réponse ici, dans tes mots…" style={champ} />
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <BoutonCyan onClick={approfondir} style={{ flex: "1 1 45%" }}>APPROFONDIR</BoutonCyan>
            <BoutonCyan onClick={guerir} style={{ flex: "1 1 45%", background: C.lime }}>🌅 GUIDE-MOI VERS LA GUÉRISON</BoutonCyan>
            <BoutonCyan onClick={recommencer} style={{ flex: "1 1 100%", background: C.orange, fontSize: 15 }}>NOUVEAU SYMPTÔME</BoutonCyan>
          </div>
          {erreur && <p style={{ color: C.rose, fontWeight: 700, marginTop: 8 }}>{erreur}</p>}
        </Carte>
      )}
    </div>
  );
}

function Historique() {
  const [sessions, setSessions] = useState(null);
  const [ouvert, setOuvert] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const liste = await window.storage.list("decodage:");
        const cles = liste?.keys || [];
        const charges = [];
        for (const k of cles) {
          try {
            const r = await window.storage.get(k.key || k);
            if (r?.value) charges.push(JSON.parse(r.value));
          } catch (e) { /* clé illisible, on saute */ }
        }
        charges.sort((a, b) => b.id - a.id);
        setSessions(charges);
      } catch (e) { setSessions([]); }
    })();
  }, []);

  const effacer = async (id) => {
    try { await window.storage.delete(`decodage:${id}`); } catch (e) {}
    setSessions(s => s.filter(x => x.id !== id));
  };

  const dateFr = (iso) => new Date(iso).toLocaleString("fr-CA", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (sessions === null) return <p style={{ color: "#bfe9ff", fontWeight: 700, textAlign: "center", paddingTop: 30 }}>Chargement…</p>;
  if (sessions.length === 0) return (
    <div style={{ textAlign: "center", paddingTop: 40 }}>
      <div style={{ fontSize: 44 }}>🗂️</div>
      <div className="zts-titre" style={{ fontSize: 22, color: C.blanc, textShadow: "2px 2px 0 #000" }}>AUCUN DÉCODAGE ENCORE</div>
      <p style={{ color: "#bfe9ff", fontWeight: 700 }}>Tes recherches, leurs dates et tes réponses apparaîtront ici automatiquement.</p>
    </div>
  );

  return (
    <div>
      <div className="zts-titre" style={{ fontSize: 24, color: C.blanc, textShadow: "2px 2px 0 #000", marginBottom: 12, textAlign: "center" }}>🗂️ TON HISTORIQUE</div>
      {sessions.map(s => {
        const estOuvert = ouvert === s.id;
        return (
          <Carte key={s.id} couleur={C.cyan} style={{ padding: 0, overflow: "hidden" }}>
            <div onClick={() => setOuvert(estOuvert ? null : s.id)} style={{ padding: 14, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div>
                <div className="zts-titre" style={{ fontSize: 17, color: C.marine }}>{s.symptome}</div>
                <div style={{ fontSize: 13, color: "#5b7396", fontWeight: 700 }}>📅 {dateFr(s.date)} · {s.echanges.length} échange{s.echanges.length > 1 ? "s" : ""}</div>
              </div>
              <div className="zts-titre" style={{ fontSize: 24, color: C.marine }}>{estOuvert ? "−" : "+"}</div>
            </div>
            {estOuvert && (
              <div style={{ padding: "0 14px 14px", borderTop: `2px dashed ${C.cyan}` }}>
                {s.echanges.map((e, i) => (
                  <div key={i} style={{ margin: "12px 0", paddingLeft: 10, borderLeft: `4px solid ${[C.cyan, C.lime, C.orange, C.rose][i % 4]}` }}>
                    <div style={{ fontSize: 12.5, color: "#5b7396", fontWeight: 800 }}>{dateFr(e.quand)}</div>
                    <p style={{ margin: "4px 0", fontWeight: 800 }}>✍️ Toi : {e.demande}</p>
                    {e.interpelle?.length > 0 && <p style={{ margin: "2px 0", fontSize: 13.5, fontWeight: 700, color: "#d68500" }}>✓ T'interpellaient : {e.interpelle.join(", ")}</p>}
                    {e.resultat?.mode === "guerison" ? (
                      <div style={{ fontSize: 14.5 }}>
                        <p style={{ margin: "4px 0", fontWeight: 700 }}>🌅 Guérison — {e.resultat.intro}</p>
                        {e.resultat.questions?.map((q, j) => <p key={j} style={{ margin: "2px 0 2px 10px" }}>💭 {q}</p>)}
                        {e.resultat.actions?.map((a, j) => <p key={j} style={{ margin: "2px 0 2px 10px" }}>{a.emoji} <b>{a.auteur} :</b> {a.texte}</p>)}
                        {e.resultat.affirmation && <p style={{ margin: "4px 0", fontStyle: "italic", fontWeight: 700 }}>💗 « {e.resultat.affirmation} »</p>}
                      </div>
                    ) : (
                      <div style={{ fontSize: 14.5 }}>
                        {e.resultat?.intro && <p style={{ margin: "4px 0", fontWeight: 700 }}>{e.resultat.intro}</p>}
                        {e.resultat?.interpretations?.map((it, j) => <p key={j} style={{ margin: "2px 0 2px 10px" }}>{it.emoji} <b>{it.auteur} :</b> {it.texte}</p>)}
                        {e.resultat?.solutions?.length > 0 && <p style={{ margin: "4px 0 2px", fontWeight: 800 }}>✨ Solutions :</p>}
                        {e.resultat?.solutions?.map((so, j) => <p key={j} style={{ margin: "2px 0 2px 10px" }}>{so.emoji} <b>{so.auteur} :</b> {so.texte}</p>)}
                        {e.resultat?.question && <p style={{ margin: "4px 0", fontWeight: 700 }}>💭 {e.resultat.question}</p>}
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={() => effacer(s.id)} style={{
                  fontFamily: "Nunito", fontWeight: 800, fontSize: 13, cursor: "pointer",
                  background: "#FFE8F1", color: C.rose, border: `2px solid ${C.rose}`,
                  borderRadius: 10, padding: "5px 12px" }}>🗑️ Effacer ce décodage</button>
              </div>
            )}
          </Carte>
        );
      })}
    </div>
  );
}

function Dictionnaire({ decoderPhrase }) {
  const [recherche, setRecherche] = useState("");
  const [sysActif, setSysActif] = useState(null);
  const [ouvert, setOuvert] = useState(null);

  const normaliser = (t) => (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const ALIAS = {
    "kyste-baker": "kist baker kyste poplite derriere genou liquide",
    "menisque": "menisque dechirure dechire genou cartilage",
    "genoux": "genou rotule",
    "lombaires": "lombaire lumbago bas dos rein tour",
    "sciatique": "nerf sciatique jambe",
    "gorge": "angine laryngite pharyngite voix",
    "sinus": "rhume sinusite nez congestion",
    "herpes": "feu sauvage bouton fievre levre",
    "hemorroides": "hemoroide hemorroide anus",
    "migraine": "mal tete cephalee crane",
    "fatigue": "epuisement burnout brule",
    "machoire": "bruxisme grincer dents atm",
    "transit": "constipation diarrhee selles",
    "surpoids": "gros poids obesite maigrir",
    "thyroide": "hypothyroidie hyperthyroidie cou",
    "diabete": "sucre glycemie insuline",
    "arthrose": "arthrite articulation raideur",
    "tendinite": "tendon epicondylite",
    "yeux": "oeil vision myopie conjonctivite orgelet",
    "oreilles": "oreille acouphene otite surdite",
  };

  const MOTS_VIDES = new Set(["les","des","une","aux","mon","mes","ton","tes","son","ses","que","qui","est","ai","jai","avec","pour","dans","sur","depuis","gauche","droit","droite","interne","externe","petit","petite","gros","grosse","tres","plus"]);

  const filtres = (() => {
    const q = normaliser(recherche).trim();
    const base = DICO.filter(d => !sysActif || d.sys === sysActif);
    if (!q) return base;
    const mots = q.split(/[^a-z0-9]+/).filter(m => m.length > 2 && !MOTS_VIDES.has(m));
    if (mots.length === 0) return base.filter(d => normaliser(d.nom).includes(q));
    const scores = base.map(d => {
      const nom = normaliser(d.nom + " " + (ALIAS[d.id] || ""));
      const meule = normaliser([d.nom, d.hamer, d.martel, d.sabbah, ALIAS[d.id]].join(" "));
      let score = 0;
      for (const m of mots) {
        if (nom.includes(m)) score += 3;        // mot dans le nom ou l'alias : fort
        else if (meule.includes(m)) score += 1; // mot dans le contenu : faible
      }
      return { d, score };
    }).filter(x => x.score > 0);
    scores.sort((a, b) => b.score - a.score);
    return scores.map(x => x.d);
  })();

  return (
    <div>
      <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔍 Écris tes symptômes… (un ou plusieurs)"
        style={{ width: "100%", boxSizing: "border-box", fontFamily: "Nunito", fontWeight: 600, fontSize: 16, padding: "10px 14px",
          border: `3px solid ${C.marine}`, borderRadius: 10, marginBottom: 8, background: C.blanc, color: C.marine }} />
      {recherche.trim().length > 2 && (
        <BoutonCyan onClick={() => decoderPhrase(recherche)} style={{ width: "100%", marginBottom: 12, background: C.lime, fontSize: 16 }}>
          🧭 DÉCODER TOUT ÇA AVEC L'IA
        </BoutonCyan>
      )}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 8 }}>
        <button onClick={() => setSysActif(null)} style={{
          fontFamily: "Nunito", fontWeight: 800, fontSize: 13.5, whiteSpace: "nowrap", padding: "6px 12px", cursor: "pointer",
          background: !sysActif ? C.jaune : C.blanc, color: C.marine,
          border: `2.5px solid ${C.marine}`, borderRadius: 10, boxShadow: `2.5px 2.5px 0 ${C.marineFonce}` }}>Tous</button>
        {Object.entries(SYSTEMES).map(([k, s]) => (
          <button key={k} onClick={() => setSysActif(sysActif === k ? null : k)} style={{
            fontFamily: "Nunito", fontWeight: 800, fontSize: 13.5, whiteSpace: "nowrap", padding: "6px 12px", cursor: "pointer",
            background: sysActif === k ? s.couleur : C.blanc, color: C.marine,
            border: `2.5px solid ${C.marine}`, borderRadius: 10, boxShadow: `2.5px 2.5px 0 ${C.marineFonce}` }}>{s.emoji} {s.nom}</button>
        ))}
      </div>
      {filtres.map(d => {
        const s = SYSTEMES[d.sys];
        const estOuvert = ouvert === d.id;
        return (
          <Carte key={d.id} couleur={s.couleur} style={{ cursor: "pointer", padding: 0, overflow: "hidden" }}>
            <div onClick={() => setOuvert(estOuvert ? null : d.id)} style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="zts-titre" style={{ fontSize: 18, color: C.marine }}>{s.emoji} {d.nom}</div>
                <div style={{ fontSize: 13, color: "#5b7396", fontWeight: 700 }}>{d.feuillet}</div>
              </div>
              <div className="zts-titre" style={{ fontSize: 24, color: C.marine }}>{estOuvert ? "−" : "+"}</div>
            </div>
            {estOuvert && (
              <div style={{ padding: "0 14px 14px", borderTop: `2px dashed ${C.cyan}` }}>
                <p style={{ margin: "10px 0 6px" }}><b style={{ color: "#0090c9" }}>Hamer / Flèche :</b> {d.hamer}</p>
                <p style={{ margin: "6px 0" }}><b style={{ color: "#d68500" }}>Martel / Rainville :</b> {d.martel}</p>
                {d.sabbah && <p style={{ margin: "6px 0" }}><b style={{ color: C.rose }}>Sabbah :</b> {d.sabbah}</p>}
                <p style={{ margin: "6px 0" }}><b style={{ color: "#b0006f" }}>Médecine chinoise :</b> {MTC_SYS[d.sys]}</p>
                <p style={{ margin: "6px 0" }}><b style={{ color: "#4a9500" }}>Dr. Sebi :</b> {SEBI_SYS[d.sys]}</p>
                <p className="zts-titre" style={{ margin: "10px 0 4px", color: C.marine }}>QUESTIONS D'INTROSPECTION</p>
                {d.questions.map((q, i) => <p key={i} style={{ margin: "3px 0 3px 12px" }}>• {q}</p>)}
                <p className="zts-titre" style={{ margin: "10px 0 4px", color: "#4a9500" }}>PISTES DE LIBÉRATION</p>
                {d.pistes.map((p, i) => <p key={i} style={{ margin: "3px 0 3px 12px" }}>• {p}</p>)}
              </div>
            )}
          </Carte>
        );
      })}
      {filtres.length === 0 && <p style={{ textAlign: "center", color: C.blanc, fontWeight: 700 }}>Aucun résultat — essaie le mode Décodage guidé, l'IA connaît bien plus de symptômes.</p>}
    </div>
  );
}

function Approches() {
  const [actif, setActif] = useState(null);
  if (actif) {
    const a = APPROCHES.find(x => x.id === actif);
    return (
      <div>
        <BoutonCyan onClick={() => setActif(null)} style={{ fontSize: 15, padding: "6px 14px", marginBottom: 14 }}>← RETOUR</BoutonCyan>
        <div className="zts-titre" style={{ fontSize: 26, color: C.blanc, textShadow: `2px 2px 0 ${C.marineFonce}` }}>{a.emoji} {a.nom.toUpperCase()}</div>
        <div style={{ color: "#bfe9ff", marginBottom: 14, fontWeight: 700 }}>{a.sous}</div>
        {a.contenu.map(([titre, texte], i) => (
          <Carte key={i} couleur={a.couleur}>
            <div className="zts-titre" style={{ fontSize: 17, color: C.marine, marginBottom: 6 }}>{titre.toUpperCase()}</div>
            <p style={{ margin: 0, lineHeight: 1.55 }}>{texte}</p>
          </Carte>
        ))}
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {APPROCHES.map(a => (
        <div key={a.id} onClick={() => setActif(a.id)} style={{
          background: a.aVenir ? "#dbe7f5" : C.blanc, border: `3px solid ${C.marine}`, borderRadius: 14,
          boxShadow: `4px 4px 0 ${a.couleur}`, padding: 14, cursor: "pointer", textAlign: "center",
          opacity: a.aVenir ? 0.75 : 1 }}>
          <div style={{ fontSize: 34 }}>{a.emoji}</div>
          <div className="zts-titre" style={{ fontSize: 15, color: C.marine }}>{a.nom.toUpperCase()}</div>
          <div style={{ fontSize: 12.5, color: "#5b7396", fontWeight: 700 }}>{a.sous}</div>
        </div>
      ))}
    </div>
  );
}

function Accueil({ aller }) {
  return (
    <div>
      <div style={{ textAlign: "center", padding: "18px 10px 22px" }}>
        <div style={{ fontSize: 46 }}>🧭</div>
        <div className="zts-titre" style={{ fontSize: 34, color: C.blanc, textShadow: `3px 3px 0 ${C.marineFonce}` }}>
          TON CORPS,<br />TES MESSAGES.
        </div>
        <p style={{ margin: "10px auto 0", maxWidth: 440, fontSize: 16, color: "#dff4ff", fontWeight: 600 }}>
          Hamer, Sabbah, Flèche, Martel, Rainville, la médecine chinoise et Dr. Sebi proposent des grilles pour écouter ce que ton corps raconte — explore-les ici.
        </p>
      </div>
      <Carte couleur={C.jaune} style={{ cursor: "pointer" }}>
        <div onClick={() => aller("chat")}>
          <div className="zts-titre" style={{ fontSize: 20, color: C.marine }}>💬 DÉCODAGE GUIDÉ PAR IA</div>
          <p style={{ margin: "6px 0 0" }}>Nomme ton symptôme, réponds aux questions une à une, reçois les pistes de libération selon chaque approche.</p>
        </div>
      </Carte>
      <Carte couleur={C.orange} style={{ cursor: "pointer" }}>
        <div onClick={() => aller("dico")}>
          <div className="zts-titre" style={{ fontSize: 20, color: C.marine }}>📖 DICTIONNAIRE CROISÉ</div>
          <p style={{ margin: "6px 0 0" }}>{DICO.length} symptômes par système corporel : le conflit selon chaque auteur, côte à côte.</p>
        </div>
      </Carte>
      <Carte couleur={C.lime} style={{ cursor: "pointer" }}>
        <div onClick={() => aller("approches")}>
          <div className="zts-titre" style={{ fontSize: 20, color: C.marine }}>🧑‍🏫 LES APPROCHES</div>
          <p style={{ margin: "6px 0 0" }}>Les 5 lois de Hamer, le projet-sens de Sabbah, les 4 étages de Flèche, les 5 étapes de Martel, la Métamédecine, les 5 éléments de la médecine chinoise et l'approche alcaline de Dr. Sebi.</p>
        </div>
      </Carte>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("accueil");
  const [prefill, setPrefill] = useState("");
  const decoderPhrase = (texte) => { setPrefill(texte); setPage("chat"); };
  const NAV = [
    ["accueil", "🏠", "Accueil"],
    ["chat", "💬", "Décodage"],
    ["histo", "🗂️", "Historique"],
    ["dico", "📖", "Dico"],
    ["approches", "🧑‍🏫", "Approches"],
  ];
  return (
    <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 500,
      background: `linear-gradient(180deg, #123A73 0%, ${C.marine} 45%, ${C.marineFonce} 100%)`,
      minHeight: "100vh", display: "flex", flexDirection: "column", color: C.encre, position: "relative", overflow: "hidden" }}>
      <style>{STYLES}</style>
      <div className="ztsh-rays" aria-hidden="true" />
      <div style={{ flex: 1, maxWidth: 640, width: "100%", margin: "0 auto", padding: 16, boxSizing: "border-box", position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column" }}>
        {page === "accueil" && <Accueil aller={setPage} />}
        {page === "chat" && <Chat prefill={prefill} />}
        {page === "histo" && <Historique />}
        {page === "dico" && <Dictionnaire decoderPhrase={decoderPhrase} />}
        {page === "approches" && <Approches />}
      </div>
      <div style={{ position: "sticky", bottom: 0, zIndex: 2, background: C.marineFonce, borderTop: `3px solid ${C.cyan}`,
        display: "flex", justifyContent: "space-around", padding: "8px 4px" }}>
        {NAV.map(([id, emoji, label]) => (
          <button key={id} onClick={() => setPage(id)} style={{
            fontFamily: "'ZoneTotalSport','Luckiest Guy',cursive", fontSize: 13, letterSpacing: ".5px",
            background: page === id ? C.cyan : "transparent",
            color: page === id ? C.marine : "#8fc9e8",
            border: page === id ? `2.5px solid ${C.marine}` : "2.5px solid transparent",
            borderRadius: 10, padding: "6px 12px", cursor: "pointer",
            boxShadow: page === id ? `3px 3px 0 #000` : "none" }}>
            <div style={{ fontSize: 20 }}>{emoji}</div>{label}
          </button>
        ))}
      </div>
    </div>
  );
}
