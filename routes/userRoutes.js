const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../controllers/leaderboardController');
const { exportStudentExcelReport, exportStudentPdfReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/leaderboard', getLeaderboard);
router.get('/export/excel', protect, exportStudentExcelReport);
router.get('/export/pdf', protect, exportStudentPdfReport);

module.exports = router;
