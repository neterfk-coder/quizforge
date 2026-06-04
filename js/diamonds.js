/* ═══════════════════════════════════════
   QuizForge — diamonds.js
   Diamond reward system
   Storage: localStorage (no DB yet)
═══════════════════════════════════════ */

const Diamonds = {
  WELCOME_BONUS: 3000,
  DAILY_BONUS: 1000,
  QUIZ_BONUS: 50,
  PERFECT_BONUS: 200,
  STREAK_BONUS: 150,

  /* ── Load data ── */
  getData() {
    const raw = localStorage.getItem("qf_diamonds");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /* ── Save data ── */
  save(data) {
    localStorage.setItem("qf_diamonds", JSON.stringify(data));
  },

  /* ── Today string ── */
  today() {
    return new Date().toISOString().split("T")[0];
  },

  /* ── Initialize new user (call on register) ── */
  initNewUser() {
    const existing = this.getData();
    if (existing) return existing; // already initialized
    const data = {
      balance: this.WELCOME_BONUS,
      totalEarned: this.WELCOME_BONUS,
      lastDaily: null,
      joinDate: this.today(),
      history: [
        {
          id: Date.now(),
          type: "welcome",
          amount: this.WELCOME_BONUS,
          label: "Welcome bonus 🎁",
          date: this.today(),
        },
      ],
    };
    this.save(data);
    return data;
  },

  /* ── Claim daily bonus ── */
  claimDaily() {
    let data = this.getData();
    if (!data) data = this.initNewUser();

    const today = this.today();
    if (data.lastDaily === today) {
      return { success: false, reason: "already_claimed", data };
    }

    data.balance += this.DAILY_BONUS;
    data.totalEarned += this.DAILY_BONUS;
    data.lastDaily = today;
    data.history.unshift({
      id: Date.now(),
      type: "daily",
      amount: this.DAILY_BONUS,
      label: "Daily bonus 💎",
      date: today,
    });

    this.save(data);
    return { success: true, amount: this.DAILY_BONUS, data };
  },

  /* ── Award diamonds (quiz complete, streak, etc) ── */
  award(amount, label, type = "reward") {
    let data = this.getData();
    if (!data) data = this.initNewUser();

    data.balance += amount;
    data.totalEarned += amount;
    data.history.unshift({
      id: Date.now(),
      type,
      amount,
      label,
      date: this.today(),
    });

    // Keep only last 50 transactions
    data.history = data.history.slice(0, 50);
    this.save(data);
    return data;
  },

  /* ── Spend diamonds ── */
  spend(amount, label) {
    let data = this.getData();
    if (!data || data.balance < amount) return { success: false };
    data.balance -= amount;
    data.history.unshift({
      id: Date.now(),
      type: "spend",
      amount: -amount,
      label,
      date: this.today(),
    });
    data.history = data.history.slice(0, 50);
    this.save(data);
    return { success: true, data };
  },

  /* ── Check if daily is available ── */
  canClaimDaily() {
    const data = this.getData();
    if (!data) return true;
    return data.lastDaily !== this.today();
  },

  /* ── Time until next daily ── */
  timeUntilNextDaily() {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  },

  /* ── Format number ── */
  format(n) {
    return n?.toLocaleString() || "0";
  },
};

window.Diamonds = Diamonds;
