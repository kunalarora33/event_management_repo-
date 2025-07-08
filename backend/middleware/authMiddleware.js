const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const Organizer = require('../models/Organizer'); 

const protect = async(req, res, next) => {
    let token;

    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
          
            token = req.headers.authorization.split(' ')[1]; 

            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            
            req.organizer = await Organizer.findById(decoded.id).select('-password');

            next(); 

        } catch (error) {
            console.error('Auth middleware error:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };