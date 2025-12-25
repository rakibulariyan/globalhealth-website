// block-master.js - Complete Block CRUD with District Cascade

// Load blocks with district information
async function loadBlocks(page = 1, search = '', districtId = '') {
    try {
        const tbody = document.querySelector('#blocksTable tbody');
        const pagination = document.getElementById('blockPagination');
        
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';
        
        // Build query with join
        let query = supabase
            .from('blocks')
            .select(`
                *,
                districts (
                    id,
                    name
                )
            `, { count: 'exact' });
        
        // Add filters
        if (search) {
            query = query.ilike('blocks.name', `%${search}%`);
        }
        if (districtId) {
            query = query.eq('district_id', districtId);
        }
        
        // Add pagination
        const from = (page - 1) * 10;
        const to = from + 9;
        query = query.order('name').range(from, to);
        
        const { data: blocks, error, count } = await query;
        
        if (error) throw error;
        
        // Update table
        if (!blocks || blocks.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        <div class="alert alert-info mb-0">
                            <i class="fas fa-info-circle me-2"></i>
                            No blocks found
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = blocks.map(block => `
            <tr>
                <td>${block.id}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="fas fa-layer-group text-warning me-2"></i>
                        ${block.name}
                    </div>
                </td>
                <td>
                    <span class="badge badge-primary">
                        <i class="fas fa-map-marker-alt me-1"></i>
                        ${block.districts?.name || 'N/A'}
                    </span>
                </td>
                <td>
                    <span class="badge badge-info">
                        <i class="fas fa-calendar me-1"></i>
                        ${new Date(block.created_at).toLocaleDateString()}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="editBlock(${block.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteBlock(${block.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn btn-outline-info" onclick="viewBlockDetails(${block.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Update pagination
        updateBlockPagination(pagination, page, count, search, districtId);
        
    } catch (error) {
        console.error('Error loading blocks:', error);
        const tbody = document.querySelector('#blocksTable tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error loading blocks: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Load districts for dropdown
async function loadDistrictsForBlocks() {
    try {
        const { data: districts, error } = await supabase
            .from('districts')
            .select('id, name')
            .order('name');
            
        if (error) throw error;
        
        const select = document.getElementById('blockDistrict');
        const editSelect = document.getElementById('editBlockDistrict');
        const filterSelect = document.getElementById('blockDistrictFilter');
        
        const options = districts.map(d => 
            `<option value="${d.id}">${d.name}</option>`
        ).join('');
        
        const baseOption = '<option value="">All Districts</option>';
        
        if (select) select.innerHTML = baseOption + options;
        if (editSelect) editSelect.innerHTML = baseOption + options;
        if (filterSelect) filterSelect.innerHTML = baseOption + options;
        
    } catch (error) {
        console.error('Error loading districts for blocks:', error);
    }
}

// Add new block
window.addBlock = async function() {
    // Load districts first
    await loadDistrictsForBlocks();
    
    // Reset form
    document.getElementById('blockForm').reset();
    $('#addBlockModal').modal('show');
};

// Save block
document.getElementById('saveBlockBtn')?.addEventListener('click', async function() {
    try {
        const name = document.getElementById('blockName').value.trim();
        const districtId = document.getElementById('blockDistrict').value;
        
        if (!name || !districtId) {
            alert('Please fill all required fields');
            return;
        }
        
        // Check if block already exists in this district
        const { data: existing } = await supabase
            .from('blocks')
            .select('id')
            .eq('name', name)
            .eq('district_id', districtId)
            .maybeSingle();
            
        if (existing) {
            alert('Block with this name already exists in selected district!');
            return;
        }
        
        const { error } = await supabase
            .from('blocks')
            .insert([{ 
                name: name,
                district_id: districtId,
                created_at: new Date().toISOString()
            }]);
            
        if (error) throw error;
        
        showToast('✅ Block added successfully!', 'success');
        $('#addBlockModal').modal('hide');
        loadBlocks();
        
        // Refresh block dropdowns in other forms
        refreshBlockDropdowns();
        
    } catch (error) {
        console.error('Error saving block:', error);
        showToast(`❌ Error: ${error.message}`, 'error');
    }
});

// Edit block
window.editBlock = async function(id) {
    try {
        const { data: block, error } = await supabase
            .from('blocks')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        
        // Load districts for dropdown
        await loadDistrictsForBlocks();
        
        // Fill edit form
        document.getElementById('editBlockId').value = block.id;
        document.getElementById('editBlockName').value = block.name;
        document.getElementById('editBlockDistrict').value = block.district_id;
        
        // Show modal
        $('#editBlockModal').modal('show');
        
    } catch (error) {
        console.error('Error loading block:', error);
        showToast(`❌ Error loading block: ${error.message}`, 'error');
    }
};

// Update block
document.getElementById('updateBlockBtn')?.addEventListener('click', async function() {
    try {
        const id = document.getElementById('editBlockId').value;
        const name = document.getElementById('editBlockName').value.trim();
        const districtId = document.getElementById('editBlockDistrict').value;
        
        if (!name || !districtId) {
            alert('Please fill all required fields');
            return;
        }
        
        const { error } = await supabase
            .from('blocks')
            .update({ 
                name: name,
                district_id: districtId,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);
            
        if (error) throw error;
        
        showToast('✅ Block updated successfully!', 'success');
        $('#editBlockModal').modal('hide');
        loadBlocks();
        
        // Refresh block dropdowns in other forms
        refreshBlockDropdowns();
        
    } catch (error) {
        console.error('Error updating block:', error);
        showToast(`❌ Error: ${error.message}`, 'error');
    }
});

// Delete block with confirmation
window.deleteBlock = async function(id) {
    try {
        // Check if block has any GPs
        const { data: gps, error: gpsError } = await supabase
            .from('gps')
            .select('id')
            .eq('block_id', id)
            .limit(1);
            
        if (gpsError) throw gpsError;
        
        if (gps && gps.length > 0) {
            if (!confirm('This block has GPs assigned! Deleting it will also delete all GPs. Are you sure?')) {
                return;
            }
        } else {
            if (!confirm('Are you sure you want to delete this block?')) {
                return;
            }
        }
        
        const { error } = await supabase
            .from('blocks')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        showToast('✅ Block deleted successfully!', 'success');
        loadBlocks();
        
        // Refresh block dropdowns in other forms
        refreshBlockDropdowns();
        
    } catch (error) {
        console.error('Error deleting block:', error);
        showToast(`❌ Error: ${error.message}`, 'error');
    }
};

// View block details
window.viewBlockDetails = async function(id) {
    try {
        // Get block with district and GPs
        const { data: block, error: blockError } = await supabase
            .from('blocks')
            .select(`
                *,
                districts (
                    id,
                    name
                )
            `)
            .eq('id', id)
            .single();
            
        if (blockError) throw blockError;
        
        // Get GPs in this block
        const { data: gps, error: gpsError } = await supabase
            .from('gps')
            .select('id, name, created_at')
            .eq('block_id', id)
            .order('name');
            
        if (gpsError) throw gpsError;
        
        // Get member count in this block
        const { data: members, error: membersError } = await supabase
            .from('members')
            .select('id')
            .eq('block_id', id);
            
        if (membersError) throw membersError;
        
        // Show details in modal
        document.getElementById('blockDetailName').textContent = block.name;
        document.getElementById('blockDetailId').textContent = block.id;
        document.getElementById('blockDetailDistrict').textContent = 
            block.districts?.name || 'N/A';
        document.getElementById('blockDetailCreated').textContent = 
            new Date(block.created_at).toLocaleDateString();
        document.getElementById('blockDetailGPs').textContent = 
            gps ? gps.length : 0;
        document.getElementById('blockDetailMembers').textContent = 
            members ? members.length : 0;
        
        // Populate GPs list
        const gpsList = document.getElementById('blockGPsList');
        if (gps && gps.length > 0) {
            gpsList.innerHTML = gps.map(gp => `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <i class="fas fa-home text-success me-2"></i>
                            <strong>${gp.name}</strong>
                        </div>
                        <small class="text-muted">
                            ${new Date(gp.created_at).toLocaleDateString()}
                        </small>
                    </div>
                </div>
            `).join('');
        } else {
            gpsList.innerHTML = `
                <div class="alert alert-info mb-0">
                    <i class="fas fa-info-circle me-2"></i>
                    No GPs found in this block
                </div>
            `;
        }
        
        $('#blockDetailModal').modal('show');
        
    } catch (error) {
        console.error('Error loading block details:', error);
        showToast(`❌ Error: ${error.message}`, 'error');
    }
};

// Export blocks to CSV
window.exportBlocks = async function() {
    try {
        const { data: blocks, error } = await supabase
            .from('blocks')
            .select(`
                *,
                districts (
                    name
                )
            `)
            .order('name');
            
        if (error) throw error;
        
        if (!blocks || blocks.length === 0) {
            alert('No blocks to export');
            return;
        }
        
        // Convert to CSV
        const headers = ['ID', 'Name', 'District', 'Created At'];
        const csv = [
            headers.join(','),
            ...blocks.map(b => [
                b.id,
                `"${b.name.replace(/"/g, '""')}"`,
                `"${(b.districts?.name || '').replace(/"/g, '""')}"`,
                new Date(b.created_at).toISOString()
            ].join(','))
        ].join('\n');
        
        // Create download link
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `blocks_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('✅ Blocks exported successfully!', 'success');
        
    } catch (error) {
        console.error('Error exporting blocks:', error);
        showToast(`❌ Error: ${error.message}`, 'error');
    }
};

// Search and filter blocks
function setupBlockFilters() {
    const searchInput = document.getElementById('blockSearch');
    const districtFilter = document.getElementById('blockDistrictFilter');
    
    searchInput?.addEventListener('input', function(e) {
        const search = e.target.value.trim();
        const districtId = districtFilter?.value || '';
        loadBlocks(1, search, districtId);
    });
    
    districtFilter?.addEventListener('change', function(e) {
        const districtId = e.target.value;
        const search = searchInput?.value.trim() || '';
        loadBlocks(1, search, districtId);
    });
}

// Pagination helper
function updateBlockPagination(element, currentPage, totalCount, search = '', districtId = '') {
    if (!element || !totalCount) return;
    
    const itemsPerPage = 10;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    
    let html = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadBlocks(${currentPage - 1}, '${search}', '${districtId}')">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="loadBlocks(${i}, '${search}', '${districtId}')">
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
            <a class="page-link" href="#" onclick="loadBlocks(${currentPage + 1}, '${search}', '${districtId}')">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;
    
    element.innerHTML = html;
}

// Refresh block dropdowns in other forms
async function refreshBlockDropdowns() {
    // Refresh in member form
    if (typeof loadBlockOptions === 'function') {
        // Get all district IDs to refresh
        const { data: districts } = await supabase
            .from('districts')
            .select('id');
            
        if (districts) {
            for (const district of districts) {
                // This will refresh cache
                await loadBlockOptions('memberBlockId', district.id);
                await loadBlockOptions('empBlock', district.id);
            }
        }
    }
}

// Initialize when block master section is loaded
if (document.getElementById('blockMasterSection')) {
    loadBlocks();
    loadDistrictsForBlocks();
    setupBlockFilters();
}