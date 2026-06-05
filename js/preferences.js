/* ═══════════════════════════════════════
   QuizForge — preferences.js
   User preferences — Supabase powered
═══════════════════════════════════════ */

const Preferences = {
  get db() {
    return window._supabase;
  },

  async user() {
    const {
      data: { user },
    } = await this.db.auth.getUser();
    return user;
  },

  /* ── Get preferences ── */
  async get() {
    /* Guest mode */
    if (localStorage.getItem("qf_guest_mode") === "true") {
      return {
        theme: localStorage.getItem("qf_theme") || "light",
        language: localStorage.getItem("qf_lang") || "en",
        animations: localStorage.getItem("qf_animations") !== "false",
        reminders: localStorage.getItem("qf_pref_reminders") !== "false",
        updates: localStorage.getItem("qf_pref_updates") !== "false",
      };
    }

    const user = await this.user();
    if (!user) return this._defaults();

    const { data } = await this.db
      .from("preferences")
      .select("*")
      .eq("id", user.id)
      .single();

    return data || this._defaults();
  },

  /* ── Save preferences ── */
  async save(prefs) {
    /* Always save to localStorage as cache */
    if (prefs.theme) localStorage.setItem("qf_theme", prefs.theme);
    if (prefs.language) localStorage.setItem("qf_lang", prefs.language);

    if (localStorage.getItem("qf_guest_mode") === "true") return;

    const user = await this.user();
    if (!user) return;

    await this.db.from("preferences").upsert({
      id: user.id,
      ...prefs,
      updated_at: new Date().toISOString(),
    });
  },

  /* ── Save single preference ── */
  async set(key, value) {
    const prefs = await this.get();
    prefs[key] = value;
    await this.save(prefs);
  },

  _defaults() {
    return {
      theme: "light",
      language: "en",
      animations: true,
      reminders: true,
      updates: true,
    };
  },

  /* ── Apply theme across app ── */
  applyTheme(theme) {
    document.body.classList.toggle("dark", theme === "dark");
    localStorage.setItem("qf_theme", theme);
  },

  /* ── Load and apply on page start ── */
  async init() {
    const prefs = await this.get();
    this.applyTheme(prefs.theme || "light");
    return prefs;
  },
};

window.Preferences = Preferences;

/* Auto-apply theme on load */
document.addEventListener("DOMContentLoaded", async () => {
  const theme = localStorage.getItem("qf_theme") || "light";
  document.body.classList.toggle("dark", theme === "dark");
});
