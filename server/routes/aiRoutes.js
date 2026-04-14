const express = require('express');
const router = express.Router();
const { 
    getSmartSuggestions, 
    getCourseRecommendations, 
    getAIInsights, 
    chatWithAI 
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/suggestions', getSmartSuggestions);
router.get('/recommendations', getCourseRecommendations);
router.get('/insights', getAIInsights);
router.post('/chat', chatWithAI);

module.exports = router;
