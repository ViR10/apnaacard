// Admin Dashboard JavaScript
let currentAdmin = null;
let allStudents = [];
let pendingRequests = [];
let currentSection = 'dashboard';

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    initializeAdminDashboard();
    setupAdminEventListeners();
});

// Check admin authentication
function checkAdminAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = '/login';
        return;
    }
    
    currentAdmin = JSON.parse(user);
    
    // Check if user is admin
    if (currentAdmin.role !== 'admin') {
        window.location.href = '/login';
        return;
    }
    
    // Update UI with admin info
    updateAdminInfo();
}

// Update admin info in UI
function updateAdminInfo() {
    const userAvatar = document.querySelector('.user-info .user-avatar');
    const userName = document.querySelector('.user-info div:last-child div:first-child');
    
    if (userAvatar && userName) {
        userAvatar.textContent = currentAdmin.fullName.charAt(0).toUpperCase();
        userName.textContent = currentAdmin.fullName;
    }
}

// Initialize admin dashboard
async function initializeAdminDashboard() {
    await Promise.all([
        loadPendingRequests(),
        loadAllStudents()
    ]);
    updateAdminStats();
}

// Setup event listeners
function setupAdminEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('data-section')) {
                e.preventDefault();
                navigateToAdminSection(this.getAttribute('data-section'));
            }
        });
    });
    
    // Search functionality
    const searchInput = document.getElementById('studentSearch');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) searchInput.addEventListener('input', filterStudents);
    if (statusFilter) statusFilter.addEventListener('change', filterStudents);
}

// Navigate to admin section
function navigateToAdminSection(section) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show selected section
    const targetSection = document.getElementById(section + '-section');
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`[data-section="${section}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    currentSection = section;
    
    // Close sidebar on mobile
    if (window.innerWidth <= 1024) {
        document.getElementById('sidebar').classList.remove('active');
        document.querySelector('.sidebar-overlay').classList.remove('active');
    }
    
    // Load section-specific data
    if (section === 'pending') {
        renderPendingRequests();
    } else if (section === 'students') {
        renderAllStudents();
    }
}

// Load pending requests
async function loadPendingRequests() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/pending-requests', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            pendingRequests = result.data;
            updatePendingCount(pendingRequests.length);
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error('Load pending requests error:', error);
        showAlert('Failed to load pending requests', 'danger');
    }
}

// Load all students
async function loadAllStudents() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/students', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            allStudents = result.data;
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error('Load all students error:', error);
        showAlert('Failed to load students', 'danger');
    }
}

// Update admin stats
function updateAdminStats() {
    const pending = allStudents.filter(s => s.approvalStatus === 'pending').length;
    const approved = allStudents.filter(s => s.approvalStatus === 'approved').length;
    const total = allStudents.length;
    
    const pendingStatsCount = document.getElementById('pendingStatsCount');
    const approvedStatsCount = document.getElementById('approvedStatsCount');
    const totalStatsCount = document.getElementById('totalStatsCount');
    
    if (pendingStatsCount) pendingStatsCount.textContent = pending;
    if (approvedStatsCount) approvedStatsCount.textContent = approved;
    if (totalStatsCount) totalStatsCount.textContent = total;
}

// Update pending count badge
function updatePendingCount(count) {
    const badge = document.getElementById('pendingCount');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
        badge.style.background = 'var(--danger)';
        badge.style.color = 'white';
        badge.style.borderRadius = '50%';
        badge.style.width = '20px';
        badge.style.height = '20px';
        badge.style.fontSize = '0.75rem';
        badge.style.display = 'flex';
        badge.style.alignItems = 'center';
        badge.style.justifyContent = 'center';
        badge.style.marginLeft = '0.5rem';
    }
}

// Approve student
async function approveStudent(studentId) {
    if (confirm('Are you sure you want to approve this student?')) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/student/${studentId}/approve`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                showAlert(result.message, 'success');
                await Promise.all([
                    loadPendingRequests(),
                    loadAllStudents()
                ]);
                updateAdminStats();
                renderPendingRequests();
                renderAllStudents();
            } else {
                showAlert(result.message, 'danger');
            }
        } catch (error) {
            console.error('Approve student error:', error);
            showAlert('Failed to approve student', 'danger');
        }
    }
}

// Reject student
async function rejectStudent(studentId) {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason && reason.trim()) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/student/${studentId}/reject`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: reason.trim() })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showAlert(result.message, 'success');
                await Promise.all([
                    loadPendingRequests(),
                    loadAllStudents()
                ]);
                updateAdminStats();
                renderPendingRequests();
                renderAllStudents();
            } else {
                showAlert(result.message, 'danger');
            }
        } catch (error) {
            console.error('Reject student error:', error);
            showAlert('Failed to reject student', 'danger');
        }
    }
}

// View student details
async function viewStudentDetails(studentId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/student/${studentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayStudentModal(result.data);
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error('View student details error:', error);
        showAlert('Failed to load student details', 'danger');
    }
}

// Display student modal
function displayStudentModal(student) {
    const modalBody = document.getElementById('studentModalBody');
    const formattedDate = student.expiryDate ? new Date(student.expiryDate).toLocaleDateString() : 'N/A';
    
    modalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg); margin-bottom: var(--spacing-lg);">
            <div>
                <h4>Personal Information</h4>
                <p><strong>Full Name:</strong> ${student.fullName}</p>
                <p><strong>Student ID:</strong> ${student.studentId}</p>
                <p><strong>Department:</strong> ${student.department}</p>
                <p><strong>Student Email:</strong> ${student.studentEmail}</p>
                <p><strong>Personal Email:</strong> ${student.personalEmail}</p>
            </div>
            
            <div>
                <h4>Profile Details</h4>
<p><strong>CNIC:</strong> ${(student.cnic ? String(student.cnic).replace(/\D/g, '') : 'Not provided')}</p>
                <p><strong>Registration No:</strong> ${student.registrationNumber || 'Not provided'}</p>
                <p><strong>Expiry Date:</strong> ${formattedDate}</p>
                <p><strong>Status:</strong> 
                    <span class="status-badge status-${student.approvalStatus}">
                        ${student.approvalStatus.charAt(0).toUpperCase() + student.approvalStatus.slice(1)}
                    </span>
                </p>
            </div>
        </div>
        
        ${student.profilePhoto ? `
            <div style="text-align: center; margin-bottom: var(--spacing-lg);">
                <h4>Profile Photo</h4>
                <img src="/uploads/profiles/${student.profilePhoto.filename}" 
                     alt="Student Photo" 
                     style="max-width: 200px; border-radius: var(--radius-md); border: 2px solid #e2e8f0;">
            </div>
        ` : ''}
        
        <div style="display: flex; gap: var(--spacing-md); justify-content: flex-end;">
            ${student.approvalStatus === 'pending' ? `
                <button class="btn btn-success btn-sm" onclick="approveStudent('${student._id}'); closeModal();">
                    Approve
                </button>
                <button class="btn btn-danger btn-sm" onclick="rejectStudent('${student._id}'); closeModal();">
                    Reject
                </button>
            ` : ''}
            <button class="btn btn-secondary btn-sm" onclick="closeModal()">Close</button>
        </div>
    `;
    
    document.getElementById('studentModal').classList.add('active');
}

// Close modal
function closeModal() {
    document.getElementById('studentModal').classList.remove('active');
}

// Render pending requests
function renderPendingRequests() {
    const container = document.getElementById('pendingRequestsTable');
    if (!container) return;
    
    if (pendingRequests.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: var(--spacing-xl); color: #64748b;">No pending requests</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="students-table">
            <thead>
                <tr>
                    <th>Student</th>
                    <th>Department</th>
                    <th>Student ID</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${pendingRequests.map(student => `
                    <tr>
                        <td>
                            <div class="student-info">
                                <div class="student-avatar">
                                    ${student.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div class="student-details">
                                    <h4>${student.fullName}</h4>
                                    <p>${student.studentEmail}</p>
                                </div>
                            </div>
                        </td>
                        <td>${student.department}</td>
                        <td>${student.studentId}</td>
                        <td>${student.submissionDate ? new Date(student.submissionDate).toLocaleDateString() : 'N/A'}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-primary btn-sm" onclick="viewStudentDetails('${student._id}')">
                                    View
                                </button>
                                <button class="btn btn-success btn-sm" onclick="approveStudent('${student._id}')">
                                    Approve
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="rejectStudent('${student._id}')">
                                    Reject
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Render all students
function renderAllStudents() {
    const container = document.getElementById('allStudentsTable');
    if (!container) return;
    
    container.innerHTML = `
        <table class="students-table">
            <thead>
                <tr>
                    <th>Student</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Registration Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${allStudents.map(student => `
                    <tr>
                        <td>
                            <div class="student-info">
                                <div class="student-avatar">
                                    ${student.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div class="student-details">
                                    <h4>${student.fullName}</h4>
                                    <p>${student.studentEmail}</p>
                                </div>
                            </div>
                        </td>
                        <td>${student.department}</td>
                        <td>
                            <span class="status-badge status-${student.approvalStatus}">
                                ${student.approvalStatus.charAt(0).toUpperCase() + student.approvalStatus.slice(1)}
                            </span>
                        </td>
                        <td>${new Date(student.createdAt).toLocaleDateString()}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-primary btn-sm" onclick="viewStudentDetails('${student._id}')">
                                    View
                                </button>
                                ${student.approvalStatus === 'pending' ? `
                                    <button class="btn btn-success btn-sm" onclick="approveStudent('${student._id}')">
                                        Approve
                                    </button>
                                    <button class="btn btn-danger btn-sm" onclick="rejectStudent('${student._id}')">
                                        Reject
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Filter students
function filterStudents() {
    const searchInput = document.getElementById('studentSearch');
    const statusFilter = document.getElementById('statusFilter');
    
    if (!searchInput || !statusFilter) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const statusFilter_value = statusFilter.value;
    
    let filteredStudents = allStudents;
    
    // Apply search filter
    if (searchTerm) {
        filteredStudents = filteredStudents.filter(student =>
            student.fullName.toLowerCase().includes(searchTerm) ||
            student.studentEmail.toLowerCase().includes(searchTerm) ||
            student.studentId.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply status filter
    if (statusFilter_value !== 'all') {
        filteredStudents = filteredStudents.filter(student =>
            student.approvalStatus === statusFilter_value
        );
    }
    
    // Re-render with filtered data
    const originalStudents = allStudents;
    allStudents = filteredStudents;
    renderAllStudents();
    allStudents = originalStudents;
}

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const overlay = document.querySelector('.sidebar-overlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    
    if (window.innerWidth > 1024) {
        mainContent.classList.toggle('sidebar-open');
    }
}

// Logout function
async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        // Clear local storage and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
}

// Show alert function
function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alertContainer.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Responsive sidebar handling
window.addEventListener('resize', function() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (window.innerWidth > 1024) {
        if (sidebar.classList.contains('active')) {
            mainContent.classList.add('sidebar-open');
        }
        overlay.classList.remove('active');
    } else {
        mainContent.classList.remove('sidebar-open');
    }
});

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('studentModal');
    if (event.target === modal) {
        closeModal();
    }
});
