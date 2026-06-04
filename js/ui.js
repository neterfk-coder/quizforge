/* ═══════════════════════════════════════
   QuizForge — ui.js
   Renderizado de preguntas, opciones,
   flashcards y pantalla de resultados
═══════════════════════════════════════ */

const UI = {
  /* ── Refs DOM ── */
  get quizZone() {
    return document.getElementById("quiz-zone");
  },
  get resultsZone() {
    return document.getElementById("results-zone");
  },
  get loadingZone() {
    return document.getElementById("loading");
  },
  get questionsList() {
    return document.getElementById("questions-list");
  },
  get progressFill() {
    return document.getElementById("progress-fill");
  },
  get currentQ() {
    return document.getElementById("current-q");
  },
  get totalQ() {
    return document.getElementById("total-q");
  },

  /* ════════════════════════
     LOADING
  ════════════════════════ */
  showLoading() {
    this.loadingZone.style.display = "flex";
    this.quizZone.style.display = "none";
    this.resultsZone.style.display = "none";
  },

  hideLoading() {
    this.loadingZone.style.display = "none";
  },

  /* ════════════════════════
     QUIZ
  ════════════════════════ */
  renderQuiz(questions, mode) {
    this.questionsList.innerHTML = "";
    this.totalQ.textContent = questions.length;
    this.currentQ.textContent = "0";
    this.updateProgress(0, questions.length);

    questions.forEach((q, i) => {
      const card = document.createElement("div");
      card.className = "question-card";
      card.style.animationDelay = i * 0.07 + "s";
      card.style.opacity = "0";

      if (mode === "flashcard") {
        card.innerHTML = this.buildFlashcard(q, i);
      } else {
        card.innerHTML = this.buildQuestion(q, i, mode);
      }

      this.questionsList.appendChild(card);
    });

    this.quizZone.style.display = "block";
    this.resultsZone.style.display = "none";
  },

  /* ── Construir pregunta opción múltiple / V o F ── */
  buildQuestion(q, index, mode) {
    const keys = ["A", "B", "C", "D"];
    const options = (q.options || [])
      .map(
        (opt, j) => `
      <button class="option-btn" onclick="UI.selectAnswer(this, ${index}, ${j}, ${q.correct})">
        <span class="option-key">${keys[j] || j + 1}</span>
        <span>${opt}</span>
      </button>`,
      )
      .join("");

    return `
      <div class="q-number">Pregunta ${index + 1}</div>
      <div class="q-text">${q.question}</div>
      <div class="options-list">${options}</div>`;
  },

  /* ── Construir flashcard ── */
  buildFlashcard(q, index) {
    return `
      <div class="q-number">Tarjeta ${index + 1}</div>
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
  },

  /* ── Seleccionar respuesta ── */
  selectAnswer(btn, qIdx, optIdx, correctIdx) {
    const card = btn.closest(".question-card");
    const buttons = card.querySelectorAll(".option-btn");

    /* Deshabilitar todas las opciones */
    buttons.forEach((b) => (b.disabled = true));

    const isCorrect = optIdx === correctIdx;

    /* Marcar correcta / incorrecta */
    if (isCorrect) {
      btn.classList.add("correct");
    } else {
      btn.classList.add("wrong");
      buttons[correctIdx]?.classList.add("correct");
    }

    /* Mostrar explicación si existe */
    const q = window.QuizState.questions[qIdx];
    if (q?.explanation) {
      const exp = document.createElement("div");
      exp.style.cssText = `
        margin-top: 1rem; padding: .75rem 1rem;
        background: var(--accent-light); border: 1px solid var(--border2);
        border-radius: var(--radius-sm); font-size: .85rem;
        color: var(--accent); line-height: 1.65;`;
      exp.textContent = "💡 " + q.explanation;
      card.appendChild(exp);
    }

    /* Actualizar estado */
    window.QuizState.answer(isCorrect);
    this.currentQ.textContent = window.QuizState.answered;
    this.updateProgress(window.QuizState.answered, window.QuizState.total);

    /* Terminar quiz si se respondió todo */
    if (window.QuizState.isFinished) {
      window.QuizState.finish();
      setTimeout(() => this.showResults(), 900);
    }
  },

  /* ── Barra de progreso ── */
  updateProgress(done, total) {
    const pct = total > 0 ? (done / total) * 100 : 0;
    this.progressFill.style.width = pct + "%";
  },

  /* ════════════════════════
     RESULTADOS
  ════════════════════════ */
  showResults() {
    const s = window.QuizState;

    this.quizZone.style.display = "none";
    this.resultsZone.style.display = "block";

    document.getElementById("score-num").textContent = s.correct;
    document.getElementById("result-title").textContent = s.resultMessage;
    document.getElementById("result-sub").textContent = s.resultSub;
    document.getElementById("stat-correct").textContent = s.correct;
    document.getElementById("stat-wrong").textContent = s.wrong;
    document.getElementById("stat-pct").textContent = s.pct + "%";

    /* Color del círculo según nota */
    const circle = document.querySelector(".score-circle");
    if (circle) {
      if (s.pct >= 80) {
        circle.style.borderColor = "var(--correct)";
        circle.style.background = "var(--correct-bg)";
        document.getElementById("score-num").style.color = "var(--correct)";
      } else if (s.pct < 50) {
        circle.style.borderColor = "var(--danger)";
        circle.style.background = "var(--danger-bg)";
        document.getElementById("score-num").style.color = "var(--danger)";
      }
    }

    /* Scroll suave a resultados */
    this.resultsZone.scrollIntoView({ behavior: "smooth", block: "center" });
  },

  /* ── Reiniciar vista ── */
  resetView() {
    this.quizZone.style.display = "none";
    this.resultsZone.style.display = "none";
    this.loadingZone.style.display = "none";
    this.questionsList.innerHTML = "";
  },

  /* ── Toast ── */
  toast(msg, type = "") {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.className = "toast show " + type;
    setTimeout(() => {
      t.className = "toast";
    }, 3000);
  },
};

window.UI = UI;
