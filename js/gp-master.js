// gp-master.js - Complete GP CRUD with Block Cascade

// Load GPs with block and district information
async function loadGPs(page = 1, search = '', blockId = '', districtId = '') {
    try {
        const tbody = document.querySelector('#gpsTable tbody');
        const pagination = document.getElementById('gpPagination');
        
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
        
        // Build query with joins
        let query = supabase
            .from('gps')
            .select(`
                *,
                blocks (
                    id,
                    name,
                    district_id,
                    districts (
                        id,
                        name
                    )
                )
            `, { count: 'exact' });
        
        // Add filters
        if (search) {
            query = query.ilike('gps.name', `%${search}%`);
        }
        if (blockId) {
            query = query.eq('block_id', blockId);
        }
        if (districtId) {
            // Filter by district through block
            query = query.eq('blocks.district_id', districtId);
        }
        
        // Add pagination
        const from = (page - 1) * 10;
        const to = from + 9;
        query = query.order('name').range(from, to);
        
        const { data: gps, error, count } = await query;
        
        if (error) throw error;
        
        // Update table
        if (!gps || gps.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="alert alert-info mb-0">
                            <i class="fas fa-info-circle me-2"></i>
                            No GPs found
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = gps.map(gp => `
            <tr>
                <td>${gp.id}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="fas fa-home text-success me-2"></i>
                        ${gp.name}
                    </div>
                </td>
                <td>
                    <span class="badge badge-warning">
                        <i class="fas fa-layer-group me-1"></i>
                        ${gp.blocks?.name || 'N/A'}
                    </span>
                </td>
                <td>
                    <span class="badge badge-primary">
                        <i class="fas fa-map-marker-alt me-1"></i>
                        ${gp.blocks?.districts?.name || 'N/A'}
                    </span>
                </td>
                <td>
                    <span class="badge badge-info">
                        <i class="fas fa-calendar me-1"></i>
                        ${new Date(gp.created_at).toLocaleDateString()}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="editGP(${gp.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteGP(${gp.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn btn-outline-info" onclick="viewGPDetails(${gp.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Update pagination
        updateGPPagination(pagination, page, count, search, blockId, districtId);
        
    } catch (error) {
        console.error('Error loading GPs:', error);
        const tbody = document.querySelector('#gpsTable tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error loading GPs: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Load blocks for dropdown with cascade
async function loadBlocksForGPs(districtId = '') {
    try {
        let query = supabase
            .from('blocks')
            .select(`
                id,
                name,
                district_id,
                districts (
                    name
                )
            `)
            .order('name');
        
        if (districtId) {
            query = query.eq('district_id', districtId);
        }
        
        const { data: blocks, error } = await query;
        
        if (error) throw error;
        
        const select = document.getElementById('gpBlock');
        const editSelect = document.getElementById('editGPBlock');
        const filterSelect = document.getElementById('gpBlockFilter');
        
        const options = blocks.map(b => 
            `<option value="${b.id}" data-district="${b.district_id}">
                ${b.name} (${b.districts?.name || 'N/A'})
            </option>`
        ).join('');
        
        const baseOption = '<option value="">Select Block</option>';
        
        if (select) select.innerHTML = baseOption + options;
        if (editSelect) editSelect.innerHTML = baseOption + options;
        if (filterSelect) filterSelect.innerHTML = '<option value="">All Blocks</option>' + options;
        
    } catch (error) {
        console.error('Error loading blocks for GPs:', error);
    }
}

// Load districts for filter
async function loadDistrictsForGPs() {
    try {
        const { data: districts, error } = await supabase
            .from('districts')
            .select('id, name')
            .order('name');
            
        if (error) throw error;
        
        const filterSelect = document.getElementById('gpDistrictFilter');
        
        const options = districts.map(d => 
            `<option value="${d.id}">${d.name}</option>`
        ).join('');
        
        filterSelect.innerHTML = '<option value="">All Districts</option>' + options;
        
    } catch (error) {
        console.error('Error loading districts for GPs:', error);
    }
}

// Add new GP
window.addGP = async function() {
    // Load blocks first
    await loadBlocksForGPs();
    
    // Reset form
    document.getElementById('gpForm').reset();
    $('#addGPModal').modal('show');
};

// Save GP
document.getElementById('saveGPBtn')?.addEventListener('click', async function() {
    try {
        const name = document.getElementById('gpName').value.trim();
        const blockId = document.getElementById('gpBlock').value;
        
        if (!name || !blockId) {
            alert('Please fill all required fields');
            return;
        }
        
        // Check if GP already exists in this block
        const { data: existing } = await supabase
            .from('gps')
            .select('id')
            .eq('name', name)
            .eq('block_id', blockId)
            .maybeSingle();
            
        if (existing) {
            alert('GP with this name already exists in selected block!');
            return;
        }
        
        const { error } = await supabase
            .from('gps')
            .insert([{ 
                name: name,
                block_id: blockId,
                created_at: new Date().toISOString()
            }]);
            
        if (error) throw error;
        
        showToast('✅ GP added successfully!', 'success');
        $('#addGPModal').modal('hide');
        loadGPs();
        
        // Refresh GP dropdowns in other forms
        refreshGPDropdowns();
        
    } catch (error) {
        console.error('Error saving GP:', error);
        showToast(`❌ Error: ${error.message}`, 'error');
    }
});

// Edit GP
window.editGP = async function(id) {
    try {
        const { data: gp, error } = await supabase
            .from('gps')
            .select(`
                *,
                blocks (
                    district_id
                )
            `)
            .eq('id', id)
            .single();
            
        if (error) throw error;
        
        // Load blocks for selected district
        const districtId = gp.blocks?.district_id;
        if (districtId) {
            await loadBlocksForGPs(districtId);
        } else {
            await loadBlocksForGPs();
        }
        
        // Fill edit form
        document.getElementById('editGPId').value = gp.id;
        document.getElementById('editGPName').value = gp.name;
        document.getElementById('editGPBlock').value = gp.block_id;
        
        // Show modal
        $('#editGPModal').modal('show');
        
    } catch (error) {
        console.error('Error loading GP:', error);
        showToast(`❌ Error loading GP: ${error.message}`, 'error');
    }
};

// Update GP
document.getElementById('updateGPBtn')?.addEventListener('click', async function() {
    try {
        const id = document.getElementById('editGPId').value;
        const name = document.getElementById('editGPName').value.trim();
        const blockId = document.getElementById('editGPBlock').value;
        
        if (!name || !blockId) {
            alert('Please fill all required fields');
            return;
        }
        
        const { error } = await supabase
            .from('gps')
            .update({ 
                name: name,
                block_id: blockId,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);
            
        if (error) throw error;
        
        showToast('✅ GP updated successfully!', 'success');
        $('#editGPModal').modal('hide');
        loadGPs();
        
        // Refresh GP dropdowns in other forms
        refreshGPDropdowns();
        
    } catch (error) {
        console.error('Error updating GP:', error);
        showToast(`❌ Error: ${error.message}`, 'error');
    }
});

// Delete GP with confirmation
window.deleteGP = async function(id) {
    try {
        // Check if GP has any members
        const { data: members, error: membersError } = await supabase
            .from('members')
            .select('id')
            .eq('gp_id', id)
            .limit(1);
            
        if (membersError) throw membersError;
        
        if (members && members.length > 0) {
            if (!confirm('This GP has members assigned! Are you sure you want to delete it? Members will lose GP reference.')) {
                return;
            }
        } else {
            if (!confirm('Are you sure you want to delete this GP?')) {
                return;
            }
        }
        
        const { error } = await supabase
            .from('gps')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        showToast('✅ GP deleted successfully!', 'success');
        loadGPs();
        
        // Refresh GP dropdowns in other forms
        refreshGPDropdowns();
        
    } catch (error) {
        console.error('Error deleting GP:', error);
        showToast(`❌ Error: ${error.message}`, 'error');
    }
};

// View GP details
window.viewGPDetails = async function(id) {
    try {
        // Get GP with block and district
        const { data: gp, error: gpError } = await supabase
            .from('gps')
            .select(`
                *,
                blocks (
                    id,
                    name,
                    district_id,
                    districts (
                        id,
                        name
                    )
                )
            `)
            .eq('id', id)
            .single();
            
        if (gpError) throw gpError;
        
        // Get member count in this GP
        const { data: members, error: membersError } = await supabase
            .from('members')
            .select('id, name, contact_number, join_date')
            .eq('gp_id', id)
            .order('join_date', { ascending: false })
            .limit(10);
            
        if (membersError) throw membersError;
        
        // Show details in modal
        document.getElementById('gpDetailName').textContent = gp.name;
        document.getElementById('gpDetailId').textContent = gp.id;
        document.getElementById('gpDetailBlock').textContent = 
            gp.blocks?.name || 'N/A';
        document.getElementById('gpDetailDistrict').textContent = 
            gp.blocks?.districts?.name || 'N/A';
        document.getElementById('gpDetailCreated').textContent = 
            new Date(gp.created_at).toLocaleDateString();
        document.getElementById('gpDetailMembers').textContent = 
            members ? members.length : 0;
        
        // Populate members list
        const membersList = document.getElementById('gpMembersList');
        if (members && members.length > 0) {
            membersList.innerHTML = members.map(member => `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <i class="fas fa-user text-primary me-2"></i>
                            <strong>${member.name}</strong>
                            <br>
                            <small class="text-muted">${member.contact_number}</small>
                        </div>
                        <small class="text-muted">
                            Joined: ${new Date(member.join_date).toLocaleDateString()}
                        </small>
                    </div>
                </div>
            `).join('');
        } else {
            membersList.innerHTML = `
                <div class="alert alert-info mb-0">
                    <i class="fas fa-info-circle me-2"></i>
                    No members found in this GP
                </div>
            `;
        }
        
        $('#gpDetailModal').modal('show');
        
    } catch (error) {
        console.error('Error loading GP details:', error);
        showToast(`❌ Error: ${error.message}`, 'error');
    }
};

// Export GPs to CSV
window.exportGPs = async function() {
    try {
        const { data: gps, error } = await supabase
            .from('gps')
            .select(`
                *,
                blocks (
                    name,
                    districts (
                        name
                    )
                )
            `)
            .order('name');
            
        if (error) throw error;
        
        if (!gps || gps.length === 0) {
            alert('No GPs to export');
            return;
        }
        
        // Convert to CSV
        const headers = ['ID', 'Name', 'Block', 'District', 'Created At'];
        const csv = [
            headers.join(','),
            ...gps.map(gp => [
                gp.id,
                `"${gp.name.replace(/"/g, '""')}"`,
                `"${(gp.blocks?.name || '').replace(/"/g, '""')}"`,
                `"${(gp.blocks?.districts?.name || '').replace(/"/g, '""')}"`,
                new Date(gp.created_at).toISOString()
            ].join(','))
        ].join('\n');
        
        // Create download link
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gps_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('✅ GPs exported successfully!', 'success');
        
    } catch (error) {
        console.error('Error exporting GPs:', error);
        showToast(`❌ Error: ${error.message}`, 'error');
    }
};

// Search and filter GPs
function setupGPFilters() {
    const searchInput = document.getElementById('gpSearch');
    const blockFilter = document.getElementById('gpBlockFilter');
    const districtFilter = document.getElementById('gpDistrictFilter');
    
    searchInput?.addEventListener('input', function() {
        applyGPFilters();
    });
    
    blockFilter?.addEventListener('change', function() {
        applyGPFilters();
    });
    
    districtFilter?.addEventListener('change', function() {
        const districtId = this.value;
        loadBlocksForGPs(districtId);
        applyGPFilters();
    });
}

function applyGPFilters() {
    const search = document.getElementById('gpSearch')?.value.trim() || '';
    const blockId = document.getElementById('gpBlockFilter')?.value || '';
    const districtId = document.getElementById('gpDistrictFilter')?.value || '';
    
    loadGPs(1, search, blockId, districtId);
}

// Pagination helper
function updateGPPagination(element, currentPage, totalCount, search = '', blockId = '', districtId = '') {
    if (!element || !totalCount) return;
    
    const itemsPerPage = 10;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    
    let html = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadGPs(${currentPage - 1}, '${search}', '${blockId}', '${districtId}')">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="loadGPs(${i}, '${search}', '${blockId}', '${districtId}')">
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
            <a class="page-link" href="#" onclick="loadGPs(${currentPage + 1}, '${search}', '${blockId}', '${districtId}')">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;
    
    element.innerHTML = html;
}

// Refresh GP dropdowns in other forms
async function refreshGPDropdowns() {
    // Refresh in member form
    if (typeof loadGpOptions === 'function') {
        // Get all block IDs to refresh
        const { data: blocks } = await supabase
            .from('blocks')
            .select('id');
            
        if (blocks) {
            for (const block of blocks) {
                // This will refresh cache
                await loadGpOptions('memberGPId', block.id);
                await loadGpOptions('empGP', block.id);
            }
        }
    }
}

// Initialize when GP master section is loaded
if (document.getElementById('gpMasterSection')) {
    loadGPs();
    loadBlocksForGPs();
    loadDistrictsForGPs();
    setupGPFilters();
}