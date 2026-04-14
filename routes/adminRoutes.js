const express = require('express');
const router = express.Router();
const { getStats, createTask, getAllSubmissions, updateSubmissionStatus, getAllUsers, getAttendance, markAttendance, createStudent, getUserProfileDetails, bulkImportUsers } = require('../controllers/adminController');
const { exportExcelReport } = require('../controllers/reportController');
const { protect, admin } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get('/stats', protect, admin, getStats);
router.post('/tasks', protect, admin, createTask);
router.post('/users', protect, admin, createStudent);
router.post('/users/upload', protect, admin, upload.single('file'), bulkImportUsers);
router.get('/users', protect, admin, getAllUsers);
router.get('/users/:id', protect, admin, getUserProfileDetails);
router.get('/submissions', protect, admin, getAllSubmissions);
router.put('/submissions/:id', protect, admin, updateSubmissionStatus);
router.get('/attendance', protect, admin, getAttendance);
router.post('/attendance', protect, admin, markAttendance);

// Report Export Routes
router.get('/export/excel', protect, admin, exportExcelReport);

module.exports = router;
