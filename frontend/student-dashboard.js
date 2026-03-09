const API_BASE = 'http://localhost:5000/api';

// Global variables
let studentData = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkStudentAuth();
    loadDashboardData();
    setupEventListeners();
});

function checkStudentAuth() {
    const token = localStorage.getItem('studentToken');
    studentData = localStorage.getItem('studentData');
    
    if (!token || !studentData) {
        window.location.href = 'login.html';
        return;
    }
    
    studentData = JSON.parse(studentData);
    updateUserInfo();
}

function updateUserInfo() {
    if (studentData) {
        // Update all user name elements
        const userNameElements = document.querySelectorAll('#userName, #profileName, #detailName, #displayName');
        userNameElements.forEach(el => {
            if (el) el.textContent = studentData.name;
        });
        
        // Update student ID elements
        const studentIdElements = document.querySelectorAll('#profileStudentId, #detailStudentId, #displayStudentId');
        studentIdElements.forEach(el => {
            if (el) el.textContent = `Student ID: ${studentData.studentId}`;
        });
        
        // Update department elements
        const deptElements = document.querySelectorAll('#detailDepartment, #displayDepartment');
        deptElements.forEach(el => {
            if (el) el.textContent = studentData.department;
        });
        
        // Update email elements
        const emailElements = document.querySelectorAll('#detailEmail, #displayEmail');
        emailElements.forEach(el => {
            if (el) el.textContent = studentData.email;
        });
        
        // Update welcome message
        const welcomeMsg = document.getElementById('welcomeMessage');
        if (welcomeMsg) {
            welcomeMsg.textContent = `Welcome back, ${studentData.name}!`;
        }
    }
}

function setupEventListeners() {
    // Logout buttons
    const logoutBtns = document.querySelectorAll('#logoutBtn, #logoutBtnMobile');
    logoutBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', logout);
        }
    });
    
    // Profile menu toggle
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        userProfile.addEventListener('click', toggleProfileMenu);
    }
    
    // Character count for complaint text
    const complaintText = document.getElementById('complaintText');
    if (complaintText) {
        complaintText.addEventListener('input', updateCharCount);
    }
    
    // File upload handling (if on complaint form page)
    setupFileUpload();
}

function toggleProfileMenu() {
    const profileMenu = document.getElementById('profileMenu');
    if (profileMenu) {
        profileMenu.classList.toggle('show');
    }
}

async function loadDashboardData() {
    const token = localStorage.getItem('studentToken');
    
    try {
        const response = await fetch(`${API_BASE}/student/complaints`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            updateStats(data.data);
            displayRecentComplaints(data.data);
        } else {
            if (response.status === 401) {
                logout();
            }
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateStats(complaints) {
    const pending = complaints.filter(c => c.status === 'Pending').length;
    const inProgress = complaints.filter(c => c.status === 'In Progress').length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;
    const total = complaints.length;
    
    // Update stat cards
    const pendingEl = document.getElementById('pendingCount');
    const progressEl = document.getElementById('progressCount');
    const resolvedEl = document.getElementById('resolvedCount');
    const totalEl = document.getElementById('totalCount');
    
    if (pendingEl) pendingEl.textContent = pending;
    if (progressEl) progressEl.textContent = inProgress;
    if (resolvedEl) resolvedEl.textContent = resolved;
    if (totalEl) totalEl.textContent = total;
    
    // Also update profile stats if on profile page
    const totalProfile = document.getElementById('totalComplaintsProfile');
    const resolvedProfile = document.getElementById('resolvedComplaintsProfile');
    
    if (totalProfile) totalProfile.textContent = total;
    if (resolvedProfile) resolvedProfile.textContent = resolved;
}

function displayRecentComplaints(complaints) {
    const container = document.getElementById('complaintsList');
    if (!container) return;
    
    const recentComplaints = complaints.slice(0, 5); // Show last 5 complaints
    
    if (recentComplaints.length === 0) {
        container.innerHTML = `
            <div class="no-complaints">
                <i class="fas fa-inbox"></i>
                <h3>No Complaints Yet</h3>
                <p>Submit your first complaint to get started</p>
                <button class="btn btn-primary" onclick="location.href='complaint-form.html?type=normal'">
                    <i class="fas fa-plus"></i> Submit First Complaint
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentComplaints.map(complaint => `
        <div class="complaint-item">
            <div class="complaint-item-header">
                <div class="complaint-title">
                    <h4>${complaint.category} - ${complaint.complaintText.substring(0, 50)}...</h4>
                    <span class="tracking-id">COMP${complaint._id.toString().slice(-6).toUpperCase()}</span>
                </div>
                <div class="complaint-status">
                    <span class="status-badge status-${complaint.status.toLowerCase()}">${complaint.status}</span>
                    <span class="priority-badge priority-${complaint.priority.toLowerCase()}">${complaint.priority}</span>
                </div>
            </div>
            <div class="complaint-item-body">
                <p>${complaint.complaintText}</p>
                <div class="complaint-meta">
                    <span>Submitted: ${new Date(complaint.createdAt).toLocaleDateString()}</span>
                    <span>Assigned to: ${complaint.assignedAdmin}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function setupFileUpload() {
    const fileUploadArea = document.getElementById('fileUploadArea');
    const mediaFilesInput = document.getElementById('mediaFiles');
    
    if (!fileUploadArea || !mediaFilesInput) return;
    
    let uploadedFiles = [];
    
    fileUploadArea.addEventListener('click', () => mediaFilesInput.click());
    mediaFilesInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = '#2563eb';
        fileUploadArea.style.background = '#f0f4ff';
    });
    
    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.style.borderColor = '#d1d5db';
        fileUploadArea.style.background = '';
    });
    
    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = '#d1d5db';
        fileUploadArea.style.background = '';
        handleFiles(e.dataTransfer.files);
    });
    
    function handleFileSelect(e) {
        handleFiles(e.target.files);
    }
    
    function handleFiles(files) {
        for (let file of files) {
            if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                if (uploadedFiles.length >= 5) {
                    alert('Maximum 5 files allowed');
                    break;
                }
                uploadedFiles.push(file);
                createPreview(file);
            }
        }
        mediaFilesInput.value = '';
    }
    
    function createPreview(file) {
        const reader = new FileReader();
        const filePreview = document.getElementById('filePreview');
        
        reader.onload = function(e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            if (file.type.startsWith('image/')) {
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button type="button" class="remove-btn" onclick="removeFile('${file.name}')">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            } else {
                previewItem.innerHTML = `
                    <video>
                        <source src="${e.target.result}" type="${file.type}">
                    </video>
                    <button type="button" class="remove-btn" onclick="removeFile('${file.name}')">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            }
            
            filePreview.appendChild(previewItem);
        };
        
        reader.readAsDataURL(file);
    }
    
    window.removeFile = function(fileName) {
        uploadedFiles = uploadedFiles.filter(file => file.name !== fileName);
        renderPreviews();
    };
    
    function renderPreviews() {
        const filePreview = document.getElementById('filePreview');
        filePreview.innerHTML = '';
        uploadedFiles.forEach(file => createPreview(file));
    }
    
    // Handle complaint form submission
    const complaintForm = document.getElementById('complaintForm');
    if (complaintForm) {
        complaintForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const token = localStorage.getItem('studentToken');
            const submitBtn = e.target.querySelector('.btn-primary');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            submitBtn.disabled = true;
            
            const formData = new FormData();
            formData.append('category', document.getElementById('category').value);
            formData.append('priority', document.getElementById('priority').value);
            formData.append('complaintText', document.getElementById('complaintText').value);
            
            // Get complaint type
            const urlParams = new URLSearchParams(window.location.search);
            const complaintType = urlParams.get('type') || 'normal';
            
            if (complaintType === 'anonymous') {
                // For anonymous complaints, we'll handle differently in backend
                formData.append('isAnonymous', 'true');
            }
            
            uploadedFiles.forEach(file => {
                formData.append('mediaFiles', file);
            });
            
            try {
                const response = await fetch(`${API_BASE}/complaints/submit`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showMessage(`✅ Complaint submitted successfully! Tracking ID: ${data.trackingId}`, 'success');
                    setTimeout(() => {
                        window.location.href = 'student-dashboard.html';
                    }, 2000);
                } else {
                    showMessage(`❌ ${data.message}`, 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage('❌ Network error. Please try again.', 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

function updateCharCount() {
    const textarea = document.getElementById('complaintText');
    const charCount = document.getElementById('charCount');
    
    if (textarea && charCount) {
        const count = textarea.value.length;
        charCount.textContent = count;
        
        if (count > 800) {
            charCount.style.color = '#ef4444';
        } else if (count > 600) {
            charCount.style.color = '#f59e0b';
        } else {
            charCount.style.color = '#6b7280';
        }
    }
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('formMessage') || document.createElement('div');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.marginTop = '1rem';
    
    if (!document.getElementById('formMessage')) {
        document.querySelector('.complaint-form-container').appendChild(messageDiv);
    }
    
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = 'message';
    }, 50000);
}

function logout() {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentData');
    window.location.href = 'role-select.html';
}

// Make functions globally available
window.toggleProfileMenu = toggleProfileMenu;
window.logout = logout;