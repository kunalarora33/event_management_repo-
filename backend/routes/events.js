const express = require('express');
const router = express.Router();
const Event = require('../models/Event'); 
const { protect } = require('../middleware/authMiddleware'); 

router.get('/', protect, async (req, res) => {
    try {
        const events = await Event.find({ organizer: req.organizer._id }).sort({ date: 1, time: 1 });
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error.message);
        res.status(500).send('Server Error');
    }
});


router.post('/', protect, async (req, res) => {
    const { title, description, date, time, location } = req.body;

    try {
        const newEvent = new Event({
            title,
            description,
            date,
            time,
            location,
            organizer: req.organizer._id 
        });

        const event = await newEvent.save();
        res.status(201).json(event);
    } catch (error) {
        console.error('Error creating event:', error.message);
        res.status(500).send('Server Error');
    }
});


router.put('/:id', protect, async (req, res) => {
    const { title, description, date, time, location } = req.body;

    try {
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

      
        if (event.organizer.toString() !== req.organizer._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to update this event' });
        }

        
        event.title = title || event.title;
        event.description = description || event.description;
        event.date = date || event.date;
        event.time = time || event.time;
        event.location = location || event.location;

        event = await event.save();
        res.json(event);

    } catch (error) {
        console.error('Error updating event:', error.message);
        res.status(500).send('Server Error');
    }
});


router.delete('/:id', protect, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        
        if (event.organizer.toString() !== req.organizer._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete this event' });
        }

        await Event.deleteOne({ _id: req.params.id }); 
        res.json({ message: 'Event removed' });

    } catch (error) {
        console.error('Error deleting event:', error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;