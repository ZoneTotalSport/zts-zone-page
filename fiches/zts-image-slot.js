/**
 * zts-image-slot.js — <image-slot> : case image d'une fiche de jeu.
 *
 * Remplace le composant du kit d'artefact Claude, qui persistait dans un
 * fichier voisin « .image-slots.state.json » via un pont window.omelette
 * inexistant hors de cet hote (donc : lecture seule, rien de sauvegarde).
 * Ici la case televerse vers Firebase Storage et ne garde que le CHEMIN
 * dans Firestore.
 *
 * La case remplit toujours son cadre (inset:0, object-fit:cover) : le cadre
 * noir et ses dimensions restent ceux du parent, jamais touches.
 *
 * Attributs
 *   data-champ    chemin du champ dans la fiche (ex. sections.0.explications.1.imagePath)
 *   path          chemin Storage courant (ex. fiches/abc123/p1.jpg)
 *   placeholder   texte affiche quand la case est vide
 *
 * Branchement (fait par la page, pas par le composant) :
 *   ZTSImageSlot.configurer({
 *     resoudre: function (path) { ... -> Promise<url> },
 *     televerser: function (file, champ, onProgres) { ... -> Promise<path> },
 *     editable: true
 *   });
 *
 * Evenement emis apres televersement reussi :
 *   'zts-image' { detail: { champ, path } }
 */
(function (global) {
  'use strict';

  var LARGEUR_CIBLE = 1600;   // px, cote long apres redimensionnement
  var QUALITE = 0.82;         // JPEG

  var config = {
    resoudre: function () { return Promise.resolve(''); },
    televerser: function () { return Promise.reject(new Error('televersement non configure')); },
    editable: false
  };

  var enAttente = [];

  function configurer(c) {
    Object.keys(c || {}).forEach(function (k) { config[k] = c[k]; });
    var f = enAttente.splice(0, enAttente.length);
    f.forEach(function (el) { el.rafraichir(); });
  }

  /* ── Redimensionnement cote client ───────────────────────────────────
   * Un enseignant depose une photo de 4 Mo prise au telephone ; sans ca on
   * la sert telle quelle a chaque visiteur. On ramene le cote long a
   * LARGEUR_CIBLE et on encode en JPEG. Les images plus petites que la
   * cible ne sont pas agrandies.
   */
  function redimensionner(file) {
    return new Promise(function (resolve, reject) {
      if (!/^image\//.test(file.type)) { reject(new Error('Ce fichier n’est pas une image.')); return; }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var ratio = Math.min(1, LARGEUR_CIBLE / Math.max(img.width, img.height));
        var w = Math.round(img.width * ratio);
        var h = Math.round(img.height * ratio);
        var cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        var ctx = cv.getContext('2d');
        // Fond blanc : un PNG transparent aplati en JPEG devient noir sinon.
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        cv.toBlob(function (blob) {
          if (!blob) { reject(new Error('Conversion impossible.')); return; }
          resolve(blob);
        }, 'image/jpeg', QUALITE);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('Image illisible.'));
      };
      img.src = url;
    });
  }

  var CSS_HOTE = 'position:absolute;inset:0;display:block;overflow:hidden;background:#f2f2f2;';

  function ImageSlotClass() {
    var Base = global.HTMLElement;

    function ImageSlot() {
      return Reflect.construct(Base, [], ImageSlot);
    }
    ImageSlot.prototype = Object.create(Base.prototype);
    ImageSlot.prototype.constructor = ImageSlot;
    Object.setPrototypeOf(ImageSlot, Base);

    ImageSlot.observedAttributes = ['path', 'placeholder'];

    ImageSlot.prototype.connectedCallback = function () {
      this.style.cssText = CSS_HOTE;
      if (!this._monte) { this._monter(); this._monte = true; }
      this.rafraichir();
    };

    ImageSlot.prototype.attributeChangedCallback = function () {
      if (this._monte) this.rafraichir();
    };

    ImageSlot.prototype._monter = function () {
      var self = this;

      this._img = document.createElement('img');
      this._img.alt = '';
      this._img.style.cssText =
        'width:100%;height:100%;object-fit:cover;display:none;user-select:none;-webkit-user-drag:none;';

      this._vide = document.createElement('div');
      this._vide.style.cssText =
        'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' +
        'justify-content:center;gap:8px;padding:12px;text-align:center;box-sizing:border-box;' +
        "font-family:'Comic Neue','Comic Sans MS',cursive;font-weight:700;font-size:13px;" +
        'color:#8a8a8a;line-height:1.35;';

      this._etat = document.createElement('div');
      this._etat.style.cssText =
        'position:absolute;left:0;right:0;bottom:0;padding:5px 8px;box-sizing:border-box;' +
        "font-family:'Comic Neue',cursive;font-weight:700;font-size:12px;color:#fff;" +
        'background:rgba(16,16,16,0.78);display:none;';

      this._input = document.createElement('input');
      this._input.type = 'file';
      this._input.accept = 'image/*';
      this._input.style.display = 'none';
      this._input.addEventListener('change', function () {
        if (self._input.files && self._input.files[0]) self._prendre(self._input.files[0]);
        self._input.value = '';
      });

      this.appendChild(this._img);
      this.appendChild(this._vide);
      this.appendChild(this._etat);
      this.appendChild(this._input);

      this.addEventListener('click', function () {
        if (config.editable) self._input.click();
      });
      ['dragenter', 'dragover'].forEach(function (t) {
        self.addEventListener(t, function (e) {
          if (!config.editable) return;
          e.preventDefault(); e.stopPropagation();
          self.style.outline = '3px dashed #22ccf5';
          self.style.outlineOffset = '-6px';
        });
      });
      ['dragleave', 'drop'].forEach(function (t) {
        self.addEventListener(t, function (e) {
          if (!config.editable) return;
          e.preventDefault(); e.stopPropagation();
          self.style.outline = '';
          if (t === 'drop' && e.dataTransfer && e.dataTransfer.files[0]) {
            self._prendre(e.dataTransfer.files[0]);
          }
        });
      });
    };

    ImageSlot.prototype.rafraichir = function () {
      var self = this;
      var path = this.getAttribute('path') || '';
      this._vide.textContent = '';

      if (!path) {
        this._img.style.display = 'none';
        // Icone en SVG inline plutot qu'un emoji : meme dessin sur macOS,
        // Windows et Android, et neutre a l'impression.
        var ic = document.createElement('div');
        ic.innerHTML =
          '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" ' +
          'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<rect x="3" y="3" width="18" height="18" rx="2"/>' +
          '<circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
        ic.style.cssText = 'line-height:0;opacity:.75;';
        var txt = document.createElement('div');
        txt.textContent = this.getAttribute('placeholder') || '';
        this._vide.appendChild(ic);
        this._vide.appendChild(txt);
        if (config.editable) {
          var aide = document.createElement('div');
          aide.textContent = 'Clique ou dépose une image';
          aide.style.cssText = 'font-size:11px;color:#b0b0b0;';
          this._vide.appendChild(aide);
        }
        this._vide.style.display = 'flex';
        this.style.cursor = config.editable ? 'pointer' : '';
        return;
      }

      this.style.cursor = config.editable ? 'pointer' : '';
      Promise.resolve(config.resoudre(path)).then(function (url) {
        if (!url) throw new Error('URL introuvable');
        self._img.src = url;
        self._img.style.display = 'block';
        self._vide.style.display = 'none';
      }).catch(function () {
        self._img.style.display = 'none';
        self._vide.textContent = 'Image indisponible';
        self._vide.style.display = 'flex';
      });
    };

    ImageSlot.prototype._prendre = function (file) {
      var self = this;
      var champ = this.getAttribute('data-champ') || '';
      this._message('Préparation…');
      redimensionner(file)
        .then(function (blob) {
          self._message('Téléversement… 0 %');
          return config.televerser(blob, champ, function (pct) {
            self._message('Téléversement… ' + Math.round(pct) + ' %');
          });
        })
        .then(function (path) {
          self.setAttribute('path', path);
          self._message('');
          self.dispatchEvent(new CustomEvent('zts-image', {
            bubbles: true, detail: { champ: champ, path: path }
          }));
        })
        .catch(function (err) {
          self._message(err && err.message ? err.message : 'Échec du téléversement');
          setTimeout(function () { self._message(''); }, 4000);
        });
    };

    ImageSlot.prototype._message = function (txt) {
      this._etat.textContent = txt || '';
      this._etat.style.display = txt ? 'block' : 'none';
    };

    return ImageSlot;
  }

  if (!global.customElements.get('image-slot')) {
    global.customElements.define('image-slot', ImageSlotClass());
  }

  global.ZTSImageSlot = {
    configurer: configurer,
    LARGEUR_CIBLE: LARGEUR_CIBLE
  };
})(window);
