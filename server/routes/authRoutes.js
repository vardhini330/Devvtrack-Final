const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, getMyAttendance, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Auth routes
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/attendance', protect, getMyAttendance);
router.post('/change-password', protect, changePassword);

module.exports = router;
