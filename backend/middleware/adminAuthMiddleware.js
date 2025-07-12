const jwt = require('jsonwebtoken');

const protectAdmin = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if the token is for an admin
            if (decoded.role === 'admin') {
                req.admin = decoded; // Attach the admin data to the request
                next();
            } else {
                res.status(403).json({ message: 'Not authorized, not an admin' });
            }

        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protectAdmin };