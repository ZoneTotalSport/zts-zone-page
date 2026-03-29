/**
 * ZTS Zone - Dock flottant avec 6 outils pour enseignants EPS
 * Des, Roue, Chronometre, Timer, Equipes, Post-it
 */
(function(root) {
  'use strict';

  // ── Inject Styles ──
  function injectDockStyles() {
    if (document.getElementById('zts-dock-styles')) return;
    var s = document.createElement('style');
    s.id = 'zts-dock-styles';
    s.textContent = '\
/* ── Dock Container ── */\
.zts-dock{\
  position:fixed;right:16px;top:50%;transform:translateY(-50%);z-index:99990;\
  display:flex;flex-direction:column;gap:12px;\
}\
.zts-dock-btn{\
  width:68px;height:68px;border-radius:18px;border:3px solid rgba(255,255,255,.4);\
  display:flex;align-items:center;justify-content:center;\
  font-size:2rem;cursor:pointer;\
  box-shadow:0 4px 20px rgba(0,0,0,.2);transition:all .3s;\
  position:relative;\
}\
.zts-dock-btn:hover{transform:scale(1.2);box-shadow:0 8px 35px rgba(0,0,0,.4)}\
.zts-dock-btn:active{transform:scale(.95)}\
.zts-dock-btn .zts-dock-tooltip{\
  position:absolute;right:calc(100% + 10px);top:50%;transform:translateY(-50%);\
  background:rgba(15,15,46,.95);color:#fff;padding:6px 12px;border-radius:10px;\
  font-family:"Schoolbell",cursive;font-size:.85rem;white-space:nowrap;\
  opacity:0;visibility:hidden;transition:all .2s;pointer-events:none;\
}\
.zts-dock-btn:hover .zts-dock-tooltip{opacity:1;visibility:visible}\
\
.zts-dock-btn-dice{background:linear-gradient(135deg,#00E5FF,#0096C7);}\
.zts-dock-btn-wheel{background:linear-gradient(135deg,#FFD700,#FFA500);}\
.zts-dock-btn-chrono{background:linear-gradient(135deg,#FF2A7A,#FF6B9D);}\
.zts-dock-btn-timer{background:linear-gradient(135deg,#8B5CF6,#A78BFA);}\
.zts-dock-btn-teams{background:linear-gradient(135deg,#39FF14,#22C55E);}\
.zts-dock-btn-postit{background:linear-gradient(135deg,#FF6B00,#FF9500);}\
\
/* ── Panel Base ── */\
.zts-dock-panel{\
  position:fixed;z-index:99995;\
  background:url("gym-bg.jpg") center/cover no-repeat;\
  border-radius:28px;\
  border:4px solid #00E5FF;\
  box-shadow:0 25px 60px rgba(0,0,0,.5),0 0 60px rgba(0,229,255,.15);\
  padding:36px;color:#fff;font-family:"Schoolbell",cursive;\
  opacity:0;visibility:hidden;transform:scale(.9);\
  transition:all .4s cubic-bezier(.34,1.56,.64,1);\
  width:90vw;max-width:520px;max-height:88vh;overflow-y:auto;\
  top:50%;left:50%;margin:0;\
}\
.zts-dock-panel::before{\
  content:"";position:absolute;inset:0;background:rgba(15,15,46,.88);border-radius:24px;z-index:0;\
}\
.zts-dock-panel>*{position:relative;z-index:1;}\
.zts-dock-panel.open{opacity:1;visibility:visible;transform:translate(-50%,-50%) scale(1)}\
.zts-dock-panel-title{\
  font-family:"Bangers",cursive;font-size:2.5rem;color:#FFD700;\
  text-shadow:2px 2px 0 rgba(0,0,0,.3);margin:0 0 16px;text-align:center;\
  letter-spacing:2px;\
}\
.zts-dock-panel-close{\
  position:absolute;top:12px;right:12px;width:36px;height:36px;\
  border-radius:50%;border:2px solid rgba(255,255,255,.2);background:rgba(255,255,255,.1);\
  color:#fff;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;\
  justify-content:center;transition:all .2s;font-family:sans-serif;\
}\
.zts-dock-panel-close:hover{background:rgba(255,42,122,.5);border-color:#FF2A7A}\
\
/* ── Dice ── */\
.zts-dice-display{\
  display:flex;justify-content:center;gap:20px;margin:20px 0;\
}\
.zts-dice{\
  width:120px;height:120px;border-radius:22px;\
  background:linear-gradient(145deg,#fff,#f0f0f0);\
  display:flex;align-items:center;justify-content:center;\
  font-size:3rem;color:#1a1a2e;font-family:"Bangers",cursive;\
  box-shadow:0 8px 30px rgba(0,0,0,.3),inset 0 2px 0 rgba(255,255,255,.5);\
  transition:transform .3s;border:3px solid #FFD700;\
}\
.zts-dice.rolling{animation:diceRoll .4s ease-in-out}\
@keyframes diceRoll{0%{transform:rotateX(0) rotateZ(0)}25%{transform:rotateX(90deg) rotateZ(90deg) scale(1.1)}50%{transform:rotateX(180deg) rotateZ(180deg)}75%{transform:rotateX(270deg) rotateZ(270deg) scale(.9)}100%{transform:rotateX(360deg) rotateZ(360deg)}}\
\
.zts-dock-action-btn{\
  display:inline-flex;align-items:center;justify-content:center;gap:6px;\
  padding:12px 24px;border-radius:14px;border:none;cursor:pointer;\
  font-family:"Bangers",cursive;font-size:1.1rem;letter-spacing:1px;\
  transition:all .3s;color:#1a1a2e;\
}\
.zts-dock-action-btn:hover{transform:translateY(-2px)}\
.zts-dock-btn-cyan{background:linear-gradient(135deg,#00E5FF,#0096C7);}\
.zts-dock-btn-yellow{background:linear-gradient(135deg,#FFD700,#FFA500);}\
.zts-dock-btn-pink{background:linear-gradient(135deg,#FF2A7A,#FF6B9D);color:#fff;}\
.zts-dock-btn-green{background:linear-gradient(135deg,#39FF14,#22C55E);}\
.zts-dock-btn-violet{background:linear-gradient(135deg,#8B5CF6,#A78BFA);color:#fff;}\
.zts-dock-btn-orange{background:linear-gradient(135deg,#FF6B00,#FF9500);}\
\
.zts-dock-mode-btns{\
  display:flex;gap:8px;justify-content:center;margin-bottom:16px;flex-wrap:wrap;\
}\
.zts-dock-mode-btn{\
  padding:8px 16px;border-radius:12px;border:2px solid rgba(255,255,255,.2);\
  background:rgba(255,255,255,.1);color:#fff;cursor:pointer;\
  font-family:"Schoolbell",cursive;font-size:.95rem;transition:all .2s;\
}\
.zts-dock-mode-btn.active{background:rgba(255,215,0,.3);border-color:#FFD700;color:#FFD700}\
\
/* ── Chrono/Timer Display ── */\
.zts-time-display{\
  text-align:center;font-family:"Bangers",cursive;font-size:4rem;\
  color:#00E5FF;text-shadow:0 0 30px rgba(0,229,255,.5);\
  margin:20px 0;letter-spacing:4px;\
}\
.zts-time-controls{\
  display:flex;gap:10px;justify-content:center;flex-wrap:wrap;\
}\
\
/* ── Wheel ── */\
.zts-wheel-canvas-wrap{\
  position:relative;width:380px;height:380px;margin:0 auto 20px;\
}\
.zts-wheel-canvas{\
  width:380px;height:380px;border-radius:50%;\
  box-shadow:0 0 40px rgba(255,215,0,.3);border:4px solid #FFD700;\
}\
.zts-wheel-pointer{\
  position:absolute;top:-12px;left:50%;transform:translateX(-50%);\
  width:0;height:0;border-left:14px solid transparent;border-right:14px solid transparent;\
  border-top:24px solid #FFD700;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3));\
}\
.zts-wheel-result{\
  text-align:center;font-family:"Bangers",cursive;font-size:1.8rem;\
  color:#39FF14;min-height:2.2rem;margin:8px 0;\
}\
.zts-wheel-textarea{\
  width:100%;height:100px;border-radius:14px;border:2px solid rgba(255,255,255,.2);\
  background:rgba(255,255,255,.1);color:#fff;padding:12px;\
  font-family:"Schoolbell",cursive;font-size:1rem;resize:vertical;\
}\
.zts-wheel-textarea::placeholder{color:rgba(255,255,255,.4)}\
\
/* ── Teams ── */\
.zts-teams-result{\
  display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;\
}\
.zts-team-card{\
  border-radius:14px;padding:14px;text-align:center;\
}\
.zts-team-card h4{font-family:"Bangers",cursive;font-size:1.1rem;margin:0 0 8px;letter-spacing:1px;}\
.zts-team-card ul{list-style:none;padding:0;margin:0;}\
.zts-team-card li{padding:3px 0;font-size:.95rem;}\
\
/* ── Post-it ── */\
.zts-postit-textarea{\
  width:100%;height:200px;border-radius:14px;border:2px solid rgba(255,215,0,.3);\
  background:rgba(255,215,0,.1);color:#FFD700;padding:16px;\
  font-family:"Schoolbell",cursive;font-size:1.3rem;resize:none;\
}\
.zts-postit-textarea::placeholder{color:rgba(255,215,0,.4)}\
.zts-postit-fullscreen{\
  position:fixed;inset:0;z-index:100005;\
  background:linear-gradient(145deg,#FF6B00,#FF9500);\
  display:flex;align-items:center;justify-content:center;\
  opacity:0;visibility:hidden;transition:all .4s;\
}\
.zts-postit-fullscreen.open{opacity:1;visibility:visible}\
.zts-postit-fullscreen-text{\
  font-family:"Bangers",cursive;font-size:6vw;color:#fff;\
  text-shadow:4px 4px 0 rgba(0,0,0,.2);text-align:center;\
  padding:40px;max-width:90vw;word-wrap:break-word;\
}\
.zts-postit-fullscreen-close{\
  position:absolute;top:20px;right:20px;width:50px;height:50px;\
  border-radius:50%;border:3px solid rgba(255,255,255,.4);\
  background:rgba(0,0,0,.3);color:#fff;font-size:1.8rem;\
  cursor:pointer;display:flex;align-items:center;justify-content:center;\
  font-family:sans-serif;\
}\
\
/* ── Responsive ── */\
@media(max-width:768px){\
  .zts-dock{right:8px;gap:6px;}\
  .zts-dock-btn{width:44px;height:44px;font-size:1.2rem;border-radius:12px;}\
  .zts-dock-panel{width:calc(100vw - 20px) !important;right:10px !important;left:10px !important;\
    top:50% !important;transform:translateY(-50%) scale(.9) !important;max-height:85vh;padding:18px;}\
  .zts-dock-panel.open{transform:translateY(-50%) scale(1) !important}\
  .zts-dice{width:70px;height:70px;font-size:2.2rem;}\
  .zts-time-display{font-size:2.8rem;}\
  .zts-wheel-canvas-wrap,.zts-wheel-canvas{width:220px;height:220px;}\
  .zts-postit-fullscreen-text{font-size:8vw;}\
  .zts-teams-result{grid-template-columns:1fr;}\
}\
';
    document.head.appendChild(s);
  }

  // ── Panel positions ──
  var PANEL_POS = 'top:50%;left:50%;transform-origin:center center;';

  // ── Active panel ──
  var _activePanel = null;

  function closeActivePanel() {
    if (_activePanel) {
      _activePanel.classList.remove('open');
      var overlay = document.getElementById('ztsDockOverlay');
      if (overlay) overlay.remove();
      setTimeout(function() { if (_activePanel && _activePanel.parentNode) _activePanel.remove(); _activePanel = null; }, 400);
    }
  }

  function openPanel(id, w, html) {
    closeActivePanel();
    // Overlay
    var ov = document.createElement('div');
    ov.id = 'ztsDockOverlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:99994;background:rgba(0,0,0,.6);backdrop-filter:blur(6px);';
    ov.addEventListener('click', closeActivePanel);
    document.body.appendChild(ov);
    // Panel
    var p = document.createElement('div');
    p.className = 'zts-dock-panel';
    p.id = id;
    p.style.cssText = PANEL_POS + 'max-width:' + w + 'px;transform:translate(-50%,-50%) scale(.9);';
    p.innerHTML = '<button class="zts-dock-panel-close" onclick="document.getElementById(\'' + id + '\').classList.remove(\'open\')">&times;</button>' + html;
    document.body.appendChild(p);
    _activePanel = p;
    p.querySelector('.zts-dock-panel-close').addEventListener('click', closeActivePanel);
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        p.classList.add('open');
        p.style.transform = 'translate(-50%,-50%) scale(1)';
      });
    });
    return p;
  }

  // ══════════════════════════════════════════════════════
  // 1. DICE
  // ══════════════════════════════════════════════════════
  var _diceMode = '2d6'; // '1d6', '2d6', '1d20'

  function openDice() {
    var html = '\
      <h3 class="zts-dock-panel-title">&#x1F3B2; Des</h3>\
      <div class="zts-dock-mode-btns">\
        <button class="zts-dock-mode-btn ' + (_diceMode === '1d6' ? 'active' : '') + '" data-mode="1d6">1 de (1-6)</button>\
        <button class="zts-dock-mode-btn ' + (_diceMode === '2d6' ? 'active' : '') + '" data-mode="2d6">2 des (1-6)</button>\
        <button class="zts-dock-mode-btn ' + (_diceMode === '1d20' ? 'active' : '') + '" data-mode="1d20">1 de (1-20)</button>\
      </div>\
      <div class="zts-dice-display" id="ztsDiceDisplay">\
        <div class="zts-dice" id="ztsDice1">?</div>\
        ' + (_diceMode === '2d6' ? '<div class="zts-dice" id="ztsDice2">?</div>' : '') + '\
      </div>\
      <div style="text-align:center;margin-top:16px;">\
        <button class="zts-dock-action-btn zts-dock-btn-cyan" id="ztsDiceRoll">&#x1F3B2; Lancer!</button>\
      </div>';

    var panel = openPanel('ztsDicePanel', 340, html);

    // Mode buttons
    panel.querySelectorAll('[data-mode]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        _diceMode = btn.dataset.mode;
        openDice();
      });
    });

    // Roll
    panel.querySelector('#ztsDiceRoll').addEventListener('click', function() {
      var d1 = panel.querySelector('#ztsDice1');
      var d2 = panel.querySelector('#ztsDice2');
      var max = _diceMode === '1d20' ? 20 : 6;

      d1.classList.add('rolling');
      if (d2) d2.classList.add('rolling');

      setTimeout(function() {
        d1.textContent = Math.floor(Math.random() * max) + 1;
        d1.classList.remove('rolling');
        if (d2) {
          d2.textContent = Math.floor(Math.random() * 6) + 1;
          d2.classList.remove('rolling');
        }
      }, 400);
    });
  }

  // ══════════════════════════════════════════════════════
  // 2. WHEEL (Random Name Picker)
  // ══════════════════════════════════════════════════════
  var _wheelNames = '';
  var _wheelSpinning = false;

  function openWheel() {
    var html = '\
      <h3 class="zts-dock-panel-title">&#x1F3A1; Roue aleatoire</h3>\
      <div class="zts-wheel-canvas-wrap">\
        <div class="zts-wheel-pointer"></div>\
        <canvas class="zts-wheel-canvas" id="ztsWheelCanvas" width="280" height="280"></canvas>\
      </div>\
      <div class="zts-wheel-result" id="ztsWheelResult"></div>\
      <textarea class="zts-wheel-textarea" id="ztsWheelNames" placeholder="Entre les noms (un par ligne)...">' + _wheelNames + '</textarea>\
      <div style="text-align:center;margin-top:12px;">\
        <button class="zts-dock-action-btn zts-dock-btn-yellow" id="ztsWheelSpin">&#x1F3A1; Tourner!</button>\
      </div>';

    var panel = openPanel('ztsWheelPanel', 360, html);
    var canvas = document.getElementById('ztsWheelCanvas');
    var ctx = canvas.getContext('2d');
    var textarea = document.getElementById('ztsWheelNames');
    var resultEl = document.getElementById('ztsWheelResult');

    var COLORS = ['#00E5FF', '#FFD700', '#FF2A7A', '#39FF14', '#8B5CF6', '#FF6B00',
                  '#0096C7', '#FFA500', '#FF6B9D', '#22C55E', '#A78BFA', '#FF9500'];
    var angle = 0;

    function getNames() {
      return textarea.value.split('\n').map(function(n) { return n.trim(); }).filter(Boolean);
    }

    function drawWheel(names, currentAngle) {
      ctx.clearRect(0, 0, 280, 280);
      if (names.length === 0) {
        ctx.fillStyle = 'rgba(255,255,255,.1)';
        ctx.beginPath();
        ctx.arc(140, 140, 136, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '16px Schoolbell';
        ctx.textAlign = 'center';
        ctx.fillText('Ajoute des noms!', 140, 145);
        return;
      }
      var sliceAngle = (Math.PI * 2) / names.length;
      names.forEach(function(name, i) {
        var start = currentAngle + i * sliceAngle;
        var end = start + sliceAngle;
        ctx.beginPath();
        ctx.moveTo(140, 140);
        ctx.arc(140, 140, 136, start, end);
        ctx.closePath();
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Text
        ctx.save();
        ctx.translate(140, 140);
        ctx.rotate(start + sliceAngle / 2);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px Schoolbell';
        ctx.textAlign = 'right';
        ctx.shadowColor = 'rgba(0,0,0,.5)';
        ctx.shadowBlur = 3;
        var displayName = name.length > 12 ? name.substring(0, 11) + '..' : name;
        ctx.fillText(displayName, 125, 5);
        ctx.restore();
      });
      // Center circle
      ctx.beginPath();
      ctx.arc(140, 140, 20, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD700';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    textarea.addEventListener('input', function() {
      _wheelNames = textarea.value;
      drawWheel(getNames(), angle);
    });

    drawWheel(getNames(), angle);

    panel.querySelector('#ztsWheelSpin').addEventListener('click', function() {
      var names = getNames();
      if (names.length < 2 || _wheelSpinning) return;
      _wheelSpinning = true;
      resultEl.textContent = '';

      var totalRotation = Math.PI * 2 * (5 + Math.random() * 5);
      var startAngle = angle;
      var startTime = Date.now();
      var duration = 3000 + Math.random() * 1000;

      function animate() {
        var elapsed = Date.now() - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        angle = startAngle + totalRotation * eased;
        drawWheel(names, angle);
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          _wheelSpinning = false;
          // Calculate winner
          var normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          var sliceAngle = (Math.PI * 2) / names.length;
          // Pointer is at top (3pi/2), so winner is at top
          var pointerAngle = ((Math.PI * 3 / 2 - normalizedAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          var winnerIndex = Math.floor(pointerAngle / sliceAngle) % names.length;
          resultEl.textContent = '🎉 ' + names[winnerIndex] + ' !';
        }
      }
      requestAnimationFrame(animate);
    });
  }

  // ══════════════════════════════════════════════════════
  // 3. CHRONOMETRE
  // ══════════════════════════════════════════════════════
  var _chronoStart = 0, _chronoElapsed = 0, _chronoRunning = false, _chronoInterval = null;

  function formatTime(ms) {
    var totalSec = Math.floor(ms / 1000);
    var min = Math.floor(totalSec / 60);
    var sec = totalSec % 60;
    var cent = Math.floor((ms % 1000) / 10);
    return (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec + '.' + (cent < 10 ? '0' : '') + cent;
  }

  function openChrono() {
    var html = '\
      <h3 class="zts-dock-panel-title">&#x23F1;&#xFE0F; Chronometre</h3>\
      <div class="zts-time-display" id="ztsChronoDisplay">' + formatTime(_chronoElapsed) + '</div>\
      <div class="zts-time-controls">\
        <button class="zts-dock-action-btn zts-dock-btn-green" id="ztsChronoStart">' + (_chronoRunning ? '&#x23F8; Pause' : '&#x25B6;&#xFE0F; Partir') + '</button>\
        <button class="zts-dock-action-btn zts-dock-btn-pink" id="ztsChronoReset">&#x1F504; Reset</button>\
      </div>';

    var panel = openPanel('ztsChronoPanel', 340, html);
    var display = document.getElementById('ztsChronoDisplay');

    function updateDisplay() {
      if (!document.getElementById('ztsChronoDisplay')) return;
      var now = _chronoRunning ? _chronoElapsed + (Date.now() - _chronoStart) : _chronoElapsed;
      display.textContent = formatTime(now);
    }

    if (_chronoRunning) {
      _chronoInterval = setInterval(updateDisplay, 50);
    }

    panel.querySelector('#ztsChronoStart').addEventListener('click', function() {
      if (_chronoRunning) {
        _chronoElapsed += Date.now() - _chronoStart;
        _chronoRunning = false;
        clearInterval(_chronoInterval);
        this.innerHTML = '&#x25B6;&#xFE0F; Partir';
      } else {
        _chronoStart = Date.now();
        _chronoRunning = true;
        _chronoInterval = setInterval(updateDisplay, 50);
        this.innerHTML = '&#x23F8; Pause';
      }
    });

    panel.querySelector('#ztsChronoReset').addEventListener('click', function() {
      _chronoRunning = false;
      _chronoElapsed = 0;
      clearInterval(_chronoInterval);
      display.textContent = formatTime(0);
      panel.querySelector('#ztsChronoStart').innerHTML = '&#x25B6;&#xFE0F; Partir';
    });
  }

  // ══════════════════════════════════════════════════════
  // 4. TIMER (Countdown)
  // ══════════════════════════════════════════════════════
  var _timerTotal = 60, _timerRemaining = 60, _timerRunning = false, _timerInterval = null, _timerEnd = 0;

  function formatTimerTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function openTimer() {
    var presets = [
      { label: '30s', sec: 30 },
      { label: '1 min', sec: 60 },
      { label: '3 min', sec: 180 },
      { label: '5 min', sec: 300 },
      { label: '10 min', sec: 600 },
      { label: '15 min', sec: 900 },
      { label: '20 min', sec: 1200 }
    ];
    var curMin = Math.floor(_timerRemaining / 60);
    var curSec = _timerRemaining % 60;
    var html = '\
      <h3 class="zts-dock-panel-title">&#x23F2;&#xFE0F; Minuterie</h3>\
      <div class="zts-dock-mode-btns" id="ztsTimerPresets">\
        ' + presets.map(function(p) {
          return '<button class="zts-dock-mode-btn' + (_timerTotal === p.sec ? ' active' : '') + '" data-sec="' + p.sec + '">' + p.label + '</button>';
        }).join('') + '\
      </div>\
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin:12px 0;">\
        <input type="number" id="ztsTimerInputMin" value="' + curMin + '" min="0" max="120" style="width:70px;text-align:center;font-family:Bangers,cursive;font-size:2rem;background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.2);border-radius:12px;color:#FF2A7A;padding:8px;" />\
        <span style="font-family:Bangers,cursive;font-size:2rem;color:#fff;">:</span>\
        <input type="number" id="ztsTimerInputSec" value="' + (curSec < 10 ? '0' + curSec : curSec) + '" min="0" max="59" style="width:70px;text-align:center;font-family:Bangers,cursive;font-size:2rem;background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.2);border-radius:12px;color:#FF2A7A;padding:8px;" />\
        <button id="ztsTimerSetCustom" style="padding:8px 16px;border-radius:12px;border:2px solid #39FF14;background:rgba(57,255,20,.15);color:#39FF14;font-family:Bangers,cursive;font-size:1.1rem;cursor:pointer;">OK</button>\
      </div>\
      <div class="zts-time-display" id="ztsTimerDisplay" style="color:#FF2A7A;text-shadow:0 0 30px rgba(255,42,122,.5);">' + formatTimerTime(_timerRemaining) + '</div>\
      <div style="width:100%;height:8px;border-radius:4px;background:rgba(255,255,255,.1);margin-bottom:16px;overflow:hidden;">\
        <div id="ztsTimerBar" style="height:100%;border-radius:4px;background:linear-gradient(90deg,#FF2A7A,#FFD700);width:' + (_timerTotal > 0 ? (_timerRemaining / _timerTotal * 100) : 100) + '%;transition:width .5s;"></div>\
      </div>\
      <div class="zts-time-controls">\
        <button class="zts-dock-action-btn zts-dock-btn-green" id="ztsTimerStart">' + (_timerRunning ? '&#x23F8; Pause' : '&#x25B6;&#xFE0F; Partir') + '</button>\
        <button class="zts-dock-action-btn zts-dock-btn-pink" id="ztsTimerReset">&#x1F504; Reset</button>\
      </div>';

    var panel = openPanel('ztsTimerPanel', 340, html);
    var display = document.getElementById('ztsTimerDisplay');
    var bar = document.getElementById('ztsTimerBar');

    function updateTimer() {
      if (!document.getElementById('ztsTimerDisplay')) return;
      if (_timerRunning) {
        _timerRemaining = Math.max(0, Math.ceil((_timerEnd - Date.now()) / 1000));
      }
      display.textContent = formatTimerTime(_timerRemaining);
      bar.style.width = (_timerTotal > 0 ? (_timerRemaining / _timerTotal * 100) : 0) + '%';
      if (_timerRemaining <= 0 && _timerRunning) {
        _timerRunning = false;
        clearInterval(_timerInterval);
        display.textContent = '00:00';
        display.style.animation = 'ztsBlink 0.5s infinite';
        // Sound alert
        try {
          var actx = new (window.AudioContext || window.webkitAudioContext)();
          [0, 200, 400].forEach(function(delay) {
            var osc = actx.createOscillator();
            var gain = actx.createGain();
            osc.connect(gain); gain.connect(actx.destination);
            osc.frequency.value = 880;
            osc.type = 'square';
            gain.gain.value = 0.15;
            osc.start(actx.currentTime + delay / 1000);
            osc.stop(actx.currentTime + delay / 1000 + 0.15);
          });
        } catch(e) {}
        var startBtn = panel.querySelector('#ztsTimerStart');
        if (startBtn) startBtn.innerHTML = '&#x25B6;&#xFE0F; Partir';
      }
    }

    if (_timerRunning) {
      _timerInterval = setInterval(updateTimer, 200);
    }

    // Presets
    panel.querySelectorAll('[data-sec]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (_timerRunning) return;
        var sec = parseInt(btn.dataset.sec);
        _timerTotal = sec;
        _timerRemaining = sec;
        panel.querySelectorAll('[data-sec]').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        display.textContent = formatTimerTime(sec);
        display.style.animation = '';
        bar.style.width = '100%';
      });
    });

    // Bouton OK - temps personnalisé
    panel.querySelector('#ztsTimerSetCustom').addEventListener('click', function() {
      if (_timerRunning) return;
      var m = parseInt(document.getElementById('ztsTimerInputMin').value) || 0;
      var s = parseInt(document.getElementById('ztsTimerInputSec').value) || 0;
      var total = m * 60 + s;
      if (total <= 0) return;
      _timerTotal = total;
      _timerRemaining = total;
      panel.querySelectorAll('[data-sec]').forEach(function(b) { b.classList.remove('active'); });
      display.textContent = formatTimerTime(total);
      display.style.animation = '';
      bar.style.width = '100%';
    });

    panel.querySelector('#ztsTimerStart').addEventListener('click', function() {
      if (_timerRunning) {
        _timerRemaining = Math.max(0, Math.ceil((_timerEnd - Date.now()) / 1000));
        _timerRunning = false;
        clearInterval(_timerInterval);
        this.innerHTML = '&#x25B6;&#xFE0F; Partir';
      } else {
        if (_timerRemaining <= 0) return;
        _timerEnd = Date.now() + _timerRemaining * 1000;
        _timerRunning = true;
        display.style.animation = '';
        _timerInterval = setInterval(updateTimer, 200);
        this.innerHTML = '&#x23F8; Pause';
      }
    });

    panel.querySelector('#ztsTimerReset').addEventListener('click', function() {
      _timerRunning = false;
      clearInterval(_timerInterval);
      _timerRemaining = _timerTotal;
      display.textContent = formatTimerTime(_timerTotal);
      display.style.animation = '';
      bar.style.width = '100%';
      panel.querySelector('#ztsTimerStart').innerHTML = '&#x25B6;&#xFE0F; Partir';
    });
  }

  // ══════════════════════════════════════════════════════
  // 5. EQUIPES
  // ══════════════════════════════════════════════════════
  var _teamsNames = '', _teamsCount = 2;

  function openTeams() {
    var html = '\
      <h3 class="zts-dock-panel-title">&#x1F465; Generateur d\'equipes</h3>\
      <textarea class="zts-wheel-textarea" id="ztsTeamsNames" placeholder="Entre les noms des eleves (un par ligne)...">' + _teamsNames + '</textarea>\
      <div style="display:flex;align-items:center;gap:10px;margin:12px 0;justify-content:center;">\
        <span style="font-size:1rem;">Nombre d\'equipes:</span>\
        <button class="zts-dock-mode-btn" id="ztsTeamsMinus">-</button>\
        <span id="ztsTeamsCount" style="font-family:Bangers;font-size:1.5rem;color:#FFD700;min-width:30px;text-align:center;">' + _teamsCount + '</span>\
        <button class="zts-dock-mode-btn" id="ztsTeamsPlus">+</button>\
      </div>\
      <div style="text-align:center;">\
        <button class="zts-dock-action-btn zts-dock-btn-green" id="ztsTeamsGenerate">&#x1F465; Generer!</button>\
      </div>\
      <div id="ztsTeamsResult" class="zts-teams-result"></div>';

    var panel = openPanel('ztsTeamsPanel', 380, html);
    var countEl = document.getElementById('ztsTeamsCount');
    var textarea = document.getElementById('ztsTeamsNames');

    textarea.addEventListener('input', function() { _teamsNames = textarea.value; });

    panel.querySelector('#ztsTeamsMinus').addEventListener('click', function() {
      if (_teamsCount > 2) { _teamsCount--; countEl.textContent = _teamsCount; }
    });
    panel.querySelector('#ztsTeamsPlus').addEventListener('click', function() {
      if (_teamsCount < 20) { _teamsCount++; countEl.textContent = _teamsCount; }
    });

    var teamColors = [
      { bg: 'rgba(0,229,255,.15)', border: '#00E5FF', color: '#00E5FF' },
      { bg: 'rgba(255,42,122,.15)', border: '#FF2A7A', color: '#FF2A7A' },
      { bg: 'rgba(57,255,20,.15)', border: '#39FF14', color: '#39FF14' },
      { bg: 'rgba(255,215,0,.15)', border: '#FFD700', color: '#FFD700' },
      { bg: 'rgba(139,92,246,.15)', border: '#8B5CF6', color: '#8B5CF6' },
      { bg: 'rgba(255,107,0,.15)', border: '#FF6B00', color: '#FF6B00' }
    ];

    panel.querySelector('#ztsTeamsGenerate').addEventListener('click', function() {
      var names = textarea.value.split('\n').map(function(n) { return n.trim(); }).filter(Boolean);
      if (names.length < _teamsCount) return;
      // Shuffle
      for (var i = names.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = names[i]; names[i] = names[j]; names[j] = tmp;
      }
      // Distribute
      var teams = [];
      for (var t = 0; t < _teamsCount; t++) teams.push([]);
      names.forEach(function(name, idx) { teams[idx % _teamsCount].push(name); });

      var resultEl = document.getElementById('ztsTeamsResult');
      resultEl.innerHTML = teams.map(function(team, idx) {
        var c = teamColors[idx % teamColors.length];
        return '<div class="zts-team-card" style="background:' + c.bg + ';border:2px solid ' + c.border + ';">' +
          '<h4 style="color:' + c.color + ';">Equipe ' + (idx + 1) + '</h4>' +
          '<ul>' + team.map(function(n) { return '<li>' + n + '</li>'; }).join('') + '</ul></div>';
      }).join('');
    });
  }

  // ══════════════════════════════════════════════════════
  // 6. POST-IT
  // ══════════════════════════════════════════════════════
  var _postitText = '';

  function openPostit() {
    var html = '\
      <h3 class="zts-dock-panel-title">&#x1F4DD; Message du jour</h3>\
      <textarea class="zts-postit-textarea" id="ztsPostitText" placeholder="Ecris ton message ici...">' + _postitText + '</textarea>\
      <div style="display:flex;gap:10px;justify-content:center;margin-top:12px;">\
        <button class="zts-dock-action-btn zts-dock-btn-orange" id="ztsPostitFull">&#x1F4FA; Plein ecran</button>\
      </div>';

    var panel = openPanel('ztsPostitPanel', 340, html);
    var textarea = document.getElementById('ztsPostitText');
    textarea.addEventListener('input', function() { _postitText = textarea.value; });

    panel.querySelector('#ztsPostitFull').addEventListener('click', function() {
      if (!_postitText.trim()) return;
      var fs = document.createElement('div');
      fs.className = 'zts-postit-fullscreen';
      fs.innerHTML = '<button class="zts-postit-fullscreen-close">&times;</button><div class="zts-postit-fullscreen-text">' +
        _postitText.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '</div>';
      document.body.appendChild(fs);
      requestAnimationFrame(function() { fs.classList.add('open'); });
      fs.querySelector('.zts-postit-fullscreen-close').addEventListener('click', function() {
        fs.classList.remove('open');
        setTimeout(function() { fs.remove(); }, 400);
      });
      fs.addEventListener('click', function(e) {
        if (e.target === fs) {
          fs.classList.remove('open');
          setTimeout(function() { fs.remove(); }, 400);
        }
      });
    });
  }

  // ── Build Dock ──
  // ══════════════════════════════════════════════════════
  // 7. PÉRIODE (temps restant à la période)
  // ══════════════════════════════════════════════════════
  var _periodTotal = 3600, _periodRemaining = 3600, _periodRunning = false, _periodEnd = 0, _periodInterval = null;

  function openPeriod() {
    var curMin = Math.floor(_periodRemaining / 60);
    var html = '\
      <h3 class="zts-dock-panel-title">&#x1F3EB; Temps de periode</h3>\
      <p style="text-align:center;font-size:1.1rem;color:rgba(255,255,255,.6);margin-bottom:16px;">Configure le temps total de ta periode</p>\
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:16px;">\
        <input type="number" id="ztsPeriodInput" value="' + curMin + '" min="1" max="120" style="width:90px;text-align:center;font-family:Bangers,cursive;font-size:2.5rem;background:rgba(255,255,255,.1);border:2px solid rgba(139,92,246,.4);border-radius:14px;color:#A78BFA;padding:10px;" />\
        <span style="font-family:Bangers,cursive;font-size:1.8rem;color:#A78BFA;">min</span>\
        <button id="ztsPeriodSet" style="padding:10px 20px;border-radius:12px;border:2px solid #8B5CF6;background:rgba(139,92,246,.2);color:#A78BFA;font-family:Bangers,cursive;font-size:1.2rem;cursor:pointer;">OK</button>\
      </div>\
      <div class="zts-dock-mode-btns">\
        <button class="zts-dock-mode-btn" data-pmin="30">30 min</button>\
        <button class="zts-dock-mode-btn" data-pmin="45">45 min</button>\
        <button class="zts-dock-mode-btn active" data-pmin="60">60 min</button>\
        <button class="zts-dock-mode-btn" data-pmin="75">75 min</button>\
        <button class="zts-dock-mode-btn" data-pmin="90">90 min</button>\
      </div>\
      <div class="zts-time-display" id="ztsPeriodDisplay" style="color:#A78BFA;text-shadow:0 0 30px rgba(139,92,246,.5);font-size:5rem;">' + formatTimerTime(_periodRemaining) + '</div>\
      <div style="width:100%;height:10px;border-radius:5px;background:rgba(255,255,255,.1);margin-bottom:16px;overflow:hidden;">\
        <div id="ztsPeriodBar" style="height:100%;border-radius:5px;background:linear-gradient(90deg,#8B5CF6,#A78BFA,#C4B5FD);width:' + (_periodTotal > 0 ? (_periodRemaining / _periodTotal * 100) : 100) + '%;transition:width 1s;"></div>\
      </div>\
      <div class="zts-time-controls">\
        <button class="zts-dock-action-btn zts-dock-btn-green" id="ztsPeriodStart">' + (_periodRunning ? '&#x23F8; Pause' : '&#x25B6;&#xFE0F; Partir') + '</button>\
        <button class="zts-dock-action-btn zts-dock-btn-pink" id="ztsPeriodReset">&#x1F504; Reset</button>\
      </div>';

    var panel = openPanel('ztsPeriodPanel', 400, html);
    var display = document.getElementById('ztsPeriodDisplay');
    var bar = document.getElementById('ztsPeriodBar');

    function updatePeriod() {
      if (!document.getElementById('ztsPeriodDisplay')) return;
      if (_periodRunning) {
        _periodRemaining = Math.max(0, Math.ceil((_periodEnd - Date.now()) / 1000));
      }
      display.textContent = formatTimerTime(_periodRemaining);
      bar.style.width = (_periodTotal > 0 ? (_periodRemaining / _periodTotal * 100) : 0) + '%';
      // Couleur change quand il reste peu de temps
      if (_periodRemaining <= 300 && _periodRemaining > 60) {
        display.style.color = '#FFD700';
      } else if (_periodRemaining <= 60) {
        display.style.color = '#FF2A7A';
        display.style.animation = 'ztsBlink 1s infinite';
      } else {
        display.style.color = '#A78BFA';
        display.style.animation = '';
      }
      if (_periodRemaining <= 0 && _periodRunning) {
        _periodRunning = false;
        clearInterval(_periodInterval);
        display.textContent = '00:00';
        try {
          var actx = new (window.AudioContext || window.webkitAudioContext)();
          [0, 300, 600, 900].forEach(function(delay) {
            var osc = actx.createOscillator();
            var gain = actx.createGain();
            osc.connect(gain); gain.connect(actx.destination);
            osc.frequency.value = 660;
            osc.type = 'square';
            gain.gain.value = 0.2;
            osc.start(actx.currentTime + delay / 1000);
            osc.stop(actx.currentTime + delay / 1000 + 0.2);
          });
        } catch(e) {}
      }
    }

    if (_periodRunning) {
      _periodInterval = setInterval(updatePeriod, 500);
    }

    // Presets
    panel.querySelectorAll('[data-pmin]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (_periodRunning) return;
        var sec = parseInt(btn.dataset.pmin) * 60;
        _periodTotal = sec;
        _periodRemaining = sec;
        document.getElementById('ztsPeriodInput').value = btn.dataset.pmin;
        panel.querySelectorAll('[data-pmin]').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        display.textContent = formatTimerTime(sec);
        display.style.color = '#A78BFA';
        display.style.animation = '';
        bar.style.width = '100%';
      });
    });

    // Bouton OK personnalisé
    panel.querySelector('#ztsPeriodSet').addEventListener('click', function() {
      if (_periodRunning) return;
      var m = parseInt(document.getElementById('ztsPeriodInput').value) || 60;
      _periodTotal = m * 60;
      _periodRemaining = m * 60;
      panel.querySelectorAll('[data-pmin]').forEach(function(b) { b.classList.remove('active'); });
      display.textContent = formatTimerTime(_periodTotal);
      display.style.color = '#A78BFA';
      display.style.animation = '';
      bar.style.width = '100%';
    });

    panel.querySelector('#ztsPeriodStart').addEventListener('click', function() {
      if (_periodRunning) {
        _periodRemaining = Math.max(0, Math.ceil((_periodEnd - Date.now()) / 1000));
        _periodRunning = false;
        clearInterval(_periodInterval);
        this.innerHTML = '&#x25B6;&#xFE0F; Partir';
      } else {
        if (_periodRemaining <= 0) return;
        _periodEnd = Date.now() + _periodRemaining * 1000;
        _periodRunning = true;
        display.style.animation = '';
        _periodInterval = setInterval(updatePeriod, 500);
        this.innerHTML = '&#x23F8; Pause';
      }
    });

    panel.querySelector('#ztsPeriodReset').addEventListener('click', function() {
      _periodRunning = false;
      clearInterval(_periodInterval);
      _periodRemaining = _periodTotal;
      display.textContent = formatTimerTime(_periodTotal);
      display.style.color = '#A78BFA';
      display.style.animation = '';
      bar.style.width = '100%';
      panel.querySelector('#ztsPeriodStart').innerHTML = '&#x25B6;&#xFE0F; Partir';
    });
  }

  function buildDock() {
    if (document.getElementById('ztsDock')) return;
    var dock = document.createElement('div');
    dock.className = 'zts-dock';
    dock.id = 'ztsDock';
    dock.innerHTML = '\
      <button class="zts-dock-btn zts-dock-btn-dice" id="ztsDockDice"><span class="zts-dock-tooltip">Des</span>&#x1F3B2;</button>\
      <button class="zts-dock-btn zts-dock-btn-wheel" id="ztsDockWheel"><span class="zts-dock-tooltip">Roue</span>&#x1F3A1;</button>\
      <button class="zts-dock-btn zts-dock-btn-chrono" id="ztsDockChrono"><span class="zts-dock-tooltip">Chronometre</span>&#x23F1;&#xFE0F;</button>\
      <button class="zts-dock-btn zts-dock-btn-timer" id="ztsDockTimer"><span class="zts-dock-tooltip">Minuterie</span>&#x23F2;&#xFE0F;</button>\
      <button class="zts-dock-btn zts-dock-btn-teams" id="ztsDockTeams"><span class="zts-dock-tooltip">Equipes</span>&#x1F465;</button>\
      <button class="zts-dock-btn zts-dock-btn-postit" id="ztsDockPostit"><span class="zts-dock-tooltip">Post-it</span>&#x1F4DD;</button>\
      <button class="zts-dock-btn" id="ztsDockPeriod" style="background:linear-gradient(135deg,#8B5CF6,#A78BFA);"><span class="zts-dock-tooltip">Periode</span>&#x1F3EB;</button>';
    document.body.appendChild(dock);

    document.getElementById('ztsDockDice').addEventListener('click', openDice);
    document.getElementById('ztsDockWheel').addEventListener('click', openWheel);
    document.getElementById('ztsDockChrono').addEventListener('click', openChrono);
    document.getElementById('ztsDockTimer').addEventListener('click', openTimer);
    document.getElementById('ztsDockTeams').addEventListener('click', openTeams);
    document.getElementById('ztsDockPostit').addEventListener('click', openPostit);
    document.getElementById('ztsDockPeriod').addEventListener('click', openPeriod);

    // Close panel on click outside
    document.addEventListener('click', function(e) {
      if (_activePanel && !_activePanel.contains(e.target) && !dock.contains(e.target)) {
        closeActivePanel();
      }
    });
  }

  // ── Init ──
  function init() {
    injectDockStyles();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', buildDock);
    } else {
      buildDock();
    }
  }

  init();

})(window);
