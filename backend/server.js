const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();

// ================== Middleware ==================
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
    fs.mkdirSync('uploads/images');
    fs.mkdirSync('uploads/videos');
}

// ================== Multer Config ==================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, 'uploads/images/');
        } else if (file.mimetype.startsWith('video/')) {
            cb(null, 'uploads/videos/');
        } else {
            cb(null, 'uploads/');
        }
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) cb(null, true);
        else cb(new Error('Only images and videos are allowed!'), false);
    }
});

// ================== Database ==================
mongoose.connect('mongodb://localhost:27017/college_portal', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// ================== Schemas ==================
const studentSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    studentId: { type: String, unique: true },
    department: String,
    password: String,
    createdAt: { type: Date, default: Date.now }
});
const Student = mongoose.model('Student', studentSchema);

const adminSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    name: String,
    email: String,
    category: String,
    role: { type: String, default: 'admin' }
});
const Admin = mongoose.model('Admin', adminSchema);

// ---- Complaint Schema ----
const complaintSchema = new mongoose.Schema({
    studentId: String,
    studentName: String,
    studentEmail: String,
    department: String,
    category: String,
    priority: String,
    trackingId: { type: String, unique: true, sparse: true },
    complaintTitle: String,        // ✅ Title field
    complaintText: String,
    mediaFiles: [{
        filename: String,
        originalName: String,
        path: String,
        fileType: String
    }],
    status: { type: String, default: 'Pending' },
    assignedAdmin: String,
    updates: [{
        status: String,
        message: String,
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

// ✅ Automatically generate tracking ID from real _id before saving
complaintSchema.pre('save', function (next) {
    if (!this.trackingId && this._id) {
        this.trackingId = `COMP${this._id.toString().slice(-6).toUpperCase()}`;
    }
    next();
});

const Complaint = mongoose.model('Complaint', complaintSchema);

// ================== Auth Middleware ==================
const JWT_SECRET = 'college_complaint_secret_2024';
const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// ================== Routes ==================

// ---- Student Signup ----
app.post('/api/student/signup', async (req, res) => {
    try {
        const { name, email, studentId, department, password } = req.body;
        const existing = await Student.findOne({ $or: [{ email }, { studentId }] });
        if (existing)
            return res.status(400).json({ success: false, message: 'Student with this email or ID already exists' });

        const hashed = await bcrypt.hash(password, 10);
        const student = await Student.create({ name, email, studentId, department, password: hashed });

        const token = jwt.sign({ id: student._id, email: student.email, role: 'student' }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, message: 'Registered successfully', token, student });
    } catch (e) {
        console.error('Signup error:', e);
        res.status(500).json({ success: false, message: 'Error during registration' });
    }
});

// ---- Student Login ----
app.post('/api/student/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const student = await Student.findOne({ email });
        if (!student) return res.status(400).json({ success: false, message: 'Invalid credentials' });
        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

        const token = jwt.sign({ id: student._id, email: student.email, role: 'student' }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, message: 'Login successful', token, student });
    } catch (e) {
        console.error('Login error:', e);
        res.status(500).json({ success: false, message: 'Error during login' });
    }
});

// ---- Admin Login ----
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });
        if (!admin) return res.status(400).json({ success: false, message: 'Invalid credentials' });
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

        const token = jwt.sign({ id: admin._id, username: admin.username, role: 'admin', category: admin.category },
            JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, message: 'Login successful', token, admin });
    } catch (e) {
        console.error('Admin login error:', e);
        res.status(500).json({ success: false, message: 'Error during login' });
    }
});

// ---- Submit Complaint (Protected) ----
app.post('/api/complaints/submit', auth, upload.array('mediaFiles', 5), async (req, res) => {
    try {
        const { category, priority, complaintTitle, complaintText } = req.body;

        const student = await Student.findById(req.user.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const categoryToAdmin = {
            'Hostel': 'Hostel Admin',
            'Academics': 'Academics Admin',
            'Library': 'Library Admin',
            'IT': 'IT Admin',
            'Sports': 'Sports Admin',
            'Mess': 'Mess Admin'
        };

        const mediaFiles = req.files ? req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            fileType: file.mimetype.startsWith('image/') ? 'image' : 'video'
        })) : [];

        // ✅ Create complaint normally (trackingId auto-set by pre-save hook)
        const complaint = new Complaint({
            studentId: student.studentId,
            studentName: student.name,
            studentEmail: student.email,
            department: student.department,
            category,
            priority,
            complaintTitle,
            complaintText,
            mediaFiles,
            assignedAdmin: categoryToAdmin[category] || 'General Admin',
            updates: [{ status: 'Pending', message: 'Complaint submitted successfully' }]
        });

        await complaint.save();

        res.json({
            success: true,
            message: 'Complaint submitted successfully!',
            complaintId: complaint._id,
            trackingId: complaint.trackingId
        });

    } catch (error) {
        console.error('Complaint submit error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting complaint'
        });
    }
});

// ---- Student's Complaints ----
app.get('/api/student/complaints', auth, async (req, res) => {
    try {
        const student = await Student.findById(req.user.id);
        const complaints = await Complaint.find({ studentId: student.studentId }).sort({ createdAt: -1 });
        res.json({ success: true, data: complaints });
    } catch {
        res.status(500).json({ success: false, message: 'Error fetching complaints' });
    }
});

// ---- Track Complaint (Public) ----
app.get('/api/complaints/track/:trackingId', async (req, res) => {
    try {
        const complaint = await Complaint.findOne({ trackingId: req.params.trackingId });
        if (!complaint)
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        res.json({ success: true, data: complaint });
    } catch (e) {
        console.error('Tracking error:', e);
        res.status(500).json({ success: false, message: 'Error fetching complaint' });
    }
});

// ---- Admin Routes (unchanged) ----
app.get('/api/admin/complaints', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin')
            return res.status(403).json({ success: false, message: 'Access denied' });
        const complaints = await Complaint.find().sort({ createdAt: -1 });
        res.json({ success: true, data: complaints });
    } catch {
        res.status(500).json({ success: false, message: 'Error fetching complaints' });
    }
});

app.put('/api/admin/complaints/:id/status', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin')
            return res.status(403).json({ success: false, message: 'Access denied' });

        const { status, message } = req.body;
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint)
            return res.status(404).json({ success: false, message: 'Complaint not found' });

        complaint.status = status;
        complaint.updates.push({ status, message: message || `Status changed to ${status}` });
        await complaint.save();

        res.json({ success: true, message: 'Status updated successfully', data: complaint });
    } catch {
        res.status(500).json({ success: false, message: 'Error updating status' });
    }
});

// ---- Stats ----
app.get('/api/stats', async (req, res) => {
    try {
        const total = await Complaint.countDocuments();
        const pending = await Complaint.countDocuments({ status: 'Pending' });
        const resolved = await Complaint.countDocuments({ status: 'Resolved' });
        res.json({ success: true, data: { total, pending, resolved } });
    } catch {
        res.status(500).json({ success: false, message: 'Error fetching statistics' });
    }
});

// ---- Root Test Route ----
app.get('/', (req, res) => {
    res.json({
        message: 'College Complaint Portal API is running!',
        version: '2.1',
        features: ['Authentication', 'File Upload', 'Stable Tracking IDs', 'Complaint Titles']
    });
});

// ================== Server Start ==================
const PORT = 5000;
app.listen(PORT, () => {
    console.log('🎉 College Complaint Portal Backend Started!');
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 MongoDB: college_portal`);
    console.log(`🔐 Authentication: Enabled`);
});
