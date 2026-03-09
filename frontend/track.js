const API_BASE = 'http://localhost:5000/api';

document.getElementById('trackBtn').addEventListener('click', trackComplaint);

// Also allow Enter key to trigger search
document.getElementById('trackingId').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        trackComplaint();
    }
});

async function trackComplaint() {
    const trackingId = document.getElementById('trackingId').value.trim().toUpperCase();
    const resultDiv = document.getElementById('trackResult');
    
    if (!trackingId) {
        resultDiv.innerHTML = `
            <div class="message error">
                <i class="fas fa-exclamation-circle"></i> Please enter a tracking ID
            </div>
        `;
        return;
    }
    
    // Validate tracking ID format (COMP + 6 characters)
    if (!/^COMP[A-Z0-9]{6}$/.test(trackingId)) {
        resultDiv.innerHTML = `
            <div class="message error">
                <i class="fas fa-exclamation-circle"></i> Invalid tracking ID format. Should be like COMP123456
            </div>
        `;
        return;
    }
    
    resultDiv.innerHTML = `
        <div class="loading" style="text-align: center; padding: 2rem;">
            <i class="fas fa-spinner fa-spin"></i> Searching for complaint...
        </div>
    `;
    
    try {
        const response = await fetch(`${API_BASE}/complaints/track/${trackingId}`);
        const data = await response.json();
        
        if (data.success) {
            displayComplaintDetails(data.data, trackingId);
        } else {
            resultDiv.innerHTML = `
                <div class="message error">
                    <i class="fas fa-exclamation-circle"></i> ${data.message || 'Complaint not found'}
                </div>
            `;
        }
    } catch (error) {
        console.error('Tracking error:', error);
        resultDiv.innerHTML = `
            <div class="message error">
                <i class="fas fa-exclamation-circle"></i> Network error. Please check if backend is running.
            </div>
        `;
    }
}

function displayComplaintDetails(complaint, trackingId) {
    const resultDiv = document.getElementById('trackResult');
    
    const statusClass = `status-${complaint.status.toLowerCase().replace(' ', '-')}`;
    const priorityClass = `priority-${complaint.priority.toLowerCase()}`;
    
    resultDiv.innerHTML = `
        <div class="complaint-details">
            <div class="details-header">
                <h2>Complaint Details</h2>
                <div class="tracking-id">Tracking ID: ${trackingId}</div>
            </div>
            
            <div class="details-grid">
                <div class="detail-section">
                    <h3>Student Information</h3>
                    <div class="detail-item">
                        <label>Name:</label>
                        <span>${complaint.studentName}</span>
                    </div>
                    <div class="detail-item">
                        <label>Student ID:</label>
                        <span>${complaint.studentId}</span>
                    </div>
                    <div class="detail-item">
                        <label>Department:</label>
                        <span>${complaint.department}</span>
                    </div>
                    <div class="detail-item">
                        <label>Email:</label>
                        <span>${complaint.studentEmail}</span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>Complaint Information</h3>
                    <div class="detail-item">
                        <label>Category:</label>
                        <span class="category">${complaint.category}</span>
                    </div>
                    <div class="detail-item">
                        <label>Priority:</label>
                        <span class="priority-badge ${priorityClass}">${complaint.priority}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status-badge ${statusClass}">${complaint.status}</span>
                    </div>
                    <div class="detail-item">
                        <label>Assigned To:</label>
                        <span>${complaint.assignedAdmin}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section full-width">
                <h3>Complaint Description</h3>
                <div class="complaint-description">
                    ${complaint.complaintText}
                </div>
            </div>
            
            ${complaint.mediaFiles && complaint.mediaFiles.length > 0 ? `
            <div class="detail-section full-width">
                <h3>Attached Media (${complaint.mediaFiles.length})</h3>
                <div class="media-gallery">
                    ${complaint.mediaFiles.map(media => `
                        <div class="media-item" onclick="viewMedia('${media.path}', '${media.fileType}')">
                            ${media.fileType === 'image' ? 
                                `<img src="http://localhost:5000/${media.path}" alt="Evidence">` :
                                `<video>
                                    <source src="http://localhost:5000/${media.path}" type="video/mp4">
                                </video>`
                            }
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <div class="detail-section full-width">
                <h3>Status Timeline</h3>
                <div class="status-timeline">
                    ${complaint.updates.map(update => `
                        <div class="timeline-item">
                            <div class="timeline-dot"></div>
                            <div class="timeline-content">
                                <h4>${update.status}</h4>
                                <p>${update.message}</p>
                                <div class="timeline-date">${new Date(update.timestamp).toLocaleString()}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="detail-section full-width">
                <div class="complaint-meta">
                    <div class="meta-item">
                        <strong>Submitted:</strong> ${new Date(complaint.createdAt).toLocaleString()}
                    </div>
                    <div class="meta-item">
                        <strong>Last Updated:</strong> ${new Date(complaint.updatedAt || complaint.createdAt).toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function viewMedia(path, fileType) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
            ${fileType === 'image' ? 
                `<img src="http://localhost:5000/${path}" class="modal-media">` :
                `<video controls class="modal-media">
                    <source src="http://localhost:5000/${path}" type="video/mp4">
                </video>`
            }
        </div>
    `;
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
    
    document.body.appendChild(modal);
}

// Add to CSS for track page
const additionalStyles = `
    .complaint-details {
        background: white;
        border-radius: 10px;
        padding: 2rem;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .details-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #e5e7eb;
    }
    
    .tracking-id {
        background: #2563eb;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-weight: 600;
    }
    
    .details-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-bottom: 2rem;
    }
    
    .detail-section.full-width {
        grid-column: 1 / -1;
    }
    
    .detail-section h3 {
        margin-bottom: 1rem;
        color: #1f2937;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 0.5rem;
    }
    
    .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
        border-bottom: 1px solid #f3f4f6;
    }
    
    .detail-item:last-child {
        border-bottom: none;
    }
    
    .detail-item label {
        font-weight: 600;
        color: #374151;
    }
    
    .complaint-meta {
        display: flex;
        gap: 2rem;
        justify-content: space-between;
        background: #f8fafc;
        padding: 1rem;
        border-radius: 8px;
    }
    
    @media (max-width: 768px) {
        .details-grid {
            grid-template-columns: 1fr;
        }
        
        .complaint-meta {
            flex-direction: column;
            gap: 1rem;
        }
        
        .details-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
        }
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);