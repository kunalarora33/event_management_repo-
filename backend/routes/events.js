const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
// Assuming 'protect' middleware is defined as 'authenticateOrganizer' for clarity with previous discussions
const { protect } = require('../middleware/authMiddleware');

// --- GET All Events for the authenticated organizer ---
// (Corresponds to Organizer Dashboard's event list display)
router.get('/', protect, async (req, res) => {
    try {
        // req.organizer._id comes from your 'protect' middleware (assuming it sets 'req.organizer')
        const events = await Event.find({ organizer: req.organizer._id }).sort({ date: 1, time: 1 });
        res.json(events);
    } catch (error) {
        console.error('Error fetching events for organizer:', error.message);
        res.status(500).send('Server Error');
    }
});

// --- GET Single Event by ID for public view ---
// (Corresponds to the frontend's need for event details for the registration modal)
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json(event);
    } catch (error) {
        console.error('Error fetching single event:', error.message);
        // This handles cases where the ID format is invalid
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(500).send('Server Error');
    }
});

// --- POST Create New Event ---
// (Corresponds to Organizer Dashboard's "Add Event" functionality)
router.post('/', protect, async (req, res) => {
    // Destructure all expected fields, including the new ones: category, imageUrl, fee
    const { title, description, date, time, location, category, imageUrl, fee } = req.body;

    try {
        const newEvent = new Event({
            title,
            description,
            date,
            time,
            location,
            category, // Added
            imageUrl, // Added
            organizer: req.organizer._id, // Ensure this is correct based on your middleware
            fee: parseFloat(fee) || 0 // Added: Convert fee to number, default to 0 if invalid
        });

        const event = await newEvent.save();
        // Respond with a success message and the created event
        res.status(201).json({ message: 'Event created successfully', event });
    } catch (error) {
        // More specific error logging for validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        console.error('Error creating event:', error.message);
        res.status(500).send('Server Error');
    }
});

// --- PUT Update Existing Event ---
// (Corresponds to Organizer Dashboard's "Edit Event" functionality)
router.put('/:id', protect, async (req, res) => {
    // Destructure all expected fields, including the new ones: category, imageUrl, fee
    const { title, description, date, time, location, category, imageUrl, fee } = req.body;

    try {
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Authorization check: Ensure the event belongs to the authenticated organizer
        if (event.organizer.toString() !== req.organizer._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to update this event' });
        }

        // Update fields if they are provided in the request body
        event.title = title !== undefined ? title : event.title; // Use explicit check for undefined
        event.description = description !== undefined ? description : event.description;
        event.date = date !== undefined ? date : event.date;
        event.time = time !== undefined ? time : event.time;
        event.location = location !== undefined ? location : event.location;
        event.category = category !== undefined ? category : event.category; // Added
        event.imageUrl = imageUrl !== undefined ? imageUrl : event.imageUrl; // Added
        event.fee = (fee !== undefined && fee !== null) ? parseFloat(fee) : event.fee; // Added: Convert fee to number

        event = await event.save(); // Save the updated event
        res.json({ message: 'Event updated successfully', event }); // Respond with success message and updated event

    } catch (error) {
        // More specific error logging for validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        console.error('Error updating event:', error.message);
        res.status(500).send('Server Error');
    }
});

// --- DELETE Event ---
// (Corresponds to Organizer Dashboard's "Delete Event" functionality)
router.delete('/:id', protect, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Authorization check: Ensure the event belongs to the authenticated organizer
        if (event.organizer.toString() !== req.organizer._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete this event' });
        }

        // Use findByIdAndDelete for a cleaner delete operation
        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event removed successfully' }); // More consistent message

    } catch (error) {
        console.error('Error deleting event:', error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;