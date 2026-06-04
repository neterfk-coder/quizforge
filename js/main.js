/* ═══════════════════════════════════════
   QuizForge — main.js
   Coordinador principal — conecta
   api.js + quiz.js + ui.js + supabase.js
═══════════════════════════════════════ */

let currentMode = "multiple";

/* ── Cambiar modo (tabs) ── */
function setMode(mode) {
  currentMode = mode;
  document
    .querySelectorAll(".mode-tab")
    .forEach((t) => t.classList.remove("active"));
  const map = {
    multiple: "tab-multi",
    flashcard: "tab-flash",
    truefalse: "tab-truefalse",
  };
  document.getElementById(map[mode])?.classList.add("active");
}

/* ── Leer archivo subido ── */
function handleFile(input) {
  const file = input.files[0];
  if (!file) return;
  document.getElementById("file-name").textContent = file.name;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById("text-input").value = e.target.result;
  };
  reader.readAsText(file);
}

/* ── Generar quiz ── */
async function generateQuiz() {
  const text = document.getElementById("text-input").value.trim();

  if (!text) {
    UI.toast("Escribe o pega un texto primero.", "error");
    return;
  }
  if (text.length < 50) {
    UI.toast("El texto es muy corto. Agrega más contenido.", "error");
    return;
  }

  const btn = document.getElementById("generate-btn");
  const numQ = document.getElementById("num-questions").value;
  const difficulty = document.getElementById("difficulty").value;
  const language = document.getElementById("language").value;

  btn.disabled = true;
  UI.showLoading();

  try {
    const questions = await window.generateQuestions(
      text,
      currentMode,
      numQ,
      difficulty,
      language,
    );

    /* Inicializar estado del quiz */
    window.QuizState.init(questions, currentMode);

    /* Renderizar */
    UI.renderQuiz(questions, currentMode);
    UI.toast("Quiz generado correctamente", "success");
  } catch (err) {
    UI.toast("Error al generar el quiz. Intenta de nuevo.", "error");
    console.error(err);
    UI.hideLoading();
  } finally {
    btn.disabled = false;
    UI.hideLoading();
  }
}

/* ── Reiniciar quiz (mismas preguntas) ── */
function resetQuiz() {
  const questions = window.QuizState.questions;
  const mode = window.QuizState.mode;
  window.QuizState.init(questions, mode);
  UI.renderQuiz(questions, mode);
}

/* ── Nuevo texto ── */
function newText() {
  UI.resetView();
  document.getElementById("text-input").value = "";
  document.getElementById("file-name").textContent = "Sin archivo seleccionado";
  document.getElementById("generate-btn").disabled = false;
}

/* ── Guardar resultado en Supabase ── */
async function saveResult() {
  const s = window.QuizState;
  try {
    await window.saveQuizResult({
      mode: s.mode,
      total: s.total,
      correct: s.correct,
      pct: s.pct,
    });
    UI.toast("Resultado guardado en tu historial ✓", "success");
  } catch {
    UI.toast("Inicia sesión para guardar tu resultado", "error");
  }
}

/* ════════════════════════
   MODO INVITADO
   Se ejecuta al cargar index.html
════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  const isGuest = localStorage.getItem("qf_guest_mode") === "true";
  if (!isGuest) return;

  /* Crear banner de invitado */
  const banner = document.createElement("div");
  banner.id = "guest-banner";
  banner.innerHTML = `
    <div style="
      background: linear-gradient(90deg, #1d4ed8, #2563eb);
      color: #fff;
      padding: .65rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: .75rem;
      font-family: 'Inter', Arial, sans-serif;
      font-size: .875rem;
    ">
      <span style="display:flex;align-items:center;gap:8px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        Estás en <strong style="margin:0 3px">modo invitado</strong> — tus resultados no se guardarán
      </span>
      <span style="display:flex;align-items:center;gap:.6rem;">
        <a href="pages/register.html" style="
          background:#fff; color:#1d4ed8;
          padding:.35rem .9rem; border-radius:7px;
          font-weight:600; font-size:.82rem;
          text-decoration:none; transition:opacity .15s;
        ">Crear cuenta gratis</a>
        <button onclick="exitGuestMode()" style="
          background:rgba(255,255,255,.15);
          border:1px solid rgba(255,255,255,.3);
          color:#fff; padding:.35rem .9rem;
          border-radius:7px; font-size:.82rem;
          cursor:pointer; font-family:inherit;
        ">Salir</button>
      </span>
    </div>`;

  /* Insertar debajo del nav */
  const nav = document.getElementById("navbar");
  nav.parentNode.insertBefore(banner, nav.nextSibling);

  /* Actualizar nav para mostrar nombre invitado */
  const navLinks = document.querySelector(".nav-links");
  if (navLinks) {
    const chip = document.createElement("span");
    chip.style.cssText = `
      font-size:.8rem; font-weight:600; color:var(--accent);
      background:var(--accent-light); border:1.5px solid var(--border2);
      padding:.3rem .85rem; border-radius:999px;
      font-family:'Inter',Arial,sans-serif;
    `;
    chip.textContent = "👤 Invitado";
    navLinks.prepend(chip);
  }
});

/* Salir del modo invitado */
function exitGuestMode() {
  localStorage.removeItem("qf_guest_mode");
  localStorage.removeItem("qf_guest_name");
  window.location.href = "pages/login.html";
}
