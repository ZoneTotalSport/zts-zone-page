/* ui.jsx — jetons visuels et briques communes de « Zone — Décodage du corps ».
   Extraits tels quels de l'app d'origine pour être partagés avec les
   modules (voir perte-de-poids.jsx) : aucune valeur n'a été changée. */

export const STYLES = `
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

export const C = {
  cyan: "#00CFFF", marine: "#0B2A5B", marineFonce: "#071B3D",
  jaune: "#FFFC00", lime: "#A3FF00", orange: "#FFA200", rose: "#FF0061",
  encre: "#0B2A5B", blanc: "#FFFFFF",
};

/* ─────────────── COMPOSANTS ─────────────── */
export function Carte({ children, couleur = C.cyan, style = {} }) {
  return (
    <div style={{
      background: C.blanc, border: `3px solid ${C.marine}`, borderRadius: 14,
      boxShadow: `5px 5px 0 ${couleur}`, padding: 16, marginBottom: 16, ...style
    }}>{children}</div>
  );
}

export function BoutonCyan({ children, onClick, disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily: "'ZoneTotalSport','Luckiest Guy',cursive", fontSize: 18, letterSpacing: ".5px",
      padding: "10px 20px", cursor: "pointer", color: C.marine,
      background: C.cyan, border: `3px solid ${C.marine}`, borderRadius: 10,
      boxShadow: `4px 4px 0 ${C.marineFonce}`, ...style
    }}>{children}</button>
  );
}


/* Style commun des champs texte (était défini dans Chat, sorti ici pour que
   le module de perte de poids utilise exactement le même). */
export const champStyle = {
  width: "100%", boxSizing: "border-box", fontFamily: "Nunito", fontWeight: 600, fontSize: 16,
  padding: "12px 14px", border: `3px solid ${C.marine}`, borderRadius: 10, outline: "none",
  background: C.blanc, color: C.marine, resize: "vertical",
};

/* Adresse de la route worker durcie (le prompt système est imposé côté
   serveur : ce que le front envoie dans `system` est jeté). */
export const URL_API = "https://api.zonetotalsport.ca/decodage";
