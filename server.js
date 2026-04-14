const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

// Load env vars
dotenv.config();

const User = require('./models/User');
const Task = require('./models/Task');

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Mount routers
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/internships', require('./routes/internshipRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

const PORT = process.env.PORT || 5000;

// Connect to database and seed users
connectDB().then(async () => {
    console.log('Synchronizing user accounts...');
    
    // Ensure Admin
    let admin = await User.findOne({ email: 'admin@devtrack.com' });
    if (!admin) {
        await User.create({ 
            name: 'Super Admin', 
            email: 'admin@devtrack.com', 
            password: 'password123', 
            initialPassword: 'password123', 
            role: 'admin',
            isFirstLogin: false 
        });
        console.log('✅ Admin account restored.');
    } else {
        admin.password = 'password123';
        admin.initialPassword = 'password123';
        await admin.save();
        console.log('✅ Admin password synchronized.');
    }

    // Ensure Student
    let student = await User.findOne({ email: 'student@devtrack.com' });
    if (!student) {
        await User.create({ 
            name: 'Student User', 
            email: 'student@devtrack.com', 
            password: 'password123', 
            initialPassword: 'password123', 
            role: 'user',
            isFirstLogin: true 
        });
        console.log('✅ Student account restored.');
    } else {
        student.password = 'password123';
        student.initialPassword = 'password123';
        await student.save();
        console.log('✅ Student password synchronized.');
    }
    
    const taskCount = await Task.countDocuments();
    if (taskCount === 0) {
        await Task.insertMany([
            { title: 'Complete React Fundamentals Module', type: 'course', description: 'Watch sections 1-3 of the React course and submit the certificate or screenshot.' },
            { title: 'Two Sum', type: 'leetcode', description: 'Solve "Two Sum" on LeetCode. Array, Hash Table.', day: 1 },
            { title: 'Update Portfolio Repo', type: 'daily', description: 'Commit at least one update to your Github portfolio.' },
            { title: 'Build Weather App MVP', type: 'project', description: 'Initialize responsive weather app using public API.' }
        ]);
        console.log('✅ Tasks seeded.');
    }

    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
});
