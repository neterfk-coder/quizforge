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

/* ════════════════════════
   DIAMOND REWARDS
   Called after quiz completion
════════════════════════ */
function awardQuizDiamonds(pct) {
  if (typeof Diamonds === "undefined") return;
  let total = Diamonds.QUIZ_BONUS;
  let msg = `+${total} 💎 Quiz completed!`;

  if (pct === 100) {
    total += Diamonds.PERFECT_BONUS;
    msg = `+${total} 💎 Perfect score bonus!`;
  }

  Diamonds.award(total, msg, pct === 100 ? "perfect" : "quiz");
  showDiamondToast(total, pct === 100 ? "🏆 Perfect score!" : "⚡ Quiz done!");
}

function showDiamondToast(amount, label) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = `${label} +${amount} 💎`;
  toast.className = "toast show success";
  setTimeout(() => {
    toast.className = "toast";
  }, 3500);
}
