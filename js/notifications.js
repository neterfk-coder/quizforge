/* ═══════════════════════════════════════
   QuizForge — notifications.js
   Real-time notification system
   localStorage + Web Notifications API
═══════════════════════════════════════ */

const Notifs = {
  STORAGE_KEY: "qf_notifications",
  MAX_NOTIFS: 50,

  /* ── Types ── */
  TYPES: {
    diamond: { icon: "💎", color: "#06b6d4", label: "Diamonds" },
    streak: { icon: "🔥", color: "#f97316", label: "Streak" },
    quiz: { icon: "⚡", color: "#2563eb", label: "Quiz" },
    level: { icon: "⭐", color: "#f59e0b", label: "Level Up" },
    challenge: { icon: "🏆", color: "#7c3aed", label: "Challenge" },
    system: { icon: "🔔", color: "#64748b", label: "System" },
    reward: { icon: "🎁", color: "#16a34a", label: "Reward" },
  },

  /* ── Get all notifications ── */
  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  },

  /* ── Save ── */
  save(notifs) {
    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(notifs.slice(0, this.MAX_NOTIFS)),
    );
  },

  /* ── Add notification ── */
  add(type, title, message, data = {}) {
    const notifs = this.getAll();
    const notif = {
      id: Date.now() + Math.random(),
      type,
      title,
      message,
      data,
      read: false,
      time: new Date().toISOString(),
    };
    notifs.unshift(notif);
    this.save(notifs);
    this.updateBadge();
    this.showBanner(notif);

    /* Browser notification if permitted */
    this.sendBrowserNotif(title, message, type);

    return notif;
  },

  /* ── Mark as read ── */
  markRead(id) {
    const notifs = this.getAll().map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    this.save(notifs);
    this.updateBadge();
  },

  /* ── Mark all as read ── */
  markAllRead() {
    const notifs = this.getAll().map((n) => ({ ...n, read: true }));
    this.save(notifs);
    this.updateBadge();
  },

  /* ── Delete notification ── */
  delete(id) {
    const notifs = this.getAll().filter((n) => n.id !== id);
    this.save(notifs);
    this.updateBadge();
    this.renderPanel();
  },

  /* ── Clear all ── */
  clearAll() {
    this.save([]);
    this.updateBadge();
    this.renderPanel();
  },

  /* ── Unread count ── */
  unreadCount() {
    return this.getAll().filter((n) => !n.read).length;
  },

  /* ── Update badge ── */
  updateBadge() {
    const badge = document.getElementById("notif-badge");
    const count = this.unreadCount();
    if (!badge) return;
    badge.textContent = count > 9 ? "9+" : count;
    badge.style.display = count > 0 ? "flex" : "none";
  },

  /* ── Format time ── */
  formatTime(iso) {
    const now = new Date();
    const then = new Date(iso);
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return Math.floor(diff / 60) + "m ago";
    if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
    return Math.floor(diff / 86400) + "d ago";
  },

  /* ── Show banner toast ── */
  showBanner(notif) {
    const type = this.TYPES[notif.type] || this.TYPES.system;
    const banner = document.getElementById("notif-banner");
    if (!banner) return;

    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:1.3rem;flex-shrink:0">${type.icon}</span>
        <div style="flex:1;min-width:0">
          <p style="font-size:.85rem;font-weight:700;color:var(--text,#0f172a);margin-bottom:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${notif.title}</p>
          <p style="font-size:.78rem;color:var(--muted,#64748b);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${notif.message}</p>
        </div>
        <button onclick="Notifs.closeBanner()" style="background:none;border:none;color:var(--muted2,#94a3b8);cursor:pointer;font-size:1rem;padding:.2rem;flex-shrink:0">✕</button>
      </div>`;

    banner.style.borderLeftColor = type.color;
    banner.classList.add("show");
    clearTimeout(this._bannerTimer);
    this._bannerTimer = setTimeout(() => this.closeBanner(), 4000);
  },

  closeBanner() {
    const banner = document.getElementById("notif-banner");
    if (banner) banner.classList.remove("show");
  },

  /* ── Browser notification ── */
  async sendBrowserNotif(title, message, type) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification("QuizForge — " + title, {
        body: message,
        icon: "/favicon.ico",
      });
    }
  },

  async requestPermission() {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  },

  /* ══════════════════════
     PANEL UI
  ══════════════════════ */
  togglePanel() {
    const panel = document.getElementById("notif-panel");
    if (!panel) return;
    const isOpen = panel.classList.contains("open");
    if (isOpen) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  },

  openPanel() {
    const panel = document.getElementById("notif-panel");
    if (!panel) return;
    panel.classList.add("open");
    this.renderPanel();
    /* Close on outside click */
    setTimeout(() => {
      document.addEventListener(
        "click",
        (this._outsideClick = (e) => {
          const wrap = document.getElementById("notif-wrap");
          if (wrap && !wrap.contains(e.target)) this.closePanel();
        }),
      );
    }, 100);
  },

  closePanel() {
    const panel = document.getElementById("notif-panel");
    if (panel) panel.classList.remove("open");
    document.removeEventListener("click", this._outsideClick);
  },

  /* ── Render panel content ── */
  renderPanel() {
    const list = document.getElementById("notif-list");
    const notifs = this.getAll();
    if (!list) return;

    /* Mark all as read when opening */
    const hasUnread = notifs.some((n) => !n.read);
    if (hasUnread) {
      setTimeout(() => {
        this.markAllRead();
      }, 1500);
    }

    if (!notifs.length) {
      list.innerHTML = `
        <div style="text-align:center;padding:3rem 1.5rem;color:var(--muted,#64748b)">
          <div style="font-size:2.5rem;margin-bottom:.75rem">🔔</div>
          <p style="font-size:.9rem;font-weight:500">No notifications yet</p>
          <p style="font-size:.8rem;margin-top:.3rem;opacity:.7">Complete quizzes and challenges to get notified!</p>
        </div>`;
      return;
    }

    list.innerHTML = notifs
      .map((n) => {
        const t = this.TYPES[n.type] || this.TYPES.system;
        const time = this.formatTime(n.time);
        return `
        <div class="notif-item ${n.read ? "" : "unread"}" id="ni-${n.id}" onclick="Notifs.markRead(${n.id})">
          <div class="notif-icon-wrap" style="background:${t.color}22;border-color:${t.color}44">
            <span>${t.icon}</span>
          </div>
          <div class="notif-content">
            <p class="notif-title">${n.title}</p>
            <p class="notif-msg">${n.message}</p>
            <p class="notif-time">${time}</p>
          </div>
          <button class="notif-del" onclick="event.stopPropagation();Notifs.delete(${n.id})">✕</button>
          ${!n.read ? '<div class="notif-dot"></div>' : ""}
        </div>`;
      })
      .join("");
  },

  /* ══════════════════════
     INJECT UI
  ══════════════════════ */
  inject() {
    /* Styles */
    const style = document.createElement("style");
    style.textContent = `
      #notif-wrap {
        position: relative;
        display: inline-flex;
        align-items: center;
      }

      /* Bell button */
      #notif-btn {
        width: 38px; height: 38px;
        background: var(--surface, #fff);
        border: 1.5px solid var(--border2, #b8d4f7);
        border-radius: var(--radius-sm, 9px);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: all .18s;
        position: relative; color: var(--muted, #64748b);
        flex-shrink: 0;
      }
      #notif-btn:hover {
        border-color: var(--accent, #2563eb);
        color: var(--accent, #2563eb);
        background: var(--accent-light, #dbeafe);
        transform: translateY(-1px);
      }
      #notif-btn svg { width: 17px; height: 17px; }
      #notif-btn.ringing { animation: bellRing .5s ease 3; }
      @keyframes bellRing {
        0%,100% { transform: rotate(0); }
        20%      { transform: rotate(15deg); }
        40%      { transform: rotate(-15deg); }
        60%      { transform: rotate(10deg); }
        80%      { transform: rotate(-5deg); }
      }

      /* Badge */
      #notif-badge {
        position: absolute;
        top: -6px; right: -6px;
        background: #dc2626;
        color: #fff;
        font-size: .62rem; font-weight: 700;
        min-width: 18px; height: 18px;
        border-radius: 999px;
        border: 2px solid var(--bg, #f0f6ff);
        display: none;
        align-items: center; justify-content: center;
        font-family: 'Inter', Arial, sans-serif;
        animation: badgePop .3s cubic-bezier(.34,1.56,.64,1);
        padding: 0 3px;
      }
      @keyframes badgePop {
        from { transform: scale(0); }
        to   { transform: scale(1); }
      }

      /* Panel */
      #notif-panel {
        position: absolute;
        top: calc(100% + 10px);
        right: 0;
        width: 360px;
        background: var(--surface, #fff);
        border: 1.5px solid var(--border, #d0e3fa);
        border-radius: 16px;
        box-shadow: 0 12px 40px rgba(37,99,235,.18);
        z-index: 999;
        overflow: hidden;
        opacity: 0;
        transform: translateY(-8px) scale(.97);
        pointer-events: none;
        transition: all .25s cubic-bezier(.34,1.56,.64,1);
        font-family: 'Inter', Arial, sans-serif;
      }
      #notif-panel.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: all;
      }

      /* Panel header */
      .notif-panel-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 1rem 1.25rem;
        border-bottom: 1.5px solid var(--border, #d0e3fa);
        background: var(--surface2, #f7faff);
      }
      .notif-panel-title {
        font-size: .9rem; font-weight: 700;
        color: var(--text, #0f172a);
        display: flex; align-items: center; gap: 7px;
      }
      .notif-panel-actions {
        display: flex; gap: .5rem; align-items: center;
      }
      .notif-action-btn {
        background: none; border: none;
        font-size: .75rem; font-weight: 500;
        color: var(--accent, #2563eb);
        cursor: pointer; padding: .2rem .5rem;
        border-radius: 6px; transition: all .15s;
        font-family: 'Inter', Arial, sans-serif;
      }
      .notif-action-btn:hover { background: var(--accent-light, #dbeafe); }

      /* List */
      #notif-list {
        max-height: 400px;
        overflow-y: auto;
        scrollbar-width: thin;
      }
      #notif-list::-webkit-scrollbar { width: 4px; }
      #notif-list::-webkit-scrollbar-thumb { background: var(--border2, #b8d4f7); border-radius: 2px; }

      /* Item */
      .notif-item {
        display: flex; align-items: flex-start; gap: 10px;
        padding: .9rem 1.25rem;
        border-bottom: 1px solid var(--border, #d0e3fa);
        cursor: pointer; transition: background .15s;
        position: relative;
      }
      .notif-item:last-child { border-bottom: none; }
      .notif-item:hover { background: var(--surface2, #f7faff); }
      .notif-item.unread { background: var(--accent-light, #dbeafe); }
      .notif-item.unread:hover { background: #bfdbfe; }

      .notif-icon-wrap {
        width: 36px; height: 36px; flex-shrink: 0;
        border-radius: 10px; border: 1.5px solid;
        display: flex; align-items: center; justify-content: center;
        font-size: 1rem;
      }
      .notif-content { flex: 1; min-width: 0; }
      .notif-title {
        font-size: .85rem; font-weight: 600;
        color: var(--text, #0f172a);
        margin-bottom: 2px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .notif-msg {
        font-size: .78rem; color: var(--muted, #64748b);
        line-height: 1.5; margin-bottom: 3px;
      }
      .notif-time {
        font-size: .7rem; color: var(--muted2, #94a3b8); font-weight: 500;
      }
      .notif-del {
        background: none; border: none; color: var(--muted2, #94a3b8);
        cursor: pointer; font-size: .8rem; padding: .2rem;
        opacity: 0; transition: all .15s; flex-shrink: 0;
        border-radius: 4px;
      }
      .notif-item:hover .notif-del { opacity: 1; }
      .notif-del:hover { color: #dc2626; background: #fee2e2; }
      .notif-dot {
        position: absolute; top: 50%; right: 1rem;
        transform: translateY(-50%);
        width: 7px; height: 7px;
        background: var(--accent, #2563eb);
        border-radius: 50%;
      }

      /* Panel footer */
      .notif-footer {
        padding: .75rem 1.25rem;
        border-top: 1.5px solid var(--border, #d0e3fa);
        background: var(--surface2, #f7faff);
        text-align: center;
      }
      .notif-footer a {
        font-size: .8rem; color: var(--accent, #2563eb);
        font-weight: 600; text-decoration: none;
        display: flex; align-items: center; justify-content: center; gap: 5px;
      }
      .notif-footer a:hover { text-decoration: underline; }

      /* Banner toast */
      #notif-banner {
        position: fixed;
        top: 80px; right: 1.5rem;
        width: 320px;
        background: var(--surface, #fff);
        border: 1.5px solid var(--border, #d0e3fa);
        border-left: 4px solid var(--accent, #2563eb);
        border-radius: 12px;
        padding: .9rem 1rem;
        box-shadow: 0 8px 28px rgba(37,99,235,.18);
        z-index: 1000;
        opacity: 0;
        transform: translateX(120%);
        transition: all .35s cubic-bezier(.34,1.56,.64,1);
        font-family: 'Inter', Arial, sans-serif;
      }
      #notif-banner.show {
        opacity: 1;
        transform: translateX(0);
      }

      @media(max-width: 600px) {
        #notif-panel { width: 310px; right: -80px; }
        #notif-banner { width: calc(100vw - 2rem); right: 1rem; }
      }
    `;
    document.head.appendChild(style);

    /* Banner element */
    const banner = document.createElement("div");
    banner.id = "notif-banner";
    document.body.appendChild(banner);

    /* Inject bell button into navbar */
    const navLinks = document.querySelector(".nav-links");
    if (!navLinks) return;

    const wrap = document.createElement("div");
    wrap.id = "notif-wrap";
    wrap.innerHTML = `
      <button id="notif-btn" onclick="Notifs.togglePanel()" title="Notifications" aria-label="Notifications">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        <span id="notif-badge">0</span>
      </button>
      <div id="notif-panel">
        <div class="notif-panel-header">
          <span class="notif-panel-title">
            🔔 Notifications
            <span id="notif-unread-label" style="background:#dc2626;color:#fff;font-size:.62rem;font-weight:700;padding:.1rem .5rem;border-radius:999px;display:none"></span>
          </span>
          <div class="notif-panel-actions">
            <button class="notif-action-btn" onclick="Notifs.markAllRead();Notifs.renderPanel()">Mark all read</button>
            <button class="notif-action-btn" style="color:var(--danger,#dc2626)" onclick="Notifs.clearAll()">Clear all</button>
          </div>
        </div>
        <div id="notif-list"></div>
        <div class="notif-footer">
          <a href="javascript:void(0)" onclick="Notifs.closePanel()">
            Close panel ↑
          </a>
        </div>
      </div>
    `;

    /* Insert before Sign in button */
    const signInBtn = navLinks.querySelector(".btn-primary");
    if (signInBtn) {
      navLinks.insertBefore(wrap, signInBtn);
    } else {
      navLinks.appendChild(wrap);
    }

    /* Initial badge update */
    this.updateBadge();

    /* Request browser notification permission */
    this.requestPermission();

    /* Simulate real-time notifications */
    this.startRealTimeSimulation();
  },

  /* ══════════════════════
     REAL-TIME SIMULATION
     Fires contextual notifications
     based on user activity
  ══════════════════════ */
  startRealTimeSimulation() {
    /* Welcome notification on first visit */
    const welcomed = localStorage.getItem("qf_welcomed");
    if (!welcomed) {
      setTimeout(() => {
        this.add(
          "reward",
          "Welcome to QuizForge! 🎉",
          "You received 3,000 welcome diamonds. Start your first quiz!",
        );
        localStorage.setItem("qf_welcomed", "1");
        this.ringBell();
      }, 2000);
    }

    /* Daily bonus reminder */
    const lastDailyCheck = localStorage.getItem("qf_last_daily_notif");
    const today = new Date().toDateString();
    if (lastDailyCheck !== today) {
      setTimeout(() => {
        this.add(
          "diamond",
          "Daily bonus available! 💎",
          "Claim your 1,000 free diamonds today. Don't break your streak!",
        );
        localStorage.setItem("qf_last_daily_notif", today);
        this.ringBell();
      }, 5000);
    }

    /* Streak reminder after 30s */
    setTimeout(() => {
      const streak = JSON.parse(localStorage.getItem("qf_streak") || "{}");
      if (streak.current > 0) {
        this.add(
          "streak",
          `🔥 ${streak.current}-day streak!`,
          `Keep it up! Check in today to maintain your streak.`,
        );
        this.ringBell();
      }
    }, 8000);

    /* Challenge reminder after 1 min */
    setTimeout(() => {
      this.add(
        "challenge",
        "Daily Challenge ready! ⚡",
        "Today's math challenge is waiting. Earn up to 200 💎!",
      );
      this.ringBell();
    }, 60000);
  },

  ringBell() {
    const btn = document.getElementById("notif-btn");
    if (btn) {
      btn.classList.remove("ringing");
      void btn.offsetWidth; /* reflow */
      btn.classList.add("ringing");
      setTimeout(() => btn.classList.remove("ringing"), 1500);
    }
    this.updateBadge();
  },

  /* ── Called externally when events happen ── */
  onQuizComplete(correct, total, diamonds) {
    const pct = Math.round((correct / total) * 100);
    this.add(
      "quiz",
      `Quiz completed! ${pct}%`,
      `You got ${correct}/${total} correct and earned +${diamonds} 💎`,
    );
    this.ringBell();
  },

  onDiamondEarned(amount, reason) {
    this.add("diamond", `+${amount} diamonds earned! 💎`, reason);
    this.ringBell();
  },

  onStreakUpdate(days) {
    if (days % 7 === 0) {
      this.add(
        "streak",
        `🔥 ${days}-day streak milestone!`,
        `Amazing! You've studied for ${days} days in a row. +150 💎 bonus!`,
      );
      this.ringBell();
    } else {
      this.add(
        "streak",
        `Day ${days} streak! 🔥`,
        `You checked in today. Keep going!`,
      );
    }
  },

  onLevelUp(level, name) {
    this.add(
      "level",
      `Level Up! You're now ${name} ⭐`,
      `Reached level ${level}. Keep earning XP to unlock the next level!`,
    );
    this.ringBell();
  },

  onPurchase(item, cost) {
    this.add(
      "reward",
      `Purchase complete! 🛍️`,
      `You bought ${item} for ${cost} 💎. Check your profile to use it.`,
    );
    this.ringBell();
  },
};

window.Notifs = Notifs;

/* Auto-inject when DOM is ready */
document.addEventListener("DOMContentLoaded", () => Notifs.inject());
