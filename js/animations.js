/* ═══════════════════════════════════════
   QuizForge — animations.js
   Animaciones, contadores, scroll effects
═══════════════════════════════════════ */

/* ── Navbar sombra al hacer scroll ── */
window.addEventListener("scroll", () => {
  const nav = document.getElementById("navbar");
  if (!nav) return;
  nav.classList.toggle("scrolled", window.scrollY > 20);
});

/* ── Reveal al hacer scroll ── */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add("visible");
        }, i * 80);
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 },
);

document
  .querySelectorAll(".reveal")
  .forEach((el) => revealObserver.observe(el));

/* ── Contador animado ── */
function animateCounter(el, target) {
  const duration = 1400;
  const step = 16;
  const steps = duration / step;
  const increment = target / steps;
  let current = 0;

  const suffix = el.textContent.includes("+") ? "+" : "";

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current).toLocaleString() + suffix;
  }, step);
}

/* Observar stats para disparar contador cuando sean visibles */
const statObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        animateCounter(el, target);
        statObserver.unobserve(el);
      }
    });
  },
  { threshold: 0.5 },
);

document.querySelectorAll(".stat-hero-num[data-target]").forEach((el) => {
  statObserver.observe(el);
});

/* ── FAQ accordion ── */
function toggleFaq(btn) {
  const answer = btn.nextElementSibling;
  const isOpen = btn.classList.contains("open");

  // Cerrar todos
  document.querySelectorAll(".faq-q.open").forEach((q) => {
    q.classList.remove("open");
    q.nextElementSibling.classList.remove("open");
  });

  // Abrir el clickeado si estaba cerrado
  if (!isOpen) {
    btn.classList.add("open");
    answer.classList.add("open");
  }
}

/* ── Scroll suave a secciones ── */
function scrollToQuiz() {
  document
    .getElementById("quiz-app")
    .scrollIntoView({ behavior: "smooth", block: "center" });
}

function scrollToDemo() {
  document.getElementById("demo").scrollIntoView({ behavior: "smooth" });
}
