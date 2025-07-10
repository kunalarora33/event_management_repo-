const express = require('express');
const router = express.Router();
const Attendee = require('../models/Attendee'); 
const Event = require('../models/Event');
const { protect } = require('../middleware/authMiddleware'); 
const mongoose = require('mongoose'); // <--- ADDED THIS LINE

router.post('/', async (req, res) => {
    const { name, email, eventId } = req.body;

    if (!name || !email || !eventId) {
        return res.status(400).json({ message: 'Please enter all required fields (name, email, eventId)' });
    }

    // <--- ADDED THIS VALIDATION BLOCK
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        console.warn(`Attendees Route (POST): Invalid Event ID format received: ${eventId}`);
        return res.status(400).json({ message: 'Invalid event ID format for registration.' });
    }

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const existingRegistration = await Attendee.findOne({ email, event: eventId });
        if (existingRegistration) {
            return res.status(409).json({ message: 'You are already registered for this event.' });
        }

        const newAttendee = new Attendee({
            name,
            email,
            event: eventId
        });

        const attendee = await newAttendee.save();
        res.status(201).json({ message: 'Registration successful!', attendee });

    } catch (error) {
        // Handle MongoDB duplicate key error specifically for unique index on email+event
        if (error.code === 11000 && error.keyPattern && error.keyPattern.email && error.keyPattern.event) {
            return res.status(409).json({ message: 'You are already registered for this event.' });
        }
        
        console.error('Error registering attendee:', error.message);
        res.status(500).json({ message: 'Server error during registration' });
    }
});


router.get('/event/:eventId', protect, async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const organizerId = req.organizer._id;

        // Ensure eventId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(eventId)) { // <--- Added validation for consistency
            return res.status(400).json({ message: 'Invalid event ID format.' });
        }
        
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.organizer.toString() !== organizerId.toString()) {
            return res.status(401).json({ message: 'Not authorized to view attendees for this event.' });
        }

        const attendees = await Attendee.find({ event: eventId }).select('-__v'); 

        res.json(attendees);

    } catch (error) {
        console.error('Error fetching attendees for event:', error.message);
        // Catch-all for other errors, including potential Mongoose CastError if ID is malformed (though we added a check)
        res.status(500).json({ message: 'Server error' });
    }
});


router.delete('/:attendeeId', protect, async (req, res) => {
    try {
        const attendeeId = req.params.attendeeId;
        const organizerId = req.organizer._id;

        // Ensure attendeeId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(attendeeId)) { // <--- Added validation for consistency
            return res.status(400).json({ message: 'Invalid attendee ID format.' });
        }
        
        const attendee = await Attendee.findById(attendeeId);

        if (!attendee) {
            return res.status(404).json({ message: 'Attendee registration not found.' });
        }

        const event = await Event.findById(attendee.event);

        if (!event) {
            // If the associated event is gone, we can still delete the attendee record
            // but log a warning. Or, you could return 404/410 if the event is strictly required.
            // For now, let's allow deletion but acknowledge the missing event.
            console.warn(`Attendee ${attendeeId} refers to a non-existent event ${attendee.event}.`);
            // return res.status(404).json({ message: 'Associated event not found for this registration.' }); // Optional: uncomment if strict
        } else {
             if (event.organizer.toString() !== organizerId.toString()) {
                return res.status(401).json({ message: 'Not authorized to delete this attendee registration.' });
            }
        }
       
        await Attendee.deleteOne({ _id: attendeeId }); 

        res.json({ message: 'Attendee registration deleted successfully.' });

    } catch (error) {
        console.error('Error deleting attendee registration:', error.message);
        // Catch-all for other errors, including potential Mongoose CastError if ID is malformed (though we added a check)
        res.status(500).json({ message: 'Server error during deletion.' });
    }
});

module.exports = router;