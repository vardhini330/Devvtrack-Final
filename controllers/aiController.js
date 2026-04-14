const User = require('../models/User');
const Task = require('../models/Task');
const Submission = require('../models/Submission');

// @desc    Suggest smart tasks based on user history (Rule-based)
// @route   GET /api/ai/suggest-tasks
exports.suggestTasks = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const streak = user.streak || 0;
        
        // Find existing tasks
        const allTasks = await Task.find();
        
        let suggestions = [];
        
        if (streak === 0) {
            suggestions = ["Complete your first task to start your streak", "Update your profile details"];
        } else if (streak < 5) {
            suggestions = ["Focus on consistent daily tasks", "Revise basic data structures"];
        } else {
            suggestions = ["Try an advanced project task", "Solve a medium-difficulty LeetCode problem"];
        }

        // Filter actual available tasks from DB that match the criteria
        const relevantTasks = allTasks.filter(t => {
            if (streak > 5) return t.type === 'project' || t.type === 'leetcode';
            return t.type === 'daily' || t.type === 'course';
        }).slice(0, 3).map(t => t.title);

        res.status(200).json({ 
            suggestedTasks: relevantTasks.length > 0 ? relevantTasks : suggestions 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Recommend courses based on domain
// @route   GET /api/ai/recommend-courses
exports.recommendCourses = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const domain = user.domain || 'Web Development';
        
        const recommendations = {
            'Web Development': ['Advanced React Patterns', 'Node.js Performance Tuning', 'Modern CSS with Tailwind'],
            'AI / ML': ['Neural Networks from Scratch', 'Data Science with Python', 'PyTorch for Beginners'],
            'Data Structures': ['Clean Code in Java', 'Advanced Algorithm Analysis', 'Competitive Programming 101']
        };

        res.status(200).json({ 
            courses: recommendations[domain] || recommendations['Web Development'] 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get AI Insights (Performance Analysis)
// @route   GET /api/ai/insights
exports.getAIInsights = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const completionRate = user.totalTasksCompleted > 0 ? (user.totalTasksCompleted / 30) * 100 : 0; // Assuming 30 target
        
        let insight = "";
        if (user.streak > 10) {
            insight = "You are on fire! Your consistency is in the top 5% of users. Focus on complex projects now.";
        } else if (user.streak > 0) {
            insight = "Great progress. Increasing your daily task completion by 10% will stabilize your streak.";
        } else {
            insight = "Let's get started. Completing just one task today will unlock your first streak milestone.";
        }

        res.status(200).json({ insight });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    AI Mentor Chat (Personalized Rule-based Chat)
// @route   POST /api/ai/chat
exports.chat = async (req, res) => {
    try {
        const { message } = req.body;
        const user = await User.findById(req.user._id);
        
        const input = message.toLowerCase();
        let response = "";

        if (input.includes("hello") || input.includes("hi")) {
            response = `Hello ${user.name}! I'm your DevTrack AI Mentor. How can I help you today?`;
        } else if (input.includes("do today")) {
            response = "You should start with your most challenging task first. Check your 'Smart Suggestions' for specifics!";
        } else if (input.includes("improve")) {
            response = "Consistency is key. Try to complete at least one small task every single day to build a habit.";
        } else if (input.includes("streak")) {
            response = `Your current streak is ${user.streak}. Keep going! Doubling this will earn you a rank upgrade.`;
        } else {
            response = "That's an interesting question! As your mentor, I recommend breaking down your goals into small, actionable tasks.";
        }

        res.status(200).json({ response });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
