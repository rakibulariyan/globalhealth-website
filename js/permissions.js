// Permission mapping and access control functions

// Permission mapping for sections
const sectionPermissions = {
    // Dashboard sections - available to all
    'dashboard': ['admin', 'coordinator', 'health_worker', 'accountant', 'employee'],
    'kpis': ['admin', 'coordinator', 'health_worker', 'accountant', 'employee'],
    'activity-logs': ['admin', 'coordinator', 'health_worker', 'accountant', 'employee'],
    'geo-heatmap': ['admin', 'coordinator', 'health_worker', 'accountant', 'employee'],
    
    // Search sections - available to all
    'search-members': ['admin', 'coordinator', 'health_worker', 'accountant', 'employee'],
    'search-employees': ['admin', 'coordinator', 'health_worker', 'accountant', 'employee'],
    'search-payments': ['admin', 'coordinator', 'health_worker', 'accountant', 'employee'],
    'advanced-filters': ['admin', 'coordinator', 'health_worker', 'accountant', 'employee'],
    'geo-smart-search': ['admin', 'coordinator', 'health_worker', 'accountant', 'employee'],
    
    // Master Data - Admin only
    'districts-master': ['admin'],
    'blocks-master': ['admin'],
    'gps-master': ['admin'],
    
    // Employee Master - Admin only
    'add-employee': ['admin'],
    'employee-list': ['admin'],
    'employee-details': ['admin'],
    'salary-slips': ['admin'],
    'health-worker-performance': ['admin'],
    'performance-scorecard': ['admin'],
    
    // Members - Admin, Coordinator, Health Worker
    'register-member': ['admin', 'coordinator', 'health_worker'],
    'member-list': ['admin', 'coordinator', 'health_worker'],
    'member-view': ['admin', 'coordinator', 'health_worker'],
    'member-card': ['admin', 'coordinator', 'health_worker'],
    'renewal-expiry': ['admin', 'coordinator', 'health_worker'],
    'beneficiary-management': ['admin', 'coordinator', 'health_worker'],
    
    // Payments - Admin and Accountant
    'payment-list': ['admin', 'accountant'],
    'pending-payments': ['admin', 'accountant'],
    'price-master': ['admin', 'accountant'],
    'revenue-breakdown': ['admin', 'accountant'],
    
    // Reports - Admin and Coordinator
    'summary-reports': ['admin', 'coordinator'],
    'daily-summary': ['admin', 'coordinator'],
    'weekly-summary': ['admin', 'coordinator'],
    'monthly-performance': ['admin', 'coordinator'],
    
    // Admin Tools - Admin only
    'user-roles': ['admin'],
    'permission-matrix': ['admin'],
    'system-logs': ['admin'],
    'backups': ['admin'],
    
    // Audit - Admin only
    'financial-audit': ['admin'],
    'data-export-logs': ['admin'],
    'district-performance-audit': ['admin'],
    
    // Data Import - Admin only
    'import-members': ['admin'],
    'import-employees': ['admin'],
    'import-geo-data': ['admin'],
    
    // Ticket System - Available to all
    'raise-ticket': ['admin', 'coordinator', 'health_worker', 'accountant', 'employee'],
    'tickets-list': ['admin', 'coordinator', 'health_worker', 'accountant', 'employee'],
    'resolution-history': ['admin', 'coordinator', 'health_worker', 'accountant', 'employee'],
    
    // Partner Validation - Available to all
    'validation': ['admin', 'coordinator', 'health_worker', 'accountant', 'employee'],
    
    // Profile - Available to all
    'profile': ['admin', 'coordinator', 'health_worker', 'accountant', 'employee']
};

// Check if user has permission for a section
function hasPermission(sectionId) {
    // If no permissions defined for section, allow access
    if (!sectionPermissions[sectionId]) return true;
    
    // Check if current role has permission
    return sectionPermissions[sectionId].includes(currentRole);
}

// Show access denied message
function showAccessDenied() {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Show access denied section
    document.getElementById('accessDeniedSection').style.display = 'block';
    document.getElementById('accessDeniedSection').classList.add('active');
}