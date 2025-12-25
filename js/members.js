// Member management functions

// Save member function
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
                        amount: 300,
                        currency: 'INR',
                        payment_status: 'completed',
                        collected_by: currentUser ? currentUser.name : "Admin",
                        district_name: districtName,
                        payment_date: new Date().toISOString()
                    }
                ]);

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
        loadMembers();

    } catch (err) {
        console.error('Error registering member:', err);
        alert('Error registering member: ' + err.message);
    }
};

// Load members
async function loadMembers() {
    try {
        const tbody = document.querySelector('#membersTable tbody');
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">Loading...</td></tr>';

        const { data: members, error } = await supabase
            .from('members')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        if (!members || members.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No members found</td></tr>';
            return;
        }

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

// Delete member
window.deleteMember = async function (id) {
    try {
        if (!confirm("Are you sure you want to delete this member?")) return;

        const { error } = await supabase
            .from('members')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert("✅ Member deleted successfully!");
        loadMembers();
    } catch (err) {
        console.error("Error deleting member:", err);
        alert("❌ Error deleting member: " + err.message);
    }
};

// Edit member
window.editMember = async function (id) {
    try {
        const { data: member, error } = await supabase
            .from('members')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        // Fill form fields
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
            await loadBlockOptions('editBlock', member.district_id, true);
            if (member.block_id) {
                document.getElementById('editBlock').value = member.block_id;
                await loadGpOptions('editGP', member.block_id, true);
                if (member.gp_id) {
                    document.getElementById('editGP').value = member.gp_id;
                }
            }
        }

        $('#editMemberModal').modal('show');

    } catch (err) {
        console.error('Error loading member details:', err);
        alert('❌ Error loading member details.');
    }
};

// Update member
document.getElementById('updateMemberBtn')?.addEventListener('click', async () => {
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
                updates.district = districtData.name;
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