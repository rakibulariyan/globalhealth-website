// assets/js/app.js
import { handleLogin, handleLogout } from "./modules/auth.js";
import { checkAccess, showAccessDenied } from "./core/permissions.js";
import { getRole } from "./core/session.js";
import { showLogin, showApp } from "./core/router.js";

console.log("=== GLOBAL HEALTH APP LOADED ===");


// ---- Small helper: map sidebar data-section -> PERMISSION key ----
function sectionToPermissionKey(section) {
  const map = {
    dashboard: "VIEW_DASHBOARD",
    districts: "VIEW_DISTRICTS",
    blocks: "VIEW_BLOCKS",
    gps: "VIEW_GPS",
    members: "VIEW_MEMBERS",
    employees: "VIEW_EMPLOYEES",
    payments: "VIEW_PAYMENTS",
    reports: "VIEW_DASHBOARD",
    users: "MANAGE_USERS"
  };
  return map[section] || "VIEW_DASHBOARD";
}

// ---- Placeholder loader - replace later with real module loaders ----
function loadSection(section) {
  // Minimal safe behavior: show app container and log action
  showApp();
  console.log("Loading section:", section);
  // TODO: call actual loader when module is extracted, e.g.:
  // if (section === 'dashboard') import('./modules/dashboard.js').then(m=>m.loadDashboard());
}

// ---- Attach menu click handlers with RBAC guard ----
function attachMenuGuards() {
  document.querySelectorAll("[data-section]").forEach(el => {
    el.addEventListener("click", (ev) => {
      ev.preventDefault();
      const section = el.dataset.section;
      const role = getRole();
      const permission = sectionToPermissionKey(section);

      if (!checkAccess(permission, role)) {
        showAccessDenied();
        return;
      }

      loadSection(section);
    });
  });
}

// ---- Wire DOM event listeners (login/logout) ----
function setupEventListeners() {
  const loginForm = document.getElementById("loginForm");
  const logoutBtn = document.getElementById("logoutBtn");

  // Use a small wrapper so auth module stays responsible for auth logic
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      await handleLogin(e);
    });
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await handleLogout();
      showLogin();
    });
  }
}


// ---- Initialize application (safe, idempotent) ----
function initializeApp() {
  // Always attach listeners and menu guards (safe even if DOM nodes are missing)
  setupEventListeners();
  attachMenuGuards();

  // Default: show login screen (auth module or supabase-config may restore session)
  showLogin();
}

document.addEventListener("DOMContentLoaded", initializeApp);
