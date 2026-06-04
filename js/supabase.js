/* ═══════════════════════════════════════
   QuizForge — supabase.js
   Conexión y funciones de base de datos
═══════════════════════════════════════ */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ── CREDENCIALES ── */
const SUPABASE_URL = "https://mbzrwfrnkqefoodpbesp.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ienJ3ZnJua3FlZm9vZHBiZXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MjU0MDAsImV4cCI6MjA5NjEwMTQwMH0.8kmt2T1wt9IfwAZsEIKsEsH7G7tnW-2HIiGG9FPSOio";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ════════════════════════
   AUTH — Autenticación
════════════════════════ */

/* Registrar nuevo usuario */
window.signUp = async (email, password, name) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
  if (error) throw error;
  return data;
};

/* Iniciar sesión */
window.signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

/* Cerrar sesión */
window.signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/* Obtener usuario actual */
window.getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

/* Recuperar contraseña */
window.resetPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/pages/recuperacion.html`,
  });
  if (error) throw error;
};

/* ════════════════════════
   RESULTS — Historial
════════════════════════ */

/* Guardar resultado de un quiz */
window.saveQuizResult = async ({ mode, total, correct, pct }) => {
  const user = await window.getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase.from("results").insert([
    {
      user_id: user.id,
      mode,
      total,
      correct,
      pct,
      created_at: new Date().toISOString(),
    },
  ]);

  if (error) throw error;
  return data;
};

/* Obtener todos los resultados del usuario */
window.getResults = async () => {
  const user = await window.getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase
    .from("results")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

/* Obtener un resultado por ID */
window.getResultById = async (id) => {
  const { data, error } = await supabase
    .from("results")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

/* ════════════════════════
   SESIÓN ACTIVA
   Redirige si no está logueado
════════════════════════ */
window.requireAuth = async (redirectTo = "/pages/login.html") => {
  const user = await window.getCurrentUser();
  if (!user) window.location.href = redirectTo;
  return user;
};

/* Escucha cambios de sesión (login/logout automático) */
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    // Limpiar cualquier estado local si es necesario
    console.log("Sesión cerrada");
  }
  if (event === "SIGNED_IN") {
    console.log("Sesión iniciada:", session?.user?.email);
  }
});

/* Exponer cliente para uso directo en settings.html */
window._supabase = supabase;

/* ════════════════════════
   MODO INVITADO
   Sobrescribe saveQuizResult para
   que no falle cuando no hay sesión
════════════════════════ */
const _originalSave = window.saveQuizResult;
window.saveQuizResult = async (data) => {
  if (localStorage.getItem("qf_guest_mode") === "true") {
    /* En modo invitado guardar solo en localStorage */
    const key = "qf_guest_results";
    const results = JSON.parse(localStorage.getItem(key) || "[]");
    results.unshift({
      ...data,
      id: Date.now(),
      created_at: new Date().toISOString(),
    });
    localStorage.setItem(key, JSON.stringify(results.slice(0, 20)));
    return;
  }
  return _originalSave(data);
};
