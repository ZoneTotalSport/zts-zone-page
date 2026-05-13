// Schémas JSON de sortie attendus par type.
// Le worker append ces schémas au prompt système pour forcer Claude à
// répondre avec exactement ces champs.

export const SCHEMA_JEU = `{
  "titre": "string court (max 60 chars)",
  "duree_min": "number (minutes)",
  "duree_max": "number (minutes)",
  "nb_joueurs": "string (ex. '20-30')",
  "espace": "string ('gymnase' | 'extérieur' | 'local' | 'gymnase ou extérieur')",
  "materiel": ["array de strings, chaque item = un article avec quantité"],
  "but": "string (1-2 phrases, l'objectif du jeu)",
  "regles": "string (déroulement complet, paragraphes séparés par \\\\n)",
  "variantes": ["array de 2-4 strings, variantes courtes"],
  "securite": "string (1-2 phrases sur la sécurité)",
  "competence_pfeq": "string ('C1' | 'C2' | 'C3' | null si non applicable)",
  "niveaux": ["array de strings (ex. 'primaire-2e-cycle')"],
  "tags": ["array de 3-5 strings descriptifs"]
}`;

export const SCHEMA_SAE = `{
  "titre": "string court (max 80 chars)",
  "cycle": "string ('Préscolaire' | '1er cycle' | '2e cycle' | '3e cycle' | 'Secondaire')",
  "competence_pfeq": "string ('C1 Agir' | 'C2 Interagir' | 'C3 Mode vie sain')",
  "duree_totale": "string (ex. '4 périodes de 60 min')",
  "intentions_pedagogiques": "string (2-4 phrases)",
  "savoirs_essentiels": ["array de strings"],
  "materiel": ["array de strings avec quantités"],
  "deroulement": [
    {
      "phase": "string (ex. 'Phase 1 — Activation')",
      "duree": "string (ex. '15 min')",
      "description": "string (1-3 phrases)",
      "organisation": "string (ex. 'équipes de 4', 'circuit en stations')"
    }
  ],
  "evaluation": {
    "observables": ["array de strings"],
    "critere": "string",
    "echelle": ["A — string", "B — string", "C — string", "D — string"]
  },
  "differenciation": "string (adaptations EHDAA, 1-2 phrases)",
  "tags": ["array de 3-5 strings"]
}`;

export const SCHEMA_EDUCATIF = `{
  "titre": "string court (max 60 chars)",
  "habilete_ciblee": "string (le geste/skill visé)",
  "moyen_action": "string (ex. 'lancer', 'équilibre', 'coordination')",
  "duree_par_palier": "string (ex. '3-5 min')",
  "duree_totale": "number (minutes total)",
  "nb_joueurs": "string",
  "materiel": ["array de strings par élève ou par paire"],
  "organisation_spatiale": "string (ex. 'vagues', 'stations', 'paires en miroir')",
  "progression": [
    {
      "palier": "number (1, 2, 3...)",
      "consigne": "string (ce que l'élève doit faire)",
      "critere_reussite": "string (observable, mesurable)"
    }
  ],
  "erreurs_courantes": ["array de strings (erreur → correction)"],
  "differenciation": "string (adaptation EHDAA)",
  "tags": ["array de 3-5 strings"]
}`;

export const SCHEMAS = {
  jeu: SCHEMA_JEU,
  sae: SCHEMA_SAE,
  educatif: SCHEMA_EDUCATIF,
};
