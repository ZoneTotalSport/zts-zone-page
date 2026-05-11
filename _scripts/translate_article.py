#!/usr/bin/env python3
"""
translate_article.py — Traduit un article HTML de Zone Total Sport en 4 langues.

Usage:
    pip install anthropic beautifulsoup4
    export ANTHROPIC_API_KEY=sk-ant-xxx
    python translate_article.py path/to/article.html

Output:
    Modifie l'article in-place en wrappant chaque <h2>, <h3>, <p> traduisible
    avec 4 <span lang="fr|en|zh|es"> contenant les traductions.

Pattern:
    AVANT : <h2>Origines du nawatobi</h2>
    APRES : <h2>
              <span lang="fr">Origines du nawatobi</span>
              <span lang="en">Origins of nawatobi</span>
              <span lang="zh">Nawatobi 的起源</span>
              <span lang="es">Orígenes del nawatobi</span>
            </h2>
"""

import os
import sys
import re
import json
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString
from anthropic import Anthropic

# ============ CONFIG ============
GLOSSARY_PATH = Path(__file__).parent.parent.parent / "GLOSSAIRE-QUADRILINGUE.md"
MODEL = "claude-sonnet-4-6"
BATCH_SIZE = 10  # Nb de paragraphes par appel API (économie de tokens)

# Selecteurs HTML a traduire dans l'article body
TRANSLATABLE_TAGS = ["h2", "h3", "p", "li"]

# Elements a IGNORER (deja traduits via <span lang>, ou non-textuels)
SKIP_IF_CONTAINS = [
    'lang="fr"', 'lang="en"', 'lang="zh"', 'lang="es"',
    'data-i18n', 'class="tag-pill"',
]


# ============ HELPERS ============

def load_glossary() -> str:
    """Charge le glossaire trilingue pour le donner au prompt."""
    if GLOSSARY_PATH.exists():
        return GLOSSARY_PATH.read_text(encoding="utf-8")
    return ""


def build_prompt(texts: list[str], glossary: str) -> str:
    return f"""Tu es un traducteur professionnel spécialisé en pédagogie en éducation physique.

GLOSSAIRE OBLIGATOIRE à respecter (extrait) :
{glossary[:5000]}

Traduis les textes français suivants en EN, ZH (chinois simplifié), ES (espagnol neutre LATAM).

RÈGLES STRICTES :
- Préserve TOUTES les balises HTML inline (<strong>, <em>, <a>, <span>, etc.) à l'identique
- Préserve les références [1], [2], etc.
- Préserve les noms propres : Joey Root, Zone Total Sport, Mr. Root, Bûcheron, Québec, Nawatobi, etc.
- Préserve les codes techniques de sport (JJ.K, KKKK, S.J, etc.) non traduits
- Ton chaleureux, accessible, comme une discussion entre profs ÉPS
- ES = espagnol neutre (pas de "vosotros", utiliser "ustedes" et "tú")
- ZH = chinois simplifié (zh-CN)

INPUT (JSON) :
{json.dumps(texts, ensure_ascii=False, indent=2)}

OUTPUT obligatoire (JSON valide uniquement, aucun texte avant/après) :
{{
  "translations": [
    {{ "en": "...", "zh": "...", "es": "..." }},
    {{ "en": "...", "zh": "...", "es": "..." }}
  ]
}}
"""


def translate_batch(client: Anthropic, texts: list[str], glossary: str) -> list[dict]:
    """Appelle Claude pour traduire un batch de textes."""
    prompt = build_prompt(texts, glossary)
    response = client.messages.create(
        model=MODEL,
        max_tokens=8000,
        messages=[{"role": "user", "content": prompt}],
    )
    content = response.content[0].text
    # Extraire le JSON (au cas où il y aurait du texte autour)
    match = re.search(r"\{[\s\S]*\}", content)
    if not match:
        raise ValueError(f"No JSON in response: {content[:200]}")
    parsed = json.loads(match.group(0))
    return parsed["translations"]


def already_translated(tag) -> bool:
    """Vérifie si le tag contient déjà un <span lang>."""
    return tag.find("span", attrs={"lang": True}) is not None


def is_translatable(tag) -> bool:
    """Filtre les tags qui méritent traduction."""
    if already_translated(tag):
        return False
    text = tag.get_text(strip=True)
    if len(text) < 5:
        return False
    # Skip si le tag contient un attribut blacklist
    html = str(tag)
    for skip in SKIP_IF_CONTAINS:
        if skip in html:
            return False
    return True


def wrap_with_translations(tag, fr_html: str, en: str, zh: str, es: str):
    """Remplace le contenu du tag par 4 <span lang>."""
    # Garde le HTML inline original pour FR (preserve <strong>, <em>, etc.)
    new_html = (
        f'<span lang="fr">{fr_html}</span>'
        f'<span lang="en">{en}</span>'
        f'<span lang="zh">{zh}</span>'
        f'<span lang="es">{es}</span>'
    )
    tag.clear()
    new_soup = BeautifulSoup(new_html, "html.parser")
    for child in new_soup.contents:
        tag.append(child)


# ============ MAIN ============

def main(article_path: Path):
    if not article_path.exists():
        print(f"❌ Fichier introuvable: {article_path}")
        sys.exit(1)

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ ANTHROPIC_API_KEY non défini dans l'environnement")
        sys.exit(1)

    client = Anthropic(api_key=api_key)
    glossary = load_glossary()

    print(f"📖 Lecture de {article_path.name}")
    html = article_path.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")

    # Cible : article.article-body (ou main si pas trouvé)
    article_body = soup.find(class_="article-body") or soup.find("article") or soup.find("main")
    if not article_body:
        print("❌ Pas d'élément <article> ou .article-body trouvé")
        sys.exit(1)

    # Collecter les tags traduisibles
    tags = []
    for tag_name in TRANSLATABLE_TAGS:
        for tag in article_body.find_all(tag_name):
            if is_translatable(tag):
                tags.append(tag)

    print(f"🔍 {len(tags)} éléments à traduire")
    if len(tags) == 0:
        print("✅ Rien à faire (déjà traduit ou aucun contenu)")
        return

    # Traduire par batch
    for i in range(0, len(tags), BATCH_SIZE):
        batch_tags = tags[i : i + BATCH_SIZE]
        # Decoder le contenu HTML interne (preserve <strong>, <em>, etc.)
        batch_texts = [tag.decode_contents().strip() for tag in batch_tags]

        print(f"  Batch {i // BATCH_SIZE + 1}/{(len(tags) + BATCH_SIZE - 1) // BATCH_SIZE}...")
        translations = translate_batch(client, batch_texts, glossary)

        for tag, fr_text, trans in zip(batch_tags, batch_texts, translations):
            wrap_with_translations(
                tag,
                fr_text,
                trans.get("en", "[EN missing]"),
                trans.get("zh", "[ZH missing]"),
                trans.get("es", "[ES missing]"),
            )

    # Sauvegarder
    backup_path = article_path.with_suffix(".html.bak")
    backup_path.write_text(html, encoding="utf-8")
    article_path.write_text(str(soup), encoding="utf-8")
    print(f"✅ {article_path.name} traduit ({len(tags)} éléments)")
    print(f"📦 Backup sauvegardé : {backup_path.name}")
    print("⚠️  À FAIRE MANUELLEMENT :")
    print("   1. Ajouter les hreflang dans <head> (voir PATTERN-TRADUCTION-ARTICLES.md §1)")
    print("   2. Inclure /zts-lang.js avant </body>")
    print("   3. Ajouter le hook dynamique title/meta (voir §3)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python translate_article.py <article.html>")
        sys.exit(1)
    main(Path(sys.argv[1]))
