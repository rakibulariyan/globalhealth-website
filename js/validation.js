// validation.js
async function validateMemberCard() {
    const cardId = document.getElementById('cardId')?.value.trim();
    const resultDiv = document.getElementById('validationResult');
    
    if (!cardId) {
        alert('Please enter a Member ID');
        return;
    }
    
    if (!resultDiv) {
        alert('Validation result container not found');
        return;
    }
    
    try {
        resultDiv.innerHTML = '<div class="alert alert-info">Validating...</div>';
        
        const { data: member, error } = await supabase
            .from('members')
            .select('*')
            .eq('member_id', cardId)
            .single();
            
        if (error) throw error;
        
        if (!member) {
            resultDiv.innerHTML = `
                <div class="alert alert-danger">
                    <h5><i class="fas fa-times-circle me-2"></i>Invalid Card</h5>
                    <p>Member ID <strong>${cardId}</strong> not found in the system.</p>
                </div>
            `;
            return;
        }
        
        // Check if membership is active
        const expiryDate = new Date(member.expiry_date);
        const today = new Date();
        const isActive = expiryDate > today;
        
        resultDiv.innerHTML = `
            <div class="alert ${isActive ? 'alert-success' : 'alert-warning'}">
                <h5><i class="fas fa-${isActive ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
                    ${isActive ? 'Valid Card' : 'Expired Card'}
                </h5>
                <p><strong>Member ID:</strong> ${member.member_id}</p>
                <p><strong>Name:</strong> ${member.name}</p>
                <p><strong>Status:</strong> ${isActive ? 'Active' : 'Expired'}</p>
                <p><strong>Expiry Date:</strong> ${expiryDate.toLocaleDateString()}</p>
                ${!isActive ? '<p class="mb-0"><strong>⚠️ This membership has expired.</strong></p>' : ''}
            </div>
        `;
        
    } catch (error) {
        console.error('Validation error:', error);
        resultDiv.innerHTML = `
            <div class="alert alert-danger">
                <h5><i class="fas fa-exclamation-circle me-2"></i>Validation Error</h5>
                <p>Error validating card: ${error.message}</p>
            </div>
        `;
    }
}