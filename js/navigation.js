// navigation.js
// Navigation and routing functions

// Navigation function with permission checking
function navigateToSection(sectionId) {
    // Check permission
    if (!hasPermission(sectionId)) {
        showAccessDenied();
        return;
    }
    
    // Hide access denied section
    document.getElementById('accessDeniedSection').style.display = 'none';
    document.getElementById('accessDeniedSection').classList.remove('active');
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Remove active from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('active');
    }
    
    // Activate nav link
    const navLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
    if (navLink) {
        navLink.classList.add('active');
    }
    
    // Load section data
    loadSectionData(sectionId);
}

// Load data for specific section
async function loadSectionData(sectionId) {
    // Only load data if user has permission
    if (!hasPermission(sectionId)) {
        return;
    }

    switch(sectionId) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'employee-list':
            await loadEmployees();
            break;
        case 'member-list':
            await loadMembers();
            break;
        case 'payment-list':
            await loadPayments();
            break;
        case 'validation':
            await loadValidation();
            break;
        // Add more cases as needed
        default:
            console.log(`Loading data for ${sectionId}`);
    }
}