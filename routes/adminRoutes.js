const express = require('express');
const router = express.Router();
const { getStats, createTask, getAllSubmissions, updateSubmissionStatus, getAllUsers, getAttendance, markAttendance, createStudent, getUserProfileDetails } = require('../controllers/adminController');
const { exportExcelReport, exportPdfReport } = require('../controllers/reportController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/stats', protect, admin, getStats);
router.post('/tasks', protect, admin, createTask);
router.post('/users', protect, admin, createStudent);
router.get('/users', protect, admin, getAllUsers);
router.get('/users/:id', protect, admin, getUserProfileDetails);
router.get('/submissions', protect, admin, getAllSubmissions);
router.put('/submissions/:id', protect, admin, updateSubmissionStatus);
router.get('/attendance', protect, admin, getAttendance);
router.post('/attendance', protect, admin, markAttendance);

// Report Export Routes
router.get('/export/excel', protect, admin, exportExcelReport);
router.get('/export/pdf', protect, admin, exportPdfReport);

module.exports = router;
