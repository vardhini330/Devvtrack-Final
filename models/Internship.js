const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    companyName: {
        type: String,
        required: true
    },
    domain: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['online', 'offline'],
        required: true
    },
    documents: {
        offerLetter: { type: String }, // Path to file
        mailProof: { type: String },
        forms: { type: String },
        certificate: { type: String }
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    feedback: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Internship', internshipSchema);
