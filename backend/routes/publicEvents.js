const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Organizer = require('../models/Organizer'); 


router.get('/', async (req, res) => {
    try {
       
        const events = await Event.find({}).sort({ date: 1, time: 1 });

      
        const eventsWithOrganizerInfo = await Promise.all(events.map(async (event) => {
            let organizerEmail = 'Unknown Organizer';
            if (event.organizer) {
                const organizer = await Organizer.findById(event.organizer).select('email'); 
                if (organizer) {
                    organizerEmail = organizer.email;
                }
            }
            return { ...event.toObject(), organizerEmail };
        }));

        res.json(eventsWithOrganizerInfo);
    } catch (error) {
        console.error('Error fetching public events:', error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;