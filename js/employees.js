// Employee management functions

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
        resetEmployeeForm();
        loadEmployees();

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

// Edit employee
window.editEmployee = async function(id) {
    try {
        const { data: emp, error } = await supabase
            .from('employees')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;

        // Fill the Add/Edit Employee modal
        document.getElementById('empName').value = emp.name || '';
        document.getElementById('empFatherName').value = emp.father_name || '';
        document.getElementById('empEmail').value = emp.email || '';
        document.getElementById('empPhone').value = emp.phone || '';
        document.getElementById('empRole').value = emp.role || 'employee';
        document.getElementById('empAddress').value = emp.address || '';
        document.getElementById('empPassword').value = '';

        // Show the modal
        $('#addEmployeeModal').modal('show');

        // Change Save button temporarily into Update mode
        const saveBtn = document.getElementById('saveEmployeeBtn');
        const originalText = saveBtn.textContent;

        saveBtn.textContent = 'Update Employee';
        saveBtn.onclick = null;

        saveBtn.addEventListener('click', async function updateHandler() {
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
                resetEmployeeForm();

                // restore Save button state
                saveBtn.textContent = originalText;
                saveBtn.onclick = saveEmployee;
                saveBtn.removeEventListener('click', updateHandler);

                // reload table
                loadEmployees();
            } catch (e) {
                alert('Error updating employee: ' + (e.message || e));
            }
        }, { once: true });

    } catch (e) {
        alert('Cannot load employee: ' + (e.message || e));
    }
};

// Delete employee
window.deleteEmployee = async function(id) {
    try {
        if (!confirm('Are you sure you want to delete this employee?')) return;

        const { error } = await supabase
            .from('employees')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert('Employee deleted');
        loadEmployees();
    } catch (e) {
        alert('Error deleting employee: ' + (e.message || e));
    }
};