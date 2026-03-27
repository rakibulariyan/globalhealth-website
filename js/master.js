// master.js
// Master Data module (District -> Block -> GP) - Full CRUD + Export CSV
// Requires: supabase client initialized in global `supabase` (from supabase-config.js)
// Requires: index.html contains an element with id="masterContent" and tabs with data-master attributes
// Bootstrap 4 is used for modal classes; AdminLTE style assumed.

(function () {
  // Defensive: ensure supabase exists
  if (typeof supabase === 'undefined') {
    console.error('supabase client not found. Make sure supabase-config.js is loaded before master.js');
    return;
  }

  // ---------- Helpers ----------
  function el(selector) {
    return document.querySelector(selector);
  }

  function createNode(html) {
    const div = document.createElement('div');
    div.innerHTML = html.trim();
    return div.firstChild;
  }

  function showToast(msg, type = 'success') {
    // minimal toast using alert; you can replace with better UI
    const klass = type === 'error' ? 'alert-danger' : 'alert-success';
    const toast = createNode(`<div class="alert ${klass} alert-dismissible fade show" role="alert">
      ${msg}
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">&times;</button>
    </div>`);
    const wrapper = document.querySelector('.content') || document.body;
    wrapper.prepend(toast);
    setTimeout(() => {
      try { $(toast).alert('close'); } catch (e) { toast.remove(); }
    }, 4000);
  }

  // CSV Export helper
  function downloadCSV(filename, rows) {
    if (!rows || !rows.length) {
      showToast('No data to export', 'error');
      return;
    }
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => `"${(r[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ---------- UI Templates ----------
  function masterControlsHTML(type) {
    return `
      <div class="d-flex justify-content-between mb-2">
        <div>
          <button class="btn btn-primary btn-sm" data-action="add-${type}">Add ${type === 'districts' ? 'District' : type === 'blocks' ? 'Block' : 'GP'}</button>
          <button class="btn btn-outline-success btn-sm" data-action="export-${type}">Export CSV</button>
        </div>
        <div>
          <input class="form-control form-control-sm" placeholder="Filter..." id="masterFilter" style="width:220px;display:inline-block">
        </div>
      </div>
    `;
  }

  function tableWrapperHTML(innerHtml) {
    return `
      <div class="table-responsive">
        ${innerHtml}
      </div>
    `;
  }

  // ---------- Data Loaders ----------
  async function loadDistricts() {
    const { data, error } = await supabase.from('districts').select('*').order('name');
    if (error) throw error;
    return data || [];
  }

  async function loadBlocks() {
    // include district name via foreign table
    const { data, error } = await supabase
      .from('blocks')
      .select('id, name, district_id, districts(name)')
      .order('name');
    if (error) throw error;
    return data || [];
  }

  async function loadGPs() {
    // include block and district information
    const { data, error } = await supabase
      .from('gps')
      .select('id, name, block_id, blocks(name, district_id, districts(name))')
      .order('name');
    if (error) throw error;
    return data || [];
  }

  // ---------- Renderers ----------
  async function renderDistricts(container) {
    const rows = await loadDistricts();
    let html = masterControlsHTML('districts');
    html += `<table class="table table-bordered table-striped table-sm">
      <thead class="table-secondary"><tr><th style="width:60px">ID</th><th>Name</th><th style="width:160px">Actions</th></tr></thead>
      <tbody>
      ${rows.map(r => `
        <tr data-id="${r.id}">
          <td>${r.id}</td>
          <td class="master-name">${escapeHtml(r.name)}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary" data-action="edit-district" data-id="${r.id}">Edit</button>
            <button class="btn btn-sm btn-outline-danger" data-action="delete-district" data-id="${r.id}">Delete</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
    container.innerHTML = tableWrapperHTML(html);
  }

  async function renderBlocks(container) {
    const rows = await loadBlocks();
    let html = masterControlsHTML('blocks');
    html += `<table class="table table-bordered table-striped table-sm">
      <thead class="table-secondary"><tr><th style="width:60px">ID</th><th>Block</th><th>District</th><th style="width:180px">Actions</th></tr></thead>
      <tbody>
      ${rows.map(r => `
        <tr data-id="${r.id}">
          <td>${r.id}</td>
          <td class="master-name">${escapeHtml(r.name)}</td>
          <td>${escapeHtml(r.districts ? r.districts.name : '')}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary" data-action="edit-block" data-id="${r.id}">Edit</button>
            <button class="btn btn-sm btn-outline-danger" data-action="delete-block" data-id="${r.id}">Delete</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
    container.innerHTML = tableWrapperHTML(html);
  }

  async function renderGPs(container) {
    const rows = await loadGPs();
    let html = masterControlsHTML('gps');
    html += `<table class="table table-bordered table-striped table-sm">
      <thead class="table-secondary"><tr><th style="width:60px">ID</th><th>GP Name</th><th>Block</th><th>District</th><th style="width:180px">Actions</th></tr></thead>
      <tbody>
      ${rows.map(r => `
        <tr data-id="${r.id}">
          <td>${r.id}</td>
          <td class="master-name">${escapeHtml(r.name)}</td>
          <td>${escapeHtml(r.blocks ? r.blocks.name : '')}</td>
          <td>${escapeHtml(r.blocks && r.blocks.districts ? r.blocks.districts.name : '')}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary" data-action="edit-gp" data-id="${r.id}">Edit</button>
            <button class="btn btn-sm btn-outline-danger" data-action="delete-gp" data-id="${r.id}">Delete</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
    container.innerHTML = tableWrapperHTML(html);
  }

  // ---------- CRUD Operations ----------
  async function addDistrict(name) {
    const { error } = await supabase.from('districts').insert([{ name }]);
    if (error) throw error;
  }

  async function updateDistrict(id, name) {
    const { error } = await supabase.from('districts').update({ name }).eq('id', id);
    if (error) throw error;
  }

  async function deleteDistrict(id) {
    // delete cascades to blocks/gps due to foreign key on delete cascade, but we set on delete cascade earlier.
    const { error } = await supabase.from('districts').delete().eq('id', id);
    if (error) throw error;
  }

  async function addBlock(district_id, name) {
    const { error } = await supabase.from('blocks').insert([{ district_id, name }]);
    if (error) throw error;
  }

  async function updateBlock(id, district_id, name) {
    const { error } = await supabase.from('blocks').update({ district_id, name }).eq('id', id);
    if (error) throw error;
  }

  async function deleteBlock(id) {
    const { error } = await supabase.from('blocks').delete().eq('id', id);
    if (error) throw error;
  }

  async function addGP(block_id, name) {
    const { error } = await supabase.from('gps').insert([{ block_id, name }]);
    if (error) throw error;
  }

  async function updateGP(id, block_id, name) {
    const { error } = await supabase.from('gps').update({ block_id, name }).eq('id', id);
    if (error) throw error;
  }

  async function deleteGP(id) {
    const { error } = await supabase.from('gps').delete().eq('id', id);
    if (error) throw error;
  }

  // ---------- Small helpers ----------
  function escapeHtml(s) {
    if (s === undefined || s === null) return '';
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  }

  // ---------- Modal builders ----------
  function showDistrictModal({ mode = 'add', id = null, name = '' } = {}) {
    const title = mode === 'add' ? 'Add District' : 'Edit District';
    const modalId = 'masterDistrictModal';
    const existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const html = `
      <div class="modal fade" id="${modalId}" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-sm">
          <div class="modal-content">
            <div class="modal-header healthcare-primary">
              <h5 class="modal-title">${title}</h5>
              <button type="button" class="close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
              <form id="districtForm">
                <div class="form-group">
                  <label>District Name</label>
                  <input type="text" id="districtName" class="form-control" value="${escapeHtml(name)}" required>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-dismiss="modal">Cancel</button>
              <button class="btn btn-primary" id="districtSaveBtn">${mode === 'add' ? 'Add' : 'Save'}</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    const $modal = $(`#${modalId}`);
    $modal.modal({ backdrop: 'static' });
    document.getElementById('districtSaveBtn').addEventListener('click', async () => {
      const val = document.getElementById('districtName').value.trim();
      if (!val) { showToast('Please enter district name', 'error'); return; }
      try {
        if (mode === 'add') await addDistrict(val);
        else await updateDistrict(id, val);
        $modal.modal('hide');
        showToast('District saved');
        await refreshCurrentTab();
      } catch (err) {
        showToast(err.message || 'Save failed', 'error');
        console.error(err);
      }
    });
  }

  function showBlockModal({ mode = 'add', id = null, district_id = null, name = '' } = {}) {
    const title = mode === 'add' ? 'Add Block' : 'Edit Block';
    const modalId = 'masterBlockModal';
    if (document.getElementById(modalId)) document.getElementById(modalId).remove();

    const html = `
      <div class="modal fade" id="${modalId}" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header healthcare-primary">
              <h5 class="modal-title">${title}</h5>
              <button type="button" class="close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
              <form id="blockForm">
                <div class="form-group">
                  <label>District</label>
                  <select id="blockDistrict" class="form-control"></select>
                </div>
                <div class="form-group">
                  <label>Block Name</label>
                  <input type="text" id="blockName" class="form-control" value="${escapeHtml(name)}" required>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-dismiss="modal">Cancel</button>
              <button class="btn btn-primary" id="blockSaveBtn">${mode === 'add' ? 'Add' : 'Save'}</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    const $modal = $(`#${modalId}`);
    $modal.modal({ backdrop: 'static' });

    // populate districts
    loadDistricts().then(districts => {
      const sel = document.getElementById('blockDistrict');
      sel.innerHTML = `<option value="">Select District</option>${districts.map(d => `<option value="${d.id}" ${d.id == district_id ? 'selected' : ''}>${escapeHtml(d.name)}</option>`).join('')}`;
    });

    document.getElementById('blockSaveBtn').addEventListener('click', async () => {
      const nameVal = document.getElementById('blockName').value.trim();
      const districtVal = document.getElementById('blockDistrict').value;
      if (!districtVal) { showToast('Please select district', 'error'); return; }
      if (!nameVal) { showToast('Please enter block name', 'error'); return; }
      try {
        if (mode === 'add') await addBlock(districtVal, nameVal);
        else await updateBlock(id, districtVal, nameVal);
        $modal.modal('hide');
        showToast('Block saved');
        await refreshCurrentTab();
      } catch (err) {
        showToast(err.message || 'Save failed', 'error');
        console.error(err);
      }
    });
  }

  function showGPModal({ mode = 'add', id = null, block_id = null, name = '' } = {}) {
    const title = mode === 'add' ? 'Add GP' : 'Edit GP';
    const modalId = 'masterGPModal';
    if (document.getElementById(modalId)) document.getElementById(modalId).remove();

    const html = `
      <div class="modal fade" id="${modalId}" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header healthcare-primary">
              <h5 class="modal-title">${title}</h5>
              <button type="button" class="close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
              <form id="gpForm">
                <div class="form-group">
                  <label>District</label>
                  <select id="gpDistrict" class="form-control"></select>
                </div>
                <div class="form-group">
                  <label>Block</label>
                  <select id="gpBlock" class="form-control"></select>
                </div>
                <div class="form-group">
                  <label>GP Name</label>
                  <input type="text" id="gpName" class="form-control" value="${escapeHtml(name)}" required>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-dismiss="modal">Cancel</button>
              <button class="btn btn-primary" id="gpSaveBtn">${mode === 'add' ? 'Add' : 'Save'}</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    const $modal = $(`#${modalId}`);
    $modal.modal({ backdrop: 'static' });

    // populate districts -> blocks
    loadDistricts().then(districts => {
      const sel = document.getElementById('gpDistrict');
      sel.innerHTML = `<option value="">Select District</option>${districts.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('')}`;
      if (block_id) {
        // find block's district and preselect
        supabase.from('blocks').select('id, name, district_id').eq('id', block_id).then(res => {
          if (res.data && res.data[0]) {
            const b = res.data[0];
            document.getElementById('gpDistrict').value = b.district_id;
            populateGpBlocks(b.district_id, block_id);
          }
        });
      } else {
        if (districts.length) {
          // default no preselect
          document.getElementById('gpBlock').innerHTML = '<option value="">Select Block</option>';
        }
      }
    });

    document.getElementById('gpDistrict').addEventListener('change', (e) => {
      const dId = e.target.value;
      populateGpBlocks(dId);
    });

    async function populateGpBlocks(districtId, preselectBlockId = null) {
      if (!districtId) {
        document.getElementById('gpBlock').innerHTML = '<option value="">Select Block</option>';
        return;
      }
      const { data } = await supabase.from('blocks').select('id, name').eq('district_id', districtId).order('name');
      const sel = document.getElementById('gpBlock');
      sel.innerHTML = `<option value="">Select Block</option>${data.map(b => `<option value="${b.id}" ${b.id == preselectBlockId ? 'selected' : ''}>${escapeHtml(b.name)}</option>`).join('')}`;
    }

    document.getElementById('gpSaveBtn').addEventListener('click', async () => {
      const nameVal = document.getElementById('gpName').value.trim();
      const blockVal = document.getElementById('gpBlock').value;
      if (!blockVal) { showToast('Please select block', 'error'); return; }
      if (!nameVal) { showToast('Please enter GP name', 'error'); return; }
      try {
        if (mode === 'add') await addGP(blockVal, nameVal);
        else await updateGP(id, blockVal, nameVal);
        $modal.modal('hide');
        showToast('GP saved');
        await refreshCurrentTab();
      } catch (err) {
        showToast(err.message || 'Save failed', 'error');
        console.error(err);
      }
    });
  }

  // ---------- Event Delegation for Master content ----------
  async function masterActionHandler(e) {
    const el = e.target.closest('button');
    if (!el) return;
    const action = el.dataset.action;
    if (!action) return;
    // get current active master tab
    const active = document.querySelector('#masterTabs .nav-link.active');
    const activeType = active ? active.dataset.master : 'districts';

    try {
      // ADD
      if (action === 'add-district') return showDistrictModal({ mode: 'add' });
      if (action === 'add-block') return showBlockModal({ mode: 'add' });
      if (action === 'add-gps') return showGPModal({ mode: 'add' });

      // EXPORT
      if (action === 'export-districts') {
        const data = await loadDistricts();
        downloadCSV('districts.csv', data.map(r => ({ id: r.id, name: r.name })));
        return;
      }
      if (action === 'export-blocks') {
        const data = await loadBlocks();
        downloadCSV('blocks.csv', data.map(r => ({ id: r.id, block: r.name, district: r.districts ? r.districts.name : '' })));
        return;
      }
      if (action === 'export-gps') {
        const data = await loadGPs();
        downloadCSV('gps.csv', data.map(r => ({ id: r.id, gp: r.name, block: r.blocks ? r.blocks.name : '', district: r.blocks && r.blocks.districts ? r.blocks.districts.name : '' })));
        return;
      }

      // EDIT / DELETE (district/block/gp)
      if (action === 'edit-district') {
        const id = el.dataset.id;
        const { data } = await supabase.from('districts').select('*').eq('id', id).single();
        return showDistrictModal({ mode: 'edit', id: data.id, name: data.name });
      }
      if (action === 'delete-district') {
        const id = el.dataset.id;
        if (!confirm('Delete district and all linked blocks & GPs? This cannot be undone.')) return;
        await deleteDistrict(id);
        showToast('District deleted');
        return await refreshCurrentTab();
      }

      if (action === 'edit-block') {
        const id = el.dataset.id;
        const { data } = await supabase.from('blocks').select('*').eq('id', id).single();
        return showBlockModal({ mode: 'edit', id: data.id, district_id: data.district_id, name: data.name });
      }
      if (action === 'delete-block') {
        const id = el.dataset.id;
        if (!confirm('Delete block and all linked GPs? This cannot be undone.')) return;
        await deleteBlock(id);
        showToast('Block deleted');
        return await refreshCurrentTab();
      }

      if (action === 'edit-gp') {
        const id = el.dataset.id;
        const { data } = await supabase.from('gps').select('*').eq('id', id).single();
        // fetch block info
        return showGPModal({ mode: 'edit', id: data.id, block_id: data.block_id, name: data.name });
      }
      if (action === 'delete-gp') {
        const id = el.dataset.id;
        if (!confirm('Delete this GP? This cannot be undone.')) return;
        await deleteGP(id);
        showToast('GP deleted');
        return await refreshCurrentTab();
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Operation failed', 'error');
    }
  }

  // ---------- Filter input handler ----------
  function attachFilter(container) {
    const filter = container.querySelector('#masterFilter');
    if (!filter) return;
    filter.addEventListener('input', function () {
      const q = this.value.trim().toLowerCase();
      container.querySelectorAll('tbody tr').forEach(tr => {
        const txt = tr.textContent.toLowerCase();
        tr.style.display = txt.indexOf(q) === -1 ? 'none' : '';
      });
    });
  }

  // ---------- Refresh current tab ----------
  async function refreshCurrentTab() {
    const active = document.querySelector('#masterTabs .nav-link.active');
    const type = active ? active.dataset.master : 'districts';
    const content = document.getElementById('masterContent');
    if (!content) return;
    if (type === 'districts') await renderDistricts(content);
    if (type === 'blocks') await renderBlocks(content);
    if (type === 'gps') await renderGPs(content);
  }

  // ---------- Initialize bindings ----------
  function initMasterBindings() {
    // tab clicks
    document.querySelectorAll('#masterTabs .nav-link').forEach(tab => {
      tab.addEventListener('click', async function () {
        document.querySelectorAll('#masterTabs .nav-link').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        await refreshCurrentTab();
      });
    });

    // delegate actions from masterContent
    document.getElementById('masterContent').addEventListener('click', masterActionHandler);

    // load default tab
    refreshCurrentTab();
    // attach filter handler after initial render
    setTimeout(() => attachFilter(document.getElementById('masterContent')), 300);
  }

  // ---------- Boot ----------
  document.addEventListener('DOMContentLoaded', () => {
    // ensure masterContent container exists
    if (!document.getElementById('masterContent')) {
      const masterCardBody = document.querySelector('#master .card-body');
      if (masterCardBody) {
        const container = document.createElement('div');
        container.id = 'masterContent';
        masterCardBody.appendChild(container);
      }
    }
    initMasterBindings();
  });

})();