// ============================================
// GLOBAL HEALTH MANAGEMENT SYSTEM - APP.JS
// ============================================
// Main application file - Consolidates all functionality
// ============================================

// Global variables
window.currentUser = null;
window.currentRole = null;
window.currentUserData = null;

// ============================================
// 1. PERMISSIONS & ROLE MANAGEMENT
// ============================================

const sectionPermissions = {
    'dashboard': ['admin', 'coordinator', 'health_worker', 'accountant', 'employee'],
    'kpis': ['admin', 'coordinator'],
    'activity-logs': ['admin'],
    'geo-heatmap': ['admin', 'coordinator'],
    'search-members': ['admin', 'coordinator', 'health_worker', 'employee'],
    'search-employees': ['admin', 'coordinator'],
    'search-payments': ['admin', 'coordinator', 'accountant'],
    'advanced-filters': ['admin', 'coordinator'],
    'geo-smart-search': ['admin', 'coordinator'],
    'master': ['admin', 'coordinator'],
    'blocks-master': ['admin', 'coordinator'],
    'gps-master': ['admin', 'coordinator'],
    'add-employee': ['admin'],
    'employee-list': ['admin', 'coordinator'],
    'employee-details': ['admin', 'coordinator'],
    'salary-slips': ['admin', 'coordinator'],
    'health-worker-performance': ['admin', 'coordinator'],
    'performance-scorecard': ['admin', 'coordinator'],
    'register-member': ['admin', 'coordinator', 'health_worker'],
    'member-list': ['admin', 'coordinator', 'health_worker', 'employee'],
    'member-view': ['admin', 'coordinator', 'health_worker', 'employee'],
    'member-card': ['admin', 'coordinator', 'health_worker', 'employee'],
    'renewal-expiry': ['admin', 'coordinator', 'health_worker'],
    'beneficiary-management': ['admin', 'coordinator', 'health_worker'],
    'payment-list': ['admin', 'coordinator', 'accountant'],
    'pending-payments': ['admin', 'coordinator', 'accountant'],
    'price-master': ['admin', 'coordinator'],
    'revenue-breakdown': ['admin', 'coordinator'],
    'summary-reports': ['admin', 'coordinator', 'accountant'],
    'daily-summary': ['admin', 'coordinator', 'accountant'],
    'weekly-summary': ['admin', 'coordinator', 'accountant'],
    'monthly-performance': ['admin', 'coordinator', 'accountant'],
    'user-roles': ['admin'],
    'permission-matrix': ['admin'],
    'system-logs': ['admin'],
    'backups': ['admin'],
    'financial-audit': ['admin', 'coordinator'],
    'data-export-logs': ['admin', 'coordinator'],
    'district-performance-audit': ['admin', 'coordinator'],
    'import-members': ['admin', 'coordinator'],
    'import-employees': ['admin', 'coordinator'],
    'import-geo-data': ['admin', 'coordinator'],
    'raise-ticket': ['admin', 'coordinator', 'health_worker', 'accountant', 'employee'],
    'tickets-list': ['admin', 'coordinator'],
    'resolution-history': ['admin', 'coordinator'],
    'validation': ['admin', 'coordinator', 'health_worker', 'employee'],
    'profile': ['admin', 'coordinator', 'health_worker', 'accountant', 'employee']
};

window.checkPermission = function(sectionId) {
    if (!window.currentUser || !window.currentRole) return false;
    if (window.currentRole === 'admin') return true;
    return sectionPermissions[sectionId]?.includes(window.currentRole) || false;
};

window.updateUIForRole = function() {
    if (window.currentUser && window.currentUser.name) {
        const userNameElement = document.getElementById('userName');
        const dropdownUserName = document.getElementById('dropdownUserName');
        const dropdownUserEmail = document.getElementById('dropdownUserEmail');
        
        if (userNameElement) userNameElement.textContent = window.currentUser.name;
        if (dropdownUserName) dropdownUserName.textContent = window.currentUser.name;
        if (dropdownUserEmail) dropdownUserEmail.textContent = window.currentUser.email;
    }
};


window.setupFamilyMemberHandlers = function() {
    const addFamilyBtn = document.getElementById('addFamilyBtn');
    const familyBody = document.getElementById('familyBody');
    
    if (!addFamilyBtn || !familyBody) return;
    
    addFamilyBtn.addEventListener('click', function() {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" class="form-control form-control-sm fam-name" placeholder="Name" required></td>
            <td><input type="number" class="form-control form-control-sm fam-age" placeholder="Age" min="0" max="120" required></td>
            <td>
                <select class="form-control form-control-sm fam-relation">
                    <option value="spouse">Spouse</option>
                    <option value="son">Son</option>
                    <option value="daughter">Daughter</option>
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="brother">Brother</option>
                    <option value="sister">Sister</option>
                </select>
            </td>
            <td><button type="button" class="btn btn-sm btn-danger remove-family"><i class="fas fa-times"></i></button></td>
        `;
        familyBody.appendChild(row);
    });
    
    familyBody.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-family') || e.target.closest('.remove-family')) {
            const row = e.target.closest('tr');
            if (row) row.remove();
        }
    });
};

window.resetMemberForm = function() {
    const form = document.getElementById('addMemberForm');
    if (form) {
        form.reset();
        document.getElementById('familyBody').innerHTML = '';
        document.getElementById('memberBlockId').innerHTML = '<option value="">Select District First</option>';
        document.getElementById('memberGPId').innerHTML = '<option value="">Select Block First</option>';
        showToast('Member form reset', 'info');
    }
};

window.resetEmployeeForm = function() {
    const form = document.getElementById('addEmployeeForm');
    if (form) {
        form.reset();
        document.getElementById('empBlock').innerHTML = '<option value="">Select District First</option>';
        document.getElementById('empGP').innerHTML = '<option value="">Select Block First</option>';
        showToast('Employee form reset', 'info');
    }
};

window.showToast = function(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type === 'error' ? 'danger' : type === 'info' ? 'info' : 'success'} alert-dismissible fade show`;
    toast.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    toast.innerHTML = `
        ${msg}
        <button type="button" class="close" data-dismiss="alert">&times;</button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 4000);
};

// ============================================
// 3. AUTHENTICATION
// ============================================

async function initializeAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (session && session.user) {
        console.log('User already logged in:', session.user.email);
        await handleSuccessfulLogin(session.user);
    } else {
        showLoginSection();
    }
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            await handleSuccessfulLogin(session.user);
        } else if (event === 'SIGNED_OUT') {
            showLoginSection();
        }
    });
}

async function handleSuccessfulLogin(user) {
    try {
        // Get user data from employees table
        const { data: employeeData, error } = await supabase
            .from('employees')
            .select('*')
            .eq('email', user.email)
            .single();
        
        if (error) {
            console.error('Error fetching user data:', error);
            showToast('Error loading user profile', 'error');
            return;
        }
        
        // Set global user data
        window.currentUser = {
            ...user,
            name: employeeData.name || user.email.split('@')[0],
            role: employeeData.role,
            employeeId: employeeData.employee_id,
            photoUrl: employeeData.photo_url
        };
        
        window.currentRole = employeeData.role;
        window.currentUserData = employeeData;
        
        // Update UI
        updateUIForRole();
        updateUserPhoto();
        
        // Load initial data
        await loadDashboardData();
        await loadEmployeeList();
        await loadMemberList();
        await loadPaymentList();

        // Show app section
        showAppSection();
        
        showToast(`Welcome back, ${window.currentUser.name}!`, 'success');
        
    } catch (error) {
        console.error('Login error:', error);
        showToast('Login error - please contact admin', 'error');
    }
}

function showLoginSection() {
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('appSection').classList.add('hidden');
    window.currentUser = null;
    window.currentRole = null;
}

function showAppSection() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('appSection').classList.remove('hidden');
    navigateToSection('dashboard');
}

function updateUserPhoto() {
    const userPhoto = document.getElementById('userPhoto');
    const dropdownUserPhoto = document.getElementById('dropdownUserPhoto');
    const userIcon = document.getElementById('userIcon');
    const dropdownUserIcon = document.getElementById('dropdownUserIcon');
    
    if (window.currentUser?.photoUrl) {
        userPhoto.src = window.currentUser.photoUrl;
        userPhoto.style.display = 'block';
        userIcon.style.display = 'none';
        
        dropdownUserPhoto.src = window.currentUser.photoUrl;
        dropdownUserPhoto.style.display = 'block';
        dropdownUserIcon.style.display = 'none';
    } else {
        userPhoto.style.display = 'none';
        userIcon.style.display = 'inline-block';
        
        dropdownUserPhoto.style.display = 'none';
        dropdownUserIcon.style.display = 'block';
    }
}

// ============================================
// 4. NAVIGATION
// ============================================

window.navigateToSection = function(sectionId) {
    console.log(`Navigating to: ${sectionId}`);
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Check permission
    if (!checkPermission(sectionId)) {
        showAccessDenied(sectionId);
        
        const navLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
        if (navLink) navLink.classList.add('active');
        return;
    }
    
    // Show section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        
        const navLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
        if (navLink) navLink.classList.add('active');
        
        // Load section-specific data
        loadSectionData(sectionId);
    } else {
        console.error(`Section ${sectionId} not found`);
        showAccessDenied(sectionId);
    }
};

window.showAccessDenied = function(sectionId) {
    const accessDeniedSection = document.getElementById('accessDeniedSection');
    if (!accessDeniedSection) return;
    
    const sectionNames = {
        'dashboard': 'Dashboard Overview',
        'employee-list': 'Employee List',
        'member-list': 'Member List',
        'payment-list': 'Payment List',
        'validation': 'Partner Validation',
        'profile': 'My Profile'
    };
    
    const sectionName = sectionNames[sectionId] || sectionId;
    
    accessDeniedSection.innerHTML = `
        <div class="access-denied-container">
            <div class="access-denied-content">
                <div class="access-denied-icon"><i class="fas fa-ban"></i></div>
                <h1>Access Denied – Required Permissions Missing</h1>
                <p class="lead"><strong>Attempted to access:</strong> ${sectionName}</p>
                <p>Your account (Role: <strong>${window.currentRole || 'Unknown'}</strong>) does not have authorization for this module.</p>
                <p><strong>Required Roles:</strong> ${sectionPermissions[sectionId] ? sectionPermissions[sectionId].join(', ') : 'Admin only'}</p>
                <div class="mt-4">
                    <button class="btn btn-primary" onclick="navigateToSection('dashboard')">
                        <i class="fas fa-tachometer-alt me-2"></i>Return to Dashboard
                    </button>
                </div>
            </div>
        </div>
    `;
    
    accessDeniedSection.style.display = 'block';
    accessDeniedSection.classList.add('active');
};

async function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'employee-list':
            await loadEmployeeList();
            break;
        case 'member-list':
            await loadMemberList();
            break;
        case 'payment-list':
            await loadPaymentList();
            break;
        case 'validation':
            // Nothing to load initially
            break;
        case 'profile':
            loadProfileData();
            break;
    }
}

// ============================================
// 5. DASHBOARD FUNCTIONS
// ============================================

async function loadDashboardData() {
    try {
        console.log('Loading dashboard data...');
        
        // Load stats
        await loadDashboardStats();
        
        // Load recent payments
        await loadRecentPayments();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

async function loadDashboardStats() {
    try {
        // Get total members
        const { data: members, error: membersError } = await supabase
            .from('members')
            .select('id, status');
            
        // Get total employees
        const { data: employees, error: employeesError } = await supabase
            .from('employees')
            .select('id');
            
        // Get total payments
        const { data: payments, error: paymentsError } = await supabase
            .from('payments')
            .select('amount');
            
        if (membersError || employeesError || paymentsError) {
            throw membersError || employeesError || paymentsError;
        }
        
        const totalMembers = members?.length || 0;
        const activeMembers = members?.filter(m => m.status === 'active')?.length || 0;
        const totalEmployees = employees?.length || 0;
        const totalRevenue = payments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
        
        const statsContainer = document.getElementById('dashboardStats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="col-md-3">
                    <div class="card dashboard-card" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                        <div class="card-body text-center">
                            <h5 class="card-title"><i class="fas fa-users me-2"></i>Total Members</h5>
                            <h2 class="stat-number">${totalMembers}</h2>
                            <p class="mb-0">Active: ${activeMembers}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card dashboard-card" style="background: linear-gradient(135deg, #f093fb, #f5576c);">
                        <div class="card-body text-center">
                            <h5 class="card-title"><i class="fas fa-user-tie me-2"></i>Employees</h5>
                            <h2 class="stat-number">${totalEmployees}</h2>
                            <p class="mb-0">Field Workforce</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card dashboard-card" style="background: linear-gradient(135deg, #4facfe, #00f2fe);">
                        <div class="card-body text-center">
                            <h5 class="card-title"><i class="fas fa-rupee-sign me-2"></i>Revenue</h5>
                            <h2 class="stat-number">₹${totalRevenue.toLocaleString()}</h2>
                            <p class="mb-0">Total Collected</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card dashboard-card" style="background: linear-gradient(135deg, #43e97b, #38f9d7);">
                        <div class="card-body text-center">
                            <h5 class="card-title"><i class="fas fa-hospital me-2"></i>Validation</h5>
                            <h2 class="stat-number">${activeMembers}</h2>
                            <p class="mb-0">Valid Cards</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading stats:', error);
        document.getElementById('dashboardStats').innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">Error loading dashboard statistics</div>
            </div>
        `;
    }
}

async function loadRecentPayments() {
    try {
        const { data: payments, error } = await supabase
            .from('payments')
            .select('*')
            .order('payment_date', { ascending: false })
            .limit(10);
            
        if (error) throw error;
        
        const paymentsContainer = document.getElementById('recentPayments');
        if (paymentsContainer) {
            if (payments && payments.length > 0) {
                let html = '<table class="table table-hover"><thead><tr><th>Payment ID</th><th>Member ID</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead><tbody>';
                
                payments.forEach(payment => {
                    html += `
                        <tr>
                            <td>${payment.id}</td>
                            <td>${payment.member_id || 'N/A'}</td>
                            <td>₹${payment.amount || '0'}</td>
                            <td>${new Date(payment.payment_date).toLocaleDateString()}</td>
                            <td><span class="badge badge-success">${payment.payment_status || 'completed'}</span></td>
                        </tr>
                    `;
                });
                
                html += '</tbody></table>';
                paymentsContainer.innerHTML = html;
            } else {
                paymentsContainer.innerHTML = '<p class="text-muted">No recent payments found</p>';
            }
        }
        
    } catch (error) {
        console.error('Error loading recent payments:', error);
    }
}

// ============================================
// 6. EMPLOYEE MANAGEMENT
// ============================================

async function loadEmployeeList() {
    try {
        const { data: employees, error } = await supabase
            .from('employees')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        const tableBody = document.querySelector('#employeesTable tbody');
        if (tableBody) {
            tableBody.innerHTML = '';
            
            if (employees && employees.length > 0) {
                employees.forEach(emp => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${emp.employee_id || 'N/A'}</td>
                        <td>${emp.name}</td>
                        <td><span class="badge badge-info">${emp.role || 'employee'}</span></td>
                        <td>${emp.phone || 'N/A'}</td>
                        <td>${emp.email}</td>
                        <td>
                            <button class="btn btn-sm btn-info" onclick="viewEmployee(${emp.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${window.currentRole === 'admin' ? `
                                <button class="btn btn-sm btn-warning" onclick="editEmployee(${emp.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteEmployee(${emp.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            } else {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No employees found</td></tr>';
            }
        }
        
    } catch (error) {
        console.error('Error loading employees:', error);
        showToast('Error loading employee list', 'error');
    }
}

async function addEmployee() {
    try {
        const form = document.getElementById('addEmployeeForm');
        if (!form) return;
        
        const formData = new FormData(form);
        const employeeData = {
            name: formData.get('empName'),
            email: formData.get('empEmail'),
            password: formData.get('empPassword'),
            phone: formData.get('empPhone'),
            role: formData.get('empRole'),
            father_name: formData.get('empFatherName'),
            date_of_birth: formData.get('empDOB'),
            address: formData.get('empAddress'),
            district_id: formData.get('empDistrict') || null,
            block_id: formData.get('empBlock') || null,
            gp_id: formData.get('empGP') || null,
            employee_id: 'EMP' + Date.now().toString().slice(-6)
        };
        
        // Insert employee
        const { data, error } = await supabase
            .from('employees')
            .insert([employeeData])
            .select();
            
        if (error) throw error;
        
        // Create auth user
        const { error: authError } = await supabase.auth.signUp({
            email: employeeData.email,
            password: employeeData.password,
            options: {
                data: {
                    name: employeeData.name,
                    role: employeeData.role
                }
            }
        });
        
        if (authError) {
            console.warn('Auth creation warning:', authError);
            // Continue even if auth fails - user can be created later
        }
        
        // Close modal
        $('#addEmployeeModal').modal('hide');
        
        // Reset form
        resetEmployeeForm();
        
        // Reload employee list
        await loadEmployeeList();
        
        showToast('Employee added successfully!', 'success');
        
    } catch (error) {
        console.error('Error adding employee:', error);
        showToast('Error adding employee: ' + error.message, 'error');
    }
}

function viewEmployee(id) {
    // Navigate to employee details
    navigateToSection('employee-details');
    // TODO: Load specific employee details
}

function editEmployee(id) {
    // TODO: Implement edit employee
    showToast('Edit employee - Coming soon', 'info');
}

async function deleteEmployee(id) {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    
    try {
        const { error } = await supabase
            .from('employees')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        await loadEmployeeList();
        showToast('Employee deleted successfully', 'success');
        
    } catch (error) {
        console.error('Error deleting employee:', error);
        showToast('Error deleting employee', 'error');
    }
}

// ============================================
// 7. MEMBER MANAGEMENT
// ============================================

async function loadMemberList() {
    try {
        const { data: members, error } = await supabase
            .from('members')
            .select(`
                *,
                districts:district_id(name),
                blocks:block_id(name),
                gps:gp_id(name)
            `)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        const tableBody = document.querySelector('#membersTable tbody');
        const searchInput = document.getElementById('memberSearch');
        
        if (tableBody) {
            tableBody.innerHTML = '';
            
            if (members && members.length > 0) {
                // Store members globally for search
                window.membersList = members;
                
                members.forEach(member => {
                    const row = document.createElement('tr');
                    const statusClass = member.status === 'active' ? 'success' : 
                                      member.status === 'expired' ? 'danger' : 'warning';
                    
                    row.innerHTML = `
                        <td>${member.member_id}</td>
                        <td>${member.name}</td>
                        <td>${member.father_name || 'N/A'}</td>
                        <td>${member.contact_number || 'N/A'}</td>
                        <td>${member.districts?.name || member.district || 'N/A'}</td>
                        <td>${new Date(member.join_date).toLocaleDateString()}</td>
                        <td>${member.expiry_date ? new Date(member.expiry_date).toLocaleDateString() : 'N/A'}</td>
                        <td><span class="badge badge-${statusClass}">${member.status || 'unknown'}</span></td>
                        <td>
                            <button class="btn btn-sm btn-info" onclick="viewMember('${member.member_id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="renewMember('${member.member_id}')">
                                <i class="fas fa-redo"></i>
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="generateMemberCard('${member.member_id}')">
                                <i class="fas fa-id-card"></i>
                            </button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            } else {
                tableBody.innerHTML = '<tr><td colspan="9" class="text-center">No members found</td></tr>';
            }
        }
        
        // Setup search
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                filterMemberList(e.target.value.toLowerCase());
            });
        }
        
    } catch (error) {
        console.error('Error loading members:', error);
        showToast('Error loading member list', 'error');
    }
}

function filterMemberList(searchTerm) {
    if (!window.membersList) return;
    
    const tableBody = document.querySelector('#membersTable tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    const filtered = window.membersList.filter(member => 
        member.member_id.toLowerCase().includes(searchTerm) ||
        member.name.toLowerCase().includes(searchTerm) ||
        (member.father_name && member.father_name.toLowerCase().includes(searchTerm)) ||
        (member.contact_number && member.contact_number.includes(searchTerm))
    );
    
    if (filtered.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center">No matching members found</td></tr>';
        return;
    }
    
    filtered.forEach(member => {
        const row = document.createElement('tr');
        const statusClass = member.status === 'active' ? 'success' : 
                          member.status === 'expired' ? 'danger' : 'warning';
        
        row.innerHTML = `
            <td>${member.member_id}</td>
            <td>${member.name}</td>
            <td>${member.father_name || 'N/A'}</td>
            <td>${member.contact_number || 'N/A'}</td>
            <td>${member.districts?.name || member.district || 'N/A'}</td>
            <td>${new Date(member.join_date).toLocaleDateString()}</td>
            <td>${member.expiry_date ? new Date(member.expiry_date).toLocaleDateString() : 'N/A'}</td>
            <td><span class="badge badge-${statusClass}">${member.status || 'unknown'}</span></td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewMember('${member.member_id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="renewMember('${member.member_id}')">
                    <i class="fas fa-redo"></i>
                </button>
                <button class="btn btn-sm btn-primary" onclick="generateMemberCard('${member.member_id}')">
                    <i class="fas fa-id-card"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

async function addMember() {
    try {
        const form = document.getElementById('addMemberForm');
        if (!form) return;
        
        // Collect family members
        const familyMembers = [];
        document.querySelectorAll('#familyBody tr').forEach(row => {
            const name = row.querySelector('.fam-name').value;
            const age = row.querySelector('.fam-age').value;
            const relation = row.querySelector('.fam-relation').value;
            
            if (name && age) {
                familyMembers.push({ name, age: parseInt(age), relation });
            }
        });
        
        const formData = new FormData(form);
        const memberData = {
            member_id: 'GHM' + Date.now().toString().slice(-6),
            name: formData.get('memberName'),
            father_name: formData.get('memberFatherName'),
            age: parseInt(formData.get('memberAge')) || null,
            gender: formData.get('memberGender'),
            contact_number: formData.get('memberPhone'),
            alternate_number: formData.get('memberAltPhone') || null,
            aadhar_number: formData.get('memberAadhar') || null,
            clinical_history: formData.get('memberMedicalHistory') || null,
            nominee_name: formData.get('memberNominee') || null,
            full_address: formData.get('memberAddress'),
            district: formData.get('memberDistrictText') || null,
            district_id: formData.get('memberDistrictId') || null,
            block_id: formData.get('memberBlockId') || null,
            gp_id: formData.get('memberGPId') || null,
            payment_received: formData.get('paymentReceived') === 'on',
            join_date: new Date().toISOString().split('T')[0],
            expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            status: 'active',
            created_by: window.currentUser?.email,
            family_members: familyMembers
        };
        
        // Handle photo upload
        const photoFile = formData.get('memberPhoto');
        let photoUrl = null;
        
        if (photoFile && photoFile.size > 0) {
            const fileName = `member_${memberData.member_id}_${Date.now()}.${photoFile.name.split('.').pop()}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('member-photos')
                .upload(fileName, photoFile);
                
            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from('member-photos')
                    .getPublicUrl(fileName);
                photoUrl = publicUrl;
            }
        }
        
        if (photoUrl) {
            memberData.applicant_photo_url = photoUrl;
        }
        
        // Insert member
        const { data, error } = await supabase
            .from('members')
            .insert([memberData])
            .select();
            
        if (error) throw error;
        
        // Create payment record if payment received
        if (memberData.payment_received) {
            const paymentData = {
                member_id: memberData.member_id,
                amount: 300.00,
                currency: 'INR',
                payment_status: 'completed',
                payment_date: new Date().toISOString().split('T')[0],
                collected_by: window.currentUser?.email,
                district: memberData.district
            };
            
            await supabase
                .from('payments')
                .insert([paymentData]);
        }
        
        // Close modal
        $('#addMemberModal').modal('hide');
        
        // Reset form
        resetMemberForm();
        
        // Reload data
        await loadMemberList();
        await loadDashboardData();
        
        showToast('Member registered successfully!', 'success');
        
    } catch (error) {
        console.error('Error adding member:', error);
        showToast('Error adding member: ' + error.message, 'error');
    }
}

function viewMember(memberId) {
    // Navigate to member view
    navigateToSection('member-view');
    // TODO: Load specific member details
    showToast(`Viewing member: ${memberId}`, 'info');
}

async function renewMember(memberId) {
    if (!confirm(`Renew membership for ${memberId}?`)) return;
    
    try {
        const newExpiry = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            .toISOString().split('T')[0];
        
        const { error } = await supabase
            .from('members')
            .update({ 
                expiry_date: newExpiry,
                status: 'active',
                updated_at: new Date().toISOString()
            })
            .eq('member_id', memberId);
            
        if (error) throw error;
        
        await loadMemberList();
        showToast('Membership renewed successfully!', 'success');
        
    } catch (error) {
        console.error('Error renewing member:', error);
        showToast('Error renewing membership', 'error');
    }
}

async function generateMemberCard(memberId) {
    try {
        // Get member data
        const { data: member, error } = await supabase
            .from('members')
            .select('*')
            .eq('member_id', memberId)
            .single();
            
        if (error) throw error;
        
        // Call PDF generator function if available
        if (window.generatePDFCard) {
            window.generatePDFCard(member);
        } else {
            showToast('PDF generator not available', 'warning');
        }
        
    } catch (error) {
        console.error('Error generating card:', error);
        showToast('Error generating member card', 'error');
    }
}

// ============================================
// 8. PAYMENT MANAGEMENT
// ============================================

async function loadPaymentList() {
    try {
        const { data: payments, error } = await supabase
            .from('payments')
            .select('*')
            .order('payment_date', { ascending: false });
            
        if (error) throw error;
        
        const tableBody = document.querySelector('#paymentsTable tbody');
        if (tableBody) {
            tableBody.innerHTML = '';
            
            if (payments && payments.length > 0) {
                // Store payments for search
                window.paymentsList = payments;
                
                payments.forEach(payment => {
                    const row = document.createElement('tr');
                    const statusClass = payment.payment_status === 'completed' ? 'success' : 
                                      payment.payment_status === 'pending' ? 'warning' : 'danger';
                    
                    row.innerHTML = `
                        <td>${payment.id}</td>
                        <td>${payment.member_id || 'N/A'}</td>
                        <td>₹${payment.amount || '0'}</td>
                        <td>${payment.currency || 'INR'}</td>
                        <td><span class="badge badge-${statusClass}">${payment.payment_status || 'unknown'}</span></td>
                        <td>${new Date(payment.payment_date).toLocaleDateString()}</td>
                        <td>${payment.collected_by || 'N/A'}</td>
                    `;
                    tableBody.appendChild(row);
                });
            } else {
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No payments found</td></tr>';
            }
        }
        
        // Setup payment search
        setupPaymentFilters();
        
    } catch (error) {
        console.error('Error loading payments:', error);
        showToast('Error loading payment list', 'error');
    }
}

function setupPaymentFilters() {
    const searchBtn = document.getElementById('searchPayments');
    const resetBtn = document.getElementById('resetPayments');
    const searchInput = document.getElementById('paymentSearch');
    const dateFrom = document.getElementById('paymentDateFrom');
    const dateTo = document.getElementById('paymentDateTo');
    const districtSelect = document.getElementById('paymentDistrict');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', filterPayments);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            if (searchInput) searchInput.value = '';
            if (dateFrom) dateFrom.value = '';
            if (dateTo) dateTo.value = '';
            if (districtSelect) districtSelect.value = '';
            loadPaymentList();
        });
    }
}

function filterPayments() {
    if (!window.paymentsList) return;
    
    const searchTerm = document.getElementById('paymentSearch')?.value.toLowerCase() || '';
    const dateFrom = document.getElementById('paymentDateFrom')?.value;
    const dateTo = document.getElementById('paymentDateTo')?.value;
    const district = document.getElementById('paymentDistrict')?.value;
    
    const filtered = window.paymentsList.filter(payment => {
        let match = true;
        
        // Search term
        if (searchTerm) {
            match = match && (
                payment.id.toString().includes(searchTerm) ||
                (payment.member_id && payment.member_id.toLowerCase().includes(searchTerm)) ||
                (payment.collected_by && payment.collected_by.toLowerCase().includes(searchTerm))
            );
        }
        
        // Date range
        if (dateFrom) {
            match = match && (new Date(payment.payment_date) >= new Date(dateFrom));
        }
        if (dateTo) {
            match = match && (new Date(payment.payment_date) <= new Date(dateTo));
        }
        
        // District
        if (district) {
            match = match && (payment.district === district);
        }
        
        return match;
    });
    
    const tableBody = document.querySelector('#paymentsTable tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (filtered.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No matching payments found</td></tr>';
        return;
    }
    
    filtered.forEach(payment => {
        const row = document.createElement('tr');
        const statusClass = payment.payment_status === 'completed' ? 'success' : 
                          payment.payment_status === 'pending' ? 'warning' : 'danger';
        
        row.innerHTML = `
            <td>${payment.id}</td>
            <td>${payment.member_id || 'N/A'}</td>
            <td>₹${payment.amount || '0'}</td>
            <td>${payment.currency || 'INR'}</td>
            <td><span class="badge badge-${statusClass}">${payment.payment_status || 'unknown'}</span></td>
            <td>${new Date(payment.payment_date).toLocaleDateString()}</td>
            <td>${payment.collected_by || 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });
}

// ============================================
// 9. VALIDATION SYSTEM
// ============================================

async function validateMemberCard() {
    const cardIdInput = document.getElementById('cardId');
    if (!cardIdInput) return;
    
    const cardId = cardIdInput.value.trim();
    if (!cardId) {
        showToast('Please enter a Member ID', 'warning');
        return;
    }
    
    try {
        const { data: member, error } = await supabase
            .from('members')
            .select('*')
            .eq('member_id', cardId)
            .single();
            
        if (error) {
            if (error.code === 'PGRST116') {
                showValidationResult(false, 'Member not found');
            } else {
                throw error;
            }
            return;
        }
        
        // Check if membership is active
        const today = new Date();
        const expiryDate = new Date(member.expiry_date);
        const isActive = member.status === 'active' && expiryDate >= today;
        
        showValidationResult(true, member, isActive);
        
    } catch (error) {
        console.error('Validation error:', error);
        showToast('Validation error: ' + error.message, 'error');
    }
}

function showValidationResult(success, data, isActive = false) {
    const resultDiv = document.getElementById('validationResult');
    if (!resultDiv) return;
    
    if (success && data) {
        const expiryDate = new Date(data.expiry_date);
        const daysRemaining = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        
        resultDiv.innerHTML = `
            <div class="card ${isActive ? 'border-success' : 'border-danger'}">
                <div class="card-header ${isActive ? 'bg-success' : 'bg-danger'} text-white">
                    <h5 class="mb-0">
                        <i class="fas fa-${isActive ? 'check-circle' : 'times-circle'} me-2"></i>
                        ${isActive ? 'VALID MEMBER CARD' : 'INVALID/EXPIRED CARD'}
                    </h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4 text-center">
                            ${data.applicant_photo_url ? 
                                `<img src="${data.applicant_photo_url}" alt="Member Photo" class="img-fluid rounded" style="max-height: 150px;">` :
                                `<div class="text-muted">No photo available</div>`
                            }
                        </div>
                        <div class="col-md-8">
                            <table class="table table-sm">
                                <tr><th>Member ID:</th><td>${data.member_id}</td></tr>
                                <tr><th>Name:</th><td>${data.name}</td></tr>
                                <tr><th>Father's Name:</th><td>${data.father_name || 'N/A'}</td></tr>
                                <tr><th>Phone:</th><td>${data.contact_number || 'N/A'}</td></tr>
                                <tr><th>Status:</th>
                                    <td>
                                        <span class="badge badge-${isActive ? 'success' : 'danger'}">
                                            ${isActive ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </td>
                                </tr>
                                <tr><th>Expiry Date:</th><td>${expiryDate.toLocaleDateString()}</td></tr>
                                <tr><th>Days Remaining:</th>
                                    <td>
                                        <span class="badge ${daysRemaining > 30 ? 'badge-success' : daysRemaining > 0 ? 'badge-warning' : 'badge-danger'}">
                                            ${daysRemaining} days
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        resultDiv.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${data || 'Validation failed'}
            </div>
        `;
    }
    
    resultDiv.style.display = 'block';
}

// ============================================
// 10. PROFILE MANAGEMENT
// ============================================

function loadProfileData() {
    if (!window.currentUserData) return;
    
    const user = window.currentUserData;
    
    // Populate form fields
    const nameField = document.getElementById('profileName');
    const fatherField = document.getElementById('profileFatherName');
    const dobField = document.getElementById('profileDOB');
    const phoneField = document.getElementById('profilePhone');
    const emailField = document.getElementById('profileEmail');
    const addressField = document.getElementById('profileAddress');
    
    if (nameField) nameField.value = user.name || '';
    if (fatherField) fatherField.value = user.father_name || '';
    if (dobField && user.date_of_birth) dobField.value = user.date_of_birth;
    if (phoneField) phoneField.value = user.phone || '';
    if (emailField) emailField.value = user.email || '';
    if (addressField) addressField.value = user.address || '';
}

async function updateProfile() {
    try {
        const form = document.getElementById('profileForm');
        if (!form || !window.currentUser) return;
        
        const formData = new FormData(form);
        const updateData = {
            name: formData.get('profileName'),
            father_name: formData.get('profileFatherName'),
            date_of_birth: formData.get('profileDOB') || null,
            phone: formData.get('profilePhone'),
            address: formData.get('profileAddress'),
            updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
            .from('employees')
            .update(updateData)
            .eq('email', window.currentUser.email);
            
        if (error) throw error;
        
        // Update global user data
        window.currentUserData = { ...window.currentUserData, ...updateData };
        window.currentUser.name = updateData.name;
        updateUIForRole();
        
        showToast('Profile updated successfully!', 'success');
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Error updating profile', 'error');
    }
}

async function changePassword() {
    try {
        const currentPassword = document.getElementById('currentPassword')?.value;
        const newPassword = document.getElementById('newPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast('Please fill all password fields', 'warning');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match', 'warning');
            return;
        }
        
        if (newPassword.length < 6) {
            showToast('New password must be at least 6 characters', 'warning');
            return;
        }
        
        // Update password in employees table
        const { error: updateError } = await supabase
            .from('employees')
            .update({ password: newPassword })
            .eq('email', window.currentUser.email);
            
        if (updateError) throw updateError;
        
        // Update auth password
        const { error: authError } = await supabase.auth.updateUser({
            password: newPassword
        });
        
        if (authError) {
            console.warn('Auth password update warning:', authError);
            // Continue even if auth update fails
        }
        
        // Clear form
        document.getElementById('changePasswordForm').reset();
        
        showToast('Password changed successfully!', 'success');
        
    } catch (error) {
        console.error('Error changing password:', error);
        showToast('Error changing password', 'error');
    }
}


// ============================================
// 12. EVENT LISTENERS & INITIALIZATION
// ============================================

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                // Show loading
                $('#loginForm button').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Signing In...');
                
                if (error) throw error;
                
                showToast('Login successful!', 'success');
                
            } catch (error) {
                console.error('Login error:', error);
                showToast('Login failed: ' + error.message, 'error');
            }
        });
    }
    
    // Forgot password
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('forgotPasswordSection').style.display = 'block';
        });
    }
    
    const backToLogin = document.getElementById('backToLogin');
    if (backToLogin) {
        backToLogin.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('forgotPasswordSection').style.display = 'none';
        });
    }
    
    // Send reset link
    const sendResetLink = document.getElementById('sendResetLink');
    if (sendResetLink) {
        sendResetLink.addEventListener('click', async function() {
            const email = document.getElementById('resetEmail').value;
            
            if (!email) {
                showToast('Please enter your email', 'warning');
                return;
            }
            
            try {
                const { error } = await supabase.auth.resetPasswordForEmail(email);
                if (error) throw error;
                
                showToast('Password reset link sent to your email', 'success');
                document.getElementById('forgotPasswordSection').style.display = 'none';
                
            } catch (error) {
                console.error('Reset password error:', error);
                showToast('Error sending reset link', 'error');
            }
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
                
                showToast('Logged out successfully', 'info');
                
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }
    
    
    
    // Add Employee
    const saveEmployeeBtn = document.getElementById('saveEmployeeBtn');
    if (saveEmployeeBtn) {
        saveEmployeeBtn.addEventListener('click', addEmployee);
    }
    
    // Reset Employee Form
    const resetEmployeeFormBtn = document.getElementById('resetEmployeeFormBtn');
    if (resetEmployeeFormBtn) {
        resetEmployeeFormBtn.addEventListener('click', resetEmployeeForm);
    }
    
    // Add Member
    const saveMemberBtn = document.getElementById('saveMemberBtn');
    if (saveMemberBtn) {
        saveMemberBtn.addEventListener('click', addMember);
    }
    
    // Reset Member Form
    const resetMemberFormBtn = document.getElementById('resetMemberFormBtn');
    if (resetMemberFormBtn) {
        resetMemberFormBtn.addEventListener('click', resetMemberForm);
    }
    
    // Validation
    const validateBtn = document.getElementById('validateBtn');
    if (validateBtn) {
        validateBtn.addEventListener('click', validateMemberCard);
    }
    
    // Profile forms
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateProfile();
        });
    }
    
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            changePassword();
        });
    }

}

// ============================================
// 13. MAIN INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Global Health System initializing...');
    
    // Initialize Supabase auth
    await initializeAuth();
    
    // Setup all event listeners
    setupEventListeners();
    
    // Initialize AdminLTE components
    if (typeof $.fn.AdminLTE !== 'undefined') {
        $('body').AdminLTE();
    }
    
    console.log('Global Health System initialized successfully!');
});

// ============================================
// EXPORT FUNCTIONS FOR HTML USE
// ============================================

// Make functions available globally
window.addEmployee = addEmployee;
window.resetEmployeeForm = resetEmployeeForm;
window.addMember = addMember;
window.resetMemberForm = resetMemberForm;
window.validateMemberCard = validateMemberCard;
window.viewMember = viewMember;
window.renewMember = renewMember;
window.generateMemberCard = generateMemberCard;
window.viewEmployee = viewEmployee;
window.editEmployee = editEmployee;
window.deleteEmployee = deleteEmployee;
window.updateProfile = updateProfile;
window.changePassword = changePassword;

// CSV Export helper
window.exportToCSV = function(filename, data) {
    if (!data || data.length === 0) {
        showToast('No data to export', 'warning');
        return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('CSV exported successfully', 'success');
};