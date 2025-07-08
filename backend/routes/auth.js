const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); 
const Organizer = require('../models/Organizer'); 


const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1h' 
    });
};


router.post('/register', async (req, res) => {
    const { email, password } = req.body; 
    try {
        let organizer = await Organizer.findOne({ email }); 
        if (organizer) {
            return res.status(400).json({ message: 'Organizer with this email already exists' });
        }

        organizer = new Organizer({ email, password }); 
        await organizer.save(); 

        const token = generateToken(organizer._id); 

        res.status(201).json({ 
            message: 'Organizer registered successfully!',
            token, 
            email: organizer.email
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error during registration');
    }
});


router.post('/login', async (req, res) => {
    const { email, password } = req.body; 

    try {
        
        const organizer = await Organizer.findOne({ email });
        if (!organizer) {
            return res.status(400).json({ message: 'Invalid email or password.' }); 
        }

        
        const isMatch = await organizer.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password.' }); 
        }

        
        const token = generateToken(organizer._id);

        res.json({
            message: 'Login successful!',
            token, 
            email: organizer.email
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error during login'); 
    }
});

module.exports = router;