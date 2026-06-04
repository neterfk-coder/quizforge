/* ═══════════════════════════════════════
   QuizForge — streak.js
   Sistema de rachas interactivo
   Sin conexión a base de datos (localStorage)
═══════════════════════════════════════ */

const Streak = {
  /* ── Obtener datos ── */
  getData() {
    const raw = localStorage.getItem("qf_streak");
    if (!raw) return this.defaultData();
    try {
      return JSON.parse(raw);
    } catch {
      return this.defaultData();
    }
  },

  defaultData() {
    return {
      current: 0,
      best: 0,
      lastDate: null,
      history: [] /* últimos 7 días { date, done } */,
      totalDays: 0,
      freezes: 1 /* escudos de protección */,
      xp: 0,
    };
  },

  /* ── Guardar datos ── */
  save(data) {
    localStorage.setItem("qf_streak", JSON.stringify(data));
  },

  /* ── Fecha de hoy YYYY-MM-DD ── */
  today() {
    return new Date().toISOString().split("T")[0];
  },

  /* ── Registrar actividad del día ── */
  recordActivity() {
    const data = this.getData();
    const today = this.today();

    if (data.lastDate === today) return data; /* ya completó hoy */

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split("T")[0];

    if (data.lastDate === yStr) {
      /* Continuó la racha */
      data.current++;
    } else if (data.lastDate && data.lastDate < yStr) {
      /* Rompió la racha — verificar freezes */
      if (data.freezes > 0) {
        data.freezes--;
        data.current++;
      } else {
        data.current = 1;
      }
    } else {
      /* Primera vez o nuevo inicio */
      data.current = 1;
    }

    data.best = Math.max(data.best, data.current);
    data.lastDate = today;
    data.totalDays++;
    data.xp += 10 + data.current * 2; /* XP por racha */

    /* Actualizar historial 7 días */
    data.history = this.buildHistory(data);

    this.save(data);
    return data;
  },

  /* ── Construir historial 7 días ── */
  buildHistory(data) {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split("T")[0];
      days.push({
        date: str,
        done:
          str === data.lastDate ||
          (data.history || []).some((h) => h.date === str && h.done),
      });
    }
    /* Marcar hoy como done */
    if (data.lastDate) {
      const idx = days.findIndex((d) => d.date === data.lastDate);
      if (idx !== -1) days[idx].done = true;
    }
    return days;
  },

  /* ── Calcular nivel ── */
  getLevel(xp) {
    if (xp < 50)
      return { level: 1, name: "Principiante", icon: "🌱", next: 50 };
    if (xp < 150)
      return { level: 2, name: "Estudiante", icon: "📚", next: 150 };
    if (xp < 350) return { level: 3, name: "Aplicado", icon: "⭐", next: 350 };
    if (xp < 700) return { level: 4, name: "Experto", icon: "🔥", next: 700 };
    if (xp < 1200) return { level: 5, name: "Maestro", icon: "💎", next: 1200 };
    return { level: 6, name: "Leyenda", icon: "👑", next: null };
  },

  /* ── Calcular progreso de XP ── */
  getXpProgress(xp) {
    const lvl = this.getLevel(xp);
    const prev = [0, 0, 50, 150, 350, 700, 1200][lvl.level] || 0;
    const next = lvl.next || xp;
    const pct = lvl.next
      ? Math.round(((xp - prev) / (next - prev)) * 100)
      : 100;
    return { pct, prev, next: lvl.next, current: xp };
  },
};

window.Streak = Streak;
