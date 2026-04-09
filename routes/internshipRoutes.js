const express = require('express');
const router = express.Router();
const { submitInternship, getMyInternships, getAllInternships, evaluateInternship } = require('../controllers/internshipController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const uploadFields = upload.fields([
    { name: 'offerLetter', maxCount: 1 },
    { name: 'mailProof', maxCount: 1 },
    { name: 'forms', maxCount: 1 },
    { name: 'certificate', maxCount: 1 }
]);

router.post('/', protect, uploadFields, submitInternship);
router.get('/me', protect, getMyInternships);

// Admin routes
router.get('/', protect, admin, getAllInternships);
router.put('/:id', protect, admin, evaluateInternship);

module.exports = router;
