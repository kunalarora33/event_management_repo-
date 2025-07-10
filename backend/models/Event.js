const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        // If you want it required: true, otherwise keep false or remove the line
        required: true, // Changed from false to true based on the second definition
        trim: true
    },
    date: {
        type: Date, // Consider changing to Date type for better date manipulation and queries
        required: true
    },
    time: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    category: { // Added from the second definition
        type: String,
        required: true
    },
    imageUrl: { // Added from the second definition
        type: String,
        default: ''
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organizer',
        required: true
    },
    fee: { // Added from the second definition
        type: Number,
        default: 0,
        min: 0 // Ensure fee cannot be negative
    },
    attendees: [{ // Added from the second definition
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    // Keep timestamps: true for createdAt and updatedAt fields
    timestamps: true
});

module.exports = mongoose.model('Event', EventSchema);