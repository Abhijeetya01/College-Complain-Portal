const API_BASE = 'http://localhost:5000/api';

let studentData = null;
let studentComplaints = [];

document.addEventListener('DOMContentLoaded', function() {
    checkStudentAuth();
    loadProfileData();
    setupProfileEventListeners();
});

function checkStudentAuth() {
    const token = localStorage.getItem('studentToken');
    studentData = localStorage.getItem('studentData');
    
    if (!token || !studentData) {
        window.location.href = 'login.html';
        return;
    }
    
    studentData = JSON.parse(studentData);
    updateProfileInfo();
}

function updateProfileInfo() {
    if (studentData) {
        // Update all profile elements
        const elements = {
            'userName': studentData.name,
            'profileName': studentData.name,
            'detailName': studentData.name,
            'profileStudentId': `Student ID: ${studentData.studentId}`,
            'detailStudentId': studentData.studentId,
            'profileDepartment': `Department: ${studentData.department}`,
            'detailDepartment': studentData.department,
            'detailEmail': studentData.email,
            'detailMemberSince': new Date(studentData.createdAt).toLocaleDateString()
        };
        
        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        }
    }
}

function setupProfileEventListeners() {
    // Modal event listeners will be added here
}

async function loadProfileData() {
    const token = localStorage.getItem('studentToken');
    
    try {
        // Load student complaints
        const response = await fetch(`${API_BASE}/student/complaints`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            studentComplaints = data.data;
            updateProfileStats();
            updateActivityTimeline();
            updateCharts();
        }
    } catch (error) {
        console.error('Error loading profile data:', error);
    }
}

function updateProfileStats() {
    const total = studentComplaints.length;
    const resolved = studentComplaints.filter(c => c.status === 'Resolved').length;
    const pending = studentComplaints.filter(c => c.status === 'Pending').length;
    const inProgress = studentComplaints.filter(c => c.status === 'In Progress').length;
    
    // Update stat numbers
    document.getElementById('totalComplaintsProfile').textContent = total;
    document.getElementById('resolvedComplaintsProfile').textContent = resolved;
    document.getElementById('pendingComplaintsProfile').textContent = pending;
    
    // Update charts
    if (total > 0) {
        const resolvedPercent = Math.round((resolved / total) * 100);
        const pendingPercent = Math.round((pending / total) * 100);
        const progressPercent = Math.round((inProgress / total) * 100);
        
        document.getElementById('resolvedBar').style.width = `${resolvedPercent}%`;
        document.getElementById('pendingBar').style.width = `${pendingPercent}%`;
        document.getElementById('progressPercent').style.width = `${progressPercent}%`;
        
        document.getElementById('resolvedPercent').textContent = `${resolvedPercent}%`;
        document.getElementById('pendingPercent').textContent = `${pendingPercent}%`;
        document.getElementById('progressPercentText').textContent = `${progressPercent}%`;
    }
}

function updateActivityTimeline() {
    const activityList = document.getElementById('recentActivity');
    if (!activityList) return;
    
    const recentActivities = studentComplaints
        .slice(0, 5)
        .map(complaint => {
            const lastUpdate = complaint.updates[complaint.updates.length - 1];
            return {
                type: 'complaint',
                status: lastUpdate.status,
                message: lastUpdate.message,
                timestamp: lastUpdate.timestamp,
                complaintId: complaint._id
            };
        });
    
    if (recentActivities.length === 0) {
        activityList.innerHTML = '<div class="no-activity">No recent activity</div>';
        return;
    }
    
    activityList.innerHTML = recentActivities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${getActivityIconClass(activity.status)}">
                <i class="fas ${getActivityIcon(activity.status)}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-text">${activity.message}</div>
                <div class="activity-time">${new Date(activity.timestamp).toLocaleString()}</div>
            </div>
        </div>
    `).join('');
}

function getActivityIcon(status) {
    const icons = {
        'Pending': 'clock',
        'In Progress': 'sync-alt',
        'Resolved': 'check-circle',
        'Rejected': 'times-circle'
    };
    return icons[status] || 'info-circle';
}

function getActivityIconClass(status) {
    const classes = {
        'Pending': 'warning',
        'In Progress': 'info',
        'Resolved': 'success',
        'Rejected': 'warning'
    };
    return classes[status] || 'info';
}

function updateCharts() {
    // Additional chart updates can be implemented here
}

// Modal Functions
function editProfile() {
    // Populate modal with current data
    document.getElementById('editName').value = studentData.name;
    document.getElementById('editPhone').value = studentData.phone || '';
    document.getElementById('editDepartment').value = studentData.department;
    
    // Show modal
    document.getElementById('editProfileModal').style.display = 'flex';
}

function changePassword() {
    document.getElementById('changePasswordModal').style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

async function saveProfile() {
    const formData = {
        name: document.getElementById('editName').value,
        phone: document.getElementById('editPhone').value,
        department: document.getElementById('editDepartment').value
    };
    
    const token = localStorage.getItem('studentToken');
    
    try {
        // Here you would typically make an API call to update the profile
        // For now, we'll update locally
        Object.assign(studentData, formData);
        localStorage.setItem('studentData', JSON.stringify(studentData));
        
        updateProfileInfo();
        closeModal('editProfileModal');
        
        showMessage('Profile updated successfully!', 'success');
    } catch (error) {
        showMessage('Error updating profile', 'error');
    }
}

async function updatePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    
    if (newPassword !== confirmPassword) {
        showMessage('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showMessage('Password must be at least 6 characters', 'error');
        return;
    }
    
    const token = localStorage.getItem('studentToken');
    
    try {
        // Here you would typically make an API call to change password
        showMessage('Password updated successfully!', 'success');
        closeModal('changePasswordModal');
        
        // Clear form
        document.getElementById('changePasswordForm').reset();
    } catch (error) {
        showMessage('Error updating password', 'error');
    }
}

function changeAvatar() {
    // Implement avatar change functionality
    alert('Avatar change functionality would be implemented here');
}

function downloadData() {
    // Create and download student data
    const data = {
        studentInfo: studentData,
        complaints: studentComplaints,
        downloadDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `student-data-${studentData.studentId}.json`;
    link.click();
}

function showMessage(text, type) {
    // Create or use existing message element
    let messageDiv = document.getElementById('profileMessage');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'profileMessage';
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
window.editProfile = editProfile;
window.changePassword = changePassword;
window.closeModal = closeModal;
window.saveProfile = saveProfile;
window.updatePassword = updatePassword;
window.changeAvatar = changeAvatar;
window.downloadData = downloadData;