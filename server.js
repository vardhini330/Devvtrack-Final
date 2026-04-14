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

const PORT = process.env.PORT || 5000;

// Connect to database and seed if users are missing
connectDB().then(async () => {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
        console.log('No users found. Seeding initial data...');
        await User.create({ name: 'Super Admin', email: 'admin@devtrack.com', password: 'password123', role: 'admin' });
        await User.create({ name: 'Student User', email: 'student@devtrack.com', password: 'password123', role: 'user' });
        
        const taskCount = await Task.countDocuments();
        if (taskCount === 0) {
            await Task.insertMany([
                { title: 'Complete React Fundamentals Module', type: 'course', description: 'Watch sections 1-3 of the React course and submit the certificate or screenshot.' },
                { title: 'Two Sum', type: 'leetcode', description: 'Solve "Two Sum" on LeetCode. Array, Hash Table.', day: 1 },
                { title: 'Update Portfolio Repo', type: 'daily', description: 'Commit at least one update to your Github portfolio.' },
                { title: 'Build Weather App MVP', type: 'project', description: 'Initialize responsive weather app using public API.' }
            ]);
        }
        console.log('Test data seeded.');
    }

    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
});
