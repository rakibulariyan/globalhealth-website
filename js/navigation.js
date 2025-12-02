// navigation.js
// Navigation and routing functions with permission checks

// Navigation function with permission checking
window.navigateToSection = function(sectionId) {
    console.log(`========== NAVIGATION ==========`);
    console.log(`📍 Navigating to: ${sectionId}`);
    console.log(`👤 Current user:`, window.currentUser?.email);
    console.log(`🎭 Current role:`, window.currentRole);
    
    // Hide all sections and access denied
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    const accessDeniedSection = document.getElementById('accessDeniedSection');
    if (accessDeniedSection) {
        accessDeniedSection.style.display = 'none';
    }
    
    // Remove active from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Check permission with debug
    if (!checkPermission(sectionId)) {
        console.log(`❌ PERMISSION DENIED for ${sectionId}`);
        // Show access denied page
        showAccessDenied(sectionId);
        
        // Still activate the nav link (user clicked it)
        const navLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
        if (navLink) {
            navLink.classList.add('active');
        }
        return;
    }
    
    console.log(`✅ PERMISSION GRANTED for ${sectionId}`);
    // User has permission - show the section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        
        // Activate nav link
        const navLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
        if (navLink) {
            navLink.classList.add('active');
        }
        
        // Load section data
        loadSectionData(sectionId);
    } else {
        console.error(`Section ${sectionId} not found in HTML`);
        showAccessDenied(sectionId);
    }
};

document.addEventListener('click', function (e) {
    const link = e.target.closest('.nav-link[data-master-tab]');
    if (!link) return;

    const tab = link.dataset.masterTab;

    navigateToSection('master');

    // Activate correct tab
    const tabBtn = document.querySelector(`#masterTabs .nav-link[data-master="${tab}"]`);
    if (tabBtn) tabBtn.click();
});


// Show access denied page
window.showAccessDenied = function(sectionId) {
    console.log(`🛑 Showing access denied for: ${sectionId}`);
    
    // Get the section name for display
    const sectionName = getSectionName(sectionId);
    
    // Get or create access denied section
    let accessDeniedSection = document.getElementById('accessDeniedSection');
    if (!accessDeniedSection) {
        accessDeniedSection = document.createElement('div');
        accessDeniedSection.id = 'accessDeniedSection';
        accessDeniedSection.className = 'section';
        document.querySelector('.content').appendChild(accessDeniedSection);
    }
    
    // Update access denied message
    accessDeniedSection.innerHTML = `
        <div class="access-denied-container">
            <div class="access-denied-content">
                <div class="access-denied-icon">
                    <i class="fas fa-ban"></i>
                </div>
                <h1>Access Denied – Required Permissions Missing</h1>
                <p class="lead"><strong>Attempted to access:</strong> ${sectionName}</p>
                <p>Your account (Role: <strong>${window.currentRole || 'Unknown'}</strong>) does not have the necessary authorization to access this module.</p>
                <p>The system has blocked this action because your current role does not include the required privileges.</p>
                <p><strong>Required Roles:</strong> ${sectionPermissions[sectionId] ? sectionPermissions[sectionId].join(', ') : 'Admin only'}</p>
                <p>If you need access for operational purposes, request a role upgrade or permission change from your administrator.</p>
                <div class="mt-4">
                    <button class="btn btn-primary" onclick="navigateToSection('dashboard')">
                        <i class="fas fa-tachometer-alt me-2"></i>Return to Dashboard
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Show access denied section
    accessDeniedSection.style.display = 'block';
    accessDeniedSection.classList.add('active');
};

// Get human-readable section name
function getSectionName(sectionId) {
    const sectionNames = {
        'dashboard': 'Dashboard Overview',
        'kpis': 'Key Performance Indicators',
        'activity-logs': 'Activity Logs',
        'geo-heatmap': 'Geo Heatmap',
        'search-members': 'Search Members',
        'search-employees': 'Search Employees',
        'search-payments': 'Search Payments',
        'advanced-filters': 'Advanced Filters',
        'geo-smart-search': 'Geo Smart Search',
        'master': 'District Master Data',
        'blocks-master': 'Block Master Data',
        'gps-master': 'GP Master Data',
        'add-employee': 'Add Employee',
        'employee-list': 'Employee List',
        'employee-details': 'Employee Details',
        'salary-slips': 'Salary Slips',
        'health-worker-performance': 'Health Worker Performance',
        'performance-scorecard': 'Performance Scorecard',
        'register-member': 'Register Member',
        'member-list': 'Member List',
        'member-view': 'Member View',
        'member-card': 'Member Card (PDF)',
        'renewal-expiry': 'Renewal & Expiry Management',
        'beneficiary-management': 'Beneficiary Management',
        'payment-list': 'Payment List',
        'pending-payments': 'Pending Payments',
        'price-master': 'Price Master',
        'revenue-breakdown': 'Revenue Breakdown',
        'summary-reports': 'Summary Reports',
        'daily-summary': 'Daily Summary',
        'weekly-summary': 'Weekly Summary',
        'monthly-performance': 'Monthly Performance',
        'user-roles': 'User Roles Management',
        'permission-matrix': 'Permission Matrix',
        'system-logs': 'System Logs',
        'backups': 'Backup Management',
        'financial-audit': 'Financial Audit Logs',
        'data-export-logs': 'Data Export Logs',
        'district-performance-audit': 'District Performance Audit',
        'import-members': 'Import Members (Excel)',
        'import-employees': 'Import Employees (Excel)',
        'import-geo-data': 'Geo Data Import (Excel)',
        'raise-ticket': 'Raise Ticket',
        'tickets-list': 'Tickets List',
        'resolution-history': 'Resolution History',
        'validation': 'Partner Validation',
        'profile': 'My Profile'
    };
    
    return sectionNames[sectionId] || sectionId;
}

// Add to loadSectionData function
case 'district-master':
    if (typeof loadDistricts === 'function') {
        await loadDistricts();
    }
    break;
    
case 'block-master':
    if (typeof loadBlocks === 'function') {
        await loadBlocks();
    }
    if (typeof loadDistrictsForBlocks === 'function') {
        await loadDistrictsForBlocks();
    }
    break;
    
case 'gp-master':
    if (typeof loadGPs === 'function') {
        await loadGPs();
    }
    if (typeof loadBlocksForGPs === 'function') {
        await loadBlocksForGPs();
    }
    if (typeof loadDistrictsForGPs === 'function') {
        await loadDistrictsForGPs();
    }
    break;