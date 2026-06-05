/* ═══════════════════════════════════════
   QuizForge — api.js
   Integración con Groq API
   Modelo: llama-3.3-70b-versatile
═══════════════════════════════════════ */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_KEY = "YOUR_GROQ_API_KEY_HERE";

/* ── Obtener API key ── */
function getApiKey() {
  return window.__GROQ_KEY__ || GROQ_KEY;
}

/* ════════════════════════
   PROMPTS por modo
════════════════════════ */

function buildPrompt(text, mode, numQ, difficulty, language) {
  const base = `Eres un experto en pedagogía y diseño de evaluaciones educativas.
Tu tarea es generar preguntas de estudio a partir del siguiente texto.

TEXTO:
"""
${text}
"""

INSTRUCCIONES:
- Genera exactamente ${numQ} preguntas
- Dificultad: ${difficulty}
- Idioma de las preguntas: ${language}
- Basa todas las preguntas ÚNICAMENTE en el texto proporcionado
- Varía los tipos de preguntas (conceptos, aplicación, análisis)
- NO incluyas preguntas triviales o demasiado obvias
- Responde ÚNICAMENTE con el JSON válido, sin texto adicional, sin markdown, sin backticks`;

  if (mode === "multiple") {
    return `${base}

FORMATO DE RESPUESTA (JSON estricto):
{
  "questions": [
    {
      "question": "texto de la pregunta",
      "options": ["opción A", "opción B", "opción C", "opción D"],
      "correct": 2,
      "explanation": "breve explicación de por qué es correcta"
    }
  ]
}

REGLAS:
- Cada pregunta tiene exactamente 4 opciones (A, B, C, D)
- Solo una opción es correcta
- Las opciones incorrectas deben ser plausibles, no obviamente falsas
- El campo "correct" es el índice (0-3) de la opción correcta
- El campo "explanation" es una sola oración`;
  }

  if (mode === "truefalse") {
    return `${base}

RESPONSE FORMAT (strict JSON):
{
  "questions": [
    {
      "question": "a clear statement to evaluate as true or false",
      "options": ["True", "False"],
      "correct": 0,
      "explanation": "brief explanation of why it is true or false"
    }
  ]
}

RULES:
- Each question is a statement that is either true or false
- correct = 0 means True, correct = 1 means False
- Mix true and false statements evenly
- Make statements clear and unambiguous`;
  }

  if (mode === "flashcard") {
    return `${base}

FORMATO DE RESPUESTA (JSON estricto):
{
  "questions": [
    {
      "question": "término o concepto clave",
      "answer": "definición o explicación concisa"
    }
  ]
}

REGLAS:
- El campo "question" debe ser un término o pregunta corta (máx 10 palabras)
- El campo "answer" debe ser la definición o explicación (máx 2 oraciones)
- Cubre los conceptos más importantes del texto`;
  }
}

/* ════════════════════════
   FUNCIÓN PRINCIPAL
════════════════════════ */

window.generateQuestions = async function (
  text,
  mode,
  numQ,
  difficulty,
  language,
) {
  const apiKey = getApiKey();
  const prompt = buildPrompt(text, mode, numQ, difficulty, language);

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 4000,
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente educativo experto. Responde SIEMPRE con JSON válido y nada más.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    console.error("Error Groq API:", err);
    throw new Error(err.error?.message || "Error al conectar con Groq");
  }

  const data = await response.json();

  /* Extraer texto de la respuesta */
  const rawText = data.choices?.[0]?.message?.content || "";

  /* Limpiar posibles backticks o markdown */
  const cleaned = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  /* Parsear JSON */
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error("Error al parsear JSON:", cleaned);
    throw new Error("La IA devolvió un formato inesperado. Intenta de nuevo.");
  }

  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    throw new Error("No se encontraron preguntas en la respuesta.");
  }

  return parsed.questions;
};
