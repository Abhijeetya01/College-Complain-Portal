const API_BASE = 'http://localhost:5000/api';

// DOM Elements
const complaintForm = document.getElementById('complaintForm');
const fileUploadArea = document.getElementById('fileUploadArea');
const mediaFilesInput = document.getElementById('mediaFiles');
const filePreview = document.getElementById('filePreview');
const messageDiv = document.getElementById('message');

let uploadedFiles = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    setupEventListeners();
});

function setupEventListeners() {
    // File upload area click
    fileUploadArea.addEventListener('click', () => {
        mediaFilesInput.click();
    });

    // File input change
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
        
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    // Form submission
    complaintForm.addEventListener('submit', handleSubmit);
}

function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
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
        } else {
            alert('Only images and videos are allowed!');
        }
    }
    mediaFilesInput.value = '';
}

function createPreview(file) {
    const reader = new FileReader();
    
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

function removeFile(fileName) {
    uploadedFiles = uploadedFiles.filter(file => file.name !== fileName);
    renderPreviews();
}

function renderPreviews() {
    filePreview.innerHTML = '';
    uploadedFiles.forEach(file => createPreview(file));
}

async function handleSubmit(e) {
    e.preventDefault();
    
    // Show loading state
    const submitBtn = complaintForm.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
    
    const formData = new FormData();
    
    // Add form data
    formData.append('studentName', document.getElementById('studentName').value);
    formData.append('studentEmail', document.getElementById('studentEmail').value);
    formData.append('studentId', document.getElementById('studentId').value);
    formData.append('department', document.getElementById('department').value);
    formData.append('category', document.getElementById('category').value);
    formData.append('priority', document.getElementById('priority').value);
    formData.append('complaintText', document.getElementById('complaintText').value);
    
    // Add files
    uploadedFiles.forEach(file => {
        formData.append('mediaFiles', file);
    });
    
    try {
        const response = await fetch(`${API_BASE}/complaints/submit`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(`✅ Complaint submitted successfully! Tracking ID: ${data.trackingId}`, 'success');
            complaintForm.reset();
            uploadedFiles = [];
            filePreview.innerHTML = '';
            loadStats();
        } else {
            showMessage(`❌ ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('❌ Network error. Please check if backend is running.', 'error');
    } finally {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalComplaints').textContent = data.data.total;
            document.getElementById('resolvedComplaints').textContent = data.data.resolved;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = 'message';
    }, 5000);
}

// Make removeFile available globally
window.removeFile = removeFile;