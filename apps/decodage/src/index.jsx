import { createRoot } from "react-dom/client";
import App from "./app.jsx";

/* Shim window.storage → localStorage, préfixe ztsdeco:.
   L'app a été écrite pour une API de stockage asynchrone côté hôte; sur
   GitHub Pages il n'y en a pas, on la sert depuis le navigateur. */
if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    async set(key, value) { localStorage.setItem("ztsdeco:" + key, value); return { key, value }; },
    async get(key) {
      const value = localStorage.getItem("ztsdeco:" + key);
      if (value === null) throw new Error("absent");
      return { key, value };
    },
    async delete(key) { localStorage.removeItem("ztsdeco:" + key); return { key, deleted: true }; },
    async list(prefix = "") {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith("ztsdeco:" + prefix)) keys.push({ key: k.slice(8) });
      }
      return { keys, prefix };
    },
  };
}

createRoot(document.getElementById("racine")).render(<App />);
