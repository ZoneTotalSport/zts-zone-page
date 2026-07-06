// app.js — Pages à colorier (Zone Total Sport)
// Génération via le worker zts-colorier (proxy Gemini) + studio de coloriage
// en ligne (flood-fill / pinceau / gomme) + export PNG / PDF / impression.

// ⚠️ À renseigner après `wrangler deploy` du worker cf-worker/colorier/ :
//    l'URL workers.dev (ou le sous-domaine custom), SANS slash final.
const API_BASE = "https://zts-colorier.zts-ccd.workers.dev";

(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  // --- éléments ---
  const subjectInput = $("#subjectInput");
  const customToggle = $("#customToggle");
  const customWrap   = $("#customWrap");
  const selSports    = $("#selSports");
  const selSante     = $("#selSante");
  const generateBtn  = $("#generateBtn");
  const quotaHint    = $("#quotaHint");
  const resultZone   = $("#resultZone");
  const loadingState = $("#loadingState");
  const studio       = $("#studio");
  const errorState   = $("#errorState");
  const errorMsg     = $("#errorMsg");
  const imageCaption = $("#imageCaption");
  const canvas       = $("#colorCanvas");
  const ctx          = canvas.getContext("2d", { willReadFrequently: true });

  let lastSubject = "";
  let busy = false;

  // ====================================================================
  // 1) FORMULAIRE — dropdowns + génération
  // ====================================================================
  function pickFromSelect(sel, other) {
    sel.addEventListener("change", () => {
      if (!sel.value) return;
      subjectInput.value = sel.value;
      if (other) other.value = "";
      // piger une idée referme le champ « j'écris ma propre idée »
      customToggle.checked = false;
      customWrap.hidden = true;
    });
  }
  pickFromSelect(selSports, selSante);
  pickFromSelect(selSante, selSports);

  // case à cocher : révèle / masque le champ texte blanc
  function revealCustom(show) {
    customToggle.checked = show;
    customWrap.hidden = !show;
    if (show) {
      selSports.value = ""; selSante.value = "";
      subjectInput.focus();
    } else {
      subjectInput.value = "";
    }
  }
  customToggle.addEventListener("change", () => revealCustom(customToggle.checked));

  subjectInput.addEventListener("input", () => { selSports.value = ""; selSante.value = ""; });
  subjectInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); generate(); }
  });

  generateBtn.addEventListener("click", () => generate());
  $("#retryBtn").addEventListener("click", () => generate(lastSubject));
  // « Autre version » force une nouvelle génération (ignore la banque + la remplace)
  $("#regenBtn").addEventListener("click", () => generate(lastSubject, true));

  function setBusy(on) {
    busy = on;
    generateBtn.disabled = on;
    generateBtn.classList.toggle("is-busy", on);
  }

  function showState(state) {
    resultZone.hidden = false;
    loadingState.hidden = state !== "loading";
    studio.hidden       = state !== "studio";
    errorState.hidden   = state !== "error";
    if (state === "loading") resultZone.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function generate(forced, force) {
    if (busy) return;
    const subject = (forced != null ? forced : subjectInput.value).trim();
    if (subject.length < 2) {
      // rien de pigé ni écrit : on ouvre le champ « j'écris ma propre idée »
      if (customWrap.hidden) { revealCustom(true); return; }
      subjectInput.focus();
      subjectInput.classList.add("col-input--shake");
      setTimeout(() => subjectInput.classList.remove("col-input--shake"), 500);
      return;
    }
    lastSubject = subject;
    setBusy(true);
    showState("loading");

    try {
      const resp = await fetch(API_BASE + "/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, force: force === true }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.ok) {
        showError(data.message || "Le générateur n'a pas répondu. Réessaie.");
        return;
      }
      await loadIntoCanvas(data.image);
      imageCaption.textContent = data.cached ? subject + "  ⚡ (banque)" : subject;
      showState("studio");
      if (typeof data.used === "number" && typeof data.limit === "number") updateQuota(data.limit - data.used);
      // une nouvelle page entre dans la banque -> on rafraîchit la galerie
      if (data.cached === false) loadGallery();
    } catch (e) {
      showError("Connexion impossible au générateur. Vérifie ta connexion et réessaie.");
    } finally {
      setBusy(false);
    }
  }

  function showError(msg) { errorMsg.textContent = msg; showState("error"); }

  function updateQuota(remaining) {
    quotaHint.textContent = remaining <= 0
      ? "Limite quotidienne atteinte — reviens demain !"
      : `Encore ${remaining} dessin${remaining > 1 ? "s" : ""} aujourd'hui.`;
  }

  // ====================================================================
  // 1.5) BANQUE DE PAGES (galerie partagée)
  // ====================================================================
  const bankSection = $("#bankSection");
  const bankGrid    = $("#bankGrid");

  async function loadGallery() {
    try {
      const resp = await fetch(API_BASE + "/gallery");
      const data = await resp.json().catch(() => ({}));
      if (!data.ok || !Array.isArray(data.items) || !data.items.length) {
        bankSection.hidden = true;
        return;
      }
      renderGallery(data.items);
      bankSection.hidden = false;
    } catch (e) {
      bankSection.hidden = true;
    }
  }

  function renderGallery(items) {
    bankGrid.innerHTML = "";
    items.forEach((it) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "col-bank-card";
      card.title = it.subject;

      const img = document.createElement("img");
      img.className = "col-bank-img";
      img.loading = "lazy";
      img.crossOrigin = "anonymous";   // garde le canvas exportable
      img.alt = it.subject;
      img.src = it.url;

      const label = document.createElement("span");
      label.className = "col-bank-label";
      label.textContent = it.subject;

      card.appendChild(img);
      card.appendChild(label);
      card.addEventListener("click", () => generate(it.subject));
      bankGrid.appendChild(card);
    });
  }

  loadGallery();

  // ====================================================================
  // 2) STUDIO DE COLORIAGE
  // ====================================================================
  // Palette FLUO vive (tape-à-l'œil) — couleurs néon saturées.
  const PALETTE = [
    "#ff1744", "#ff3d00", "#ff6d00", "#ff9100", "#ffea00", "#c6ff00",
    "#76ff03", "#00e676", "#1de9b6", "#00e5ff", "#18ffff", "#2979ff",
    "#651fff", "#d500f9", "#ff00e5", "#ff4081",
    "#ffffff", "#000000",
  ];
  let currentColor = "#ff1744";
  let currentTool = "fill"; // fill | brush | eraser
  let brushSize = 18;
  let originalImageData = null; // pour la gomme (restaure le trait)
  let painting = false;

  // -- palette UI --
  const paletteEl = $("#palette");
  PALETTE.forEach((c, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "col-swatch" + (i === 0 ? " is-active" : "");
    b.style.background = c;
    b.setAttribute("aria-label", "Couleur " + c);
    b.addEventListener("click", () => selectColor(c, b));
    paletteEl.appendChild(b);
  });
  const customColor = $("#customColor");
  customColor.addEventListener("input", () => selectColor(customColor.value, null));

  function selectColor(c, swatchEl) {
    currentColor = c;
    document.querySelectorAll(".col-swatch.is-active").forEach((s) => s.classList.remove("is-active"));
    if (swatchEl) swatchEl.classList.add("is-active");
    // choisir une couleur bascule sur un outil de dessin si on est sur gomme
    if (currentTool === "eraser") setTool("fill");
  }

  // -- outils --
  document.querySelectorAll(".col-tool[data-tool]").forEach((btn) => {
    btn.addEventListener("click", () => setTool(btn.getAttribute("data-tool")));
  });
  $("#resetBtn").addEventListener("click", resetCanvas);
  $("#brushSize").addEventListener("input", (e) => { brushSize = parseInt(e.target.value, 10) || 18; });

  function setTool(tool) {
    currentTool = tool;
    document.querySelectorAll(".col-tool[data-tool]").forEach((b) =>
      b.classList.toggle("is-active", b.getAttribute("data-tool") === tool));
    $("#sizeWrap").hidden = tool === "fill";
    canvas.classList.toggle("col-canvas--brush", tool !== "fill");
  }

  // -- chargement image dans le canvas --
  function loadIntoCanvas(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // borne la taille pour rester performant (max 1200px de large)
        const maxW = 1200;
        const scale = img.width > maxW ? maxW / img.width : 1;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setTool("fill");
        resolve();
      };
      img.onerror = () => resolve();
      img.src = dataUrl;
    });
  }

  function resetCanvas() {
    if (!originalImageData) return;
    ctx.putImageData(originalImageData, 0, 0);
  }

  // -- coordonnées canvas depuis un évènement pointeur --
  function eventPos(e) {
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width;
    const sy = canvas.height / r.height;
    return {
      x: Math.round((e.clientX - r.left) * sx),
      y: Math.round((e.clientY - r.top) * sy),
    };
  }

  // -- pointer events (fill au clic, brush/eraser au drag) --
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const p = eventPos(e);
    if (currentTool === "fill") { floodFill(p.x, p.y, currentColor); return; }
    painting = true;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    paintDab(p.x, p.y);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!painting) return;
    const p = eventPos(e);
    paintDab(p.x, p.y);
  });
  const stop = () => { painting = false; };
  canvas.addEventListener("pointerup", stop);
  canvas.addEventListener("pointercancel", stop);
  canvas.addEventListener("pointerleave", stop);

  function paintDab(x, y) {
    if (currentTool === "eraser") {
      // restaure le trait original (efface la couleur ajoutée)
      if (!originalImageData) return;
      const r = Math.round(brushSize / 2);
      const sx = Math.max(0, x - r), sy = Math.max(0, y - r);
      const w = Math.min(canvas.width - sx, brushSize), h = Math.min(canvas.height - sy, brushSize);
      if (w <= 0 || h <= 0) return;
      const region = ctx.createImageData(w, h);
      const src = originalImageData.data, dst = region.data, cw = canvas.width;
      for (let yy = 0; yy < h; yy++) {
        for (let xx = 0; xx < w; xx++) {
          const si = ((sy + yy) * cw + (sx + xx)) * 4;
          const di = (yy * w + xx) * 4;
          dst[di] = src[si]; dst[di + 1] = src[si + 1]; dst[di + 2] = src[si + 2]; dst[di + 3] = src[si + 3];
        }
      }
      ctx.putImageData(region, sx, sy);
      return;
    }
    // pinceau (sous le trait : ne recouvre pas les pixels foncés)
    ctx.fillStyle = currentColor;
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // -- flood fill (pot de peinture) --
  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function floodFill(x, y, hex) {
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
    const w = canvas.width, h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    const [fr, fg, fb] = hexToRgb(hex);

    const start = (y * w + x) * 4;
    const sr = d[start], sg = d[start + 1], sb = d[start + 2];

    // ne pas remplir si on clique sur un trait (pixel sombre)
    if (sr < 60 && sg < 60 && sb < 60) return;
    // déjà la bonne couleur
    if (sr === fr && sg === fg && sb === fb) return;

    const tol = 60; // tolérance anti-aliasing
    const match = (i) => {
      const dr = d[i] - sr, dg = d[i + 1] - sg, db = d[i + 2] - sb;
      return dr * dr + dg * dg + db * db <= tol * tol;
    };

    const stack = [start];
    while (stack.length) {
      let i = stack.pop();
      // remonte au début de la portée horizontale
      let xx = (i / 4) % w;
      let left = i;
      while (xx > 0 && match(left - 4)) { left -= 4; xx--; }
      let right = i;
      let rx = (i / 4) % w;
      while (rx < w - 1 && match(right + 4)) { right += 4; rx++; }
      for (let p = left; p <= right; p += 4) {
        d[p] = fr; d[p + 1] = fg; d[p + 2] = fb; d[p + 3] = 255;
        if (p - w * 4 >= 0 && match(p - w * 4)) stack.push(p - w * 4);
        if (p + w * 4 < d.length && match(p + w * 4)) stack.push(p + w * 4);
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // ====================================================================
  // 3) EXPORTS
  // ====================================================================
  function safeName() {
    return ((lastSubject || "page").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40)) || "page";
  }

  $("#pngBtn").addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "colorier-" + safeName() + ".png";
    document.body.appendChild(a); a.click(); a.remove();
  });

  $("#pdfBtn").addEventListener("click", () => {
    const jsPDFCtor = window.jspdf && window.jspdf.jsPDF;
    if (!jsPDFCtor) { window.print(); return; }
    const portrait = canvas.height >= canvas.width;
    const pdf = new jsPDFCtor({ orientation: portrait ? "p" : "l", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const maxW = pageW - margin * 2, maxH = pageH - margin * 2;
    const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
    const w = canvas.width * ratio, h = canvas.height * ratio;
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h);
    pdf.save("colorier-" + safeName() + ".pdf");
  });

  $("#printBtn").addEventListener("click", () => {
    const url = canvas.toDataURL("image/png");
    const w = window.open("", "_blank", "width=800,height=1000");
    if (!w) { window.print(); return; }
    w.document.write(
      '<!DOCTYPE html><html><head><title>Page à colorier — Zone Total Sport</title>' +
      '<style>@page{margin:10mm}html,body{margin:0;padding:0}' +
      'img{display:block;width:100%;height:auto;max-height:100vh;object-fit:contain}</style>' +
      '</head><body><img src="' + url + '" onload="window.focus();window.print();"></body></html>'
    );
    w.document.close();
  });
})();
