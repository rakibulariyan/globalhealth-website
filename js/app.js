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
    
    // Forgot password
    document.getElementById('forgotPasswordLink').addEventListener('click', showForgotPassword);
    document.getElementById('backToLogin').addEventListener('click', showLoginForm);
    document.getElementById('sendResetLink').addEventListener('click', sendPasswordReset);
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
    loginSection.classList.add('hidden');
    appSection.classList.remove('hidden');
}

// Show login page
function showLogin() {
    loginSection.classList.remove('hidden');
    appSection.classList.add('hidden');
    // Reset login form
    document.getElementById('loginForm').reset();
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
                password: password,
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
    currentUser = null;
    currentRole = null;
    showLogin();
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
    const originalHandler = saveBtn.onclick;

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
        document.getElementById('addEmployeeForm').reset();

        // restore Save button state
        saveBtn.textContent = originalText;
        saveBtn.onclick = originalHandler;
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

// ---- Full Member Registration Implementation ----

window.saveMember = async function() {
  try {
    // Collect form values
    const name = document.getElementById('memberName').value.trim();
    const father = document.getElementById('memberFatherName').value.trim();
    const age = parseInt(document.getElementById('memberAge').value, 10);
    const gender = document.getElementById('memberGender').value;
    const aadhar = document.getElementById('memberAadhar').value.trim();
    const contact = document.getElementById('memberContact').value.trim();
    const alternate = document.getElementById('memberAlternate').value.trim();
    const clinical = document.getElementById('memberClinical').value.trim();
    const district = document.getElementById('memberDistrict').value;
    const state = document.getElementById('memberState').value;
    const address = document.getElementById('memberAddress').value.trim();
    const nominee = document.getElementById('memberNominee').value.trim();
    const paymentReceived = document.getElementById('paymentReceived').checked;

    // Basic validation
    if (!name || !contact || !aadhar || !district || !address) {
      alert('⚠️ Please fill all required fields (Name, Contact, Aadhaar, District, Address)');
      return;
    }

    // Aadhaar photo upload (optional)
    const aadharInput = document.getElementById('memberAadharPhoto');
    let aadhar_url = null;

    if (aadharInput && aadharInput.files.length > 0) {
      const file = aadharInput.files[0];
      const filePath = `aadhar-${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('aadhar-uploads')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase
        .storage
        .from('aadhar-uploads')
        .getPublicUrl(filePath);
      aadhar_url = publicUrl.publicUrl;
    }

    // Generate next member_id
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

    // Family members (will be empty for now until Part 3)
    const family_members = window._familyMembersArray || [];

    // Insert into members table
    const { error } = await supabase
      .from('members')
      .insert([{
        member_id: memberId,
        name,
        father_name: father,
        age,
        gender,
        aadhar_number: aadhar,
        contact_number: contact,
        alternate_number: alternate,
        clinical_history: clinical,
        district,
        state,
        full_address: address,
        nominee_name: nominee,
        aadhar_photo_url: aadhar_url,
        payment_received: paymentReceived,
        family_members
      }]);

    if (error) throw error;

    alert(`✅ Member registered successfully! ID: ${memberId}`);

    // ✅ Generate PDF after successful registration
generateMemberPDF({
  name,
  member_id: memberId,
  age,
  gender,
  aadhar_number: aadhar,
  contact_number: contact,
  district,
  join_date: new Date(),
  expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
  created_by: currentUser ? currentUser.name : "Admin",
  aadhar_photo_url: aadhar_url
});



    // Reset and close form
    document.getElementById('addMemberForm').reset();
    $('#addMemberModal').modal('hide');

    // Refresh list if function exists
    if (typeof loadMembers === 'function') loadMembers();

  } catch (err) {
    alert('❌ Error registering member: ' + (err.message || err));
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
        <td>${mem.age || ''}</td>
        <td>${mem.gender || ''}</td>
        <td>${mem.contact_number}</td>
        <td>${mem.district}</td>
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

// === Edit Member ===
window.editMember = async function (id) {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', parseInt(id))
      .maybeSingle();

    console.log('Editing ID:', id, 'Fetched:', data, 'Error:', error);
    if (error) throw error;
    if (!data) throw new Error('Member not found');

    // ✅ Fill the edit modal fields
    document.getElementById('editMemberId').value = data.id;
    document.getElementById('editMemberName').value = data.name || '';
    document.getElementById('editFatherName').value = data.father_name || '';
    document.getElementById('editAge').value = data.age || '';
    document.getElementById('editGender').value = data.gender || '';
    document.getElementById('editAadhar').value = data.aadhar_number || '';
    document.getElementById('editContact').value = data.contact_number || '';
    document.getElementById('editDistrict').value = data.district || '';
    document.getElementById('editAddress').value = data.full_address || '';
    document.getElementById('editStatus').value = data.status || 'active';

    // ✅ Show modal (Bootstrap)
    $('#editMemberModal').modal('show');
  } catch (err) {
    console.error('Error editing member:', err.message);
    alert('❌ Failed to load member details for editing.');
  }
};


// === Update Member ===
document.getElementById('updateMemberBtn').addEventListener('click', async () => {
  const id = document.getElementById('editMemberId').value;

  const updates = {
    name: document.getElementById('editMemberName').value,
    father_name: document.getElementById('editFatherName').value,
    age: parseInt(document.getElementById('editAge').value),
    gender: document.getElementById('editGender').value,
    aadhar_number: document.getElementById('editAadhar').value,
    contact_number: document.getElementById('editContact').value,
    district: document.getElementById('editDistrict').value,
    full_address: document.getElementById('editAddress').value,
    status: document.getElementById('editStatus').value,
    updated_at: new Date().toISOString()
  };

  try {
    const { error } = await supabase.from('members').update(updates).eq('id', id);
    if (error) throw error;

    alert('✅ Member updated successfully!');
    $('#editMemberModal').modal('hide');
    loadMembers();
  } catch (err) {
    console.error('Error updating member:', err.message);
    alert('❌ Failed to update member.');
  }
});


// === Delete Member ===
window.deleteMember = async function (id) {
  if (!confirm('Are you sure you want to delete this member?')) return;

  try {
    const { error } = await supabase.from('members').delete().eq('id', id);

    if (error) throw error;

    alert('✅ Member deleted successfully!');
    loadMembers(); // refresh table
  } catch (err) {
    console.error('Error deleting member:', err.message);
    alert('❌ Failed to delete member.');
  }
};


async function loadPayments() {
    // Placeholder
}

async function loadReports() {
    // Placeholder  
}

async function loadProfile() {
    // Placeholder
}