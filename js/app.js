// app.js
// Main application initialization and core functions

// Global variables
let currentUser = null;
let currentRole = null;

// DOM Elements
const loginSection = document.getElementById('loginSection');
const appSection = document.getElementById('appSection');
const loginForm = document.getElementById('loginForm');

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Application initialization
async function initializeApp() {
    console.log('Initializing app...');
    showLogin();
    setupEventListeners();

    try {
        // ✅ Get current session from Supabase Auth
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Session error:', error);
            showLogin();
            return;
        }

        if (session && session.user) {
            console.log("✅ Session found:", session.user.email);
            
            // ✅ Get employee details to determine role
            const { data: employee, error: empError } = await supabase
                .from('employees')
                .select('*')
                .eq('email', session.user.email)
                .single();

            if (empError && empError.code !== 'PGRST116') {
                console.warn('Employee record fetch warning:', empError);
            }

            // ✅ Set current user and role
            currentUser = {
                id: session.user.id,
                email: session.user.email,
                name: employee?.name || session.user.email.split('@')[0],
                role: employee?.role || 'employee'
            };
            currentRole = employee?.role || 'employee';

            console.log('✅ User restored:', currentUser);
            
            // ✅ Show app with proper UI
            showApp();
            updateUIForRole();
            loadDashboardData();
            
        } else {
            console.log("❌ No active session");
            showLogin();
        }
    } catch (error) {
        console.error('Initialization error:', error);
        showLogin();
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Setup auth state listener
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        switch (event) {
            case 'SIGNED_IN':
                console.log('User signed in');
                break;

            case 'SIGNED_OUT':
                console.log('User signed out');
                currentUser = null;
                currentRole = null;
                showLogin();
                break;

            case 'TOKEN_REFRESHED':
                console.log('Token refreshed');
                break;

            case 'USER_UPDATED':
                console.log('User updated');
                break;
        }
    });

    // Login form
    loginForm.addEventListener('submit', handleLogin);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Navigation
    document.addEventListener('click', function(e) {
        if (e.target.matches('.nav-link[data-section]') || e.target.closest('.nav-link[data-section]')) {
            e.preventDefault();
            const link = e.target.matches('.nav-link[data-section]') ? e.target : e.target.closest('.nav-link[data-section]');
            const sectionId = link.getAttribute('data-section');
            navigateToSection(sectionId);
        }
    });

    // Employee management
    document.getElementById('saveEmployeeBtn').addEventListener('click', saveEmployee);
    
    // Member management
    document.getElementById('saveMemberBtn').addEventListener('click', saveMember);

    // Family member functionality
    setupFamilyMemberHandlers();

    // Member search
    document.getElementById('memberSearch').addEventListener('input', searchMembers);
    
    // Forgot password
    document.getElementById('forgotPasswordLink').addEventListener('click', showForgotPassword);
    document.getElementById('backToLogin').addEventListener('click', showLoginForm);
    document.getElementById('sendResetLink').addEventListener('click', sendPasswordReset);
    
    // Setup cascade dropdowns
    setupCascadeDropdowns();

    // Payment search
    document.getElementById('searchPayments')?.addEventListener('click', loadPayments);
    document.getElementById('resetPayments')?.addEventListener('click', loadPayments);

    // Partner validation
    document.getElementById('validateBtn')?.addEventListener('click', validateMemberCard);

    // Search functionality
    document.getElementById('searchBtn')?.addEventListener('click', advancedSearchMembers);
    document.getElementById('resetSearchBtn')?.addEventListener('click', resetSearch);

    // Reset Form Functionality
    document.getElementById('resetMemberFormBtn')?.addEventListener('click', resetMemberForm);
    document.getElementById('resetEmployeeFormBtn')?.addEventListener('click', resetEmployeeForm);

    // Add keyboard shortcut for reset (Ctrl+R)
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 'r') {
            event.preventDefault();
            if (document.getElementById('addMemberModal').classList.contains('show')) {
                resetMemberForm();
            } else if (document.getElementById('addEmployeeModal').classList.contains('show')) {
                resetEmployeeForm();
            }
        }
    });

    // Change Photo modal
    document.getElementById('changePhotoBtn')?.addEventListener('click', function() {
        $('#changePhotoModal').modal('show');
        console.log('Change Photo modal opened');
    });

    // dashboard data filter by date range
    document.getElementById('dashboardDateFrom')?.addEventListener('change', loadDashboardData);
    document.getElementById('dashboardDateTo')?.addEventListener('change', loadDashboardData);
    document.getElementById('dashboardDistrict')?.addEventListener('change', loadDashboardData);
}

// UI update function
function updateUIForRole() {
    // Update user display
    if (currentUser && currentUser.name) {
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('dropdownUserName').textContent = currentUser.name;
        document.getElementById('dropdownUserEmail').textContent = currentUser.email;
    } else {
        document.getElementById('userName').textContent = 'User';
        document.getElementById('dropdownUserName').textContent = 'User';
        document.getElementById('dropdownUserEmail').textContent = '';
    }

    // Show user role info
    console.log('Current user role:', currentRole);
}

// Show main application
function showApp() {
    console.log('Showing application for user:', currentUser?.email);
    loginSection.classList.add('hidden');
    appSection.classList.remove('hidden');

    // Navigate to dashboard by default
    navigateToSection('dashboard');
}

// Show login page
function showLogin() {
    console.log('Showing login page');
    loginSection.classList.remove('hidden');
    appSection.classList.add('hidden');

    // Reset login form
    document.getElementById('loginForm').reset();
    document.getElementById('forgotPasswordSection').style.display = 'none';

    // Reset any user info displays
    document.getElementById('userName').textContent = 'User';
    document.getElementById('dropdownUserName').textContent = 'User';
    document.getElementById('dropdownUserEmail').textContent = '';
}

// Simple search function (can be moved to members.js)
window.searchMembers = function() {
    const searchTerm = document.getElementById('memberSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#membersTable tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
};