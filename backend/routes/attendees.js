const express = require('express');
const router = express.Router();
const Attendee = require('../models/Attendee'); 
const Event = require('../models/Event');
const { protect } = require('../middleware/authMiddleware'); 

router.post('/', async (req, res) => {
    const { name, email, eventId } = req.body;

    if (!name || !email || !eventId) {
        return res.status(400).json({ message: 'Please enter all required fields (name, email, eventId)' });
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

        
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        
        if (event.organizer.toString() !== organizerId.toString()) {
            return res.status(401).json({ message: 'Not authorized to view attendees for this event.' });
        }

       
        const attendees = await Attendee.find({ event: eventId }).select('-__v'); // Exclude __v field

        res.json(attendees);

    } catch (error) {
        console.error('Error fetching attendees for event:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});


router.delete('/:attendeeId', protect, async (req, res) => {
    try {
        const attendeeId = req.params.attendeeId;
        const organizerId = req.organizer._id;

       
        const attendee = await Attendee.findById(attendeeId);

        if (!attendee) {
            return res.status(404).json({ message: 'Attendee registration not found.' });
        }

        
        const event = await Event.findById(attendee.event);

        if (!event) {
           
            return res.status(404).json({ message: 'Associated event not found for this registration.' });
        }

      
        if (event.organizer.toString() !== organizerId.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete this attendee registration.' });
        }

        
        await Attendee.deleteOne({ _id: attendeeId }); 

        res.json({ message: 'Attendee registration deleted successfully.' });

    } catch (error) {
        console.error('Error deleting attendee registration:', error.message);
        res.status(500).json({ message: 'Server error during deletion.' });
    }
});


module.exports = router;