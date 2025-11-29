// assets/js/core/router.js

// These must match the IDs in index.html
const loginSection = document.getElementById("loginSection");
const appSection = document.getElementById("appSection");

// Show the login page
export function showLogin() {
    if (!loginSection || !appSection) {
        console.warn("showLogin() called but required DOM elements missing");
        return;
    }

    loginSection.classList.remove("hidden");
    appSection.classList.add("hidden");

    // Reset login form if it exists
    const f = document.getElementById("loginForm");
    if (f) f.reset();
}

// Show the application (after successful login)
export function showApp() {
    if (!loginSection || !appSection) {
        console.warn("showApp() called but required DOM elements missing");
        return;
    }

    loginSection.classList.add("hidden");
    appSection.classList.remove("hidden");
}

console.log("router.js loaded: showLogin/showApp available");
