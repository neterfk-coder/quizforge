/* ═══════════════════════════════════════
   QuizForge — streak.js
   Streak system — Supabase powered
═══════════════════════════════════════ */

const Streak = {
  get db() {
    return window._supabase;
  },

  async user() {
    const {
      data: { user },
    } = await this.db.auth.getUser();
    return user;
  },

  today() {
    return new Date().toISOString().split("T")[0];
  },

  /* ── Get streak data ── */
  async getData() {
    /* Guest mode */
    if (localStorage.getItem("qf_guest_mode") === "true") {
      const raw = localStorage.getItem("qf_streak");
      return raw ? JSON.parse(raw) : this._default();
    }

    const user = await this.user();
    if (!user) return this._default();

    const { data, error } = await this.db
      .from("streaks")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !data) return this._default();
    return {
      current: data.current,
      best: data.best,
      lastDate: data.last_date,
      totalDays: data.total_days,
      freezes: data.freezes,
      xp: data.xp,
      history: this.buildHistory({ lastDate: data.last_date }),
    };
  },

  _default() {
    return {
      current: 0,
      best: 0,
      lastDate: null,
      totalDays: 0,
      freezes: 1,
      xp: 0,
      history: [],
    };
  },

  /* ── Record activity ── */
  async recordActivity() {
    const today = this.today();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split("T")[0];

    /* Guest mode */
    if (localStorage.getItem("qf_guest_mode") === "true") {
      let data = this._default();
      const raw = localStorage.getItem("qf_streak");
      if (raw) data = JSON.parse(raw);
      if (data.lastDate === today) return data;
      if (data.lastDate === yStr) data.current++;
      else if (data.freezes > 0 && data.lastDate < yStr) {
        data.freezes--;
        data.current++;
      } else data.current = 1;
      data.best = Math.max(data.best, data.current);
      data.lastDate = today;
      data.totalDays++;
      data.xp += 10 + data.current * 2;
      data.history = this.buildHistory(data);
      localStorage.setItem("qf_streak", JSON.stringify(data));
      return data;
    }

    const user = await this.user();
    if (!user) return this._default();

    /* Get current streak */
    const { data: row } = await this.db
      .from("streaks")
      .select("*")
      .eq("id", user.id)
      .single();
    if (row?.last_date === today) return this._mapRow(row);

    let current = row?.current || 0;
    let freezes = row?.freezes || 1;
    const best = row?.best || 0;
    const totalDays = (row?.total_days || 0) + 1;
    const xpGain = 10 + current * 2;
    const xp = (row?.xp || 0) + xpGain;

    if (row?.last_date === yStr) current++;
    else if (freezes > 0 && row?.last_date && row.last_date < yStr) {
      freezes--;
      current++;
    } else current = 1;

    const newBest = Math.max(best, current);

    await this.db.from("streaks").upsert({
      id: user.id,
      current,
      best: newBest,
      last_date: today,
      total_days: totalDays,
      freezes,
      xp,
      updated_at: new Date().toISOString(),
    });

    /* Award streak diamonds if 7-day milestone */
    if (current % 7 === 0 && typeof Diamonds !== "undefined") {
      await Diamonds.award(
        Diamonds.STREAK_BONUS,
        `🔥 ${current}-day streak bonus!`,
        "streak",
      );
    }

    const updated = {
      current,
      best: newBest,
      lastDate: today,
      totalDays,
      freezes,
      xp,
    };
    return { ...updated, history: this.buildHistory(updated) };
  },

  _mapRow(row) {
    return {
      current: row.current,
      best: row.best,
      lastDate: row.last_date,
      totalDays: row.total_days,
      freezes: row.freezes,
      xp: row.xp,
      history: this.buildHistory({ lastDate: row.last_date }),
    };
  },

  buildHistory(data) {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split("T")[0];
      days.push({ date: str, done: str === data.lastDate });
    }
    return days;
  },

  getLevel(xp) {
    if (xp < 50) return { level: 1, name: "Beginner", icon: "🌱", next: 50 };
    if (xp < 150) return { level: 2, name: "Student", icon: "📚", next: 150 };
    if (xp < 350) return { level: 3, name: "Dedicated", icon: "⭐", next: 350 };
    if (xp < 700) return { level: 4, name: "Expert", icon: "🔥", next: 700 };
    if (xp < 1200) return { level: 5, name: "Master", icon: "💎", next: 1200 };
    return { level: 6, name: "Legend", icon: "👑", next: null };
  },

  getXpProgress(xp) {
    const lvl = this.getLevel(xp);
    const prev = [0, 0, 50, 150, 350, 700, 1200][lvl.level] || 0;
    const next = lvl.next || xp;
    const pct = lvl.next
      ? Math.round(((xp - prev) / (next - prev)) * 100)
      : 100;
    return { pct, prev, next: lvl.next, current: xp };
  },

  format(n) {
    return n?.toLocaleString() || "0";
  },
};

window.Streak = Streak;
