/* ═══════════════════════════════════════
   QuizForge — diamonds.js
   Diamond system — Supabase powered
═══════════════════════════════════════ */

const Diamonds = {
  WELCOME_BONUS: 3000,
  DAILY_BONUS: 1000,
  QUIZ_BONUS: 50,
  PERFECT_BONUS: 200,
  STREAK_BONUS: 150,

  /* ── Get supabase client ── */
  get db() {
    return window._supabase;
  },

  /* ── Get current user ── */
  async user() {
    const {
      data: { user },
    } = await this.db.auth.getUser();
    return user;
  },

  /* ── Get diamond data ── */
  async getData() {
    /* Guest mode — use localStorage */
    if (localStorage.getItem("qf_guest_mode") === "true") {
      const raw = localStorage.getItem("qf_diamonds");
      return raw ? JSON.parse(raw) : this._defaultData();
    }
    const user = await this.user();
    if (!user) return this._guestData();

    const { data, error } = await this.db
      .from("diamonds")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !data) return this._defaultData();
    return {
      balance: data.balance,
      totalEarned: data.total_earned,
      lastDaily: data.last_daily,
      joinDate: data.join_date,
    };
  },

  _defaultData() {
    return {
      balance: 0,
      totalEarned: 0,
      lastDaily: null,
      joinDate: new Date().toISOString().split("T")[0],
    };
  },

  _guestData() {
    const raw = localStorage.getItem("qf_diamonds");
    return raw ? JSON.parse(raw) : this._defaultData();
  },

  today() {
    return new Date().toISOString().split("T")[0];
  },

  /* ── Init new user (called on first login) ── */
  async initNewUser() {
    if (localStorage.getItem("qf_guest_mode") === "true") {
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
      localStorage.setItem("qf_diamonds", JSON.stringify(data));
      return data;
    }

    const user = await this.user();
    if (!user) return;

    /* Check if already initialized */
    const { data: existing } = await this.db
      .from("diamonds")
      .select("id")
      .eq("id", user.id)
      .single();
    if (existing) return;

    /* Insert welcome diamonds */
    await this.db
      .from("diamonds")
      .upsert({
        id: user.id,
        balance: this.WELCOME_BONUS,
        total_earned: this.WELCOME_BONUS,
        join_date: this.today(),
      });
    await this.db
      .from("diamond_transactions")
      .insert({
        user_id: user.id,
        type: "welcome",
        amount: this.WELCOME_BONUS,
        label: "Welcome bonus 🎁",
      });
  },

  /* ── Claim daily bonus ── */
  async claimDaily() {
    const today = this.today();

    /* Guest mode */
    if (localStorage.getItem("qf_guest_mode") === "true") {
      let data = this._guestData();
      if (data.lastDaily === today)
        return { success: false, reason: "already_claimed", data };
      data.balance += this.DAILY_BONUS;
      data.totalEarned += this.DAILY_BONUS;
      data.lastDaily = today;
      localStorage.setItem("qf_diamonds", JSON.stringify(data));
      return { success: true, amount: this.DAILY_BONUS, data };
    }

    const user = await this.user();
    if (!user) return { success: false };

    /* Check last daily */
    const { data: row } = await this.db
      .from("diamonds")
      .select("*")
      .eq("id", user.id)
      .single();
    if (row?.last_daily === today)
      return {
        success: false,
        reason: "already_claimed",
        data: {
          balance: row.balance,
          totalEarned: row.total_earned,
          lastDaily: row.last_daily,
        },
      };

    /* Update balance */
    const newBalance = (row?.balance || 0) + this.DAILY_BONUS;
    const newTotal = (row?.total_earned || 0) + this.DAILY_BONUS;

    await this.db
      .from("diamonds")
      .upsert({
        id: user.id,
        balance: newBalance,
        total_earned: newTotal,
        last_daily: today,
        updated_at: new Date().toISOString(),
      });
    await this.db
      .from("diamond_transactions")
      .insert({
        user_id: user.id,
        type: "daily",
        amount: this.DAILY_BONUS,
        label: "Daily bonus 💎",
      });

    return {
      success: true,
      amount: this.DAILY_BONUS,
      data: { balance: newBalance, totalEarned: newTotal, lastDaily: today },
    };
  },

  /* ── Award diamonds ── */
  async award(amount, label, type = "reward") {
    /* Guest mode */
    if (localStorage.getItem("qf_guest_mode") === "true") {
      let data = this._guestData();
      data.balance += amount;
      data.totalEarned += amount;
      localStorage.setItem("qf_diamonds", JSON.stringify(data));
      return data;
    }

    const user = await this.user();
    if (!user) return;

    const { data: row } = await this.db
      .from("diamonds")
      .select("balance, total_earned")
      .eq("id", user.id)
      .single();
    const newBalance = (row?.balance || 0) + amount;
    const newTotal = (row?.total_earned || 0) + amount;

    await this.db
      .from("diamonds")
      .upsert({
        id: user.id,
        balance: newBalance,
        total_earned: newTotal,
        updated_at: new Date().toISOString(),
      });
    await this.db
      .from("diamond_transactions")
      .insert({ user_id: user.id, type, amount, label });

    return { balance: newBalance, totalEarned: newTotal };
  },

  /* ── Spend diamonds ── */
  async spend(amount, label) {
    /* Guest mode */
    if (localStorage.getItem("qf_guest_mode") === "true") {
      let data = this._guestData();
      if (data.balance < amount) return { success: false };
      data.balance -= amount;
      localStorage.setItem("qf_diamonds", JSON.stringify(data));
      return { success: true, data };
    }

    const user = await this.user();
    if (!user) return { success: false };

    const { data: row } = await this.db
      .from("diamonds")
      .select("balance")
      .eq("id", user.id)
      .single();
    if (!row || row.balance < amount) return { success: false };

    const newBalance = row.balance - amount;
    await this.db
      .from("diamonds")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    await this.db
      .from("diamond_transactions")
      .insert({ user_id: user.id, type: "spend", amount: -amount, label });

    return { success: true, data: { balance: newBalance } };
  },

  /* ── Get transaction history ── */
  async getHistory() {
    if (localStorage.getItem("qf_guest_mode") === "true") {
      return this._guestData().history || [];
    }
    const user = await this.user();
    if (!user) return [];
    const { data } = await this.db
      .from("diamond_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    return data || [];
  },

  /* ── Check if daily available ── */
  async canClaimDaily() {
    const data = await this.getData();
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

  format(n) {
    return n?.toLocaleString() || "0";
  },
};

window.Diamonds = Diamonds;
