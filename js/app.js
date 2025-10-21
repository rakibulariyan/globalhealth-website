console.log('=== GLOBAL HEALTH APP LOADED ===');

// Current user and role
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
    
    // Check if user is already logged in
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        await loadUserRole();
        showApp();
    } else {
        showLogin();
    }
    
    setupEventListeners();
}

// Setup all event listeners
function setupEventListeners() {
    // Login form
    loginForm.addEventListener('submit', handleLogin);
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Navigation
    document.addEventListener('click', function(e) {
        if (e.target.matches('.nav-link[data-section]') || e.target.closest('.nav-link[data-section]')) {
            e.preventDefault();
            const link = e.target.matches('.nav-link[data-section]') ? e.target : e.target.closest('.nav-link[data-section]');
            navigateToSection(link.getAttribute('data-section'));
        }
    });
    
    // Employee management
    document.getElementById('saveEmployeeBtn').addEventListener('click', saveEmployee);
    
    // Member management
    document.getElementById('saveMemberBtn').addEventListener('click', saveMember);
    document.getElementById('memberSearch').addEventListener('input', searchMembers);
    
    // Payments
    document.getElementById('searchPayments').addEventListener('click', loadPayments);
    document.getElementById('resetPayments').addEventListener('click', resetPaymentSearch);
    
    // Validation
    document.getElementById('validateBtn').addEventListener('click', validateMemberCard);
    
    // Search
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('resetSearchBtn').addEventListener('click', resetSearch);
    
    // Profile
    document.getElementById('profileForm').addEventListener('submit', updateProfile);
    document.getElementById('changePasswordForm').addEventListener('submit', changePassword);
    
    // Dashboard filters
    document.getElementById('dashboardDistrict').addEventListener('change', loadDashboardData);
    document.getElementById('dashboardDateFrom').addEventListener('change', loadDashboardData);
    document.getElementById('dashboardDateTo').addEventListener('change', loadDashboardData);
    
    // Forgot password
    document.getElementById('forgotPasswordLink').addEventListener('click', showForgotPassword);
    document.getElementById('backToLogin').addEventListener('click', showLoginForm);
    document.getElementById('sendResetLink').addEventListener('click', sendPasswordReset);
    
    // Change photo
    document.getElementById('changePhotoBtn').addEventListener('click', showChangePhotoModal);
    document.getElementById('savePhotoBtn').addEventListener('click', saveUserPhoto);
    document.getElementById('userPhotoUpload').addEventListener('change', previewUserPhoto);
}

// Updated login handler with proper Supabase auth
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        // First try to sign in with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (authError) {
            // If auth fails, check if it's a database user
            const { data: employee, error: empError } = await supabase
                .from('employees')
                .select('*')
                .eq('email', email)
                .eq('password', password)
                .single();
                
            if (empError || !employee) {
                throw new Error('Invalid login credentials');
            }
            
            // Create auth session for database user
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: email,
                password: password,
            });
            
            if (signUpError) throw signUpError;
            
            currentUser = { email: email };
        } else {
            currentUser = authData.user;
        }
        
        await loadUserRole();
        showApp();
        
    } catch (error) {
        alert('Login failed: ' + error.message);
        console.error('Login error:', error);
    }
}

// Load user role from database
async function loadUserRole() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            const { data: employee, error } = await supabase
                .from('employees')
                .select('role, name')
                .eq('email', user.email)
                .single();
                
            if (employee) {
                currentRole = employee.role;
                document.getElementById('userName').textContent = employee.name;
                document.getElementById('dropdownUserName').textContent = employee.name;
                document.getElementById('dropdownUserEmail').textContent = user.email;
            } else {
                currentRole = 'employee';
            }
        }
    } catch (error) {
        console.error('Error loading user role:', error);
        currentRole = 'employee';
    }
    
    updateUIForRole();
}

// Update UI based on user role
function updateUIForRole() {
    // Show/hide admin sections
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = (currentRole === 'admin') ? 'block' : 'none';
    });
    
    // Show/hide employee-admin sections
    document.querySelectorAll('.employee-admin').forEach(el => {
        el.style.display = (currentRole === 'admin' || currentRole === 'coordinator' || currentRole === 'health_worker') ? 'block' : 'none';
    });
    
    // Show/hide accountant sections
    document.querySelectorAll('.accountant-only').forEach(el => {
        el.style.display = (currentRole === 'admin' || currentRole === 'accountant') ? 'block' : 'none';
    });
}

// Show main application
function showApp() {
    loginSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    loadDashboardData();
}

// Show login page
function showLogin() {
    loginSection.classList.remove('hidden');
    appSection.classList.add('hidden');
}

// Navigation
function navigateToSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Activate nav link
    document.querySelector(`.nav-link[data-section="${sectionId}"]`).classList.add('active');
    
    // Load section data
    loadSectionData(sectionId);
}

// Load data for specific section
async function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'employees':
            await loadEmployees();
            break;
        case 'members':
            await loadMembers();
            break;
        case 'payments':
            await loadPayments();
            break;
        case 'reports':
            await loadReports();
            break;
        case 'profile':
            await loadProfile();
            break;
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Get filter values
        const district = document.getElementById('dashboardDistrict').value;
        const dateFrom = document.getElementById('dashboardDateFrom').value;
        const dateTo = document.getElementById('dashboardDateTo').value;
        
        // Build query for members
        let membersQuery = supabase.from('members').select('*');
        if (district !== 'all') {
            membersQuery = membersQuery.eq('district', district);
        }
        
        const { data: members, error: membersError } = await membersQuery;
        if (membersError) throw membersError;
        
        // Build query for payments
        let paymentsQuery = supabase.from('payments').select('*');
        if (district !== 'all') {
            paymentsQuery = paymentsQuery.eq('district', district);
        }
        if (dateFrom) {
            paymentsQuery = paymentsQuery.gte('payment_date', dateFrom);
        }
        if (dateTo) {
            paymentsQuery = paymentsQuery.lte('payment_date', dateTo);
        }
        
        const { data: payments, error: paymentsError } = await paymentsQuery;
        if (paymentsError) throw paymentsError;
        
        // Build query for employees
        const { data: employees, error: employeesError } = await supabase.from('employees').select('*');
        if (employeesError) throw employeesError;
        
        // Calculate stats
        const totalMembers = members.length;
        const totalEmployees = employees.length;
        const totalPayments = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
        const activeMembers = members.filter(m => m.status === 'active').length;
        
        // Update dashboard stats
        document.getElementById('dashboardStats').innerHTML = `
            <div class="col-md-3">
                <div class="card dashboard-card">
                    <div class="card-body text-center">
                        <h5 class="card-title">Total Members</h5>
                        <div class="stat-number">${totalMembers}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card dashboard-card">
                    <div class="card-body text-center">
                        <h5 class="card-title">Total Employees</h5>
                        <div class="stat-number">${totalEmployees}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card dashboard-card">
                    <div class="card-body text-center">
                        <h5 class="card-title">Total Payments</h5>
                        <div class="stat-number">₹${totalPayments}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card dashboard-card">
                    <div class="card-body text-center">
                        <h5 class="card-title">Active Members</h5>
                        <div class="stat-number">${activeMembers}</div>
                    </div>
                </div>
            </div>
        `;
        
        // Update recent payments
        const recentPayments = payments.slice(0, 5);
        document.getElementById('recentPayments').innerHTML = recentPayments.length > 0 ? 
            recentPayments.map(payment => `
                <div class="alert alert-light">
                    <strong>${payment.member_id}</strong> - ₹${payment.amount} - ${new Date(payment.payment_date).toLocaleDateString()}
                </div>
            `).join('') : 
            '<p class="text-muted">No recent payments</p>';
            
    } catch (error) {
        console.error('Error loading dashboard:', error);
        document.getElementById('dashboardStats').innerHTML = '<div class="col-12"><div class="alert alert-danger">Error loading dashboard data</div></div>';
    }
}

// Save employee function
async function saveEmployee() {
    const name = document.getElementById('empName').value;
    const fatherName = document.getElementById('empFatherName').value;
    const email = document.getElementById('empEmail').value;
    const phone = document.getElementById('empPhone').value;
    const role = document.getElementById('empRole').value;
    const password = document.getElementById('empPassword').value;
    const address = document.getElementById('empAddress').value;
    
    if (!name || !email || !phone || !role || !password) {
        alert('Please fill all required fields');
        return;
    }
    
    try {
        // Generate employee ID
        const { data: lastEmployee } = await supabase
            .from('employees')
            .select('employee_id')
            .order('id', { ascending: false })
            .limit(1);
            
        let nextId = 100;
        if (lastEmployee && lastEmployee.length > 0) {
            const lastId = parseInt(lastEmployee[0].employee_id.replace('E', ''));
            nextId = lastId + 1;
        }
        
        const employeeId = 'E' + nextId.toString().padStart(4, '0');
        
        // Save employee
        const { error } = await supabase
            .from('employees')
            .insert([{
                employee_id: employeeId,
                name: name,
                father_name: fatherName,
                email: email,
                phone: phone,
                role: role,
                password: password, // In real app, hash this password
                address: address
            }]);
            
        if (error) throw error;
        
        alert('Employee created successfully! Employee ID: ' + employeeId);
        $('#addEmployeeModal').modal('hide');
        document.getElementById('addEmployeeForm').reset();
        loadEmployees();
        
    } catch (error) {
        alert('Error creating employee: ' + error.message);
    }
}

// Save member function
async function saveMember() {
    const name = document.getElementById('memberName').value;
    const fatherName = document.getElementById('memberFatherName').value;
    const age = document.getElementById('memberAge').value;
    const gender = document.getElementById('memberGender').value;
    const contact = document.getElementById('memberContact').value;
    const alternate = document.getElementById('memberAlternate').value;
    const aadhar = document.getElementById('memberAadhar').value;
    const clinical = document.getElementById('memberClinical').value;
    const district = document.getElementById('memberDistrict').value;
    const address = document.getElementById('memberAddress').value;
    const nominee = document.getElementById('memberNominee').value;
    const paymentReceived = document.getElementById('paymentReceived').checked;
    
    if (!name || !fatherName || !age || !gender || !contact || !aadhar || !district || !address) {
        alert('Please fill all required fields');
        return;
    }
    
    if (!paymentReceived) {
        alert('Please confirm that ₹300 payment has been received');
        return;
    }
    
    try {
        // Generate member ID
        const { data: lastMember } = await supabase
            .from('members')
            .select('member_id')
            .order('id', { ascending: false })
            .limit(1);
            
        let nextId = 1001;
        if (lastMember && lastMember.length > 0) {
            const lastId = parseInt(lastMember[0].member_id.replace('GHM', ''));
            nextId = lastId + 1;
        }
        
        const memberId = 'GHM' + nextId.toString().padStart(6, '0');
        
        // Calculate dates
        const joinDate = new Date();
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        
        // Save member
        const { error } = await supabase
            .from('members')
            .insert([{
                member_id: memberId,
                name: name,
                father_name: fatherName,
                age: age,
                gender: gender,
                contact_number: contact,
                alternate_number: alternate,
                aadhar_number: aadhar,
                clinical_history: clinical,
                nominee_name: nominee,
                district: district,
                state: 'Assam',
                full_address: address,
                payment_received: true,
                join_date: joinDate.toISOString().split('T')[0],
                expiry_date: expiryDate.toISOString().split('T')[0],
                status: 'active',
                created_by: currentUser.email
            }]);
            
        if (error) throw error;
        
        // Record payment
        await supabase
            .from('payments')
            .insert([{
                member_id: memberId,
                amount: 300.00,
                payment_date: joinDate.toISOString().split('T')[0],
                collected_by: currentUser.email,
                district: district
            }]);
        
        alert('Member registered successfully! Member ID: ' + memberId);
        $('#addMemberModal').modal('hide');
        document.getElementById('addMemberForm').reset();
        loadMembers();
        
        // Generate PDF card
        setTimeout(() => {
            generateMemberPDF({
                memberId: memberId,
                name: name,
                fatherName: fatherName,
                age: age,
                phone: contact,
                joinDate: joinDate,
                expiryDate: expiryDate,
                createdBy: currentUser.email
            });
        }, 1000);
        
    } catch (error) {
        alert('Error registering member: ' + error.message);
    }
}

// Load employees
async function loadEmployees() {
    try {
        const { data: employees, error } = await supabase
            .from('employees')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        const tbody = document.querySelector('#employeesTable tbody');
        
        if (employees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No employees found</td></tr>';
            return;
        }
        
        tbody.innerHTML = employees.map(emp => `
            <tr>
                <td>${emp.employee_id}</td>
                <td>${emp.name}</td>
                <td><span class="badge ${emp.role === 'admin' ? 'bg-primary' : 'bg-secondary'}">${emp.role}</span></td>
                <td>${emp.phone}</td>
                <td>${emp.email}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editEmployee('${emp.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee('${emp.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading employees:', error);
        document.querySelector('#employeesTable tbody').innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading employees</td></tr>';
    }
}

// Load members
async function loadMembers() {
    try {
        const { data: members, error } = await supabase
            .from('members')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        const tbody = document.querySelector('#membersTable tbody');
        
        if (members.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">No members found</td></tr>';
            return;
        }
        
        tbody.innerHTML = members.map(member => {
            const isActive = new Date(member.expiry_date) > new Date();
            return `
            <tr>
                <td>${member.member_id}</td>
                <td>${member.name}</td>
                <td>${member.father_name}</td>
                <td>${member.contact_number}</td>
                <td>${member.district}</td>
                <td>${new Date(member.join_date).toLocaleDateString()}</td>
                <td>${new Date(member.expiry_date).toLocaleDateString()}</td>
                <td><span class="badge ${isActive ? 'badge-success' : 'badge-danger'}">${isActive ? 'Active' : 'Expired'}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewMemberCard('${member.member_id}')">
                        <i class="fas fa-id-card"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success" onclick="renewMember('${member.member_id}')">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </td>
            </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading members:', error);
        document.querySelector('#membersTable tbody').innerHTML = '<tr><td colspan="9" class="text-center text-danger">Error loading members</td></tr>';
    }
}

// Search members
function searchMembers() {
    const searchTerm = document.getElementById('memberSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#membersTable tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Logout function
async function handleLogout() {
    await supabase.auth.signOut();
    currentUser = null;
    currentRole = null;
    showLogin();
}

// Make functions available globally
window.editEmployee = function(id) {
    alert('Edit employee: ' + id);
};

window.deleteEmployee = function(id) {
    if (confirm('Are you sure you want to delete this employee?')) {
        alert('Delete employee: ' + id);
    }
};

window.viewMemberCard = function(memberId) {
    alert('View member card: ' + memberId);
};

window.renewMember = function(memberId) {
    if (confirm('Renew membership for ' + memberId + '?')) {
        alert('Renew member: ' + memberId);
    }
};