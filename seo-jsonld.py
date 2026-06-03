#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Ajoute un JSON-LD WebApplication (idempotent) dans chaque apps/*/index.html."""
import os, re, html, glob, json

BASE = "https://zonetotalsport.ca/apps/"
ROOT = os.path.dirname(os.path.abspath(__file__))

def get(content, pattern, grp=1):
    m = re.search(pattern, content, re.I|re.S)
    return html.unescape(m.group(grp).strip()) if m else None

report = []
for f in sorted(glob.glob(os.path.join(ROOT, "apps", "*", "index.html"))):
    name = os.path.basename(os.path.dirname(f))
    with open(f, encoding="utf-8") as fh:
        c = fh.read()
    if "</head>" not in c.lower():
        report.append((name, "SKIP (pas de </head>)")); continue
    if "application/ld+json" in c.lower():
        report.append((name, "déjà présent")); continue
    url = BASE + name + "/"
    title = get(c, r'<title>(.*?)</title>') or "Zone Total Sport"
    desc = get(c, r'name=["\']description["\']\s+content=["\'](.*?)["\']') or title
    data = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": title,
        "description": desc,
        "url": url,
        "applicationCategory": "EducationApplication",
        "operatingSystem": "Web",
        "inLanguage": ["fr-CA", "en"],
        "isAccessibleForFree": True,
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "CAD"},
        "publisher": {
            "@type": "Organization",
            "name": "Zone Total Sport",
            "url": "https://zonetotalsport.ca/",
            "logo": "https://zonetotalsport.ca/favicon.png"
        }
    }
    ld = json.dumps(data, ensure_ascii=False, indent=2)
    block = f'\n  <!-- ZTS-JSONLD -->\n  <script type="application/ld+json">\n{ld}\n  </script>\n  <!-- /ZTS-JSONLD -->\n'
    c2 = re.sub(r'(</head>)', lambda m: block + m.group(1), c, count=1, flags=re.I)
    with open(f, "w", encoding="utf-8") as fh:
        fh.write(c2)
    report.append((name, "ajouté"))

added = sum(1 for _,s in report if s=="ajouté")
print(f"JSON-LD WebApplication — {len(report)} apps")
for n,s in report:
    print(f"  {n:24} {s}")
print(f"\nAjoutés : {added}   Déjà présents/skip : {len(report)-added}")
