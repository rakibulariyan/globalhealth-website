// permissions.js - Role-based permissions and access control

// Define section permissions for different roles
const sectionPermissions = {
    // Dashboard and basic sections - accessible to all logged-in users
    'dashboard': ['admin', 'coordinator', 'health_worker', 'accountant', 'employee'],
    'kpis': ['admin', 'coordinator'],
    'activity-logs': ['admin'],
    'geo-heatmap': ['admin', 'coordinator'],
    
    // Search sections
    'search-members': ['admin', 'coordinator', 'health_worker', 'employee'],
    'search-employees': ['admin', 'coordinator'],
    'search-payments': ['admin', 'coordinator', 'accountant'],
    'advanced-filters': ['admin', 'coordinator'],
    'geo-smart-search': ['admin', 'coordinator'],
    
    // Master Data sections
    'master': ['admin', 'coordinator'],
    'blocks-master': ['admin', 'coordinator'],
    'gps-master': ['admin', 'coordinator'],
    
    // Employee sections
    'add-employee': ['admin'],
    'employee-list': ['admin', 'coordinator'],
    'employee-details': ['admin', 'coordinator'],
    'salary-slips': ['admin', 'coordinator'],
    'health-worker-performance': ['admin', 'coordinator'],
    'performance-scorecard': ['admin', 'coordinator'],
    
    // Member sections
    'register-member': ['admin', 'coordinator', 'health_worker'],
    'member-list': ['admin', 'coordinator', 'health_worker', 'employee'],
    'member-view': ['admin', 'coordinator', 'health_worker', 'employee'],
    'member-card': ['admin', 'coordinator', 'health_worker', 'employee'],
    'renewal-expiry': ['admin', 'coordinator', 'health_worker'],
    'beneficiary-management': ['admin', 'coordinator', 'health_worker'],
    
    // Payment sections
    'payment-list': ['admin', 'coordinator', 'accountant'],
    'pending-payments': ['admin', 'coordinator', 'accountant'],
    'price-master': ['admin', 'coordinator'],
    'revenue-breakdown': ['admin', 'coordinator'],
    
    // Reports sections
    'summary-reports': ['admin', 'coordinator', 'accountant'],
    'daily-summary': ['admin', 'coordinator', 'accountant'],
    'weekly-summary': ['admin', 'coordinator', 'accountant'],
    'monthly-performance': ['admin', 'coordinator', 'accountant'],
    
    // Admin Tools sections
    'user-roles': ['admin'],
    'permission-matrix': ['admin'],
    'system-logs': ['admin'],
    'backups': ['admin'],
    
    // Audit & Compliance
    'financial-audit': ['admin', 'coordinator'],
    'data-export-logs': ['admin', 'coordinator'],
    'district-performance-audit': ['admin', 'coordinator'],
    
    // Data Import
    'import-members': ['admin', 'coordinator'],
    'import-employees': ['admin', 'coordinator'],
    'import-geo-data': ['admin', 'coordinator'],
    
    // Ticket System
    'raise-ticket': ['admin', 'coordinator', 'health_worker', 'accountant', 'employee'],
    'tickets-list': ['admin', 'coordinator'],
    'resolution-history': ['admin', 'coordinator'],
    
    // Partner Validation
    'validation': ['admin', 'coordinator', 'health_worker', 'employee'],
    
    // Profile - accessible to all logged-in users
    'profile': ['admin', 'coordinator', 'health_worker', 'accountant', 'employee']
};

// Check if user has permission for a section
window.checkPermission = function(sectionId) {
    console.log(`🔐 Checking permission for ${sectionId}`);
    console.log(`👤 Current user:`, window.currentUser);
    console.log(`🎭 Current role:`, window.currentRole);
    
    // If no user or role, deny access (shouldn't happen as user is logged in)
    if (!window.currentUser || !window.currentRole) {
        console.log('❌ No user or role found');
        return false;
    }

    // Admin has access to everything
    if (window.currentRole === 'admin') {
        console.log('✅ Admin access granted');
        return true;
    }

    // Check if section exists in permissions
    if (sectionPermissions[sectionId]) {
        const hasAccess = sectionPermissions[sectionId].includes(window.currentRole);
        console.log(`📋 Section requires: ${sectionPermissions[sectionId].join(', ')}`);
        console.log(`🔍 User has role: ${window.currentRole}`);
        console.log(`🎯 Access ${hasAccess ? '✅ GRANTED' : '❌ DENIED'}`);
        return hasAccess;
    }

    console.log(`⚠️ Section ${sectionId} not found in permissions`);
    // Default: deny access for unknown sections
    return false;
};

// Get permission description for current section
window.getPermissionDescription = function(sectionId) {
    if (checkPermission(sectionId)) {
        return "You have access to this section.";
    } else {
        const roles = sectionPermissions[sectionId] || [];
        return `Required roles: ${roles.join(', ')}`;
    }
};

// UI update function - NO MORE HIDING MENU ITEMS
window.updateUIForRole = function() {
    console.log('Updating UI for role:', window.currentRole);
    
    // Update user display only
    if (window.currentUser && window.currentUser.name) {
        const userNameElement = document.getElementById('userName');
        const dropdownUserName = document.getElementById('dropdownUserName');
        const dropdownUserEmail = document.getElementById('dropdownUserEmail');
        
        if (userNameElement) userNameElement.textContent = window.currentUser.name;
        if (dropdownUserName) dropdownUserName.textContent = window.currentUser.name;
        if (dropdownUserEmail) dropdownUserEmail.textContent = window.currentUser.email;
    } else {
        const userNameElement = document.getElementById('userName');
        const dropdownUserName = document.getElementById('dropdownUserName');
        
        if (userNameElement) userNameElement.textContent = 'User';
        if (dropdownUserName) dropdownUserName.textContent = 'User';
    }
    
    console.log('✅ UI updated for role:', window.currentRole);
};