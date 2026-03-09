const API_BASE = 'http://localhost:5000/api';

let adminData = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    loadAdminProfile();
    setupAdminProfileEventListeners();
});

function checkAdminAuth() {
    const token = localStorage.getItem('adminToken');
    adminData = localStorage.getItem('adminData');
    
    if (!token || !adminData) {
        window.location.href = 'login.html';
        return;
    }
    
    adminData = JSON.parse(adminData);
    updateAdminProfileInfo();
}

function updateAdminProfileInfo() {
    if (adminData) {
        // Update all admin profile elements
        const elements = {
            'adminProfileName': adminData.name,
            'adminProfileUsername': `@${adminData.username}`,
            'adminProfileRole': adminData.role === 'super_admin' ? 'Super Administrator' : 'Administrator',
            'adminProfileDepartment': adminData.category,
            'adminDetailName': adminData.name,
            'adminDetailUsername': adminData.username,
            'adminDetailEmail': adminData.email || 'Not provided',
            'adminDetailDepartment': adminData.category,
            'adminDetailRole': adminData.role === 'super_admin' ? 'Super Admin' : 'Admin',
            'adminDetailJoinDate': 'Recently', // You might want to add join date to admin schema
            'adminDetailContact': adminData.contact || 'Not provided',
            'adminDetailPermissions': getPermissionsText(adminData.role)
        };
        
        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        }
        
        // Update avatar elements
        const avatarElements = document.querySelectorAll('#adminAvatarLarge, #adminProfileAvatar');
        avatarElements.forEach(avatar => {
            if (avatar) avatar.src = '../assets/images/admin-avatar.png';
        });
    }
}

function getPermissionsText(role) {
    const permissions = {
        'super_admin': 'Full System Access',
        'admin': 'Department Management',
        'moderator': 'Complaint Management'
    };
    return permissions[role] || 'Limited Access';
}

function setupAdminProfileEventListeners() {
    // Add any specific event listeners for admin profile
}

async function loadAdminProfile() {
    // Load additional admin-specific data
    updateAdminStats();
    updateAdminPerformance();
    updateAdminActivity();
}

function updateAdminStats() {
    // These would typically come from API
    const stats = {
        totalHandled: 145,
        resolved: 120,
        pending: 15,
        efficiency: 92
    };
    
    document.getElementById('adminTotalHandled').textContent = stats.totalHandled;
    document.getElementById('adminResolved').textContent = stats.resolved;
    document.getElementById('adminPending').textContent = stats.pending;
    document.getElementById('adminEfficiency').textContent = `${stats.efficiency}%`;
}

function updateAdminPerformance() {
    // Update performance metrics
    document.getElementById('performanceScore').textContent = '92%';
    document.getElementById('performanceFill').style.width = '92%';
    document.getElementById('responseScore').textContent = '2.5h';
    document.getElementById('resolutionScore').textContent = '24h';
}

function updateAdminActivity() {
    const container = document.getElementById('adminRecentActivity');
    if (!container) return;
    
    // Mock activity data
    const activities = [
        {
            action: 'Resolved complaint',
            details: 'Hostel maintenance issue',
            time: '2 hours ago',
            type: 'success'
        },
        {
            action: 'Assigned complaint',
            details: 'Library book availability',
            time: '5 hours ago',
            type: 'info'
        },
        {
            action: 'Updated status',
            details: 'IT lab computer repair',
            time: '1 day ago',
            type: 'warning'
        }
    ];
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}">
                <i class="fas fa-${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-text">
                    <strong>${activity.action}</strong>
                    <br>
                    <span class="activity-details">${activity.details}</span>
                </div>
                <div class="activity-time">${activity.time}</div>
            </div>
        </div>
    `).join('');
}

function getActivityIcon(type) {
    const icons = {
        'success': 'check-circle',
        'info': 'info-circle',
        'warning': 'exclamation-triangle',
        'error': 'times-circle'
    };
    return icons[type] || 'info-circle';
}

// Modal Functions for Admin Profile
function editAdminProfile() {
    // Populate modal with current admin data
    document.getElementById('editAdminName').value = adminData.name;
    document.getElementById('editAdminEmail').value = adminData.email || '';
    document.getElementById('editAdminContact').value = adminData.contact || '';
    document.getElementById('editAdminDepartment').value = adminData.category;
    
    document.getElementById('editAdminModal').style.display = 'flex';
}

function changeAdminPassword() {
    document.getElementById('changePasswordModal').style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

async function saveAdminProfile() {
    const formData = {
        name: document.getElementById('editAdminName').value,
        email: document.getElementById('editAdminEmail').value,
        contact: document.getElementById('editAdminContact').value,
        department: document.getElementById('editAdminDepartment').value
    };
    
    const token = localStorage.getItem('adminToken');
    
    try {
        // Here you would typically make an API call to update admin profile
        // For now, update locally
        Object.assign(adminData, formData);
        localStorage.setItem('adminData', JSON.stringify(adminData));
        
        updateAdminProfileInfo();
        closeModal('editAdminModal');
        
        showAdminMessage('Profile updated successfully!', 'success');
    } catch (error) {
        showAdminMessage('Error updating profile', 'error');
    }
}

function changeAdminAvatar() {
    // Implement admin avatar change
    alert('Admin avatar change functionality would be implemented here');
}

function managePermissions() {
    alert('Permission management would be implemented here');
}

function backupData() {
    alert('Data backup functionality would be implemented here');
}

function showAdminMessage(text, type) {
    // Create or use existing message element
    let messageDiv = document.getElementById('adminProfileMessage');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'adminProfileMessage';
        document.querySelector('.profile-container').prepend(messageDiv);
    }
    
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = 'message';
    }, 5000);
}

// Make functions available globally
window.editAdminProfile = editAdminProfile;
window.changeAdminPassword = changeAdminPassword;
window.closeModal = closeModal;
window.saveAdminProfile = saveAdminProfile;
window.changeAdminAvatar = changeAdminAvatar;
window.managePermissions = managePermissions;
window.backupData = backupData;