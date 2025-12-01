// Authentication functions

// WORKING LOGIN FUNCTION - Uses Supabase Auth
async function handleLogin(e) {
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

        // Now get employee details from database
        const { data: employee, error: empError } = await supabase
            .from('employees')
            .select('*')
            .eq('email', email)
            .single();

        if (empError && empError.code !== 'PGRST116') { // PGRST116 can be "No rows" — still okay
            console.warn('Warning fetching employee record:', empError);
        }

        // --- SET USER SESSION (important for RLS) ---
        currentUser = {
            id: data.user.id,
            email: data.user.email,
            name: employee?.name || 'User',
            role: employee?.role || 'employee'
        };
        currentRole = employee?.role || 'employee';

        console.log('Login successful:', currentUser);

        // Update UI and show app
        updateUIForRole();
        showApp();
        loadDashboardData();

    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed: ' + (error.message || JSON.stringify(error)));

        // Helpful hint for common scenario
        if (error && error.message && error.message.toLowerCase().includes('invalid')) {
            alert('Please make sure:\n1. User exists in Supabase Authentication\n2. Email and password are correct\n3. User is confirmed (not just invited)');
        }
    }
}

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