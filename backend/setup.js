const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

mongoose.connect('mongodb://localhost:27017/college_portal', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const createDefaultAdmins = async () => {
    try {
        // Clear existing admins
        await Admin.deleteMany({});

        const defaultAdmins = [
            {
                username: 'hosteladmin',
                password: await bcrypt.hash('hostel123', 10),
                name: 'Hostel Administrator',
                email: 'hostel@college.edu',
                category: 'Hostel'
            },
            {
                username: 'academicsadmin',
                password: await bcrypt.hash('academics123', 10),
                name: 'Academics Administrator',
                email: 'academics@college.edu',
                category: 'Academics'
            },
            {
                username: 'libraryadmin',
                password: await bcrypt.hash('library123', 10),
                name: 'Library Administrator',
                email: 'library@college.edu',
                category: 'Library'
            },
            {
                username: 'itadmin',
                password: await bcrypt.hash('it123', 10),
                name: 'IT Administrator',
                email: 'it@college.edu',
                category: 'IT'
            },
            {
                username: 'sportsadmin',
                password: await bcrypt.hash('sports123', 10),
                name: 'Sports Administrator',
                email: 'sports@college.edu',
                category: 'Sports'
            },
            {
                username: 'messadmin',
                password: await bcrypt.hash('mess123', 10),
                name: 'Mess Administrator',
                email: 'mess@college.edu',
                category: 'Mess'
            },
            {
                username: 'superadmin',
                password: await bcrypt.hash('admin123', 10),
                name: 'Super Administrator',
                email: 'admin@college.edu',
                category: 'All',
                role: 'super_admin'
            }
        ];

        for (const adminData of defaultAdmins) {
            const admin = new Admin(adminData);
            await admin.save();
            console.log(`✅ Created admin: ${adminData.username}`);
        }

        console.log('\n🎉 Default admin accounts created successfully!');
        console.log('\n📋 Admin Login Credentials:');
        console.log('=================================');
        defaultAdmins.forEach(admin => {
            console.log(`Username: ${admin.username}`);
            console.log(`Password: ${admin.password.replace(/.*\$/, '')}123`); // Show plain text for setup
            console.log(`Category: ${admin.category}`);
            console.log('---------------------------------');
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Setup error:', error);
        process.exit(1);
    }
};

createDefaultAdmins();