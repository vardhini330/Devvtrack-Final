const User = require('../models/User');
const Task = require('../models/Task');
const Submission = require('../models/Submission');

// @desc    Get smart task suggestions
// @route   GET /api/ai/suggestions
// @access  Private
const getSmartSuggestions = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const streak = user.streak || 0;
        
        // Analyze recent submissions
        const submissions = await Submission.find({ user: user._id }).sort({ createdAt: -1 }).limit(10);
        const approvedCount = submissions.filter(s => s.status === 'approved').length;
        const completionRate = submissions.length > 0 ? (approvedCount / submissions.length) : 0;

        let suggestions = [];

        // Logic-based suggestions
        if (streak === 0) {
            suggestions.push("Focus on consistency: complete just one task today to start your streak.");
        } else if (streak < 3) {
            suggestions.push("You're building momentum! Try an intermediate task to push your limits.");
        } else {
            suggestions.push(`Powerful ${streak}-day streak! Time for a high-impact Project task.`);
        }

        if (completionRate < 0.4 && submissions.length > 0) {
            suggestions.push("Focus on quality: review common feedback on your rejected tasks before starting new ones.");
        }

        // Fetch actual tasks that might fit
        const targetDifficulty = user.skillLevel || 'Beginner';
        const tasks = await Task.find({ 
            difficulty: targetDifficulty,
            _id: { $nin: submissions.map(s => s.task) } 
        }).limit(2);

        tasks.forEach(t => suggestions.push(`Explore: ${t.title} (${t.type})`));

        res.status(200).json({ suggestions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get course recommendations
// @route   GET /api/ai/recommendations
// @access  Private
const getCourseRecommendations = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const domain = user.domain || 'Web Development';
        const level = user.skillLevel || 'Beginner';

        // Search for tasks of type 'course' matching domain in topics or description
        const courses = await Task.find({
            type: 'course',
            $or: [
                { topics: { $in: [domain] } },
                { description: new RegExp(domain, 'i') },
                { title: new RegExp(domain, 'i') }
            ],
            difficulty: level
        }).limit(3);

        res.status(200).json({ 
            recommendations: courses.map(c => ({
                id: c._id,
                title: c.title,
                level: c.difficulty,
                description: c.description.substring(0, 100) + '...'
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get AI insights about productivity
// @route   GET /api/ai/insights
// @access  Private
const getAIInsights = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        let insights = [];
        
        if (user.streak >= 5) {
            insights.push("🔥 Exceptional consistency! You are in the top 10% of active students this week.");
        } else if (user.streak > 0) {
            insights.push("🚀 Good progress. Maintain this for 3 more days to establish a habit.");
        }

        if (user.totalTasksCompleted > 20) {
            insights.push("🎓 Knowledge base growing. You should consider moving to 'Advanced' tasks soon.");
        }

        if (insights.length === 0) {
            insights.push("👋 Welcome to DevTrack! Start by completing a Daily Task to see your first insights.");
        }

        res.status(200).json({ insights });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mock AI Mentor Chat
// @route   POST /api/ai/chat
// @access  Private
const chatWithAI = async (req, res) => {
    try {
        const { message } = req.body;
        const msg = message.toLowerCase();
        const user = await User.findById(req.user._id);

        let reply = `I'm your Neural Mentor, ${user.name.split(' ')[0]}. Analyzing your ${user.domain} path at ${user.skillLevel} level. Ask me anything!`;

        // Validation & Technical Help
        if (msg.includes('validation') || msg.includes('github') || msg.includes('link')) {
            reply = "To validate your code, paste your GitHub URL in the submission modal and click 'VALIDATE LINK'. It checks for public visibility and commit history. If it's private, I can't verify it!";
        } 
        // Career Pathing (NEW)
        else if (msg.includes('career') || msg.includes('scope') || msg.includes('which domain') || msg.includes('web dev vs ai')) {
            reply = `Choosing between ${user.domain} and other fields? Currently, AI has high research scope, but Web Development has more immediate job openings. Since you are in ${user.domain}, focusing on full-stack integration of AI models will make you a 'Super Developer' in the next 2 years.`;
        }
        // Project Guidance (NEW)
        else if (msg.includes('project') || msg.includes('how to start') || msg.includes('weather app') || msg.includes('portfolio')) {
            reply = "To start any project: 1. Draw your UI on paper. 2. Set up your basic HTML structure. 3. Connect a sample API (like OpenWeather). My advice: build the MVP (Minimum Viable Product) first, then add the 'AI features' later!";
        }
        // Navigation Help (NEW)
        else if (msg.includes('where') || msg.includes('how to') || msg.includes('attendance') || msg.includes('leaderboard') || msg.includes('pdf')) {
            reply = "Navigation Tip: You can find reports (PDF/Excel) in the header. Attendance, Leaderboard, and Internships are in the tabs on the main Dashboard view. Click 'Dashboard' in your sidebar to go back there!";
        }
        // Streak & Consistency
        else if (msg.includes('streak') || msg.includes('consistency') || msg.includes('days')) {
            if (user.streak === 0) {
                reply = "Your streak is currently at 0. Don't overthink it—completing just one LeetCode Easy or a Daily task today will restart your engine. I believe in your consistency.";
            } else {
                reply = `Impressive! A ${user.streak}-day streak shows true discipline. Remember, your longest streak was ${user.longestStreak || user.streak} days. Can you beat it?`;
            }
        } 
        // Motivation & Struggle (NEW)
        else if (msg.includes('stuck') || msg.includes('overwhelmed') || msg.includes('hard') || msg.includes('motivation')) {
            reply = "Feeling overwhelmed? It's a common 'Developer Burnout' phase. Switch off for 1 hour, take a walk, and then come back to just ONE small task. You've already completed ${user.totalTasksCompleted} tasks—you are closer than you think!";
        }
        // Generic Greetings
        else if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
            reply = `Ready for a knowledge session, ${user.name.split(' ')[0]}? I'm processing your domain stats. How can I help you dominate your goals today?`;
        }

        res.status(200).json({ reply });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getSmartSuggestions,
    getCourseRecommendations,
    getAIInsights,
    chatWithAI
};
