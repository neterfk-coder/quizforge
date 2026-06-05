/* ═══════════════════════════════════════
   QuizForge — store.js
   Store / owned items — Supabase powered
═══════════════════════════════════════ */

const Store = {
  get db() {
    return window._supabase;
  },

  async user() {
    const {
      data: { user },
    } = await this.db.auth.getUser();
    return user;
  },

  /* ── Get owned items ── */
  async getOwned() {
    /* Guest mode */
    if (localStorage.getItem("qf_guest_mode") === "true") {
      return JSON.parse(localStorage.getItem("qf_owned_items") || "[]");
    }

    const user = await this.user();
    if (!user) return [];

    const { data } = await this.db
      .from("owned_items")
      .select("item_id")
      .eq("user_id", user.id);

    return (data || []).map((r) => r.item_id);
  },

  /* ── Purchase item ── */
  async purchase(itemId, itemName, price) {
    /* Spend diamonds first */
    const result = await Diamonds.spend(price, itemName);
    if (!result.success)
      return { success: false, reason: "insufficient_diamonds" };

    /* Guest mode */
    if (localStorage.getItem("qf_guest_mode") === "true") {
      const owned = JSON.parse(localStorage.getItem("qf_owned_items") || "[]");
      if (!owned.includes(itemId)) owned.push(itemId);
      localStorage.setItem("qf_owned_items", JSON.stringify(owned));
      return { success: true, balance: result.data.balance };
    }

    const user = await this.user();
    if (!user) return { success: false };

    /* Save to Supabase */
    await this.db.from("owned_items").upsert({
      user_id: user.id,
      item_id: itemId,
      item_name: itemName,
      purchased_at: new Date().toISOString(),
    });

    return { success: true, balance: result.data.balance };
  },

  /* ── Check if item is owned ── */
  async isOwned(itemId) {
    const owned = await this.getOwned();
    return owned.includes(itemId);
  },
};

window.Store = Store;
