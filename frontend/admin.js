const API_BASE = 'http://localhost:5000/api';

let adminData = null;
let allComplaints = [];

document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    loadAdminDashboard();
    setupAdminEventListeners();
});

function checkAdminAuth() {
    const token = localStorage.getItem('adminToken');
    adminData = localStorage.getItem('adminData');
    
    if (!token || !adminData) {
        window.location.href = 'login.html';
        return;
    }
    
    adminData = JSON.parse(adminData);
    updateAdminInfo();
}

function updateAdminInfo() {
    if (adminData) {
        document.getElementById('adminName').textContent = adminData.name;
        document.getElementById('adminUsername').textContent = `@${adminData.username}`;
        document.getElementById('adminRole').textContent = adminData.role === 'super_admin' ? 'Super Administrator' : 'Administrator';
        document.getElementById('adminDepartment').textContent = adminData.category;
        document.getElementById('adminWelcome').textContent = `Welcome back, ${adminData.name}!`;
    }
}

function setupAdminEventListeners() {
    // Refresh button
    document.querySelector('.btn-refresh')?.addEventListener('click', refreshData);
    
    // Export button
    document.querySelector('.btn-export')?.addEventListener('click', exportData);
    
    // Admin menu toggle
    const adminProfile = document.querySelector('.user-profile');
    if (adminProfile) {
        adminProfile.addEventListener('click', toggleAdminMenu);
    }
}

function toggleAdminMenu() {
    const adminMenu = document.getElementById('adminMenu');
    if (adminMenu) {
        adminMenu.classList.toggle('show');
    }
}

async function loadAdminDashboard() {
    const token = localStorage.getItem('adminToken');
    
    try {
        // Load all complaints
        const response = await fetch(`${API_BASE}/admin/complaints`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            allComplaints = data.data;
            updateDashboardStats();
            updateRecentComplaints();
            updateCharts();
            updatePerformanceMetrics();
        }
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
    }
}

function updateDashboardStats() {
    const total = allComplaints.length;
    const pending = allComplaints.filter(c => c.status === 'Pending').length;
    const resolved = allComplaints.filter(c => c.status === 'Resolved').length;
    const inProgress = allComplaints.filter(c => c.status === 'In Progress').length;
    const urgent = allComplaints.filter(c => c.priority === 'Urgent').length;
    
    // Update main stats
    document.getElementById('totalComplaints').textContent = total;
    document.getElementById('pendingComplaints').textContent = pending;
    document.getElementById('resolvedComplaints').textContent = resolved;
    
    // Update badges
    document.getElementById('totalComplaintsBadge').textContent = total;
    document.getElementById('pendingBadge').textContent = pending;
    document.getElementById('resolvedBadge').textContent = resolved;
    document.getElementById('urgentCount').textContent = `${urgent} urgent`;
    
    // Calculate resolution rate
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    document.getElementById('resolutionRate').textContent = `${resolutionRate}%`;
    
    // Today's complaints
    const today = new Date().toDateString();
    const todayCount = allComplaints.filter(c => 
        new Date(c.createdAt).toDateString() === today
    ).length;
    document.getElementById('todayCount').textContent = `${todayCount} today`;
}

function updateRecentComplaints() {
    const container = document.getElementById('recentComplaints');
    if (!container) return;
    
    const recent = allComplaints.slice(0, 5);
    
    if (recent.length === 0) {
        container.innerHTML = '<div class="no-data">No complaints found</div>';
        return;
    }
    
    container.innerHTML = recent.map(complaint => `
        <div class="complaint-item admin-complaint">
            <div class="complaint-header">
                <div class="complaint-title">
                    <h4>${complaint.category}</h4>
                    <span class="student-info">${complaint.studentName} • ${complaint.studentId}</span>
                </div>
                <div class="complaint-meta">
                    <span class="priority-badge priority-${complaint.priority.toLowerCase()}">
                        ${complaint.priority}
                    </span>
                    <span class="status-badge status-${complaint.status.toLowerCase()}">
                        ${complaint.status}
                    </span>
                </div>
            </div>
            <p class="complaint-preview">${complaint.complaintText.substring(0, 100)}...</p>
            <div class="complaint-footer">
                <span>${new Date(complaint.createdAt).toLocaleDateString()}</span>
                <button class="btn btn-sm" onclick="viewComplaint('${complaint._id}')">
                    View Details
                </button>
            </div>
        </div>
    `).join('');
}

function updateCharts() {
    updateDepartmentChart();
    updatePriorityChart();
}

function updateDepartmentChart() {
    const container = document.getElementById('departmentChart');
    if (!container) return;
    
    const departmentCounts = {};
    allComplaints.forEach(complaint => {
        departmentCounts[complaint.category] = (departmentCounts[complaint.category] || 0) + 1;
    });
    
    const chartHTML = Object.entries(departmentCounts)
        .map(([dept, count]) => `
            <div class="chart-row">
                <div class="chart-label">${dept}</div>
                <div class="chart-bar">
                    <div class="chart-fill" style="width: ${(count / allComplaints.length) * 100}%"></div>
                </div>
                <div class="chart-value">${count}</div>
            </div>
        `).join('');
    
    container.innerHTML = chartHTML;
}

function updatePriorityChart() {
    const container = document.getElementById('priorityChart');
    if (!container) return;
    
    const priorityCounts = {
        'Low': 0,
        'Medium': 0,
        'High': 0,
        'Urgent': 0
    };
    
    allComplaints.forEach(complaint => {
        priorityCounts[complaint.priority]++;
    });
    
    const total = allComplaints.length;
    const chartHTML = Object.entries(priorityCounts)
        .map(([priority, count]) => `
            <div class="priority-item">
                <div class="priority-label">
                    <span class="priority-dot priority-${priority.toLowerCase()}"></span>
                    ${priority}
                </div>
                <div class="priority-stats">
                    <span class="priority-count">${count}</span>
                    <span class="priority-percent">${total > 0 ? Math.round((count / total) * 100) : 0}%</span>
                </div>
            </div>
        `).join('');
    
    container.innerHTML = chartHTML;
}

function updatePerformanceMetrics() {
    // Calculate performance metrics
    const resolvedComplaints = allComplaints.filter(c => c.status === 'Resolved');
    const totalResolutionTime = resolvedComplaints.reduce((total, complaint) => {
        const createdAt = new Date(complaint.createdAt);
        const resolvedAt = new Date(complaint.updatedAt);
        return total + (resolvedAt - createdAt);
    }, 0);
    
    const avgResolutionTime = resolvedComplaints.length > 0 ? 
        Math.round(totalResolutionTime / resolvedComplaints.length / (1000 * 60 * 60)) : 0;
    
    const responseTime = 2; // Mock data
    const efficiencyScore = 87; // Mock data
    const satisfactionRate = 92; // Mock data
    
    document.getElementById('avgResolutionTime').textContent = `${avgResolutionTime}h`;
    document.getElementById('responseTime').textContent = `${responseTime}h`;
    document.getElementById('efficiencyScore').textContent = `${efficiencyScore}%`;
    document.getElementById('satisfactionRate').textContent = `${satisfactionRate}%`;
    
    updateActivityTimeline();
}

function updateActivityTimeline() {
    const container = document.getElementById('adminActivity');
    if (!container) return;
    
    // Get recent updates from all complaints
    const recentActivities = allComplaints
        .flatMap(complaint => 
            complaint.updates.map(update => ({
                ...update,
                complaintId: complaint._id,
                studentName: complaint.studentName,
                category: complaint.category
            }))
        )
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
    
    if (recentActivities.length === 0) {
        container.innerHTML = '<div class="no-activity">No recent activity</div>';
        return;
    }
    
    container.innerHTML = recentActivities.map(activity => `
        <div class="activity-item admin-activity">
            <div class="activity-icon ${getAdminActivityIconClass(activity.status)}">
                <i class="fas ${getAdminActivityIcon(activity.status)}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-text">
                    <strong>${activity.studentName}</strong> - ${activity.category}
                    <br>
                    <span class="activity-message">${activity.message}</span>
                </div>
                <div class="activity-time">${new Date(activity.timestamp).toLocaleString()}</div>
            </div>
        </div>
    `).join('');
}

function getAdminActivityIcon(status) {
    const icons = {
        'Pending': 'clock',
        'In Progress': 'sync-alt',
        'Resolved': 'check-circle',
        'Rejected': 'times-circle',
        'Assigned': 'user-check'
    };
    return icons[status] || 'info-circle';
}

function getAdminActivityIconClass(status) {
    const classes = {
        'Pending': 'warning',
        'In Progress': 'info',
        'Resolved': 'success',
        'Rejected': 'error',
        'Assigned': 'primary'
    };
    return classes[status] || 'info';
}

function refreshData() {
    loadAdminDashboard();
    showNotification('Data refreshed successfully', 'success');
}

function exportData() {
    const data = {
        complaints: allComplaints,
        exportDate: new Date().toISOString(),
        exportedBy: adminData.name
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `complaints-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('Data exported successfully', 'success');
}

function viewComplaint(complaintId) {
    // Navigate to complaint details page
    window.location.href = `complaint-details.html?id=${complaintId}`;
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function adminLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    window.location.href = 'role-select.html';
}

// Make functions available globally
window.refreshData = refreshData;
window.exportData = exportData;
window.toggleAdminMenu = toggleAdminMenu;
window.viewComplaint = viewComplaint;
window.adminLogout = adminLogout;