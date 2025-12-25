// payments.js
async function loadPayments() {
    try {
        const tbody = document.querySelector('#paymentsTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Loading...</td></tr>';
        
        const { data: payments, error } = await supabase
            .from('payments')
            .select('*')
            .order('payment_date', { ascending: false });
            
        if (error) throw error;
        
        if (!payments || payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No payments found</td></tr>';
            return;
        }
        
        tbody.innerHTML = payments.map(payment => `
            <tr>
                <td>${payment.id}</td>
                <td>${payment.member_id || ''}</td>
                <td>₹${payment.amount || 0}</td>
                <td>${payment.currency || 'INR'}</td>
                <td><span class="badge badge-success">${payment.payment_status || 'completed'}</span></td>
                <td>${payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : ''}</td>
                <td>${payment.collected_by || ''}</td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading payments:', error);
        const tbody = document.querySelector('#paymentsTable tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading payments</td></tr>';
        }
    }
}