/* ═══════════════════════════════════════
   QuizForge — main.js
   Lógica principal de la interfaz
═══════════════════════════════════════ */

let currentMode = "multiple";
let quizData = [];
let answered = 0;
let correct = 0;

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
  document.getElementById(map[mode]).classList.add("active");
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
    showToast("Escribe o pega un texto primero.", "error");
    return;
  }
  if (text.length < 50) {
    showToast("El texto es muy corto. Agrega más contenido.", "error");
    return;
  }

  const btn = document.getElementById("generate-btn");
  btn.disabled = true;
  document.getElementById("loading").style.display = "flex";
  document.getElementById("quiz-zone").style.display = "none";
  document.getElementById("results-zone").style.display = "none";

  try {
    const numQ = document.getElementById("num-questions").value;
    const difficulty = document.getElementById("difficulty").value;
    const language = document.getElementById("language").value;

    quizData = await window.generateQuestions(
      text,
      currentMode,
      numQ,
      difficulty,
      language,
    );
    renderQuiz(quizData);
    showToast("Quiz generado correctamente", "success");
  } catch (err) {
    showToast("Error al generar el quiz. Intenta de nuevo.", "error");
    console.error(err);
  } finally {
    document.getElementById("loading").style.display = "none";
    btn.disabled = false;
  }
}

/* ── Renderizar preguntas en pantalla ── */
function renderQuiz(questions) {
  answered = 0;
  correct = 0;

  const list = document.getElementById("questions-list");
  list.innerHTML = "";

  document.getElementById("total-q").textContent = questions.length;
  document.getElementById("current-q").textContent = "0";
  updateProgress(0, questions.length);

  questions.forEach((q, i) => {
    const card = document.createElement("div");
    card.className = "question-card";
    card.style.animationDelay = i * 0.06 + "s";
    card.style.opacity = "0";

    if (currentMode === "flashcard") {
      card.innerHTML = `
        <div class="q-number">Tarjeta ${i + 1}</div>
        <div class="flashcard" onclick="this.classList.toggle('flipped')">
          <div class="flashcard-inner">
            <div class="flashcard-front">
              <div class="q-text" style="margin:0">${q.question}</div>
              <div class="flashcard-hint">Haz clic para ver la respuesta</div>
            </div>
            <div class="flashcard-back">
              <div class="q-text" style="margin:0">${q.answer}</div>
              <div class="flashcard-hint">Haz clic para voltear</div>
            </div>
          </div>
        </div>`;
    } else {
      const keys = ["A", "B", "C", "D"];
      const opts = q.options
        .map(
          (opt, j) => `
        <button class="option-btn" onclick="selectAnswer(this, ${i}, ${j}, ${q.correct})">
          <span class="option-key">${keys[j]}</span>${opt}
        </button>`,
        )
        .join("");

      card.innerHTML = `
        <div class="q-number">Pregunta ${i + 1}</div>
        <div class="q-text">${q.question}</div>
        <div class="options-list">${opts}</div>`;
    }

    list.appendChild(card);
  });

  document.getElementById("quiz-zone").style.display = "block";
}

/* ── Seleccionar respuesta ── */
function selectAnswer(btn, qIdx, optIdx, correctIdx) {
  const card = btn.closest(".question-card");
  const buttons = card.querySelectorAll(".option-btn");

  buttons.forEach((b) => (b.disabled = true));

  if (optIdx === correctIdx) {
    btn.classList.add("correct");
    correct++;
  } else {
    btn.classList.add("wrong");
    buttons[correctIdx].classList.add("correct");
  }

  answered++;
  document.getElementById("current-q").textContent = answered;
  updateProgress(answered, quizData.length);

  if (answered === quizData.length) {
    setTimeout(showResults, 800);
  }
}

/* ── Barra de progreso ── */
function updateProgress(done, total) {
  const pct = total > 0 ? (done / total) * 100 : 0;
  document.getElementById("progress-fill").style.width = pct + "%";
}

/* ── Mostrar resultados ── */
function showResults() {
  document.getElementById("quiz-zone").style.display = "none";

  const total = quizData.length;
  const wrong = total - correct;
  const pct = Math.round((correct / total) * 100);

  document.getElementById("score-num").textContent = correct;
  document.getElementById("stat-correct").textContent = correct;
  document.getElementById("stat-wrong").textContent = wrong;
  document.getElementById("stat-pct").textContent = pct + "%";

  document.getElementById("result-title").textContent =
    pct >= 80
      ? "¡Excelente resultado!"
      : pct >= 50
        ? "¡Buen trabajo!"
        : "Sigue practicando";

  document.getElementById("result-sub").textContent =
    `Respondiste ${correct} de ${total} preguntas correctamente.`;

  document.getElementById("results-zone").style.display = "block";
}

/* ── Reiniciar quiz ── */
function resetQuiz() {
  document.getElementById("results-zone").style.display = "none";
  renderQuiz(quizData);
}

/* ── Nuevo texto ── */
function newText() {
  document.getElementById("results-zone").style.display = "none";
  document.getElementById("quiz-zone").style.display = "none";
  document.getElementById("text-input").value = "";
  document.getElementById("file-name").textContent = "Sin archivo seleccionado";
}

/* ── Guardar resultado en Supabase ── */
async function saveResult() {
  try {
    await window.saveQuizResult({
      mode: currentMode,
      total: quizData.length,
      correct: correct,
      pct: Math.round((correct / quizData.length) * 100),
    });
    showToast("Resultado guardado en tu historial", "success");
  } catch {
    showToast("Inicia sesión para guardar tu resultado", "error");
  }
}

/* ── Toast de notificaciones ── */
function showToast(msg, type = "") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show " + type;
  setTimeout(() => {
    t.className = "toast";
  }, 3000);
}
