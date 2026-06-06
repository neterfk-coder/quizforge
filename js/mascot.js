/* ═══════════════════════════════════════
   QuizForge — mascot.js
   Bo the Dog — Interactive Mascot
═══════════════════════════════════════ */

const Mascot = {
  phrases: {
    idle: [
      "Hi! I'm Bo, your study buddy! 🐾",
      "Ready to learn something new today? 🧠",
      "You can do it! Every quiz makes you smarter! 💪",
      "Remember to stay hydrated while studying 💧",
      "Bo believes in you! 🐶✨",
      "A little study each day keeps failure away 📚",
      "Studying in intervals improves memory by 40%! 🎯",
      "Woof! Time to generate a quiz 🔥",
      "Need motivation? Bo's got you! 🐾",
      "Every question answered is a step forward! ⭐",
      "You're doing amazing — keep going! 🚀",
      "Take a deep breath and focus. You've got this! 🧘",
      "The best time to study was yesterday. The second best is NOW! ⚡",
      "Small progress every day leads to big results! 📈",
    ],
    correct: [
      "CORRECT!! 🎉 I knew you could do it!",
      "WOW! You're absolutely brilliant! 🧠🔥",
      "PERFECT! Bo is doing a happy dance! 🐶💃",
      "INCREDIBLE! That's exactly right! ⭐⭐⭐",
      "Nailed it! You're on fire! 💎🔥",
      "YES! That's my study buddy! 🎯",
    ],
    wrong: [
      "No worries! Mistakes help us grow 🐾",
      "Mistakes are part of learning — keep going! 📚",
      "Try again, you've totally got this! 💪",
      "So close! The next one is yours! 🎯",
      "Bo sends you a virtual hug! 🤗❤️",
      "Don't give up! Every error makes you stronger! 🦾",
    ],
    welcome: [
      "Welcome back! Bo missed you! 🐶❤️",
      "Hey there! What are we learning today? 📚",
      "Bo is ready to study with you! Let's go! 🎯",
      "Let's crush some quizzes today! 🔥",
      "Great to see you back! Time to level up! ⭐",
    ],
    quiz: [
      "You're on a roll! Keep it up! 🔥",
      "Almost there! Finish strong! 💪",
      "Bo is cheering for you! 🐶📣",
      "Excellent focus! You're crushing it! 🎯",
    ],
    streak: [
      "STREAK ON FIRE!! 🔥🔥🔥",
      "Bo can't believe it — you're UNSTOPPABLE! 👑",
      "You're a studying machine! ⚡",
      "Consistency is your superpower! 🦸",
    ],
  },

  getPhrase(type = "idle") {
    const list = this.phrases[type] || this.phrases.idle;
    return list[Math.floor(Math.random() * list.length)];
  },

  speak(text, mood = "happy", duration = 4000) {
    const bubble = document.getElementById("bo-bubble");
    const txt = document.getElementById("bo-text");
    if (!bubble || !txt) return;
    txt.textContent = text;
    bubble.style.opacity = "0";
    bubble.style.transform = "translateY(10px) scale(0.9)";
    bubble.style.display = "block";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bubble.style.opacity = "1";
        bubble.style.transform = "translateY(0) scale(1)";
      });
    });
    clearTimeout(this._hideTimer);
    this._hideTimer = setTimeout(() => this.hideBubble(), duration);
    this.setMood(mood);
  },

  setMood(mood) {
    const dog = document.getElementById("bo-dog");
    if (!dog) return;
    dog.className = "bo-dog bo-" + mood;
  },

  hideBubble() {
    const bubble = document.getElementById("bo-bubble");
    if (!bubble) return;
    bubble.style.opacity = "0";
    bubble.style.transform = "translateY(8px) scale(0.95)";
    setTimeout(() => {
      bubble.style.display = "none";
    }, 300);
  },

  toggleMenu() {
    const menu = document.getElementById("bo-menu");
    if (!menu) return;
    const open = menu.style.opacity === "1";
    if (open) {
      this.closeMenu();
    } else {
      menu.style.display = "flex";
      menu.style.opacity = "0";
      menu.style.transform = "translateY(10px)";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          menu.style.opacity = "1";
          menu.style.transform = "translateY(0)";
        });
      });
      this.speak(this.getPhrase("idle"), "excited", 3500);
    }
  },

  closeMenu() {
    const menu = document.getElementById("bo-menu");
    if (!menu) return;
    menu.style.opacity = "0";
    menu.style.transform = "translateY(10px)";
    setTimeout(() => {
      menu.style.display = "none";
    }, 250);
  },

  onCorrect() {
    this.speak(this.getPhrase("correct"), "excited", 3000);
  },
  onWrong() {
    this.speak(this.getPhrase("wrong"), "love", 3500);
  },
  onQuizFinish(pct) {
    const msg =
      pct >= 80
        ? "AMAZING! You're a CHAMPION! 🏆🔥"
        : pct >= 50
          ? "Great job! Keep practicing! 💪⭐"
          : "Don't give up! Bo believes in you! 🐶❤️";
    this.speak(msg, pct >= 80 ? "excited" : "love", 5000);
  },

  init() {
    this.injectStyles();
    this.injectHTML();
    this.bindEvents();
    /* Welcome after short delay */
    setTimeout(() => {
      this.speak(this.getPhrase("welcome"), "love", 5000);
    }, 1500);
    /* Idle phrases */
    this.startIdle();
  },

  startIdle() {
    const loop = () => {
      const delay = 12000 + Math.random() * 8000;
      setTimeout(() => {
        if (!document.hidden) {
          const bubble = document.getElementById("bo-bubble");
          if (!bubble || bubble.style.display !== "block") {
            this.speak(this.getPhrase("idle"), "happy", 4000);
          }
        }
        loop();
      }, delay);
    };
    loop();
  },

  bindEvents() {
    document.addEventListener("click", (e) => {
      const wrap = document.getElementById("bo-wrap");
      if (wrap && !wrap.contains(e.target)) this.closeMenu();
    });
  },

  injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      #bo-wrap {
        position: fixed;
        bottom: 28px;
        right: 28px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 10px;
        font-family: 'Inter', Arial, sans-serif;
      }

      /* ── BUBBLE ── */
      #bo-bubble {
        display: none;
        background: #ffffff;
        border: 1.5px solid #b8d4f7;
        border-radius: 16px 16px 4px 16px;
        padding: 12px 36px 12px 14px;
        max-width: 210px;
        min-width: 130px;
        box-shadow: 0 8px 28px rgba(37,99,235,.18);
        transition: opacity .3s ease, transform .3s cubic-bezier(.34,1.56,.64,1);
        position: relative;
      }
      #bo-bubble::after {
        content: '';
        position: absolute;
        bottom: -8px;
        right: 28px;
        width: 0; height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid #b8d4f7;
      }
      #bo-text {
        font-size: 13px;
        color: #0f172a;
        line-height: 1.5;
        font-weight: 500;
      }
      #bo-close {
        position: absolute;
        top: 7px; right: 9px;
        background: none; border: none;
        color: #94a3b8; cursor: pointer;
        font-size: 12px; padding: 0;
        line-height: 1; transition: color .15s;
      }
      #bo-close:hover { color: #dc2626; }

      /* ── MENU ── */
      #bo-menu {
        display: none;
        flex-direction: column;
        gap: 7px;
        align-items: flex-end;
        transition: opacity .25s ease, transform .25s cubic-bezier(.34,1.56,.64,1);
      }
      .bo-menu-btn {
        display: flex; align-items: center; gap: 8px;
        background: #ffffff;
        border: 1.5px solid #d0e3fa;
        border-radius: 999px;
        padding: 7px 16px;
        font-family: 'Inter', Arial, sans-serif;
        font-size: 13px; font-weight: 600;
        color: #0f172a; cursor: pointer;
        transition: all .18s;
        box-shadow: 0 2px 10px rgba(37,99,235,.1);
        white-space: nowrap;
      }
      .bo-menu-btn:hover {
        background: #dbeafe;
        border-color: #2563eb;
        color: #2563eb;
        transform: translateX(-4px);
      }

      /* ── MAIN BUTTON ── */
      #bo-btn {
        width: 76px; height: 76px;
        border-radius: 50%;
        background: linear-gradient(145deg, #2563eb 0%, #60a5fa 100%);
        border: 3.5px solid #ffffff;
        box-shadow: 0 8px 28px rgba(37,99,235,.4), 0 0 0 0 rgba(37,99,235,.3);
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s;
        position: relative;
        animation: boFloat 3s ease-in-out infinite;
      }
      #bo-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 12px 36px rgba(37,99,235,.5), 0 0 0 6px rgba(37,99,235,.15);
        animation: none;
      }
      #bo-btn:active { transform: scale(.93); }

      @keyframes boFloat {
        0%,100% { transform: translateY(0); }
        50%      { transform: translateY(-6px); }
      }

      /* ── DOG MOODS ── */
      .bo-dog { transition: transform .3s; }
      .bo-happy   { animation: moodBounce 1.6s ease-in-out infinite; }
      .bo-excited { animation: moodSpin .5s linear infinite; }
      .bo-love    { animation: moodPulse .9s ease-in-out infinite; }

      @keyframes moodBounce {
        0%,100% { transform: translateY(0) rotate(0deg); }
        25%      { transform: translateY(-4px) rotate(-3deg); }
        75%      { transform: translateY(-4px) rotate(3deg); }
      }
      @keyframes moodSpin {
        0%   { transform: rotate(0deg) scale(1); }
        50%  { transform: rotate(180deg) scale(1.15); }
        100% { transform: rotate(360deg) scale(1); }
      }
      @keyframes moodPulse {
        0%,100% { transform: scale(1); }
        50%      { transform: scale(1.15); }
      }

      /* ── NOTIFICATION DOT ── */
      #bo-dot {
        position: absolute;
        top: 3px; right: 3px;
        width: 15px; height: 15px;
        background: #f97316;
        border: 2.5px solid #fff;
        border-radius: 50%;
        animation: dotPulse 2s infinite;
      }
      @keyframes dotPulse {
        0%,100% { box-shadow: 0 0 0 0 rgba(249,115,22,.5); }
        50%      { box-shadow: 0 0 0 5px rgba(249,115,22,0); }
      }

      /* ── LABEL ── */
      #bo-label {
        position: absolute;
        bottom: -20px; left: 50%;
        transform: translateX(-50%);
        font-size: 11px; font-weight: 700;
        color: #2563eb; white-space: nowrap;
        letter-spacing: .05em;
        font-family: 'Inter', Arial, sans-serif;
      }
    `;
    document.head.appendChild(style);
  },

  injectHTML() {
    const wrap = document.createElement("div");
    wrap.id = "bo-wrap";
    wrap.innerHTML = `
      <!-- Speech bubble -->
      <div id="bo-bubble">
        <button id="bo-close" onclick="Mascot.hideBubble()">✕</button>
        <p id="bo-text"></p>
      </div>

      <!-- Quick menu -->
      <div id="bo-menu">
        <button class="bo-menu-btn" onclick="Mascot.speak(Mascot.getPhrase('idle'),'happy',4000);Mascot.closeMenu()">
          💬 Motivate me!
        </button>
        <button class="bo-menu-btn" onclick="Mascot.speak('Study tip: 25 min focus, 5 min break — that\'s the Pomodoro method! 🍅','happy',5000);Mascot.closeMenu()">
          🍅 Study tip
        </button>
        <button class="bo-menu-btn" onclick="Mascot.speak('Your streak is your biggest treasure 🔥 Don\\'t break it!','excited',4000);Mascot.closeMenu()">
          🔥 My streak
        </button>
        <button class="bo-menu-btn" onclick="window.location.href='pages/streak.html'">
          ⭐ Go to streaks
        </button>
      </div>

      <!-- Bo the dog button -->
      <button id="bo-btn" onclick="Mascot.toggleMenu()" title="Bo - Your study buddy">
        <div class="bo-dog bo-happy" id="bo-dog">
          <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Ears -->
            <ellipse cx="14" cy="16" rx="9" ry="12" fill="#f5d49a" transform="rotate(-18 14 16)"/>
            <ellipse cx="40" cy="16" rx="9" ry="12" fill="#f5d49a" transform="rotate(18 40 16)"/>
            <ellipse cx="14" cy="17" rx="5.5" ry="8.5" fill="#e8a830" transform="rotate(-18 14 17)"/>
            <ellipse cx="40" cy="17" rx="5.5" ry="8.5" fill="#e8a830" transform="rotate(18 40 17)"/>
            <!-- Head -->
            <circle cx="27" cy="32" r="19" fill="#f5d49a"/>
            <!-- Patch -->
            <ellipse cx="19" cy="28" rx="7" ry="8" fill="#e8a830" opacity=".55"/>
            <!-- Eyes white -->
            <circle cx="21" cy="28" r="5.5" fill="white"/>
            <circle cx="33" cy="28" r="5.5" fill="white"/>
            <!-- Eyes pupil -->
            <circle cx="22" cy="29" r="3.2" fill="#1c1c2e"/>
            <circle cx="34" cy="29" r="3.2" fill="#1c1c2e"/>
            <!-- Eye shine -->
            <circle cx="23.2" cy="27.8" r="1.3" fill="white"/>
            <circle cx="35.2" cy="27.8" r="1.3" fill="white"/>
            <!-- Nose -->
            <ellipse cx="27" cy="35.5" rx="4.5" ry="3.2" fill="#e06080"/>
            <ellipse cx="27" cy="34.8" rx="3.2" ry="1.6" fill="#f4a0b8" opacity=".55"/>
            <!-- Mouth -->
            <path d="M23 38 Q27 42.5 31 38" stroke="#c04060" stroke-width="1.8" fill="none" stroke-linecap="round"/>
            <!-- Cheeks -->
            <circle cx="15" cy="37" r="4.5" fill="#f4a0b8" opacity=".38"/>
            <circle cx="39" cy="37" r="4.5" fill="#f4a0b8" opacity=".38"/>
            <!-- Tongue -->
            <ellipse cx="27" cy="41" rx="3.2" ry="2.8" fill="#f05070"/>
            <line x1="27" y1="38.5" x2="27" y2="41.5" stroke="#d03050" stroke-width="1.2"/>
          </svg>
        </div>
        <div id="bo-dot"></div>
        <span id="bo-label">Bo 🐾</span>
      </button>
    `;
    document.body.appendChild(wrap);
  },
};

window.Mascot = Mascot;
document.addEventListener("DOMContentLoaded", () => Mascot.init());
