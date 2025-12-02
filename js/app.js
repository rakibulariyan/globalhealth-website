// app.js
// Main application initialization and core functions

// Global variables (accessible across modules)
window.currentUser = null;
window.currentRole = null;

// DOM Elements
const loginSection = document.getElementById('loginSection');
const appSection = document.getElementById('appSection');
const loginForm = document.getElementById('loginForm');

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// app.js - Updated initialization
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

        console.log('Session retrieved:', session);

        if (session && session.user) {
            console.log("✅ Session found:", session.user.email);
            
            // ✅ Get employee details to determine role - FIXED QUERY
            const { data: employee, error: empError } = await supabase
                .from('employees')
                .select('*')
                .eq('email', session.user.email)
                .single();

            console.log('Employee data on init:', employee);
            console.log('Employee error on init:', empError);

            if (empError) {
                console.warn('Employee record fetch warning:', empError);
                // Set default if employee record not found
                if (empError.code === 'PGRST116') {
                    window.currentUser = {
                        id: session.user.id,
                        email: session.user.email,
                        name: session.user.email.split('@')[0],
                        role: 'employee'
                    };
                    window.currentRole = 'employee';
                }
            } else if (employee) {
                // ✅ Set current user and role - CONVERT TO LOWERCASE
                window.currentUser = {
                    id: session.user.id,
                    email: session.user.email,
                    name: employee?.name || session.user.email.split('@')[0],
                    role: employee?.role?.toLowerCase() || 'employee'
                };
                window.currentRole = employee?.role?.toLowerCase() || 'employee';
            }

            console.log('✅ User restored:', window.currentUser);
            console.log('✅ User role:', window.currentRole);
            
            // ✅ Show app with proper UI
            showApp();
            updateUIForRole();
            
            // ✅ Navigate to dashboard (permission will be checked)
            setTimeout(() => {
                navigateToSection('dashboard');
            }, 100);
            
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
                window.currentUser = null;
                window.currentRole = null;
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
    
    // Navigation - Handle ALL nav link clicks
    document.addEventListener('click', function(e) {
        // Check if clicked on nav link or its child
        if (e.target.matches('.nav-link[data-section]') || e.target.closest('.nav-link[data-section]')) {
            e.preventDefault();
            const link = e.target.matches('.nav-link[data-section]') ? e.target : e.target.closest('.nav-link[data-section]');
            const sectionId = link.getAttribute('data-section');
            console.log(`Nav clicked: ${sectionId}`);
            navigateToSection(sectionId);
        }
        
        // Handle sidebar menu toggle clicks
        if (e.target.matches('.has-treeview > .nav-link') || e.target.closest('.has-treeview > .nav-link')) {
            e.preventDefault();
            // Let Bootstrap handle the treeview toggle
            return;
        }
    });

    // Employee management
    document.getElementById('saveEmployeeBtn')?.addEventListener('click', saveEmployee);
    
    // Member management
    document.getElementById('saveMemberBtn')?.addEventListener('click', saveMember);

    // Family member functionality
    setupFamilyMemberHandlers();

    // Member search
    document.getElementById('memberSearch')?.addEventListener('input', searchMembers);
    
    // Forgot password
    document.getElementById('forgotPasswordLink')?.addEventListener('click', showForgotPassword);
    document.getElementById('backToLogin')?.addEventListener('click', showLoginForm);
    document.getElementById('sendResetLink')?.addEventListener('click', sendPasswordReset);
    
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
            if (document.getElementById('addMemberModal')?.classList.contains('show')) {
                resetMemberForm();
            } else if (document.getElementById('addEmployeeModal')?.classList.contains('show')) {
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
    
    // Update member button in edit modal
    document.getElementById('updateMemberBtn')?.addEventListener('click', async () => {
        try {
            const id = document.getElementById('editMemberId').value;

            const updates = {
                name: document.getElementById('editMemberName').value,
                father_name: document.getElementById('editFatherName').value,
                age: parseInt(document.getElementById('editAge').value),
                gender: document.getElementById('editGender').value,
                aadhar_number: document.getElementById('editAadhar').value,
                contact_number: document.getElementById('editContact').value,
                district_id: document.getElementById('editDistrict').value,
                block_id: document.getElementById('editBlock').value,
                gp_id: document.getElementById('editGP').value,
                address: document.getElementById('editAddress').value,
                status: document.getElementById('editStatus').value,
                updated_at: new Date().toISOString()
            };

            // Get district name for display
            if (updates.district_id) {
                const { data: districtData } = await supabase
                    .from('districts')
                    .select('name')
                    .eq('id', updates.district_id)
                    .single();
                
                if (districtData) {
                    updates.district = districtData.name;
                }
            }

            const { error } = await supabase
                .from('members')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            alert('✅ Member updated successfully!');
            $('#editMemberModal').modal('hide');
            loadMembers();
        } catch (err) {
            console.error('Error updating member:', err.message);
            alert('❌ Failed to update member: ' + err.message);
        }
    });
    
    // Profile form submit
    document.getElementById('profileForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        alert('Profile update would be implemented here');
    });
    
    // Change password form submit
    document.getElementById('changePasswordForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        alert('Password change would be implemented here');
    });

    // Update the navigation event listener in app.js
document.addEventListener('click', function(e) {
    // Check if clicked on nav link with data-section
    const navLink = e.target.closest('.nav-link[data-section]');
    
    if (navLink) {
        e.preventDefault();
        const sectionId = navLink.getAttribute('data-section');
        console.log(`Nav clicked: ${sectionId} from element:`, navLink);
        navigateToSection(sectionId);
        return;
    }
    
    // Handle sidebar menu toggle clicks (main menu items without data-section)
    const treeviewLink = e.target.closest('.has-treeview > .nav-link');
    if (treeviewLink) {
        e.preventDefault();
        // Let Bootstrap handle the treeview toggle
        // Don't call navigateToSection
        return;
    }
});
}

// Show main application
function showApp() {
    console.log('Showing application for user:', window.currentUser?.email);
    loginSection.classList.add('hidden');
    appSection.classList.remove('hidden');
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