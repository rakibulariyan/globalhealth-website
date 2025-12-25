// auth.js - Updated login function
window.handleLogin = async function(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }

    try {
        console.log('Attempting Supabase Auth login for:', email);

        // Use Supabase Authentication
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error('Supabase Auth error:', error);
            throw error;
        }

        if (!data || !data.user) {
            throw new Error('No user found after authentication');
        }

        console.log('Supabase Auth successful:', data.user);

        // Get employee details from database - FIXED QUERY
        const { data: employee, error: empError } = await supabase
            .from('employees')
            .select('*')
            .eq('email', email)
            .single();

        console.log('Employee data retrieved:', employee);

        if (empError) {
            console.error('Error fetching employee record:', empError);
            // Even if employee record not found, allow login with default role
            if (empError.code === 'PGRST116') {
                // No employee record found - set default
                window.currentUser = {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.email.split('@')[0],
                    role: 'employee'  // Default role
                };
                window.currentRole = 'employee';
            } else {
                throw empError;
            }
        } else {
            // Employee record found - use database role
            window.currentUser = {
                id: data.user.id,
                email: data.user.email,
                name: employee?.name || data.user.email.split('@')[0],
                role: employee?.role?.toLowerCase() || 'employee'  // Convert to lowercase
            };
            window.currentRole = employee?.role?.toLowerCase() || 'employee';
        }

        console.log('Login successful:', window.currentUser);
        console.log('Current role set to:', window.currentRole);

        // Update UI and show app
        updateUIForRole();
        showApp();
        loadDashboardData();

    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed: ' + (error.message || JSON.stringify(error)));
        
    }
};

// Logout function
async function handleLogout() {
    try {
        console.log('Logging out...');
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        currentUser = null;
        currentRole = null;
        showLogin();
        console.log('👋 Logged out successfully');
    } catch (error) {
        console.error('Error during logout:', error);
        alert('Error during logout: ' + error.message);
    }
}

// Forgot password functionality
function showForgotPassword(e) {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('forgotPasswordSection').style.display = 'block';
}

function showLoginForm(e) {
    e.preventDefault();
    document.getElementById('forgotPasswordSection').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

async function sendPasswordReset() {
    const email = document.getElementById('resetEmail').value;
    
    if (!email) {
        alert('Please enter your email address');
        return;
    }
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        
        alert('Password reset link sent to your email');
        showLoginForm();
    } catch (error) {
        console.error('Error sending reset:', error);
        alert('Error sending reset link: ' + error.message);
    }
}