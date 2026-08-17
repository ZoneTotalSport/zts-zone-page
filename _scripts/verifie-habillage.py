#!/usr/bin/env python3
"""
verifie-habillage.py — controle de conformite d'une app migree.

A lancer sur CHAQUE app apres migration, et sur tout le depot avant un
deploiement. Code de sortie 1 si un controle bloquant echoue.

    python3 _scripts/verifie-habillage.py                 # toutes les apps migrees
    python3 _scripts/verifie-habillage.py apps/suppleance # une seule

CONTROLES

 1  ORDRE DE CHARGEMENT (bloquant)
    assets/ztsh-shell.css doit venir APRES shared/zts.css, zts-header.css et
    zts-ultra.css. Sinon les surcharges du shell perdent la cascade et
    l'habillage est partiellement inactif — sans aucune erreur visible.
    C'est le controle le plus important du lot : la panne est silencieuse.

 2  PAIRE CSS/JS (bloquant)
    Une app qui charge le JS sans le CSS pose body.ztsh-on sans rien pour
    l'habiller. L'inverse charge du CSS que rien n'active.

 3  APPEL DE MONTAGE (bloquant)
    ZTSShell.monter() doit etre appele, avec une densite connue.

 4  ENVELOPPE (avertissement)
    <div class="ztsh-page"> attendue. Absente, la marge du rail vertical
    n'est pas reservee — sans consequence en densite travail ou projection,
    ou la variable vaut 0.

 5  TAILLE DU DIFF (avertissement, si git dispo)
    Plus de 30 lignes ajoutees : le contrat demande de s'arreter et
    d'expliquer.

 6  FOND IMPOSE EN !IMPORTANT (avertissement)
    Le shell pose son fond marine sur <html> et laisse <body> transparent,
    pour ne masquer aucun decor que l'app poserait en z-index negatif. Une
    app qui impose son propre fond en !important sur html, body, :root, *
    ou un conteneur de premier niveau recouvre ce marine, et avec lui les
    rayons (.ztsh-rayons, z-index negatif).

    Le shell n'a pas le droit de riposter : pas de !important hors du bloc
    @media print, et pas de modification du fichier de l'app.

    Ce n'est PAS bloquant : l'app reste fonctionnelle et le chrome (barre,
    casier, encourageur) reste lisible — la barre du haut porte sa propre
    teinte depuis le 27 juillet, justement pour cela. C'est un avertissement
    pour que personne ne redecouvre le probleme en production, comme c'est
    arrive avec apps/jeux le 27 juillet 2026.

    Les regles sous @media print sont ignorees : y forcer un fond blanc est
    l'usage attendu, le shell le fait lui-meme.

MODE --vivant <url> [<url>...]

    Controle 7 — verifie SUR LE RESEAU qu'une page deployee est equipee et
    que ses deux fichiers de shell repondent 200.

    Limite a dire franchement : ce script ne rend pas la page, il ne peut donc
    pas prouver que le shell s'est MONTE. Ce qu'il prouve, c'est que la page
    appelle monter() et que le CSS et le JS arrivent — le mode de panne le
    plus courant apres un deploiement, un asset en 404, est couvert.

    La preuve du montage, elle, vient du shell lui-meme : depuis le
    29 juillet, monter() intercepte ses erreurs et ecrit
    « [ZTSH] montage echoue : … » en console. Un shell qui ne se monte pas le
    dit desormais.
"""

import os
import re
import subprocess
import sys
from html.parser import HTMLParser

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPS = os.path.join(RACINE, "apps")
CSS_AVANT = ["shared/zts.css", "zts-header.css", "zts-ultra.css"]
DENSITES = ["vitrine", "travail", "projection"]

# Controle 6 — fond impose en !important
FOND_IMPORTANT = re.compile(
    r"background(?:-color|-image)?\s*:\s*[^;{}]*?!\s*important", re.I)
# Selecteurs qui portent le fond de page : html, body, :root, * — avec ou
# sans classe/attribut/pseudo accroche (body.pv2, html:has(...), body::before).
SEL_RACINE = re.compile(r"^\s*(?:html|body|:root|\*)(?:[.#\[:][^\s>+~,]*)?\s*$", re.I)


def regles_css(texte):
    """(selecteur, corps, contexte @) pour chaque regle d'une feuille.

    Le contexte sert a distinguer @media print du reste : forcer un fond
    blanc a l'impression est legitime.
    """
    texte = re.sub(r"/\*.*?\*/", " ", texte, flags=re.S)
    regles, pile, tampon, i = [], [], "", 0
    while i < len(texte):
        c = texte[i]
        if c == "{":
            prelude = " ".join(tampon.split())
            tampon = ""
            if prelude.startswith("@"):
                pile.append(prelude)
            else:
                prof, j = 1, i + 1
                while j < len(texte) and prof:
                    if texte[j] == "{":
                        prof += 1
                    elif texte[j] == "}":
                        prof -= 1
                    j += 1
                regles.append((prelude, texte[i + 1:j - 1], " ".join(pile)))
                i = j
                continue
        elif c == "}":
            if pile:
                pile.pop()
            tampon = ""
        else:
            tampon += c
        i += 1
    return regles


class EnfantsDeBody(HTMLParser):
    """Enfants directs de <body> : les conteneurs de premier niveau.

    Un fond opaque pose sur l'un d'eux recouvre le marine aussi surement
    qu'un fond sur body, des lors qu'il occupe la page.
    """
    VIDES = {"area", "base", "br", "col", "embed", "hr", "img", "input",
             "link", "meta", "param", "source", "track", "wbr"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.dans_body, self.profondeur, self.ignore = False, 0, None
        self.enfants = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "body":
            self.dans_body, self.profondeur = True, 0
            return
        if not self.dans_body:
            return
        if self.ignore:
            return
        if tag in ("script", "style"):
            self.ignore = tag
            return
        if self.profondeur == 0:
            self.enfants.append((a.get("id", ""), a.get("class", ""),
                                 a.get("style", ""), tag))
        if tag not in self.VIDES:
            self.profondeur += 1

    def handle_endtag(self, tag):
        if self.ignore == tag:
            self.ignore = None
        elif tag == "body":
            self.dans_body = False
        elif self.dans_body and tag not in self.VIDES and self.profondeur:
            self.profondeur -= 1


def fonds_imposes(chemin, html):
    """Declarations de fond en !important qui recouvrent le marine du shell.

    Balaie les <style> de la page et les .css du dossier de l'app. Regarde
    les selecteurs de surface de page — html, body, :root, * — les
    conteneurs de premier niveau, et les styles inline des uns et des autres.
    """
    trouves = []

    for balise in re.findall(r"<(html|body)\b([^>]*)>", html, re.I):
        st = re.search(r'style\s*=\s*"([^"]*)"', balise[1], re.I)
        if st and FOND_IMPORTANT.search(st.group(1)):
            trouves.append(f"<{balise[0].lower()} style=…> {st.group(1).strip()[:60]}")

    p = EnfantsDeBody()
    try:
        p.feed(html)
    except Exception:
        pass
    # index des conteneurs de premier niveau, par selecteur simple
    premiers = {}
    for eid, ecls, estyle, tag in p.enfants:
        if estyle and FOND_IMPORTANT.search(estyle):
            trouves.append(f"<{tag} style=…> {estyle.strip()[:60]}")
        if eid:
            premiers["#" + eid.lower()] = tag
        for c in ecls.split():
            premiers["." + c.lower()] = tag

    sources = [("<style>", m) for m in
               re.findall(r"<style[^>]*>(.*?)</style>", html, re.S | re.I)]
    for f in sorted(os.listdir(chemin)):
        if f.endswith(".css"):
            sources.append(
                (f, open(os.path.join(chemin, f), encoding="utf-8",
                         errors="replace").read()))

    for nom, texte in sources:
        for sel, corps, ctx in regles_css(texte):
            if "print" in ctx.lower():
                continue
            m = FOND_IMPORTANT.search(corps)
            if not m:
                continue
            for part in sel.split(","):
                if SEL_RACINE.match(part):
                    trouves.append(f"{nom} — {part.strip()[:40]} {{ {m.group(0)[:52]} }}")
                    break
                dernier = re.split(r"[\s>+~]+", part.strip().lower())[-1]
                dernier = re.sub(r"::?[a-z-]+(\([^)]*\))?$", "", dernier)
                if dernier in premiers:
                    trouves.append(
                        f"{nom} — {part.strip()[:40]} {{ {m.group(0)[:44]} }} "
                        f"(conteneur de 1er niveau)")
                    break
    return trouves


def controle(chemin):
    """Retourne (bloquants, avertissements) pour une app."""
    f = os.path.join(chemin, "index.html")
    if not os.path.exists(f):
        return None
    c = open(f, encoding="utf-8", errors="replace").read()
    if "ztsh-shell" not in c:
        return None  # app non migree, hors perimetre

    bloq, aver = [], []
    nom = os.path.basename(chemin)

    # 1 — ordre de chargement
    pos_shell = c.find("ztsh-shell.css")
    for autre in CSS_AVANT:
        p = c.find(autre)
        if p != -1 and p > pos_shell:
            bloq.append(
                f"ORDRE : {autre} est charge APRES ztsh-shell.css. "
                f"Les surcharges du shell perdent la cascade."
            )

    # 2 — paire CSS/JS
    a_css = "ztsh-shell.css" in c
    a_js = "ztsh-shell.js" in c
    if a_js and not a_css:
        bloq.append("PAIRE : le JS est charge sans le CSS.")
    if a_css and not a_js:
        bloq.append("PAIRE : le CSS est charge sans le JS — rien ne montera le shell.")

    # 3 — appel de montage
    m = re.search(r"ZTSShell\.monter\(\s*\{([^}]*)\}", c)
    if not m:
        bloq.append("MONTAGE : aucun appel a ZTSShell.monter().")
    else:
        d = re.search(r"densite\s*:\s*['\"](\w+)['\"]", m.group(1))
        if not d:
            bloq.append("MONTAGE : monter() sans densite explicite.")
        elif d.group(1) not in DENSITES:
            bloq.append(f"MONTAGE : densite inconnue « {d.group(1) } ».")

    # 4 — enveloppe
    if 'class="ztsh-page"' not in c:
        aver.append("ENVELOPPE : <div class=\"ztsh-page\"> absente.")

    # 5 — taille du diff
    #
    # « Zero suppression » vise le contenu de l'app. Retoucher une ligne que
    # la migration a elle-meme ajoutee — changer une densite, ajouter une
    # option a monter() — compte pour une suppression au sens de git, mais
    # ne retire rien a l'app. On ne bloque que sur les lignes retirees qui ne
    # sont pas au shell.
    try:
        out = subprocess.run(
            ["git", "diff", "-U0", "main", "--", f"apps/{nom}/index.html"],
            cwd=RACINE, capture_output=True, text=True, timeout=10,
        ).stdout
        ajouts, retirees_app = 0, []
        for ligne in out.split("\n"):
            if ligne.startswith("+") and not ligne.startswith("+++"):
                ajouts += 1
            elif ligne.startswith("-") and not ligne.startswith("---"):
                # « ZTSShell » minuscule donne « ztsshell », qui ne contient
                # pas « ztsh » : les deux marqueurs sont necessaires.
                bas = ligne.lower()
                # Les lignes du shell ne comptent pas (voir plus haut), et
                # depuis le 4 aout 2026 les lignes de POLICE non plus.
                #
                # POURQUOI CET ASSOUPLISSEMENT. Le controle protege le contrat
                # des 6 lignes du chantier d'habillage : une migration de shell
                # n'a pas le droit de toucher au contenu de l'app. La decision
                # de Joey de ramener le site a trois polices d'affichage et une
                # de lecture touche, elle, par nature a des lignes existantes —
                # `font-family:` et les liens Google Fonts, dans les 40 apps.
                # Sans cette exception le controle bloquait les 40.
                #
                # L'exception est DELIBEREMENT ETROITE : seulement les lignes
                # dont le changement porte sur une declaration de police ou un
                # lien de fonte. Toute autre ligne d'app retiree bloque
                # toujours — le contrat tient pour tout le reste.
                police = ("font-family" in bas
                          or "fonts.googleapis.com" in bas
                          or "@font-face" in bas)
                # Un selecteur `body > X` que l'ENVELOPPE du shell a casse.
                # `monter()` insere <div class="ztsh-page"> entre body et le
                # contenu : le combinateur enfant direct ne matche plus rien.
                # Corriger ces selecteurs n'est pas une intrusion dans l'app,
                # c'est reparer une regression que le chantier a causee.
                # Vu sur `jeux` le 4 aout : la barre d'outils que
                # `body>header.header{display:none}` masquait etait revenue.
                enveloppe = "body>" in bas.replace(" ", "")
                vide = not ligne[1:].strip()   # une ligne blanche ne retire rien
                # Une app passee au Worker de donnees (LOT 1 vague D, 17 aout
                # 2026) a forcement perdu son `fetch` d'origine : les banques ne
                # sont plus des fichiers servis en clair, elles vivent dans R2
                # derriere un jeton. Meme nature que l'assouplissement des
                # polices ci-dessus — une decision transverse touche par
                # necessite a des lignes existantes des apps.
                #
                # L'exception est ETROITE A DEUX TITRES : elle ne vaut que pour
                # les apps qui appellent DESORMAIS ZTSBanques (donc celles qui
                # ont reellement migre, pas les autres), et seulement pour les
                # lignes qui parlent de `fetch` ou de `.json()` — l'appel et
                # l'analyse de sa reponse. Toute autre ligne d'app retiree
                # bloque toujours, y compris dans ces apps-la.
                migre_worker = ("ztsbanques" in c.lower()
                                and ("fetch" in bas or ".json()" in bas))
                if ("ztsh" not in bas and "ztsshell" not in bas
                        and not police and not vide and not enveloppe
                        and not migre_worker):
                    retirees_app.append(ligne[1:].strip()[:60])
        if ajouts > 30:
            aver.append(f"DIFF : {ajouts} lignes ajoutees, au-dela des 30 du contrat.")
        if retirees_app:
            bloq.append(
                f"DIFF : {len(retirees_app)} ligne(s) de l'app SUPPRIMEE(S) — "
                f"p. ex. « {retirees_app[0]} »"
            )
    except Exception:
        pass

    # 6 — fond impose en !important
    for t in fonds_imposes(chemin, c):
        aver.append(
            f"FOND : {t} — recouvre le marine du shell et les rayons. "
            f"Le chrome reste lisible, le decor de fond non."
        )

    return bloq, aver


def verifie_vivant(urls):
    """Controle 7 — la page deployee est-elle equipee, et ses assets arrivent-ils ?"""
    import urllib.request, urllib.error
    from urllib.parse import urljoin

    def get(u):
        try:
            r = urllib.request.urlopen(u, timeout=15)
            return r.status, r.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            return e.code, ""
        except Exception as e:
            return 0, str(e)

    total_ko = 0
    for u in urls:
        code, html = get(u)
        if code != 200:
            print(f"  ECHEC     {u} — page en {code}")
            total_ko += 1
            continue
        soucis = []
        m = re.search(r"ZTSShell\.monter\(", html)
        if not m:
            soucis.append("aucun appel a ZTSShell.monter()")
        d = re.search(r"densite\s*:\s*['\"](\w+)['\"]", html)
        densite = d.group(1) if d else "?"
        if d and d.group(1) not in DENSITES:
            soucis.append(f"densite inconnue « {d.group(1)} »")
        for asset in ("ztsh-shell.css", "ztsh-shell.js"):
            mm = re.search(r'["\']([^"\']*' + asset + r')["\']', html)
            if not mm:
                soucis.append(f"{asset} non reference")
                continue
            ac, _ = get(urljoin(u, mm.group(1)))
            if ac != 200:
                soucis.append(f"{asset} repond {ac}")
        if soucis:
            print(f"  ECHEC     {u}")
            for x in soucis:
                print(f"              {x}")
            total_ko += 1
        else:
            print(f"  OK        {u}  (densite {densite}, CSS et JS en 200)")
    print()
    print(f"{len(urls)} page(s) verifiee(s) — {total_ko} en echec.")
    print("Rappel : ce mode ne rend pas la page. La preuve du montage vient de")
    print("la console — monter() ecrit « [ZTSH] montage echoue : … » s'il tombe.")
    return 1 if total_ko else 0


def recense_fonds():
    """--fonds : balaie les 46 apps, migrees ou non, et liste les fonds imposes.

    Le controle 6 ne voit que les apps deja migrees. Ce mode sert a savoir
    AVANT une vague quelles apps recouvriront le marine, pour ne pas le
    decouvrir en production.
    """
    dossiers = [os.path.join(APPS, d) for d in sorted(os.listdir(APPS))
                if os.path.isdir(os.path.join(APPS, d)) and not d.startswith("_")]
    concernees = 0
    for d in dossiers:
        f = os.path.join(d, "index.html")
        if not os.path.exists(f):
            continue
        html = open(f, encoding="utf-8", errors="replace").read()
        trouves = fonds_imposes(d, html)
        if not trouves:
            continue
        concernees += 1
        migree = "migree" if "ztsh-shell" in html else "a migrer"
        print(f"  {os.path.basename(d):<18} ({migree})")
        for t in trouves:
            print(f"      {t}")
    print()
    print(f"{concernees} app(s) imposent un fond en !important sur {len(dossiers)} scannees.")
    print("Le chrome du shell reste lisible ; le fond marine et les rayons, non.")
    return 0


def main():
    cibles = sys.argv[1:]
    if cibles and cibles[0] == "--fonds":
        return recense_fonds()
    if cibles and cibles[0] == "--vivant":
        if len(cibles) < 2:
            print("usage : verifie-habillage.py --vivant <url> [<url>...]")
            return 1
        return verifie_vivant(cibles[1:])
    if cibles:
        dossiers = [c if os.path.isabs(c) else os.path.join(RACINE, c) for c in cibles]
    else:
        dossiers = [
            os.path.join(APPS, d) for d in sorted(os.listdir(APPS))
            if os.path.isdir(os.path.join(APPS, d)) and not d.startswith("_")
        ]

    total_b, total_a, migrees = 0, 0, 0
    for d in dossiers:
        r = controle(d)
        if r is None:
            continue
        migrees += 1
        bloq, aver = r
        nom = os.path.basename(d)
        if not bloq and not aver:
            print(f"  OK        {nom}")
            continue
        print(f"  {'ECHEC' if bloq else 'AVERTI'}    {nom}")
        for b in bloq:
            print(f"              BLOQUANT  {b}")
        for a in aver:
            print(f"              avert.    {a}")
        total_b += len(bloq)
        total_a += len(aver)

    print()
    if not migrees:
        print("Aucune app migree trouvee.")
        return 0
    print(f"{migrees} app(s) migree(s) — {total_b} bloquant(s), {total_a} avertissement(s)")
    return 1 if total_b else 0


if __name__ == "__main__":
    sys.exit(main())
