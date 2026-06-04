/* ═══════════════════════════════════════
   QuizForge — mascot.js
   Mascota perrito interactiva
═══════════════════════════════════════ */

const Mascot = {
  phrases: {
    idle: [
      "¡Hola! Soy Bo, tu compañero de estudio 🐾",
      "¿Listo para aprender algo nuevo hoy?",
      "¡Tú puedes! Cada quiz te hace más inteligente 🧠",
      "Recuerda tomar agua mientras estudias 💧",
      "¡Bo cree en ti! 🐶✨",
      "Un poco de estudio al día mantiene el fracaso a raya 📚",
      "¿Sabías que estudiar en intervalos mejora la memoria? 🎯",
      "¡Woof! Hora de generar un quiz 🔥",
      "Bo está aquí si necesitas motivación 🐾",
      "¡Cada pregunta respondida es un paso adelante! ⭐",
    ],
    quiz: [
      "¡Eso es! ¡Sigue así! 🔥",
      "¡Wow, eres increíble! 🐶💪",
      "¡Bo está muy orgulloso de ti! 🌟",
      "¡Casi terminas! ¡Tú puedes! 🎯",
      "¡Excelente concentración! 🧠✨",
      "¡Un quiz más y eres imparable! ⚡",
    ],
    correct: [
      "¡¡CORRECTO!! 🎉 ¡Sabía que lo sabías!",
      "¡WOW! ¡Eres un genio! 🧠🔥",
      "¡PERFECTO! Bo está bailando de alegría 🐶💃",
      "¡INCREÍBLE! ¡Así se hace! ⭐⭐⭐",
      "¡Eso es exactamente! ¡Brillante! 💎",
    ],
    wrong: [
      "¡No pasa nada! Bo también se equivoca 🐾",
      "¡El error es parte del aprendizaje! 📚",
      "¡Inténtalo de nuevo, tú puedes! 💪",
      "¡Casi! ¡La próxima la tienes! 🎯",
      "¡Bo te da un abrazo virtual! 🤗",
    ],
    streak: [
      "¡¡RACHA EN LLAMAS!! 🔥🔥🔥",
      "¡Bo no puede creerlo! ¡Imparable! 👑",
      "¡Eres una máquina de estudiar! ⚡",
    ],
    welcome: [
      "¡Bienvenido de vuelta! Bo te extrañaba 🐶❤️",
      "¡Hola de nuevo! ¿Qué aprendemos hoy? 📚",
      "¡Bo está listo para estudiar contigo! 🎯",
    ],
  },

  moods: {
    happy: { anim: "bounce", eyes: "normal" },
    excited: { anim: "spin", eyes: "star" },
    sleepy: { anim: "idle", eyes: "sleepy" },
    love: { anim: "float", eyes: "heart" },
  },

  currentMood: "happy",
  isOpen: false,
  idleTimer: null,

  getPhrase(type = "idle") {
    const list = this.phrases[type] || this.phrases.idle;
    return list[Math.floor(Math.random() * list.length)];
  },

  speak(text, mood = "happy", duration = 4000) {
    const bubble = document.getElementById("mascot-bubble");
    const txt = document.getElementById("mascot-text");
    if (!bubble || !txt) return;

    txt.textContent = text;
    bubble.classList.add("visible");
    this.setMood(mood);

    clearTimeout(this._bubbleTimer);
    this._bubbleTimer = setTimeout(() => {
      bubble.classList.remove("visible");
    }, duration);
  },

  setMood(mood) {
    this.currentMood = mood;
    const body = document.getElementById("mascot-body");
    if (!body) return;
    body.className = "mascot-body mood-" + mood;
  },

  startIdlePhrases() {
    const self = this;
    function loop() {
      const delay = 8000 + Math.random() * 7000;
      self.idleTimer = setTimeout(() => {
        if (!document.hidden) {
          self.speak(self.getPhrase("idle"), "happy", 4000);
        }
        loop();
      }, delay);
    }
    loop();
  },

  init() {
    this.render();
    this.speak(this.getPhrase("welcome"), "love", 4500);
    this.startIdlePhrases();
  },

  render() {
    const el = document.createElement("div");
    el.id = "mascot-container";
    el.innerHTML = this.getHTML();
    document.body.appendChild(el);
    this.bindEvents();
  },

  getHTML() {
    return `
    <style>
      #mascot-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 300;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 10px;
        user-select: none;
      }

      /* ── BUBBLE ── */
      .mascot-bubble {
        background: var(--surface, #fff);
        border: 1.5px solid var(--border2, #b8d4f7);
        border-radius: 16px 16px 4px 16px;
        padding: .75rem 1rem;
        max-width: 220px;
        min-width: 140px;
        box-shadow: 0 8px 24px rgba(37,99,235,.15);
        opacity: 0;
        transform: translateY(8px) scale(.95);
        transition: all .3s cubic-bezier(.34,1.56,.64,1);
        pointer-events: none;
        position: relative;
      }
      .mascot-bubble.visible {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: all;
      }
      .mascot-bubble-text {
        font-family: 'Inter', Arial, sans-serif;
        font-size: .82rem;
        color: var(--text, #0f172a);
        line-height: 1.5;
        font-weight: 500;
      }
      .mascot-bubble-close {
        position: absolute;
        top: 6px; right: 8px;
        background: none; border: none;
        color: var(--muted2, #94a3b8);
        cursor: pointer; font-size: .75rem;
        padding: 0; line-height: 1;
        transition: color .15s;
      }
      .mascot-bubble-close:hover { color: var(--danger, #dc2626); }

      /* ── DOG BODY ── */
      .mascot-btn {
        width: 72px; height: 72px;
        border-radius: 50%;
        background: linear-gradient(135deg, #2563eb, #60a5fa);
        border: 3px solid #fff;
        box-shadow: 0 8px 24px rgba(37,99,235,.35);
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: transform .2s, box-shadow .2s;
        position: relative;
        overflow: visible;
      }
      .mascot-btn:hover {
        transform: scale(1.08);
        box-shadow: 0 12px 32px rgba(37,99,235,.45);
      }
      .mascot-btn:active { transform: scale(.95); }

      /* ── PERRO SVG ── */
      .mascot-body {
        width: 52px; height: 52px;
        position: relative;
        display: flex; align-items: center; justify-content: center;
      }

      /* Animaciones */
      .mood-happy   { animation: dogBounce 1.8s ease-in-out infinite; }
      .mood-excited { animation: dogSpin .6s linear infinite; }
      .mood-sleepy  { animation: dogFloat 3s ease-in-out infinite; }
      .mood-love    { animation: dogPulse 1s ease-in-out infinite; }

      @keyframes dogBounce {
        0%,100% { transform: translateY(0); }
        50%      { transform: translateY(-5px); }
      }
      @keyframes dogSpin {
        0%   { transform: rotate(0deg) scale(1); }
        50%  { transform: rotate(180deg) scale(1.1); }
        100% { transform: rotate(360deg) scale(1); }
      }
      @keyframes dogFloat {
        0%,100% { transform: translateY(0) rotate(-2deg); }
        50%      { transform: translateY(-4px) rotate(2deg); }
      }
      @keyframes dogPulse {
        0%,100% { transform: scale(1); }
        50%      { transform: scale(1.12); }
      }

      /* Notificación dot */
      .mascot-dot {
        position: absolute;
        top: 2px; right: 2px;
        width: 14px; height: 14px;
        background: #f97316;
        border: 2px solid #fff;
        border-radius: 50%;
        animation: dotPulse 2s infinite;
        display: none;
      }
      .mascot-dot.show { display: block; }
      @keyframes dotPulse {
        0%,100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(249,115,22,.4); }
        50%      { transform: scale(1.1); box-shadow: 0 0 0 4px rgba(249,115,22,0); }
      }

      /* Tooltip nombre */
      .mascot-name {
        position: absolute;
        bottom: -22px;
        left: 50%; transform: translateX(-50%);
        font-family: 'Inter', Arial, sans-serif;
        font-size: .68rem; font-weight: 700;
        color: var(--accent, #2563eb);
        white-space: nowrap;
        letter-spacing: .04em;
      }

      /* Menú rápido */
      .mascot-menu {
        display: flex; flex-direction: column; gap: 6px;
        align-items: flex-end;
        opacity: 0; pointer-events: none;
        transform: translateY(10px);
        transition: all .25s cubic-bezier(.34,1.56,.64,1);
      }
      .mascot-menu.open {
        opacity: 1; pointer-events: all;
        transform: translateY(0);
      }
      .mascot-menu-btn {
        display: flex; align-items: center; gap: 8px;
        background: var(--surface, #fff);
        border: 1.5px solid var(--border, #d0e3fa);
        border-radius: 999px;
        padding: .4rem 1rem;
        font-family: 'Inter', Arial, sans-serif;
        font-size: .8rem; font-weight: 600;
        color: var(--text, #0f172a);
        cursor: pointer; transition: all .18s;
        box-shadow: 0 2px 8px rgba(37,99,235,.1);
        white-space: nowrap;
      }
      .mascot-menu-btn:hover {
        background: var(--accent-light, #dbeafe);
        border-color: var(--accent, #2563eb);
        color: var(--accent, #2563eb);
        transform: translateX(-3px);
      }
    </style>

    <!-- BURBUJA -->
    <div class="mascot-bubble" id="mascot-bubble">
      <button class="mascot-bubble-close" onclick="Mascot.hideBubble()">✕</button>
      <p class="mascot-bubble-text" id="mascot-text">¡Hola!</p>
    </div>

    <!-- MENÚ RÁPIDO -->
    <div class="mascot-menu" id="mascot-menu">
      <button class="mascot-menu-btn" onclick="Mascot.speak(Mascot.getPhrase('idle'), 'happy', 4000); Mascot.closeMenu()">
        💬 Frase motivadora
      </button>
      <button class="mascot-menu-btn" onclick="Mascot.speak('¡Recuerda: estudia 25 min y descansa 5! Es el método Pomodoro 🍅', 'happy', 5000); Mascot.closeMenu()">
        🍅 Tip de estudio
      </button>
      <button class="mascot-menu-btn" onclick="Mascot.speak('Tu racha es tu tesoro más valioso 🔥 ¡No la rompas!', 'excited', 4000); Mascot.closeMenu()">
        🔥 Ver mi racha
      </button>
      <button class="mascot-menu-btn" onclick="window.location.href='pages/streak.html'; Mascot.closeMenu()">
        ⭐ Ir a rachas
      </button>
    </div>

    <!-- PERRITO -->
    <button class="mascot-btn" id="mascot-btn" onclick="Mascot.toggleMenu()" title="Bo - Tu mascota">
      <div class="mascot-body mood-happy" id="mascot-body">
        <!-- Perrito SVG artístico -->
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Orejas -->
          <ellipse cx="14" cy="17" rx="8" ry="11" fill="#f8e4c0" transform="rotate(-15 14 17)"/>
          <ellipse cx="38" cy="17" rx="8" ry="11" fill="#f8e4c0" transform="rotate(15 38 17)"/>
          <ellipse cx="14" cy="18" rx="5" ry="8" fill="#e8c070" transform="rotate(-15 14 18)"/>
          <ellipse cx="38" cy="18" rx="5" ry="8" fill="#e8c070" transform="rotate(15 38 18)"/>
          <!-- Cabeza -->
          <circle cx="26" cy="30" r="18" fill="#f8e4c0"/>
          <!-- Manchas -->
          <ellipse cx="19" cy="26" rx="6" ry="7" fill="#e8c070" opacity=".6"/>
          <!-- Ojos -->
          <circle cx="20" cy="26" r="5" fill="white"/>
          <circle cx="32" cy="26" r="5" fill="white"/>
          <circle cx="21" cy="27" r="3" fill="#1a1a2e"/>
          <circle cx="33" cy="27" r="3" fill="#1a1a2e"/>
          <!-- Brillo ojos -->
          <circle cx="22" cy="26" r="1.2" fill="white"/>
          <circle cx="34" cy="26" r="1.2" fill="white"/>
          <!-- Nariz -->
          <ellipse cx="26" cy="33" rx="4" ry="3" fill="#e8748a"/>
          <ellipse cx="26" cy="32.5" rx="3" ry="1.5" fill="#f4a0b0" opacity=".5"/>
          <!-- Boca -->
          <path d="M22 36 Q26 40 30 36" stroke="#c05070" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <!-- Mejillas -->
          <circle cx="15" cy="34" r="4" fill="#f4a0b0" opacity=".4"/>
          <circle cx="37" cy="34" r="4" fill="#f4a0b0" opacity=".4"/>
          <!-- Lengua -->
          <ellipse cx="26" cy="38.5" rx="3" ry="2.5" fill="#f4607a"/>
          <line x1="26" y1="36" x2="26" y2="39" stroke="#e04060" stroke-width="1"/>
        </svg>
      </div>
      <div class="mascot-dot" id="mascot-dot"></div>
      <span class="mascot-name">Bo 🐾</span>
    </button>
    `;
  },

  bindEvents() {
    /* Click fuera cierra el menú */
    document.addEventListener("click", (e) => {
      const container = document.getElementById("mascot-container");
      if (container && !container.contains(e.target)) {
        this.closeMenu();
      }
    });
  },

  toggleMenu() {
    const menu = document.getElementById("mascot-menu");
    if (!menu) return;
    const isOpen = menu.classList.contains("open");
    if (isOpen) {
      this.closeMenu();
    } else {
      menu.classList.add("open");
      this.speak(this.getPhrase("idle"), "excited", 3500);
    }
  },

  closeMenu() {
    const menu = document.getElementById("mascot-menu");
    if (menu) menu.classList.remove("open");
  },

  hideBubble() {
    const bubble = document.getElementById("mascot-bubble");
    if (bubble) bubble.classList.remove("visible");
  },

  showDot() {
    const dot = document.getElementById("mascot-dot");
    if (dot) dot.classList.add("show");
  },

  hideDot() {
    const dot = document.getElementById("mascot-dot");
    if (dot) dot.classList.remove("show");
  },

  /* Llamado desde ui.js al responder correcto */
  onCorrect() {
    this.speak(this.getPhrase("correct"), "excited", 3000);
  },

  /* Llamado desde ui.js al responder incorrecto */
  onWrong() {
    this.speak(this.getPhrase("wrong"), "love", 3500);
  },

  /* Llamado al terminar quiz */
  onQuizFinish(pct) {
    const msg =
      pct >= 80
        ? "¡INCREÍBLE! ¡Eres un CAMPEÓN! 🏆🔥"
        : pct >= 50
          ? "¡Muy bien! ¡Sigue practicando! 💪⭐"
          : "¡No te rindas! ¡Bo cree en ti! 🐶❤️";
    this.speak(msg, pct >= 80 ? "excited" : "love", 5000);
  },
};

window.Mascot = Mascot;

/* Auto-inicializar cuando el DOM esté listo */
document.addEventListener("DOMContentLoaded", () => Mascot.init());
