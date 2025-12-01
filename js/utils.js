// utils.js
// Utility functions used across the application

// Cascade dropdown functions
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

// Form reset functions
function resetMemberForm() {
    if (confirm('Are you sure you want to reset the member registration form? All entered data will be lost.')) {
        document.getElementById('addMemberForm').reset();
        document.getElementById('familyBody').innerHTML = '';
        document.getElementById('memberDistrictId').innerHTML = '<option value="">Select District</option>';
        document.getElementById('memberBlockId').innerHTML = '<option value="">Select Block</option>';
        document.getElementById('memberBlockId').disabled = true;
        document.getElementById('memberGPId').innerHTML = '<option value="">Select GP</option>';
        document.getElementById('memberGPId').disabled = true;
        loadDistrictOptions('memberDistrictId', true);
        console.log('Member form reset successfully.');
    }
}

function resetEmployeeForm() {
    if (confirm('Are you sure you want to reset the employee form?')) {
        document.getElementById('addEmployeeForm').reset();
        document.getElementById('empDistrict').innerHTML = '<option value="">Select District</option>';
        document.getElementById('empBlock').innerHTML = '<option value="">Select Block</option>';
        document.getElementById('empBlock').disabled = true;
        document.getElementById('empGP').innerHTML = '<option value="">Select GP</option>';
        document.getElementById('empGP').disabled = true;
        loadDistrictOptions('empDistrict', true);
        console.log('Employee form reset successfully.');
    }
}

// Setup cascade dropdowns
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

// Family member handlers
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

// Export functions
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