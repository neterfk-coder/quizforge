/* ═══════════════════════════════════════
   QuizForge — ui.js
   Full rendering for all quiz modes
═══════════════════════════════════════ */

const UI = {
  /* ── DOM refs ── */
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
     RENDER QUIZ
  ════════════════════════ */
  renderQuiz(questions, mode) {
    this.questionsList.innerHTML = "";
    this.totalQ.textContent = questions.length;
    this.currentQ.textContent = "0";
    this.updateProgress(0, questions.length);

    if (mode === "flashcard") {
      this.renderFlashcards(questions);
    } else {
      questions.forEach((q, i) => {
        const card = document.createElement("div");
        card.className = "question-card";
        card.style.animationDelay = i * 0.07 + "s";
        card.style.opacity = "0";
        card.innerHTML = this.buildQuestion(q, i, mode);
        this.questionsList.appendChild(card);
      });
    }

    this.quizZone.style.display = "block";
    this.resultsZone.style.display = "none";
  },

  /* ════════════════════════
     MULTIPLE CHOICE / TRUE-FALSE
  ════════════════════════ */
  buildQuestion(q, index, mode) {
    const keys = mode === "truefalse" ? ["✓", "✗"] : ["A", "B", "C", "D"];
    const label = mode === "truefalse" ? "Statement" : "Question";

    const options = (q.options || [])
      .map(
        (opt, j) => `
      <button class="option-btn" onclick="UI.selectAnswer(this, ${index}, ${j}, ${q.correct})">
        <span class="option-key" style="${mode === "truefalse" ? "font-size:1rem;" : ""}">${keys[j] || j + 1}</span>
        <span>${opt}</span>
      </button>`,
      )
      .join("");

    return `
      <div class="q-number">${label} ${index + 1}</div>
      <div class="q-text">${q.question}</div>
      <div class="options-list">${options}</div>`;
  },

  /* ════════════════════════
     FLASHCARDS — Interactive mode
  ════════════════════════ */
  renderFlashcards(questions) {
    const list = this.questionsList;

    /* Inject flashcard navigation styles once */
    if (!document.getElementById("fc-nav-styles")) {
      const style = document.createElement("style");
      style.id = "fc-nav-styles";
      style.textContent = `
        .fc-nav-wrap {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 0; margin-bottom: 1rem;
        }
        .fc-counter {
          font-size: .82rem; font-weight: 600; color: var(--muted);
        }
        .fc-counter strong { color: var(--accent); }
        .fc-btn-row {
          display: flex; gap: .5rem;
        }
        .fc-btn {
          background: var(--surface); border: 1.5px solid var(--border2);
          color: var(--muted); padding: .4rem .9rem;
          border-radius: var(--radius-sm); font-family: var(--font);
          font-size: .82rem; font-weight: 600; cursor: pointer;
          transition: all .18s; display: flex; align-items: center; gap: 5px;
        }
        .fc-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
        .fc-btn:disabled { opacity: .4; cursor: not-allowed; }
        .fc-btn.flip-btn { background: var(--accent); color: #fff; border-color: var(--accent); }
        .fc-btn.flip-btn:hover { background: var(--accent-dark); }

        .fc-progress-dots {
          display: flex; gap: 5px; justify-content: center;
          flex-wrap: wrap; margin-top: .75rem;
        }
        .fc-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--border2); transition: all .25s; cursor: pointer;
        }
        .fc-dot.active { background: var(--accent); transform: scale(1.3); }
        .fc-dot.seen   { background: var(--accent-mid); }

        .fc-single-card {
          display: none;
        }
        .fc-single-card.active {
          display: block;
          animation: fcFadeIn .3s ease;
        }
        @keyframes fcFadeIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .fc-card-inner {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow-md);
          cursor: pointer;
          transition: transform .15s;
        }
        .fc-card-inner:hover { transform: translateY(-2px); }

        .fc-front-area, .fc-back-area {
          padding: 2.5rem 2rem;
          min-height: 200px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center;
        }
        .fc-front-area {
          background: var(--surface);
          border-bottom: 1.5px solid var(--border);
        }
        .fc-back-area {
          background: var(--accent-light);
          display: none;
        }
        .fc-card-inner.flipped .fc-front-area { display: none; }
        .fc-card-inner.flipped .fc-back-area  { display: flex; }

        .fc-side-label {
          font-size: .7rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: .1em; margin-bottom: .75rem;
        }
        .fc-front-area .fc-side-label { color: var(--accent); }
        .fc-back-area  .fc-side-label { color: var(--accent-dark); }

        .fc-card-q {
          font-size: 1.05rem; font-weight: 600;
          color: var(--text); line-height: 1.65;
        }
        .fc-card-a {
          font-size: 1rem; font-weight: 500;
          color: var(--accent-dark); line-height: 1.65;
        }
        .fc-tap-hint {
          font-size: .75rem; color: var(--muted2);
          margin-top: .85rem;
        }

        .fc-known-row {
          display: flex; gap: .6rem; justify-content: center;
          margin-top: 1rem;
        }
        .fc-known-btn {
          flex: 1; max-width: 140px;
          padding: .6rem; border-radius: var(--radius-sm);
          font-family: var(--font); font-size: .85rem; font-weight: 600;
          cursor: pointer; transition: all .2s; border: 1.5px solid;
        }
        .fc-known-btn.yes {
          background: var(--correct-bg); border-color: var(--correct-bdr);
          color: var(--correct);
        }
        .fc-known-btn.yes:hover { background: var(--correct); color: #fff; }
        .fc-known-btn.no {
          background: var(--danger-bg); border-color: var(--danger-bdr);
          color: var(--danger);
        }
        .fc-known-btn.no:hover { background: var(--danger); color: #fff; }

        .fc-summary-wrap {
          background: var(--surface2); border: 1.5px solid var(--border);
          border-radius: var(--radius); padding: 1.5rem;
          text-align: center; margin-top: 1rem;
          display: none;
        }
        .fc-summary-wrap.show { display: block; animation: fcFadeIn .4s ease; }
        .fc-summary-title { font-weight:700; font-size:1.1rem; color:var(--text); margin-bottom:.4rem; }
        .fc-summary-sub   { font-size:.875rem; color:var(--muted); margin-bottom:1rem; }
        .fc-summary-stats { display:flex; gap:.75rem; justify-content:center; margin-bottom:1rem; flex-wrap:wrap; }
        .fc-stat { background:var(--surface); border:1.5px solid var(--border); border-radius:var(--radius-sm); padding:.6rem 1rem; text-align:center; }
        .fc-stat-num  { font-weight:800; font-size:1.25rem; line-height:1; }
        .fc-stat-num.g { color:var(--correct); }
        .fc-stat-num.r { color:var(--danger); }
        .fc-stat-label { font-size:.72rem; color:var(--muted); margin-top:2px; }
      `;
      document.head.appendChild(style);
    }

    /* State */
    let currentIdx = 0;
    let knownCards = new Set();
    let unknownCards = new Set();
    let flipped = false;

    /* Navigation wrap */
    const navWrap = document.createElement("div");
    navWrap.className = "fc-nav-wrap";
    navWrap.innerHTML = `
      <span class="fc-counter">Card <strong id="fc-cur">1</strong> of <strong>${questions.length}</strong></span>
      <div class="fc-btn-row">
        <button class="fc-btn" id="fc-prev" onclick="fcGo(-1)">← Prev</button>
        <button class="fc-btn flip-btn" id="fc-flip" onclick="fcFlip()">↩ Flip</button>
        <button class="fc-btn" id="fc-next" onclick="fcGo(1)">Next →</button>
      </div>
    `;
    list.appendChild(navWrap);

    /* Cards */
    questions.forEach((q, i) => {
      const wrap = document.createElement("div");
      wrap.className = "fc-single-card" + (i === 0 ? " active" : "");
      wrap.id = "fc-card-" + i;
      wrap.innerHTML = `
        <div class="fc-card-inner" id="fc-inner-${i}" onclick="fcFlipCard(${i})">
          <div class="fc-front-area">
            <div class="fc-side-label">📖 Term / Question</div>
            <div class="fc-card-q">${q.question}</div>
            <div class="fc-tap-hint">Tap to reveal answer</div>
          </div>
          <div class="fc-back-area">
            <div class="fc-side-label">✅ Answer / Definition</div>
            <div class="fc-card-a">${q.answer || q.options?.[q.correct] || "No answer available"}</div>
            <div class="fc-tap-hint">Tap to flip back</div>
          </div>
        </div>
        <div class="fc-known-row" id="fc-known-${i}" style="display:none">
          <button class="fc-known-btn yes" onclick="fcMark(${i}, true)">✓ Got it!</button>
          <button class="fc-known-btn no"  onclick="fcMark(${i}, false)">✗ Still learning</button>
        </div>
      `;
      list.appendChild(wrap);
    });

    /* Dots */
    const dotsWrap = document.createElement("div");
    dotsWrap.className = "fc-progress-dots";
    dotsWrap.id = "fc-dots";
    dotsWrap.innerHTML = questions
      .map(
        (_, i) =>
          `<div class="fc-dot${i === 0 ? " active" : ""}" id="fc-dot-${i}" onclick="fcGoTo(${i})"></div>`,
      )
      .join("");
    list.appendChild(dotsWrap);

    /* Summary */
    const summary = document.createElement("div");
    summary.className = "fc-summary-wrap";
    summary.id = "fc-summary";
    summary.innerHTML = `
      <div class="fc-summary-title">🎉 Deck Complete!</div>
      <div class="fc-summary-sub">You've gone through all ${questions.length} cards</div>
      <div class="fc-summary-stats">
        <div class="fc-stat"><div class="fc-stat-num g" id="fc-known-count">0</div><div class="fc-stat-label">Got it</div></div>
        <div class="fc-stat"><div class="fc-stat-num r" id="fc-unknown-count">0</div><div class="fc-stat-label">Still learning</div></div>
      </div>
      <button class="fc-btn flip-btn" style="margin:0 auto;display:flex" onclick="fcRestart()">↺ Restart deck</button>
    `;
    list.appendChild(summary);

    /* ── Functions ── */
    window.fcGo = function (dir) {
      const next = currentIdx + dir;
      if (next < 0 || next >= questions.length) return;
      fcGoTo(next);
    };

    window.fcGoTo = function (idx) {
      document
        .getElementById("fc-card-" + currentIdx)
        ?.classList.remove("active");
      document
        .getElementById("fc-dot-" + currentIdx)
        ?.classList.remove("active");

      currentIdx = idx;
      flipped = false;

      const card = document.getElementById("fc-card-" + currentIdx);
      card?.classList.add("active");
      document
        .getElementById("fc-inner-" + currentIdx)
        ?.classList.remove("flipped");
      document.getElementById("fc-known-" + currentIdx).style.display = "none";

      /* Update dot */
      const dot = document.getElementById("fc-dot-" + currentIdx);
      dot?.classList.add("active");
      dot?.classList.remove("seen");

      document.getElementById("fc-cur").textContent = currentIdx + 1;
      document.getElementById("fc-prev").disabled = currentIdx === 0;
      document.getElementById("fc-next").disabled =
        currentIdx === questions.length - 1;
    };

    window.fcFlip = function () {
      fcFlipCard(currentIdx);
    };

    window.fcFlipCard = function (idx) {
      const inner = document.getElementById("fc-inner-" + idx);
      const known = document.getElementById("fc-known-" + idx);
      if (!inner) return;

      inner.classList.toggle("flipped");
      flipped = inner.classList.contains("flipped");

      /* Show known/unknown buttons after flip */
      if (flipped) {
        known.style.display = "flex";
        known.style.animation = "fcFadeIn .3s ease";
      } else {
        known.style.display = "none";
      }
    };

    window.fcMark = function (idx, isKnown) {
      /* Mark dot */
      const dot = document.getElementById("fc-dot-" + idx);
      if (dot) {
        dot.style.background = isKnown ? "var(--correct)" : "var(--danger)";
        dot.classList.remove("active", "seen");
      }

      if (isKnown) knownCards.add(idx);
      else unknownCards.add(idx);

      /* Auto advance */
      if (currentIdx < questions.length - 1) {
        setTimeout(() => fcGoTo(currentIdx + 1), 300);
      } else {
        /* Show summary */
        document.getElementById("fc-summary").classList.add("show");
        document.getElementById("fc-known-count").textContent = knownCards.size;
        document.getElementById("fc-unknown-count").textContent =
          unknownCards.size;
        /* Complete the quiz state */
        window.QuizState.answered = questions.length;
        window.QuizState.correct = knownCards.size;
        window.QuizState.finish();
        setTimeout(() => UI.showResults(), 1200);
      }
    };

    window.fcRestart = function () {
      knownCards.clear();
      unknownCards.clear();
      document.getElementById("fc-summary").classList.remove("show");
      /* Reset all dots */
      questions.forEach((_, i) => {
        const d = document.getElementById("fc-dot-" + i);
        if (d) {
          d.style.background = "";
          d.className = "fc-dot";
        }
      });
      fcGoTo(0);
    };

    /* Init first card */
    window.fcGoTo(0);
    document.getElementById("fc-prev").disabled = true;
  },

  /* ── Select answer (multiple/truefalse) ── */
  selectAnswer(btn, qIdx, optIdx, correctIdx) {
    const card = btn.closest(".question-card");
    const buttons = card.querySelectorAll(".option-btn");
    buttons.forEach((b) => (b.disabled = true));

    const isCorrect = optIdx === correctIdx;
    btn.classList.add(isCorrect ? "correct" : "wrong");
    if (!isCorrect) buttons[correctIdx]?.classList.add("correct");

    /* Explanation */
    const q = window.QuizState.questions[qIdx];
    if (q?.explanation) {
      const exp = document.createElement("div");
      exp.style.cssText =
        "margin-top:1rem;padding:.75rem 1rem;background:var(--accent-light);border:1px solid var(--border2);border-radius:var(--radius-sm);font-size:.85rem;color:var(--accent);line-height:1.65;";
      exp.textContent = "💡 " + q.explanation;
      card.appendChild(exp);
    }

    window.QuizState.answer(isCorrect);
    if (window.Mascot)
      isCorrect ? window.Mascot.onCorrect() : window.Mascot.onWrong();
    this.currentQ.textContent = window.QuizState.answered;
    this.updateProgress(window.QuizState.answered, window.QuizState.total);

    if (window.QuizState.isFinished) {
      window.QuizState.finish();
      setTimeout(() => this.showResults(), 900);
    }
  },

  /* ── Progress bar ── */
  updateProgress(done, total) {
    const pct = total > 0 ? (done / total) * 100 : 0;
    this.progressFill.style.width = pct + "%";
  },

  /* ════════════════════════
     RESULTS
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

    if (window.Mascot) window.Mascot.onQuizFinish(s.pct);
    if (typeof awardQuizDiamonds !== "undefined") awardQuizDiamonds(s.pct);
    this.resultsZone.scrollIntoView({ behavior: "smooth", block: "center" });
  },

  /* ── Reset view ── */
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
