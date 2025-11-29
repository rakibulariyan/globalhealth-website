export let currentUser = null;
export let currentRole = null;

export function setSession(user, role) {
    currentUser = user;
    currentRole = role;
}

export function getUser() {
    return currentUser;
}

export function getRole() {
    return currentRole;
}


// Update menu/UI based on current role
export function updateUIForRole() {
    const role = currentRole;

    if (!role) {
        console.warn("updateUIForRole() called but no role set");
        return;
    }

    console.log("Updating UI for role:", role);

    // Example: show all menu items (your requirement)
    // If you want to HIDE items later, add logic here.
    
    // For now: no hiding. Everything remains visible.
}
console.log("updateUIForRole() available in session.js");
