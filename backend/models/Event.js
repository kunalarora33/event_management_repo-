const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
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
    category: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        default: ''
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organizer',
        required: true
    },
    fee: {
        type: Number,
        default: 0,
        min: 0
    },
    attendees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'declined'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Event', EventSchema);