const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const Task = require('./models/Task');

dotenv.config();

const seed = async () => {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');

        console.log('Cleaning old test users...');
        await User.deleteMany({ email: { $in: ['admin@devtrack.com', 'student@devtrack.com'] } });

        console.log('Seeding Student and Admin...');
        
        // Admin
        await User.create({
            name: 'Super Admin',
            email: 'admin@devtrack.com',
            password: 'password123',
            role: 'admin'
        });

        // Student
        await User.create({
            name: 'Student User',
            email: 'student@devtrack.com',
            password: 'password123',
            role: 'user'
        });

        console.log('Seeding Tasks...');
        await Task.deleteMany({});
        await Task.insertMany([
            { title: 'Complete React Fundamentals Module', type: 'course', description: 'Watch sections 1-3 of the React course and submit the certificate or screenshot.' },
            { title: 'Two Sum', type: 'leetcode', description: 'Solve "Two Sum" on LeetCode. Array, Hash Table.', day: 1 },
            { title: 'Update Portfolio Repo', type: 'daily', description: 'Commit at least one update to your Github portfolio.' },
            { title: 'Build Weather App MVP', type: 'project', description: 'Initialize responsive weather app using public API.' }
        ]);

        console.log('🌟 Cloud seeding complete! You can now log in with:');
        console.log('👉 Student: student@devtrack.com / password123');
        console.log('👉 Admin: admin@devtrack.com / password123');
        
        process.exit();
    } catch (err) {
        console.error('Error seeding:', err);
        process.exit(1);
    }
};

seed();
