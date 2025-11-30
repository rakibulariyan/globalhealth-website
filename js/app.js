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
            navigateToSection(link.getAttribute('data-section'));
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

    // Add Reset Form Functionality
    document.getElementById('resetMemberFormBtn')?.addEventListener('click', function() {
      resetMemberForm();
    });

    function resetMemberForm() {
      if (confirm('Are you sure you want to reset the member registration form? All entered data will be lost.')) {
        // Reset main form
        document.getElementById('addMemberForm').reset();

        // Clear family members table
        document.getElementById('familyBody').innerHTML = '';

        // Reset cascade dropdowns
        document.getElementById('memberDistrictId').innerHTML = '<option value="">Select District</option>';
        document.getElementById('memberBlockId').innerHTML = '<option value="">Select Block</option>';
        document.getElementById('memberBlockId').disabled = true;
        document.getElementById('memberGPId').innerHTML = '<option value="">Select GP</option>';
        document.getElementById('memberGPId').disabled = true;

        // Reload districts
        loadDistrictOptions('memberDistrictId', true);
        console.log('Member form reset successfully.');
      }
    }

    // add Reset Form Functionality for Employee Form
    document.getElementById('resetEmployeeFormBtn')?.addEventListener('click', function() {
    resetEmployeeForm();
    });

    function resetEmployeeForm() {
      if (confirm('Are you sure you want to reset the employee form?')) {
        // Reset main form
        document.getElementById('addEmployeeForm').reset();

        // Reset cascade dropdowns
        document.getElementById('empDistrict').innerHTML = '<option value="">Select District</option>';
        document.getElementById('empBlock').innerHTML = '<option value="">Select Block</option>';
        document.getElementById('empBlock').disabled = true;
        document.getElementById('empGP').innerHTML = '<option value="">Select GP</option>';
        document.getElementById('empGP').disabled = true;

        // Reload districts (optional)
        loadDistrictOptions('empDistrict', true);
        console.log('Employee form reset successfully.');
      }
    }

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

    // Add this to app.js setupEventListeners()
     document.getElementById('changePhotoBtn')?.addEventListener('click', function() {
      $('#changePhotoModal').modal('show');
      console.log('Change Photo modal opened');
    });

    // dashboard data filter by date range
    document.getElementById('dashboardDateFrom')?.addEventListener('change', loadDashboardData);
    document.getElementById('dashboardDateTo')?.addEventListener('change', loadDashboardData);
    document.getElementById('dashboardDistrict')?.addEventListener('change', loadDashboardData);

}


// Setup cascade dropdown functionality
   function setupCascadeDropdowns() {
    // Employee Modal Cascade
    $('#addEmployeeModal').on('show.bs.modal', async function () {
        await loadDistrictOptions('empDistrict', true);

    });

    // Employee District Changed
    document.getElementById('empDistrict')?.addEventListener('change', async function () {
        const districtId = this.value;
        await loadBlockOptions('empBlock', districtId, true);
        document.getElementById('empGP').innerHTML = '<option value="">Select GP</option>';
        document.getElementById('empGP').disabled = true;
    });

    // Employee Block Changed
    document.getElementById('empBlock')?.addEventListener('change', async function () {
        const blockId = this.value;
        if (blockId) {
            await loadGpOptions('empGP', blockId, true);
        } else {
            document.getElementById('empGP').innerHTML = '<option value="">Select GP</option>';
            document.getElementById('empGP').disabled = true;
        }
    });

    // Member Modal Cascade
    $('#addMemberModal').on('show.bs.modal', async function () {
        await loadDistrictOptions('memberDistrictId', true);

    });

    // Member District Changed
    document.getElementById('memberDistrictId')?.addEventListener('change', async function () {
        const districtId = this.value;
        await loadBlockOptions('memberBlockId', districtId, true);
        document.getElementById('memberGPId').innerHTML = '<option value="">Select GP</option>';
        document.getElementById('memberGPId').disabled = true;
    });

    // Member Block Changed
    document.getElementById('memberBlockId')?.addEventListener('change', async function () {
        const blockId = this.value;
        if (blockId) {
            await loadGpOptions('memberGPId', blockId, true);
        } else {
            document.getElementById('memberGPId').innerHTML = '<option value="">Select GP</option>';
            document.getElementById('memberGPId').disabled = true;
        }
    });
}

// Separate function for family member handlers
function setupFamilyMemberHandlers() {
    const addFamilyBtn = document.getElementById('addFamilyBtn');
    const familyBody = document.getElementById('familyBody');

    if (addFamilyBtn && familyBody) {
        addFamilyBtn.addEventListener('click', () => {
            if (familyBody.children.length >= 4) {
                alert("You can only add up to 4 family members.");
                return;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="text" class="form-control form-control-sm fam-name" placeholder="Name" required></td>
                <td><input type="number" class="form-control form-control-sm fam-age" placeholder="Age" required min="1" max="120"></td>
                <td>
                    <select class="form-control form-control-sm fam-relation" required>
                        <option value="">Select Relation</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                        <option value="Brother">Brother</option>
                        <option value="Sister">Sister</option>
                    </select>
                </td>
                <td class="text-center">
                    <button type="button" class="btn btn-sm btn-danger removeFam">×</button>
                </td>
            `;
            familyBody.appendChild(tr);

            // Remove row button
            tr.querySelector('.removeFam').addEventListener('click', () => tr.remove());
        });
    }
}

// ========== CASCADE DROPDOWN FUNCTIONS ==========

async function loadDistrictOptions(selectId, includeBlank = true) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = includeBlank ? '<option value="">Select District</option>' : '';
    
    try {
        const { data, error } = await supabase
            .from('districts')
            .select('id, name')
            .order('name');
            
        if (error) throw error;
        
        data.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.name;
            select.appendChild(opt);
        });
    } catch (error) {
        console.error('Failed to load districts:', error);
    }
}

async function loadBlockOptions(selectId, districtId, includeBlank = true) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = includeBlank ? '<option value="">Select Block</option>' : '';
    select.disabled = true;
    
    if (!districtId) return;
    
    try {
        const { data, error } = await supabase
            .from('blocks')
            .select('id, name')
            .eq('district_id', districtId)
            .order('name');
            
        if (error) throw error;
        
        data.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.id;
            opt.textContent = b.name;
            select.appendChild(opt);
        });
        
        select.disabled = false;
    } catch (error) {
        console.error('Failed to load blocks:', error);
    }
}

async function loadGpOptions(selectId, blockId, includeBlank = true) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = includeBlank ? '<option value="">Select GP</option>' : '';
    select.disabled = true;
    
    if (!blockId) return;
    
    try {
        const { data, error } = await supabase
            .from('gps')
            .select('id, name')
            .eq('block_id', blockId)
            .order('name');
            
        if (error) throw error;
        
        data.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g.id;
            opt.textContent = g.name;
            select.appendChild(opt);
        });
        
        select.disabled = false;
    } catch (error) {
        console.error('Failed to load GPs:', error);
    }
}

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

// UI update function (must be defined outside handleLogin)
function updateUIForRole() {
  // Update user display (safe guards)
  if (currentUser && currentUser.name) {
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('dropdownUserName').textContent = currentUser.name;
    document.getElementById('dropdownUserEmail').textContent = currentUser.email;
  } else {
    document.getElementById('userName').textContent = 'User';
    document.getElementById('dropdownUserName').textContent = 'User';
    document.getElementById('dropdownUserEmail').textContent = '';
  }

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
    console.log('Showing application for user:', currentUser?.email);
    loginSection.classList.add('hidden');
    appSection.classList.remove('hidden');

    // Navigate to dashboard by default
    navigateToSection('dashboard');
}

// Show login page
function showLogin() {
    console.log('Showing login page');;
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
    const navLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
    if (navLink) {
        navLink.classList.add('active');
    }
    
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
        console.log('Loading dashboard data...');
        
        // Get all data
        const { data: members, error: membersError } = await supabase.from('members').select('*');
        const { data: employees, error: employeesError } = await supabase.from('employees').select('*');
        const { data: payments, error: paymentsError } = await supabase.from('payments').select('*');
        
        if (membersError) throw membersError;
        if (employeesError) throw employeesError;
        if (paymentsError) throw paymentsError;
        
        // Calculate stats
        const totalMembers = members ? members.length : 0;
        const totalEmployees = employees ? employees.length : 0;
        const totalPayments = payments ? payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0) : 0;
        const activeMembers = members ? members.filter(m => m.status === 'active').length : 0;
        
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
        const recentPayments = payments ? payments.slice(0, 5) : [];
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
    try {
        const name = document.getElementById('empName')?.value?.trim();
        const fatherName = document.getElementById('empFatherName')?.value?.trim();
        const email = document.getElementById('empEmail')?.value?.trim();
        const phone = document.getElementById('empPhone')?.value?.trim();
        const role = document.getElementById('empRole')?.value;
        const password = document.getElementById('empPassword')?.value;
        const address = document.getElementById('empAddress')?.value?.trim();
        const districtId = document.getElementById('empDistrict')?.value || null;
        const blockId = document.getElementById('empBlock')?.value || null;
        const gpId = document.getElementById('empGP')?.value || null;

        // Validation
        if (!name || !email || !phone || !role || !password) {
            alert('Please fill all required fields');
            return;
        }

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

        // Save to database
        const { error } = await supabase
            .from('employees')
            .insert([{
                employee_id: employeeId,
                name: name,
                father_name: fatherName,
                email: email,
                phone: phone,
                role: role,
                password: password, // In production, hash this password
                address: address,
                district_id: districtId, // foreign keys
                block_id: blockId, // foreign keys
                gp_id: gpId // foreign keys
            }]);

        if (error) throw error;

        alert('Employee created successfully! Employee ID: ' + employeeId);
        $('#addEmployeeModal').modal('hide');
        resetEmployeeForm(); // Use the new reset function
        loadEmployees(); // Refresh the employee list

    } catch (error) {
        console.error('Error creating employee:', error);
        alert('Error creating employee: ' + error.message);
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
        
        if (!employees || employees.length === 0) {
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
    
    alert('Password reset feature would be implemented here for: ' + email);
    // In production, integrate with Supabase Auth reset
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

// --- Real Edit & Delete functions for employees ---

// Edit: open modal prefilled and allow update
window.editEmployee = async function(id) {
  try {
    // fetch employee row by id
    const { data: emp, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;

    // Fill the Add/Edit Employee modal input fields (IDs must match your form)
    document.getElementById('empName').value = emp.name || '';
    document.getElementById('empFatherName').value = emp.father_name || '';
    document.getElementById('empEmail').value = emp.email || '';
    document.getElementById('empPhone').value = emp.phone || '';
    document.getElementById('empRole').value = emp.role || 'employee';
    document.getElementById('empAddress').value = emp.address || '';
    // Do not prefill password for security
    document.getElementById('empPassword').value = '';

    // Show the modal (Bootstrap assumed)
    $('#addEmployeeModal').modal('show');

    // Change Save button temporarily into Update mode
    const saveBtn = document.getElementById('saveEmployeeBtn');
    const originalText = saveBtn.textContent;

    saveBtn.textContent = 'Update Employee';
    // remove existing onclick to avoid double-binding
    saveBtn.onclick = null;

    saveBtn.addEventListener('click', async function updateHandler () {
      try {
        const updated = {
          name: document.getElementById('empName').value.trim(),
          father_name: document.getElementById('empFatherName').value.trim(),
          email: document.getElementById('empEmail').value.trim(),
          phone: document.getElementById('empPhone').value.trim(),
          role: document.getElementById('empRole').value,
          address: document.getElementById('empAddress').value.trim()
        };

        const { error: updError } = await supabase
          .from('employees')
          .update(updated)
          .eq('id', id);

        if (updError) throw updError;

        alert('Employee updated successfully');
        $('#addEmployeeModal').modal('hide');
        resetEmployeeForm(); // reset form after update

        // restore Save button state
        saveBtn.textContent = originalText;
        saveBtn.onclick = saveEmployee;
        saveBtn.removeEventListener('click', updateHandler);

        // reload table
        if (typeof loadEmployees === 'function') loadEmployees();
      } catch (e) {
        alert('Error updating employee: ' + (e.message || e));
      }
    }, { once: true });

  } catch (e) {
    alert('Cannot load employee: ' + (e.message || e));
  }
};

// Delete: confirm and remove row from Supabase
window.deleteEmployee = async function(id) {
  try {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) throw error;

    alert('Employee deleted');
    if (typeof loadEmployees === 'function') loadEmployees();
  } catch (e) {
    alert('Error deleting employee: ' + (e.message || e));
  }
};

// ---- Full Member Registration Implementation (with Family Members) ----
window.saveMember = async function () {
  try {
    // Collect main member form values
    const name = document.getElementById('memberName').value.trim();
    const father = document.getElementById('memberFatherName').value.trim();
    const age = parseInt(document.getElementById('memberAge').value, 10);
    const gender = document.getElementById('memberGender').value;
    const aadhar = document.getElementById('memberAadhar').value.trim();
    const contact = document.getElementById('memberContact').value.trim();
    const alternate = document.getElementById('memberAlternate').value.trim();
    const clinical = document.getElementById('memberClinical').value.trim();
    const districtId = document.getElementById('memberDistrictId').value;
    const blockId = document.getElementById('memberBlockId').value;
    const gpId = document.getElementById('memberGPId').value;
    const address = document.getElementById('memberAddress').value.trim();
    const nominee = document.getElementById('memberNominee').value.trim();
    const paymentReceived = document.getElementById('paymentReceived').checked;

    // Basic validation
    if (!name || !contact || !aadhar || !districtId || !blockId || !gpId || !address) {
      alert('⚠️ Please fill all required fields (Name, Contact, Aadhaar, District, Block, GP, Address)');
      return;
    }

    // ✅ Generate next member_id
    const { data: last } = await supabase
      .from('members')
      .select('member_id')
      .order('id', { ascending: false })
      .limit(1);

    let next = 101;
    if (last && last.length > 0) {
      const num = parseInt(last[0].member_id.replace(/\D/g, ''), 10);
      if (!isNaN(num)) next = num + 1;
    }

    const memberId = 'GHM' + String(next).padStart(6, '0');

    // 📸 Upload applicant photo (optional)
    let applicant_url = null;
    const applicantInput = document.getElementById('applicantPhoto');

    if (applicantInput && applicantInput.files && applicantInput.files.length > 0) {
      const file = applicantInput.files[0];
      const filePath = `applicant-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('applicant-photos')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        console.error('Error uploading applicant photo:', uploadError.message);
        alert('Error uploading applicant photo. Please try again.');
      } else {
        const { data: publicUrlData } = supabase
          .storage
          .from('applicant-photos')
          .getPublicUrl(filePath);
        applicant_url = publicUrlData.publicUrl;
      }
    }

    // ✅ Collect family member data
    const family_members = [];
    document.querySelectorAll('#familyBody tr').forEach((row) => {
      const fname = row.querySelector('.fam-name')?.value.trim();
      const fage = parseInt(row.querySelector('.fam-age')?.value.trim(), 10);
      const frel = row.querySelector('.fam-relation')?.value;
      if (fname && fage && frel) {
        family_members.push({ name: fname, age: fage, relation: frel });
      }
    });

    // Get district name for display
    const { data: districtData } = await supabase
      .from('districts')
      .select('name')
      .eq('id', districtId)
      .single();

    const districtName = districtData ? districtData.name : '';

    // ✅ Insert main member data into Supabase
    const { data, error } = await supabase.from('members').insert([
      {
        member_id: memberId,
        name: name,
        father_name: father,
        age,
        gender,
        aadhar_number: aadhar,
        contact_number: contact,
        alternate_number: alternate,
        clinical_history: clinical,
        district: districtName, // for easy display
        district_id: districtId, // foreign keys
        block_id: blockId, // foreign keys
        gp_id: gpId, // foreign keys
        address: address,
        nominee_name: nominee,
        applicant_photo_url: applicant_url,
        payment_received: paymentReceived,
        family_members, // JSON array
        join_date: new Date().toISOString(),
        expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        created_by: currentUser ? currentUser.name : "Admin"
      },
    ]);

    if (error) throw error;

    // ✅ ADD PAYMENT RECORD IF PAYMENT RECEIVED
    if (paymentReceived) {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([
          {
            member_id: memberId,
            amount: 300, // Assuming fixed amount
            currency: 'INR', // Assuming fixed currency
            payment_status: 'completed',
            collected_by: currentUser ? currentUser.name : "Admin",
            district_name: districtName,
            payment_date: new Date().toISOString(),
            payment_date: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
            
          }]);

      if (paymentError) {
        console.error('Error recording payment:', paymentError.message);
        alert('⚠️ Member registered but failed to record payment. Please check the payments section.');
      }
    }

    // ✅ Success alert

    alert(`✅ Member registered successfully! Member ID: ${memberId}`);

    // ✅ Generate Member Card & Receipt PDF
    if (typeof generateMemberPDF === 'function') {
      generateMemberPDF({
        name,
        member_id: memberId,
        age,
        gender,
        aadhar_number: aadhar,
        contact_number: contact,
        district: districtName,
        join_date: new Date(),
        expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        created_by: currentUser ? currentUser.name : "Admin",
        applicant_photo_url: applicant_url
      });
    }

    // ✅ Reset and close form
    $('#addMemberModal').modal('hide');
    resetMemberForm();
    loadMembers(); // Refresh members table
    

  } catch (err) {
    console.error('Error registering member:', err);
    alert('Error registering member: ' + err.message);
  }
};

window.searchMembers = function() {
    const searchTerm = document.getElementById('memberSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#membersTable tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
};

// === Load Members Table ===
async function loadMembers() {
  try {
    const tbody = document.querySelector('#membersTable tbody');
    tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">Loading...</td></tr>';

    // ✅ Fetch all members
    const { data: members, error } = await supabase
      .from('members')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    if (!members || members.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No members found</td></tr>';
      return;
    }

    // ✅ Build rows
    tbody.innerHTML = members.map(mem => `
      <tr>
        <td>${mem.member_id}</td>
        <td>${mem.name}</td>
        <td>${mem.father_name || ''}</td>
        <td>${mem.contact_number}</td>
        <td>${mem.district}</td>
        <td>${mem.join_date ? new Date(mem.join_date).toLocaleDateString() : ''}</td>
        <td>${mem.expiry_date ? new Date(mem.expiry_date).toLocaleDateString() : ''}</td>
        <td>${mem.status || 'active'}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="editMember('${mem.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteMember('${mem.id}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Error loading members:', err);
    document.querySelector('#membersTable tbody').innerHTML =
      '<tr><td colspan="9" class="text-center text-danger">Error loading members</td></tr>';
  }
}

// ==============================
// DELETE MEMBER FUNCTION
// ==============================
window.deleteMember = async function (id) {
  try {
    if (!confirm("Are you sure you want to delete this member?")) return;

    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (error) throw error;

    alert("✅ Member deleted successfully!");
    loadMembers(); // reload the table
  } catch (err) {
    console.error("Error deleting member:", err);
    alert("❌ Error deleting member: " + err.message);
  }
};

// ==============================
// EDIT MEMBER FUNCTION
// ==============================
window.editMember = async function (id) {
  try {
    const { data: member, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Fill form fields in the edit modal
    document.getElementById('editMemberId').value = member.id;
    document.getElementById('editMemberName').value = member.name || '';
    document.getElementById('editFatherName').value = member.father_name || '';
    document.getElementById('editAge').value = member.age || '';
    document.getElementById('editGender').value = member.gender || '';
    document.getElementById('editAadhar').value = member.aadhar_number || '';
    document.getElementById('editContact').value = member.contact_number || '';
    document.getElementById('editAddress').value = member.address || '';
    document.getElementById('editStatus').value = member.status || 'active';

    // Load districts and preselect
    await loadDistrictOptions('editDistrict', true);
    if (member.district_id) {
      document.getElementById('editDistrict').value = member.district_id;
      // Load blocks for this district
      await loadBlockOptions('editBlock', member.district_id, true);
      if (member.block_id) {
        document.getElementById('editBlock').value = member.block_id;
        // Load GPs for this block
        await loadGpOptions('editGP', member.block_id, true);
        if (member.gp_id) {
          document.getElementById('editGP').value = member.gp_id;
        }
      }
    }

    // Show the edit modal
    $('#editMemberModal').modal('show');

  } catch (err) {
    console.error('Error loading member details:', err);
    alert('❌ Error loading member details.');
  }
};

// Update Member function
document.getElementById('updateMemberBtn').addEventListener('click', async () => {
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
        updates.district = districtData.name; // Update display name
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


// Setup edit modal cascade dropdowns
document.getElementById('editDistrict')?.addEventListener('change', async function () {
  const districtId = this.value;
  await loadBlockOptions('editBlock', districtId, true);
  document.getElementById('editGP').innerHTML = '<option value="">Select GP</option>';
  document.getElementById('editGP').disabled = true;
});

document.getElementById('editBlock')?.addEventListener('change', async function () {
  const blockId = this.value;
  if (blockId) {
    await loadGpOptions('editGP', blockId, true);
  } else {
    document.getElementById('editGP').innerHTML = '<option value="">Select GP</option>';
    document.getElementById('editGP').disabled = true;
  }
});

async function loadPayments() {
    try {
        let query = supabase.from('payments').select('*');

        // Apply filters
        const searchTerm = document.getElementById('paymentSearch')?.value;
        const dateFrom = document.getElementById('paymentDateFrom')?.value;
        const dateTo = document.getElementById('paymentDateTo')?.value;
        const district = document.getElementById('paymentDistrict')?.value;

        if (searchTerm) {
          query = query.or(`member_id.ilike.%${searchTerm}%,collected_by.ilike.%${searchTerm}%`);
        }
        if (dateFrom) query = query.gte('payment_date', dateFrom);
        if (dateTo) query = query.lte('payment_date', dateTo);
        if (district) query = query.eq('district', district);

        const { data: payments, error } = await query.order('payment_date', { ascending: false });

        if (error) throw error;

        const tbody = document.querySelector('#paymentsTable tbody');
        
        if (!payments || payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No payments found</td></tr>';
            return;
        }

        tbody.innerHTML = payments.map(payment => `
            <tr>
                <td>${payment.id}</td>
                <td>${payment.member_id || 'N/A'}</td>
                <td>₹${payment.amount || '0.00'}</td>
                <td>${payment.currency || 'INR'}</td>
                <td>${payment.payment_status || 'completed'}</td>
                <td>${new Date(payment.payment_date).toLocaleDateString()}</td>
                <td>${payment.collected_by || 'N/A'}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading payments:', error);
        document.querySelector('#paymentsTable tbody').innerHTML = 
            '<tr><td colspan="7" class="text-center text-danger">Error loading payments</td></tr>';
    }
}

async function loadReports() {
    try {
        // Load data for charts
        const { data: members } = await supabase.from('members').select('*');
        const { data: payments } = await supabase.from('payments').select('*');

        // Simple stats display instead of charts for now
        const ctx = document.getElementById('signupsChart')?.getContext('2d');
        if (ctx) {
          new Chart(ctx, {
            type: 'bar',
            data: {
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              datasets: [{
                label: 'Monthly Signups',
                data: [65, 59, 80, 81, 56, 55],
                backgroundColor: '#2c7fb8'
              }]
            }
          });
        }
    } catch (error) {
        console.error('Error loading reports:', error);
        document.getElementById('reportsSection').innerHTML = 
            '<div class="alert alert-danger">Error loading reports data</div>';
    }
}

// Profile update function
document.getElementById('profileForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    alert('Profile updated successfully!');
});

document.getElementById('changePasswordForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    alert('Password changes requested successfully!');
});


// Export functions (simple CSV export)
window.exportToExcel = async function() {
    const { data: members } = await supabase.from('members').select('*');
    if (!members) return;
    
    const csv = [
        ['Member ID', 'Name', 'Phone', 'District', 'Join Date', 'Status'],
        ...members.map(m => [m.member_id, m.name, m.contact_number, m.district, m.join_date, m.status])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'members-export.csv';
    a.click();
};

window.exportToPDF = function() {
    alert('PDF export would be implemented here with proper PDF library');
};

async function loadProfile() {
    // Placeholder - implement profile loading
    console.log('Loading profile...');
}


// Advanced Search Function
document.getElementById('searchBtn')?.addEventListener('click', async function() {
    try {
        const memberId = document.getElementById('searchMemberId').value;
        const name = document.getElementById('searchName').value;
        const phone = document.getElementById('searchPhone').value;
        const district = document.getElementById('searchDistrict').value;
        const status = document.getElementById('searchStatus').value;
        const dateFrom = document.getElementById('searchDateFrom').value;

        let query = supabase.from('members').select('*');

        if (memberId) query = query.ilike('member_id', `%${memberId}%`);
        if (name) query = query.ilike('name', `%${name}%`);
        if (phone) query = query.ilike('contact_number', `%${phone}%`);
        if (district) query = query.eq('district', district);
        if (status) query = query.eq('status', status);
        if (dateFrom) query = query.gte('join_date', dateFrom);

        const { data: members, error } = await query;

        if (error) throw error;

        const tbody = document.getElementById('searchResultsBody');
        
        if (!members || members.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center">No members found</td></tr>';
            return;
        }

        tbody.innerHTML = members.map(mem => `
            <tr>
                <td>${mem.member_id}</td>
                <td>${mem.name}</td>
                <td>${mem.father_name || ''}</td>
                <td>${mem.contact_number}</td>
                <td>${mem.age}</td>
                <td>${mem.district}</td>
                <td>${mem.join_date ? new Date(mem.join_date).toLocaleDateString() : ''}</td>
                <td>${mem.expiry_date ? new Date(mem.expiry_date).toLocaleDateString() : ''}</td>
                <td>${mem.status || 'active'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editMember('${mem.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMember('${mem.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Search error:', error);
        document.getElementById('searchResultsBody').innerHTML = 
            '<tr><td colspan="10" class="text-center text-danger">Error searching members</td></tr>';
    }
});

// Reset Search
document.getElementById('resetSearchBtn')?.addEventListener('click', function() {
    document.getElementById('searchMemberId').value = '';
    document.getElementById('searchName').value = '';
    document.getElementById('searchPhone').value = '';
    document.getElementById('searchDistrict').value = '';
    document.getElementById('searchStatus').value = '';
    document.getElementById('searchDateFrom').value = '';
    document.getElementById('searchResultsBody').innerHTML = 
        '<tr><td colspan="10" class="text-center text-muted">Use the search form above to find members</td></tr>';
});

// Fix missing function references
window.validateMemberCard = async function() {
    const cardId = document.getElementById('cardId').value.trim();
    
    if (!cardId) {
        alert('Please enter a Member ID');
        return;
    }

    try {
        const { data: member, error } = await supabase
            .from('members')
            .select('*')
            .eq('member_id', cardId)
            .single();

        if (error) throw error;

        const resultDiv = document.getElementById('validationResult');
        
        if (member) {
            const isActive = member.status === 'active' && new Date(member.expiry_date) > new Date();
            resultDiv.innerHTML = `
                <div class="alert ${isActive ? 'alert-success' : 'alert-warning'}">
                    <h5>Member Found</h5>
                    <p><strong>Name:</strong> ${member.name}</p>
                    <p><strong>Member ID:</strong> ${member.member_id}</p>
                    <p><strong>Status:</strong> ${isActive ? 'Active' : 'Expired'}</p>
                    <p><strong>Expiry Date:</strong> ${new Date(member.expiry_date).toLocaleDateString()}</p>
                    <p><strong>District:</strong> ${member.district}</p>
                </div>
            `;
        } else {
            resultDiv.innerHTML = '<div class="alert alert-danger">Member not found</div>';
        }
        resultDiv.style.display = 'block';
    } catch (error) {
        console.error('Validation error:', error);
        document.getElementById('validationResult').innerHTML = 
            '<div class="alert alert-danger">Error validating member</div>';
        document.getElementById('validationResult').style.display = 'block';
    }
};

window.advancedSearchMembers = async function() {
    try {
        const memberId = document.getElementById('searchMemberId').value;
        const name = document.getElementById('searchName').value;
        const phone = document.getElementById('searchPhone').value;
        const district = document.getElementById('searchDistrict').value;
        const status = document.getElementById('searchStatus').value;
        const dateFrom = document.getElementById('searchDateFrom').value;

        let query = supabase.from('members').select('*');

        if (memberId) query = query.ilike('member_id', `%${memberId}%`);
        if (name) query = query.ilike('name', `%${name}%`);
        if (phone) query = query.ilike('contact_number', `%${phone}%`);
        if (district) query = query.eq('district', district);
        if (status) query = query.eq('status', status);
        if (dateFrom) query = query.gte('join_date', dateFrom);

        const { data: members, error } = await query;

        if (error) throw error;

        const tbody = document.getElementById('searchResultsBody');
        
        if (!members || members.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center">No members found</td></tr>';
            return;
        }

        tbody.innerHTML = members.map(mem => `
            <tr>
                <td>${mem.member_id}</td>
                <td>${mem.name}</td>
                <td>${mem.father_name || ''}</td>
                <td>${mem.contact_number}</td>
                <td>${mem.age}</td>
                <td>${mem.district}</td>
                <td>${mem.join_date ? new Date(mem.join_date).toLocaleDateString() : ''}</td>
                <td>${mem.expiry_date ? new Date(mem.expiry_date).toLocaleDateString() : ''}</td>
                <td>${mem.status || 'active'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editMember('${mem.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMember('${mem.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Search error:', error);
        document.getElementById('searchResultsBody').innerHTML = 
            '<tr><td colspan="10" class="text-center text-danger">Error searching members</td></tr>';
    }
};

window.resetSearch = function() {
    document.getElementById('searchMemberId').value = '';
    document.getElementById('searchName').value = '';
    document.getElementById('searchPhone').value = '';
    document.getElementById('searchDistrict').value = '';
    document.getElementById('searchStatus').value = '';
    document.getElementById('searchDateFrom').value = '';
    document.getElementById('searchResultsBody').innerHTML = 
        '<tr><td colspan="10" class="text-center text-muted">Use the search form above to find members</td></tr>';
};

// PDF Generation Function
window.exportToPDF = function() {
    alert('PDF export would generate report here');
    // For now, trigger CSV export as fallback
    exportToExcel();
};