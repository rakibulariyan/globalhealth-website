import { ROLES } from "./roles.js";

// Base permission checker (use everywhere in app)
export function canAccess(permission, userRole) {
    return PERMISSIONS[permission]?.includes(userRole);
}

// Show Access Denied Message
export function showAccessDenied() {
    const appContent = document.getElementById("mainContent");
    appContent.innerHTML = `
        <div class="access-denied">
            <h2>Access Denied</h2>
            <p>You do not have permission to view this section.</p>
            <p>Please contact the administrator.</p>
        </div>
    `;
}

// // MASTER DATA & RBAC
export const PERMISSIONS = {
    // MASTER DATA — DISTRICT LEVEL (Your RBAC Part 1)
    VIEW_DISTRICTS:   [ROLES.ADMIN, ROLES.DISTRICT, ROLES.BLOCK, ROLES.HEALTH],
    CREATE_DISTRICT:  [ROLES.ADMIN],
    EDIT_DISTRICT:    [ROLES.ADMIN, ROLES.DISTRICT],
    DELETE_DISTRICT:  [ROLES.ADMIN],

    // MASTER DATA — BLOCK LEVEL
    VIEW_BLOCKS:      [ROLES.ADMIN, ROLES.DISTRICT, ROLES.BLOCK, ROLES.HEALTH],
    CREATE_BLOCK:     [ROLES.ADMIN, ROLES.DISTRICT],
    EDIT_BLOCK:       [ROLES.ADMIN, ROLES.DISTRICT, ROLES.BLOCK],
    DELETE_BLOCK:     [ROLES.ADMIN],

    // MASTER DATA — GP LEVEL
    VIEW_GPS:        [ROLES.ADMIN, ROLES.DISTRICT, ROLES.BLOCK, ROLES.HEALTH],
    CREATE_GP:       [ROLES.ADMIN, ROLES.DISTRICT, ROLES.BLOCK],
    EDIT_GP:         [ROLES.ADMIN, ROLES.DISTRICT, ROLES.BLOCK, ROLES.HEALTH],
    DELETE_GP:       [ROLES.ADMIN],

    // EMPLOYEE MANAGEMENT
    VIEW_EMPLOYEES:   [ROLES.ADMIN, ROLES.DISTRICT, ROLES.BLOCK],
    ADD_EMPLOYEE:     [ROLES.ADMIN, ROLES.DISTRICT, ROLES.BLOCK],
    EDIT_EMPLOYEE:    [ROLES.ADMIN, ROLES.DISTRICT, ROLES.BLOCK],
    DELETE_EMPLOYEE:  [ROLES.ADMIN],

    // MEMBER MANAGEMENT
    VIEW_MEMBERS:     [ROLES.ADMIN, ROLES.DISTRICT, ROLES.BLOCK, ROLES.HEALTH],
    REGISTER_MEMBER:  [ROLES.ADMIN, ROLES.DISTRICT, ROLES.BLOCK, ROLES.HEALTH],
    EDIT_MEMBER:      [ROLES.ADMIN, ROLES.DISTRICT, ROLES.BLOCK, ROLES.HEALTH],
    DELETE_MEMBER:    [ROLES.ADMIN],
    GENERATE_CARD:    [ROLES.ADMIN, ROLES.DISTRICT, ROLES.BLOCK, ROLES.HEALTH],

    // PAYMENTS
    VIEW_PAYMENTS:    [ROLES.ADMIN, ROLES.DISTRICT, ROLES.BLOCK, ROLES.HEALTH],
    RECORD_PAYMENT:   [ROLES.ADMIN, ROLES.DISTRICT, ROLES.BLOCK, ROLES.HEALTH],

    // REPORTS
    VIEW_DASHBOARD:        [ROLES.ADMIN, ROLES.DISTRICT, ROLES.BLOCK, ROLES.HEALTH],
    DISTRICT_REPORTS:      [ROLES.ADMIN, ROLES.DISTRICT],
    BLOCK_REPORTS:         [ROLES.ADMIN, ROLES.DISTRICT, ROLES.BLOCK],
    GP_REPORTS:            [ROLES.ADMIN, ROLES.DISTRICT, ROLES.BLOCK, ROLES.HEALTH],
    EMPLOYEE_CARD_COUNT:   [ROLES.ADMIN, ROLES.DISTRICT, ROLES.BLOCK],

    // USER MANAGEMENT
    MANAGE_USERS: [ROLES.ADMIN]
};

// Check access and show denied message if no access
export function checkAccess(permission, userRole) {
    if (!canAccess(permission, userRole)) {
        showAccessDenied();
        return false;
    }
    return true;
}