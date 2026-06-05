/* ═══════════════════════════════════════
   QuizForge — supabase.js
   Database connection + all functions
   Supabase Project: QuizForge
═══════════════════════════════════════ */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ── CREDENTIALS ── */
const SUPABASE_URL = "https://mbzrwfrnkqefoodpbesp.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ienJ3ZnJua3FlZm9vZHBiZXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MjU0MDAsImV4cCI6MjA5NjEwMTQwMH0.8kmt2T1wt9IfwAZsEIKsEsH7G7tnW-2HIiGG9FPSOio";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* Expose client globally for settings.html */
window._supabase = supabase;

/* ════════════════════════
   AUTH
════════════════════════ */

/* Register new user */
window.signUp = async (email, password, name) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
  if (error) throw error;

  /* Give welcome diamonds on register */
  if (typeof Diamonds !== "undefined") {
    Diamonds.initNewUser();
  }

  return data;
};

/* Sign in */
window.signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

/* Sign out */
window.signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/* Get current user */
window.getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

/* Reset password */
window.resetPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/pages/recuperacion.html`,
  });
  if (error) throw error;
};

/* ════════════════════════
   RESULTS — Quiz history
════════════════════════ */

/* Save quiz result */
window.saveQuizResult = async ({ mode, total, correct, pct }) => {
  /* Guest mode — save to localStorage only */
  if (localStorage.getItem("qf_guest_mode") === "true") {
    const key = "qf_guest_results";
    const results = JSON.parse(localStorage.getItem(key) || "[]");
    results.unshift({
      id: Date.now(),
      mode,
      total,
      correct,
      pct,
      created_at: new Date().toISOString(),
    });
    localStorage.setItem(key, JSON.stringify(results.slice(0, 20)));
    return;
  }

  const user = await window.getCurrentUser();
  if (!user) throw new Error("Not authenticated");

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

/* Get all results for current user */
window.getResults = async () => {
  /* Guest mode */
  if (localStorage.getItem("qf_guest_mode") === "true") {
    return JSON.parse(localStorage.getItem("qf_guest_results") || "[]");
  }

  const user = await window.getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("results")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

/* Get single result by ID */
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
   PROFILE — User data
════════════════════════ */

/* Save profile to Supabase (profiles table) */
window.saveProfile = async (profileData) => {
  const user = await window.getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: profileData.name + " " + (profileData.lastname || ""),
    username: profileData.username,
    bio: profileData.bio,
    country: profileData.country,
    school: profileData.school,
    github: profileData.github,
    linkedin: profileData.linkedin,
    twitter: profileData.twitter,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
  return data;
};

/* Get profile from Supabase */
window.getProfile = async () => {
  const user = await window.getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
};

/* ════════════════════════
   AUTH STATE LISTENER
════════════════════════ */
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN") {
    console.log("✅ Signed in:", session?.user?.email);
    /* Update nav if diamond balance exists */
    if (typeof Diamonds !== "undefined") {
      const data = Diamonds.getData();
      if (!data) Diamonds.initNewUser();
    }
  }
  if (event === "SIGNED_OUT") {
    console.log("👋 Signed out");
  }
  if (event === "PASSWORD_RECOVERY") {
    console.log("🔑 Password recovery");
  }
});

/* ════════════════════════
   REQUIRE AUTH HELPER
════════════════════════ */
window.requireAuth = async (redirectTo = "/pages/login.html") => {
  const user = await window.getCurrentUser();
  if (!user) window.location.href = redirectTo;
  return user;
};
