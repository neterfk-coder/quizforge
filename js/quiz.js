/* ═══════════════════════════════════════
   QuizForge — quiz.js
   Lógica del quiz: estado, puntaje,
   respuestas y control de flujo
═══════════════════════════════════════ */

const QuizState = {
  questions: [],
  answered: 0,
  correct: 0,
  mode: "multiple",
  startTime: null,
  endTime: null,

  /* Inicializar nuevo quiz */
  init(questions, mode) {
    this.questions = questions;
    this.mode = mode;
    this.answered = 0;
    this.correct = 0;
    this.startTime = Date.now();
    this.endTime = null;
  },

  /* Registrar respuesta */
  answer(isCorrect) {
    this.answered++;
    if (isCorrect) this.correct++;
  },

  /* Finalizar quiz */
  finish() {
    this.endTime = Date.now();
  },

  /* Getters */
  get total() {
    return this.questions.length;
  },
  get wrong() {
    return this.answered - this.correct;
  },
  get pct() {
    return this.total > 0 ? Math.round((this.correct / this.total) * 100) : 0;
  },
  get duration() {
    if (!this.startTime || !this.endTime) return 0;
    return Math.round((this.endTime - this.startTime) / 1000);
  },
  get isFinished() {
    return this.answered >= this.total;
  },

  /* Mensaje según resultado */
  get resultMessage() {
    if (this.pct >= 90) return "¡Excelente resultado!";
    if (this.pct >= 70) return "¡Muy bien hecho!";
    if (this.pct >= 50) return "¡Buen trabajo!";
    return "Sigue practicando";
  },

  /* Submensaje */
  get resultSub() {
    return `Respondiste ${this.correct} de ${this.total} preguntas correctamente en ${this.duration}s.`;
  },
};

window.QuizState = QuizState;
