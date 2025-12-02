// utils.js - Utility functions

// Setup cascade dropdowns for District -> Block -> GP
window.setupCascadeDropdowns = function() {
    console.log('Setting up cascade dropdowns...');
    
    // District dropdown change event
    document.addEventListener('change', function(e) {
        if (e.target && e.target.id === 'memberDistrictId') {
            const districtId = e.target.value;
            loadBlockOptions('memberBlockId', districtId);
        } else if (e.target && e.target.id === 'memberBlockId') {
            const blockId = e.target.value;
            loadGpOptions('memberGPId', blockId);
        } else if (e.target && e.target.id === 'empDistrict') {
            const districtId = e.target.value;
            loadBlockOptions('empBlock', districtId);
        } else if (e.target && e.target.id === 'empBlock') {
            const blockId = e.target.value;
            loadGpOptions('empGP', blockId);
        }
    });
};

// Load district options
window.loadDistrictOptions = async function(selectId, preselect = false) {
    try {
        const { data: districts, error } = await supabase
            .from('districts')
            .select('id, name')
            .order('name');
            
        if (error) throw error;
        
        const select = document.getElementById(selectId);
        if (!select) return;
        
        select.innerHTML = '<option value="">Select District</option>';
        districts.forEach(district => {
            const option = document.createElement('option');
            option.value = district.id;
            option.textContent = district.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading districts:', error);
    }
};

// Load block options based on district
window.loadBlockOptions = async function(selectId, districtId, preselect = false) {
    if (!districtId) {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Select District First</option>';
        }
        return;
    }
    
    try {
        const { data: blocks, error } = await supabase
            .from('blocks')
            .select('id, name')
            .eq('district_id', districtId)
            .order('name');
            
        if (error) throw error;
        
        const select = document.getElementById(selectId);
        if (!select) return;
        
        select.innerHTML = '<option value="">Select Block</option>';
        blocks.forEach(block => {
            const option = document.createElement('option');
            option.value = block.id;
            option.textContent = block.name;
            select.appendChild(option);
        });

        
    } catch (error) {
        console.error('Error loading blocks:', error);
    }
};

// Load GP options based on block
window.loadGpOptions = async function(selectId, blockId, preselect = false) {
    if (!blockId) {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Select Block First</option>';
        }
        return;
    }
    
    try {
        const { data: gps, error } = await supabase
            .from('gps')
            .select('id, name')
            .eq('block_id', blockId)
            .order('name');
            
        if (error) throw error;
        
        const select = document.getElementById(selectId);
        if (!select) return;
        
        select.innerHTML = '<option value="">Select GP</option>';
        gps.forEach(gp => {
            const option = document.createElement('option');
            option.value = gp.id;
            option.textContent = gp.name;
            select.appendChild(option);
        });


    } catch (error) {
        console.error('Error loading GPs:', error);
    }
};

// Setup family member handlers
window.setupFamilyMemberHandlers = function() {
    console.log('Setting up family member handlers...');
    
    const addFamilyBtn = document.getElementById('addFamilyBtn');
    const familyBody = document.getElementById('familyBody');
    
    if (!addFamilyBtn || !familyBody) return;
    
    // Add family member
    addFamilyBtn.addEventListener('click', function() {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="text" class="form-control form-control-sm fam-name" placeholder="Name" required>
            </td>
            <td>
                <input type="number" class="form-control form-control-sm fam-age" placeholder="Age" min="0" max="120" required>
            </td>
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
            <td>
                <button type="button" class="btn btn-sm btn-danger remove-family">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        `;
        familyBody.appendChild(row);
    });
    
    // Remove family member
    familyBody.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-family') || 
            e.target.closest('.remove-family')) {
            const row = e.target.closest('tr');
            if (row) {
                row.remove();
            }
        }
    });
};

// Reset member form
window.resetMemberForm = function() {
    console.log('Resetting member form...');
    const form = document.getElementById('addMemberForm');
    if (form) {
        form.reset();
        
        // Reset family members
        const familyBody = document.getElementById('familyBody');
        if (familyBody) {
            familyBody.innerHTML = '';
        }
        
        // Reset dropdowns
        const districtSelect = document.getElementById('memberDistrictId');
        const blockSelect = document.getElementById('memberBlockId');
        const gpSelect = document.getElementById('memberGPId');
        
        if (districtSelect) districtSelect.selectedIndex = 0;
        if (blockSelect) blockSelect.innerHTML = '<option value="">Select District First</option>';
        if (gpSelect) gpSelect.innerHTML = '<option value="">Select Block First</option>';
        
        alert('Member form has been reset.');
    }
};

// Reset employee form
window.resetEmployeeForm = function() {
    console.log('Resetting employee form...');
    const form = document.getElementById('addEmployeeForm');
    if (form) {
        form.reset();
        
        // Reset dropdowns
        const districtSelect = document.getElementById('empDistrict');
        const blockSelect = document.getElementById('empBlock');
        const gpSelect = document.getElementById('empGP');
        
        if (districtSelect) districtSelect.selectedIndex = 0;
        if (blockSelect) blockSelect.innerHTML = '<option value="">Select District First</option>';
        if (gpSelect) gpSelect.innerHTML = '<option value="">Select Block First</option>';
        
        alert('Employee form has been reset.');
    }
};

// Simple toast function
window.showToast = function(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`;
    toast.innerHTML = `
        ${msg}
        <button type="button" class="close" data-dismiss="alert">&times;</button>
    `;
    
    const wrapper = document.querySelector('.content') || document.body;
    wrapper.prepend(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 4000);
};