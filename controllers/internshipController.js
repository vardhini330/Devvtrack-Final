const Internship = require('../models/Internship');

// @desc    Submit a new internship tracking entry
// @route   POST /api/internships
// @access  Private
const submitInternship = async (req, res) => {
    try {
        const { companyName, domain, type } = req.body;
        
        if (!companyName || !domain || !type) {
            return res.status(400).json({ message: 'Please provide company name, domain, and type' });
        }

        const documents = {};
        
        if (req.files) {
            if (req.files.offerLetter) documents.offerLetter = `/uploads/${req.files.offerLetter[0].filename}`;
            if (req.files.mailProof) documents.mailProof = `/uploads/${req.files.mailProof[0].filename}`;
            if (req.files.forms) documents.forms = `/uploads/${req.files.forms[0].filename}`;
            if (req.files.certificate) documents.certificate = `/uploads/${req.files.certificate[0].filename}`;
        }

        const internship = await Internship.create({
            user: req.user._id,
            companyName,
            domain,
            type,
            documents
        });

        res.status(201).json(internship);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user's internships
// @route   GET /api/internships/me
// @access  Private
const getMyInternships = async (req, res) => {
    try {
        const internships = await Internship.find({ user: req.user._id }).sort('-createdAt');
        res.status(200).json(internships);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all internships (Admin)
// @route   GET /api/internships
// @access  Private/Admin
const getAllInternships = async (req, res) => {
    try {
        let query = {};
        if (req.query.status) {
            query.status = req.query.status;
        }
        if (req.query.userId) {
            query.user = req.query.userId;
        }
        const internships = await Internship.find(query).populate('user', 'name email').sort('-createdAt');
        res.status(200).json(internships);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Evaluate/Update an internship (Admin)
// @route   PUT /api/internships/:id
// @access  Private/Admin
const evaluateInternship = async (req, res) => {
    try {
        const { status, feedback } = req.body;
        
        const internship = await Internship.findById(req.params.id);
        if (!internship) {
            return res.status(404).json({ message: 'Internship entry not found' });
        }

        if (status) internship.status = status;
        if (feedback !== undefined) internship.feedback = feedback;

        await internship.save();
        res.status(200).json(internship);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    submitInternship,
    getMyInternships,
    getAllInternships,
    evaluateInternship
};
