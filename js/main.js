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
async function handleFile(input) {
  const file = input.files[0];
  if (!file) return;

  const fileNameEl = document.getElementById("file-name");
  const textInputEl = document.getElementById("text-input");

  fileNameEl.textContent = "⏳ Reading " + file.name + "...";
  textInputEl.value = "";

  try {
    /* TXT file — read directly */
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const text = await file.text();
      textInputEl.value = text;
      fileNameEl.textContent = "✅ " + file.name;
      return;
    }

    /* PDF file — extract text with PDF.js */
    if (typeof pdfjsLib === "undefined") {
      /* Load PDF.js dynamically if not loaded yet */
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src =
          "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js";
        s.onload = () => {
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
          resolve();
        };
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const maxPages = Math.min(pdf.numPages, 25);
    let fullText = "";

    fileNameEl.textContent = "⏳ Extracting text (" + maxPages + " pages)...";

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item) => item.str).join(" ");
      fullText += text + "\n";
    }

    fullText = fullText.trim();

    if (!fullText || fullText.length < 30) {
      fileNameEl.textContent =
        "⚠️ Could not extract text — try a text-based PDF";
      if (window.showToast)
        showToast("Could not extract text from PDF", "error");
      return;
    }

    textInputEl.value = fullText;
    fileNameEl.textContent =
      "✅ " +
      file.name +
      " (" +
      pdf.numPages +
      " pages, " +
      fullText.length.toLocaleString() +
      " chars)";
    if (window.showToast)
      showToast("✅ PDF loaded! Ready to generate quiz.", "success");
  } catch (err) {
    fileNameEl.textContent = "⚠️ Error reading file";
    console.error("PDF read error:", err);
    if (window.showToast)
      showToast("Error reading PDF: " + err.message, "error");
  }
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
