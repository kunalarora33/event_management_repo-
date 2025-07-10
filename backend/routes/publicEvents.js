const express = require('express');
const router = express.Router(); // Corrected: Should be express.Router()
const Event = require('../models/Event'); // Corrected: Removed duplicate declaration and assigned correctly
const Organizer = require('../models/Organizer');
const mongoose = require('mongoose'); // Ensure mongoose is imported

// GET all public events
router.get('/', async (req, res) => {
    console.log('Public Events Route: Request received.');
    try {
        // Correctly call find on the Event model
        const events = await Event.find({}).sort({ date: 1, time: 1 });
        console.log(`Public Events Route: Found ${events.length} events.`);

        const eventsWithFormattedData = await Promise.all(events.map(async (event) => {
            const eventObj = event.toObject();
            console.log(`Processing event: ${eventObj._id} - ${eventObj.title}`);

            let organizerEmail = 'Unknown Organizer';
            if (event.organizer) {
                console.log(`Fetching organizer for event ${eventObj._id}, organizer ID: ${event.organizer}`);
                try {
                    if (!mongoose.Types.ObjectId.isValid(event.organizer)) {
                        console.warn(`Event ${eventObj._id}: Invalid Organizer ID format: ${event.organizer}. Skipping organizer lookup.`);
                        organizerEmail = 'Invalid Organizer ID';
                    } else {
                        console.log(`Log 4b: Attempting Organizer.findById for ID: ${event.organizer}`);
                        const organizer = await Organizer.findById(event.organizer).select('email');
                        console.log(`Log 4c: Organizer.findById returned for ID: ${event.organizer}`);

                        if (organizer) {
                            organizerEmail = organizer.email;
                            console.log(`Found organizer email: ${organizerEmail} for event ${eventObj._id}`);
                        } else {
                            console.warn(`Organizer not found for ID: ${event.organizer} (Event: ${eventObj._id})`);
                        }
                    }
                } catch (organizerError) {
                    console.error(`Error fetching organizer ${event.organizer} for event ${eventObj._id}:`, organizerError.message);
                    organizerEmail = 'Error Fetching Organizer';
                }
            } else {
                console.warn(`Event ${eventObj._id} has no organizer ID.`);
            }

            let eventDate = eventObj.date;
            if (typeof eventDate === 'string') {
                eventDate = new Date(eventDate);
            }
            if (isNaN(eventDate.getTime())) {
                eventDate = new Date();
            }
            const year = eventDate.getFullYear();
            const month = String(eventDate.getMonth() + 1).padStart(2, '0');
            const day = String(eventDate.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;

            let formattedTime = eventObj.time;
            if (formattedTime) {
                if (formattedTime.includes('AM') || formattedTime.includes('PM')) {
                    try {
                        const tempDateForTime = new Date(`2000-01-01 ${formattedTime}`);
                        if (!isNaN(tempDateForTime.getTime())) {
                            const hours = String(tempDateForTime.getHours()).padStart(2, '0');
                            const minutes = String(tempDateForTime.getMinutes()).padStart(2, '0');
                            formattedTime = `${hours}:${minutes}`;
                            console.log(`Event ${eventObj._id}: Converted time from '${eventObj.time}' to '${formattedTime}' (AM/PM).`);
                        } else {
                            console.warn(`Event ${eventObj._id}: Could not parse time string '${eventObj.time}' (AM/PM). Attempting fallback.`);
                            formattedTime = formattedTime.replace(/ /g, '').replace(/[AP]M/i, '').trim();
                            if (formattedTime.length === 4 && !formattedTime.includes(':')) {
                                formattedTime = formattedTime.substring(0, 2) + ':' + formattedTime.substring(2, 4);
                            } else if (!formattedTime.includes(':')) {
                                formattedTime = formattedTime + ':00';
                            }
                        }
                    } catch (timeParseError) {
                        console.error(`Event ${eventObj._id}: Error parsing AM/PM time '${eventObj.time}':`, timeParseError.message);
                        formattedTime = '00:00';
                    }
                } else if (!formattedTime.includes(':')) {
                    if (formattedTime.length === 4) {
                        formattedTime = formattedTime.substring(0, 2) + ':' + formattedTime.substring(2, 4);
                    } else if (formattedTime.length <= 2) {
                        formattedTime = formattedTime.padStart(2, '0') + ':00';
                    } else {
                        formattedTime = formattedTime + ':00';
                    }
                    console.log(`Event ${eventObj._id}: Converted time from '${eventObj.time}' to '${formattedTime}' (HHMM/HH).`);
                }
            }
            if (!formattedTime) formattedTime = '00:00';
            const fullDateTimeString = `${formattedDate}T${formattedTime}:00`;
            console.log(`Event ${eventObj._id}: Generated fullDateTime: ${fullDateTimeString}`);

            return {
                ...eventObj,
                organizerEmail,
                fullDateTime: fullDateTimeString
            };
        }));

        console.log('Public Events Route: All events processed, sending response.');
        res.json(eventsWithFormattedData);
    } catch (error) {
        console.error('CRITICAL ERROR fetching public events:', error);
        res.status(500).send('Server Error');
    }
});

// GET a single public event by ID
router.get('/:id', async (req, res) => {
    const eventId = req.params.id;
    console.log(`Public Events Route: Request to get single event with ID: ${eventId}`);

    // Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        console.warn(`Public Events Route: Invalid Event ID format received: ${eventId}`);
        return res.status(400).json({ message: 'Invalid event ID format.' });
    }

    try {
        const event = await Event.findById(eventId); // Correctly call findById on the Event model

        if (!event) {
            console.log(`Public Events Route: Event not found for ID: ${eventId}`);
            return res.status(404).json({ message: 'Event not found.' });
        }

        const eventObj = event.toObject();

        // Re-include the same formatting logic for single event to ensure consistency
        let eventDate = eventObj.date;
        if (typeof eventDate === 'string') {
            eventDate = new Date(eventDate);
        }
        if (isNaN(eventDate.getTime())) {
            eventDate = new Date();
        }
        const year = eventDate.getFullYear();
        const month = String(eventDate.getMonth() + 1).padStart(2, '0');
        const day = String(eventDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        let formattedTime = eventObj.time;
        if (formattedTime) {
            if (formattedTime.includes('AM') || formattedTime.includes('PM')) {
                try {
                    const tempDateForTime = new Date(`2000-01-01 ${formattedTime}`);
                    if (!isNaN(tempDateForTime.getTime())) {
                        const hours = String(tempDateForTime.getHours()).padStart(2, '0');
                        const minutes = String(tempDateForTime.getMinutes()).padStart(2, '0');
                        formattedTime = `${hours}:${minutes}`;
                    } else {
                        formattedTime = formattedTime.replace(/ /g, '').replace(/[AP]M/i, '').trim();
                        if (formattedTime.length === 4 && !formattedTime.includes(':')) {
                            formattedTime = formattedTime.substring(0, 2) + ':' + formattedTime.substring(2, 4);
                        } else if (!formattedTime.includes(':')) {
                            formattedTime = formattedTime + ':00';
                        }
                    }
                } catch (timeParseError) {
                    formattedTime = '00:00';
                }
            } else if (!formattedTime.includes(':')) {
                if (formattedTime.length === 4) {
                    formattedTime = formattedTime.substring(0, 2) + ':' + formattedTime.substring(2, 4);
                } else if (formattedTime.length <= 2) {
                    formattedTime = formattedTime.padStart(2, '0') + ':00';
                } else {
                    formattedTime = formattedTime + ':00';
                }
            }
        }
        if (!formattedTime) formattedTime = '00:00';
        const fullDateTimeString = `${formattedDate}T${formattedTime}:00`;

        console.log(`Public Events Route: Successfully found event ${eventId}`);
        res.json({
            ...eventObj,
            fullDateTime: fullDateTimeString
        });
    } catch (error) {
        console.error(`CRITICAL ERROR fetching single public event ${eventId}:`, error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;