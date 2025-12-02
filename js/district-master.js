// district-master.js - Complete District CRUD with CSV Export

// Load districts with pagination and search
async function loadDistricts(page = 1, search = '') {
    try {
        const tbody = document.querySelector('#districtsTable tbody');
        const pagination = document.getElementById('districtPagination');
        
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';
        
        // Build query
        let query = supabase
            .from('districts')
            .select('*', { count: 'exact' });
        
        // Add search filter
        if (search) {
            query = query.ilike('name', `%${search}%`);
        }
        
        // Add pagination (10 items per page)
        const from = (page - 1) * 10;
        const to = from + 9;
        query = query.order('name').range(from, to);
        
        const { data: districts, error, count } = await query;
        
        if (error) throw error;
        
        // Update table
        if (!districts || districts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">
                        <div class="alert alert-info mb-0">
                            <i class="fas fa-info-circle me-2"></i>
                            No districts found
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = districts.map(district => `
            <tr>
                <td>${district.id}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="fas fa-map-marker-alt text-primary me-2"></i>
                        ${district.name}
                    </div>
                </td>
                <td>
                    <span class="badge badge-info">
                        <i class="fas fa-calendar me-1"></i>
                        ${new Date(district.created_at).toLocaleDateString()}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="editDistrict(${district.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteDistrict(${district.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn btn-outline-info" onclick="viewDistrictDetails(${district.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Update pagination
        updateDistrictPagination(pagination, page, count, search);
        
    } catch (error) {
        console.error('Error loading districts:', error);
        const tbody = document.querySelector('#districtsTable tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error loading districts: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Add new district
window.addDistrict = async function() {
    const modal = document.getElementById('addDistrictModal');
    if (!modal) return;
    
    // Reset form
    document.getElementById('districtForm').reset();
    modal.style.display = 'block';
    modal.classList.add('show');
};

// Save district
document.getElementById('saveDistrictBtn')?.addEventListener('click', async function() {
    try {
        const name = document.getElementById('districtName').value.trim();
        
        if (!name) {
            alert('Please enter district name');
            return;
        }
        
        // Check if district already exists
        const { data: existing } = await supabase
            .from('districts')
            .select('id')
            .ilike('name', name)
            .maybeSingle();
            
        if (existing) {
            alert('District with this name already exists!');
            return;
        }
        
        const { error } = await supabase
            .from('districts')
            .insert([{ 
                name: name,
                created_at: new Date().toISOString()
            }]);
            
        if (error) throw error;
        
        showToast('✅ District added successfully!', 'success');
        $('#addDistrictModal').modal('hide');
        loadDistricts();
        
        // Refresh district dropdowns in other forms
        refreshDistrictDropdowns();
        
    } catch (error) {
        console.error('Error saving district:', error);
        showToast(`❌ Error: ${error.message}`, 'error');
    }
});

// Edit district
window.editDistrict = async function(id) {
    try {
        const { data: district, error } = await supabase
            .from('districts')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        
        // Fill edit form
        document.getElementById('editDistrictId').value = district.id;
        document.getElementById('editDistrictName').value = district.name;
        
        // Show modal
        $('#editDistrictModal').modal('show');
        
    } catch (error) {
        console.error('Error loading district:', error);
        showToast(`❌ Error loading district: ${error.message}`, 'error');
    }
};

// Update district
document.getElementById('updateDistrictBtn')?.addEventListener('click', async function() {
    try {
        const id = document.getElementById('editDistrictId').value;
        const name = document.getElementById('editDistrictName').value.trim();
        
        if (!name) {
            alert('Please enter district name');
            return;
        }
        
        const { error } = await supabase
            .from('districts')
            .update({ 
                name: name,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);
            
        if (error) throw error;
        
        showToast('✅ District updated successfully!', 'success');
        $('#editDistrictModal').modal('hide');
        loadDistricts();
        
        // Refresh district dropdowns in other forms
        refreshDistrictDropdowns();
        
    } catch (error) {
        console.error('Error updating district:', error);
        showToast(`❌ Error: ${error.message}`, 'error');
    }
});

// Delete district with confirmation
window.deleteDistrict = async function(id) {
    try {
        // Check if district has any blocks
        const { data: blocks, error: blocksError } = await supabase
            .from('blocks')
            .select('id')
            .eq('district_id', id)
            .limit(1);
            
        if (blocksError) throw blocksError;
        
        if (blocks && blocks.length > 0) {
            if (!confirm('This district has blocks assigned! Deleting it will also delete all blocks and GPs. Are you sure?')) {
                return;
            }
        } else {
            if (!confirm('Are you sure you want to delete this district?')) {
                return;
            }
        }
        
        const { error } = await supabase
            .from('districts')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        showToast('✅ District deleted successfully!', 'success');
        loadDistricts();
        
        // Refresh district dropdowns in other forms
        refreshDistrictDropdowns();
        
    } catch (error) {
        console.error('Error deleting district:', error);
        showToast(`❌ Error: ${error.message}`, 'error');
    }
};

// View district details
window.viewDistrictDetails = async function(id) {
    try {
        // Get district with block count
        const { data: district, error: districtError } = await supabase
            .from('districts')
            .select('*')
            .eq('id', id)
            .single();
            
        if (districtError) throw districtError;
        
        // Get blocks in this district
        const { data: blocks, error: blocksError } = await supabase
            .from('blocks')
            .select('id, name, created_at')
            .eq('district_id', id)
            .order('name');
            
        if (blocksError) throw blocksError;
        
        // Get member count in this district
        const { data: members, error: membersError } = await supabase
            .from('members')
            .select('id')
            .eq('district_id', id);
            
        if (membersError) throw membersError;
        
        // Show details in modal
        document.getElementById('districtDetailName').textContent = district.name;
        document.getElementById('districtDetailId').textContent = district.id;
        document.getElementById('districtDetailCreated').textContent = 
            new Date(district.created_at).toLocaleDateString();
        document.getElementById('districtDetailBlocks').textContent = 
            blocks ? blocks.length : 0;
        document.getElementById('districtDetailMembers').textContent = 
            members ? members.length : 0;
        
        // Populate blocks list
        const blocksList = document.getElementById('districtBlocksList');
        if (blocks && blocks.length > 0) {
            blocksList.innerHTML = blocks.map(block => `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <i class="fas fa-layer-group text-warning me-2"></i>
                            <strong>${block.name}</strong>
                        </div>
                        <small class="text-muted">
                            ${new Date(block.created_at).toLocaleDateString()}
                        </small>
                    </div>
                </div>
            `).join('');
        } else {
            blocksList.innerHTML = `
                <div class="alert alert-info mb-0">
                    <i class="fas fa-info-circle me-2"></i>
                    No blocks found in this district
                </div>
            `;
        }
        
        $('#districtDetailModal').modal('show');
        
    } catch (error) {
        console.error('Error loading district details:', error);
        showToast(`❌ Error: ${error.message}`, 'error');
    }
};

// Export districts to CSV
window.exportDistricts = async function() {
    try {
        const { data: districts, error } = await supabase
            .from('districts')
            .select('*')
            .order('name');
            
        if (error) throw error;
        
        if (!districts || districts.length === 0) {
            alert('No districts to export');
            return;
        }
        
        // Convert to CSV
        const headers = ['ID', 'Name', 'Created At'];
        const csv = [
            headers.join(','),
            ...districts.map(d => [
                d.id,
                `"${d.name.replace(/"/g, '""')}"`,
                new Date(d.created_at).toISOString()
            ].join(','))
        ].join('\n');
        
        // Create download link
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `districts_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('✅ Districts exported successfully!', 'success');
        
    } catch (error) {
        console.error('Error exporting districts:', error);
        showToast(`❌ Error: ${error.message}`, 'error');
    }
};

// Search districts
document.getElementById('districtSearch')?.addEventListener('input', function(e) {
    const search = e.target.value.trim();
    loadDistricts(1, search);
});

// Pagination helper
function updateDistrictPagination(element, currentPage, totalCount, search = '') {
    if (!element || !totalCount) return;
    
    const itemsPerPage = 10;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    
    let html = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadDistricts(${currentPage - 1}, '${search}')">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="loadDistricts(${i}, '${search}')">
                        ${i}
                    </a>
                </li>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadDistricts(${currentPage + 1}, '${search}')">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;
    
    element.innerHTML = html;
}

// Refresh district dropdowns in other forms
async function refreshDistrictDropdowns() {
    // Refresh in member form
    if (typeof loadDistrictOptions === 'function') {
        await loadDistrictOptions('memberDistrictId');
        await loadDistrictOptions('empDistrict');
        await loadDistrictOptions('editDistrict');
    }
}

// Initialize when district master section is loaded
if (document.getElementById('districtMasterSection')) {
    loadDistricts();
}