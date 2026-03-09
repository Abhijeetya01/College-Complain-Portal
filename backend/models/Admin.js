// backend/models/Admin.js
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    category: { type: String, required: true },
    role: { type: String, default: 'admin' } // or 'super_admin'
});

module.exports = mongoose.model('Admin', adminSchema);
