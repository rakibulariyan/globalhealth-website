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