const API_BASE = 'http://localhost:5000/api';

// Student Login
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch(`${API_BASE}/student/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log(data)
                localStorage.setItem("token", data.token);

                localStorage.setItem('studentToken', data.token);
                localStorage.setItem('studentData', JSON.stringify(data.student));
                window.location.href = 'student-dashboard.html';
            } else {
                showMessage(data.message, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage('Network error. Please try again.', 'error');
        }
    });
}

// Student Signup
if (document.getElementById('signupForm')) {
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            studentId: document.getElementById('studentId').value,
            department: document.getElementById('department').value,
            password: document.getElementById('password').value
        };
        
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (formData.password !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }
        
        if (formData.password.length < 6) {
            showMessage('Password must be at least 6 characters', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}/student/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('studentToken', data.token);
                localStorage.setItem('studentData', JSON.stringify(data.student));
                window.location.href = 'student-Dashboard.html';
            } else {
                showMessage(data.message, 'error');
            }
        } catch (error) {
            console.error('Signup error:', error);
            showMessage('Network error. Please try again.', 'error');
        }
    });
}

// Admin Login
if (document.getElementById('adminLoginForm')) {
    document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch(`${API_BASE}/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('token',data.token)
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminData', JSON.stringify(data.admin));
                window.location.href = 'admin.html';
            } else {
                showMessage(data.message, 'error');
            }
        } catch (error) {
            console.error('Admin login error:', error);
            showMessage('Network error. Please try again.', 'error');
        }
    });
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = 'message';
    }, 2000);
}