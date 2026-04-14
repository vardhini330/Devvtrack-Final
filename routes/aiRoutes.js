const express = require('express');
const router = express.Router();
const { suggestTasks, recommendCourses, getAIInsights, chat } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.get('/suggest-tasks', protect, suggestTasks);
router.get('/recommend-courses', protect, recommendCourses);
router.get('/insights', protect, getAIInsights);
router.post('/chat', protect, chat);

module.exports = router;
