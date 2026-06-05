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
/* ── PDF Loading UI ── */
function createPDFLoader() {
  /* Remove existing loader */
  const existing = document.getElementById("pdf-loader-wrap");
  if (existing) existing.remove();

  const wrap = document.createElement("div");
  wrap.id = "pdf-loader-wrap";
  wrap.style.cssText = `
    margin-top: .85rem;
    background: var(--surface, #fff);
    border: 1.5px solid var(--border, #d0e3fa);
    border-radius: 10px;
    padding: 1rem 1.25rem;
    font-family: 'Inter', Arial, sans-serif;
    box-shadow: 0 1px 4px rgba(37,99,235,.07);
    animation: pdfLoaderIn .25s ease;
  `;

  wrap.innerHTML = `
    <style>
      @keyframes pdfLoaderIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      @keyframes shimmerMove { 0% { left:-100%; } 100% { left:200%; } }
      @keyframes pdfSpinIcon { to { transform:rotate(360deg); } }
    </style>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:.75rem;">
      <div id="pdf-loader-icon" style="width:32px;height:32px;border:2.5px solid var(--border,#d0e3fa);border-top-color:var(--accent,#2563eb);border-radius:50%;flex-shrink:0;animation:pdfSpinIcon .7s linear infinite;"></div>
      <div style="flex:1;min-width:0;">
        <div id="pdf-loader-title" style="font-size:.85rem;font-weight:600;color:var(--text,#0f172a);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Reading PDF...</div>
        <div id="pdf-loader-sub" style="font-size:.75rem;color:var(--muted,#64748b);">Loading PDF.js engine</div>
      </div>
      <div id="pdf-loader-pct" style="font-size:.85rem;font-weight:700;color:var(--accent,#2563eb);min-width:36px;text-align:right;">0%</div>
    </div>
    <div style="background:var(--border,#d0e3fa);border-radius:999px;height:6px;overflow:hidden;position:relative;">
      <div id="pdf-loader-bar" style="height:100%;border-radius:999px;background:linear-gradient(90deg,#60a5fa,#2563eb);width:0%;transition:width .35s cubic-bezier(.4,0,.2,1);position:relative;overflow:hidden;">
        <div style="position:absolute;top:0;bottom:0;width:60%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);animation:shimmerMove 1.2s infinite;"></div>
      </div>
    </div>
    <div id="pdf-loader-pages" style="display:flex;gap:4px;margin-top:.6rem;flex-wrap:wrap;"></div>
  `;

  /* Insert after upload-row */
  const uploadRow = document.querySelector(".upload-row");
  if (uploadRow) {
    uploadRow.parentNode.insertBefore(wrap, uploadRow.nextSibling);
  } else {
    const textarea = document.getElementById("text-input");
    if (textarea) textarea.parentNode.appendChild(wrap);
  }

  return wrap;
}

function updatePDFLoader(pct, title, sub) {
  const bar = document.getElementById("pdf-loader-bar");
  const pctEl = document.getElementById("pdf-loader-pct");
  const ttl = document.getElementById("pdf-loader-title");
  const subEl = document.getElementById("pdf-loader-sub");
  if (bar) bar.style.width = Math.min(pct, 100) + "%";
  if (pctEl) pctEl.textContent = Math.min(pct, 100) + "%";
  if (ttl) ttl.textContent = title || "";
  if (subEl) subEl.textContent = sub || "";
}

function addPageDot(pageNum, total) {
  const container = document.getElementById("pdf-loader-pages");
  if (!container) return;
  const dot = document.createElement("div");
  dot.style.cssText = `
    width:8px;height:8px;border-radius:50%;
    background:var(--accent,#2563eb);
    opacity:0;transform:scale(0);
    transition:all .2s;flex-shrink:0;
  `;
  container.appendChild(dot);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      dot.style.opacity = "1";
      dot.style.transform = "scale(1)";
    });
  });
}

function finishPDFLoader(success, message) {
  const wrap = document.getElementById("pdf-loader-wrap");
  if (!wrap) return;

  const icon = document.getElementById("pdf-loader-icon");
  const pctEl = document.getElementById("pdf-loader-pct");
  const bar = document.getElementById("pdf-loader-bar");

  if (success) {
    if (icon) {
      icon.style.animation = "none";
      icon.style.border = "2.5px solid var(--correct,#16a34a)";
      icon.textContent = "✓";
      icon.style.display = "flex";
      icon.style.alignItems = "center";
      icon.style.justifyContent = "center";
      icon.style.fontSize = "1rem";
      icon.style.color = "var(--correct,#16a34a)";
      icon.style.fontWeight = "700";
    }
    if (bar) bar.style.background = "linear-gradient(90deg,#34d399,#16a34a)";
    if (pctEl) pctEl.style.color = "var(--correct,#16a34a)";
    updatePDFLoader(100, "✅ " + message, "Ready to generate quiz!");
  } else {
    if (icon) {
      icon.style.animation = "none";
      icon.style.border = "2.5px solid var(--danger,#dc2626)";
      icon.textContent = "✕";
      icon.style.display = "flex";
      icon.style.alignItems = "center";
      icon.style.justifyContent = "center";
      icon.style.fontSize = "1rem";
      icon.style.color = "var(--danger,#dc2626)";
      icon.style.fontWeight = "700";
    }
    if (bar) bar.style.background = "#fca5a5";
    if (pctEl) pctEl.style.color = "var(--danger,#dc2626)";
    updatePDFLoader(100, "⚠️ " + message, "Try a different file");
  }

  /* Auto-hide after 4s on success */
  if (success) {
    setTimeout(() => {
      if (wrap) {
        wrap.style.opacity = "0";
        wrap.style.transform = "translateY(-4px)";
        wrap.style.transition = "all .3s";
        setTimeout(() => wrap.remove(), 300);
      }
    }, 4000);
  }
}

/* ── Main file handler ── */
async function handleFile(input) {
  const file = input.files[0];
  if (!file) return;

  const fileNameEl = document.getElementById("file-name");
  const textInputEl = document.getElementById("text-input");

  fileNameEl.textContent = file.name;
  textInputEl.value = "";

  /* Create loading UI */
  createPDFLoader();

  try {
    /* TXT file */
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      updatePDFLoader(30, "Reading text file...", file.name);
      const text = await file.text();
      updatePDFLoader(100, "Done!", "");
      textInputEl.value = text;
      finishPDFLoader(true, file.name);
      if (window.showToast) showToast("✅ File loaded!", "success");
      return;
    }

    /* PDF — load PDF.js if needed */
    updatePDFLoader(5, "Loading PDF engine...", "One moment...");
    if (typeof pdfjsLib === "undefined") {
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

    updatePDFLoader(15, "Opening PDF...", file.name);
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const maxPages = Math.min(pdf.numPages, 25);
    let fullText = "";

    updatePDFLoader(20, "Extracting text...", pdf.numPages + " pages detected");

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const ct = await page.getTextContent();
      const text = ct.items.map((item) => item.str).join(" ");
      fullText += text + "\n";

      /* Update progress */
      const pct = 20 + Math.round((i / maxPages) * 75);
      updatePDFLoader(
        pct,
        "Reading page " + i + " of " + maxPages + "...",
        Math.round((i / maxPages) * 100) +
          "% complete · " +
          fullText.length.toLocaleString() +
          " chars",
      );
      addPageDot(i, maxPages);

      /* Small yield to keep UI responsive */
      if (i % 3 === 0) await new Promise((r) => setTimeout(r, 10));
    }

    fullText = fullText.trim();

    if (!fullText || fullText.length < 30) {
      finishPDFLoader(false, "No text found — try a text-based PDF");
      if (window.showToast)
        showToast("Could not extract text from PDF", "error");
      return;
    }

    textInputEl.value = fullText;
    fileNameEl.textContent = "✅ " + file.name;
    finishPDFLoader(
      true,
      file.name +
        " (" +
        pdf.numPages +
        " pages · " +
        fullText.length.toLocaleString() +
        " chars)",
    );
    if (window.showToast)
      showToast("✅ PDF loaded! Ready to generate quiz.", "success");
  } catch (err) {
    finishPDFLoader(false, "Error: " + err.message);
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
