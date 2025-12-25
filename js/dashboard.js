// Load dashboard data
async function loadDashboardData() {
    try {
        console.log('Loading dashboard data...');
        
        // Get all data
        const { data: members, error: membersError } = await supabase.from('members').select('*');
        const { data: employees, error: employeesError } = await supabase.from('employees').select('*');
        const { data: payments, error: paymentsError } = await supabase.from('payments').select('*');
        
        if (membersError) throw membersError;
        if (employeesError) throw employeesError;
        if (paymentsError) throw paymentsError;
        
        // Calculate stats
        const totalMembers = members ? members.length : 0;
        const totalEmployees = employees ? employees.length : 0;
        const totalPayments = payments ? payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0) : 0;
        const activeMembers = members ? members.filter(m => m.status === 'active').length : 0;
        
        // Update dashboard stats
        document.getElementById('dashboardStats').innerHTML = `
            <div class="col-md-3">
                <div class="card dashboard-card">
                    <div class="card-body text-center">
                        <h5 class="card-title">Total Members</h5>
                        <div class="stat-number">${totalMembers}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card dashboard-card">
                    <div class="card-body text-center">
                        <h5 class="card-title">Total Employees</h5>
                        <div class="stat-number">${totalEmployees}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card dashboard-card">
                    <div class="card-body text-center">
                        <h5 class="card-title">Total Payments</h5>
                        <div class="stat-number">₹${totalPayments}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card dashboard-card">
                    <div class="card-body text-center">
                        <h5 class="card-title">Active Members</h5>
                        <div class="stat-number">${activeMembers}</div>
                    </div>
                </div>
            </div>
        `;
        
        // Update recent payments
        const recentPayments = payments ? payments.slice(0, 5) : [];
        document.getElementById('recentPayments').innerHTML = recentPayments.length > 0 ? 
            recentPayments.map(payment => `
                <div class="alert alert-light">
                    <strong>${payment.member_id}</strong> - ₹${payment.amount} - ${new Date(payment.payment_date).toLocaleDateString()}
                </div>
            `).join('') : 
            '<p class="text-muted">No recent payments</p>';
            
    } catch (error) {
        console.error('Error loading dashboard:', error);
        document.getElementById('dashboardStats').innerHTML = '<div class="col-12"><div class="alert alert-danger">Error loading dashboard data</div></div>';
    }
}