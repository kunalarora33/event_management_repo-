require('dotenv').config(); // Loads secret values from a special .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // To allow your browser (frontend) to talk to this server

const app = express();
const PORT = process.env.PORT || 5000; // The port your server will listen on

// Middleware: These are like helpers that process requests
app.use(express.json()); // Allows your server to understand JSON data from the frontend
app.use(cors()); // Enables Cross-Origin Resource Sharing (important for frontend-backend communication)

// Connect to MongoDB Database
mongoose.connect(process.env.MONGO_URI, { // Use the secret connection string
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected successfully!')) // Confirmation message
.catch(err => console.error('MongoDB connection error:', err)); // Error message

// Import the routes for handling login/registration and other functionalities
const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const publicEventsRoutes = require('./routes/publicEvents');
const attendeeRoutes = require('./routes/attendees');
const adminRoutes = require('./routes/admin'); // <-- NOW UNCOMMENTED: Import the admin routes

// Tell the server to use these routes for paths starting with their respective prefixes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/public/events', publicEventsRoutes);
app.use('/api/attendees', attendeeRoutes);
app.use('/api/admin', adminRoutes); // <-- NOW UNCOMMENTED: Use the admin routes for '/api/admin' prefix


// Simple test route: If you visit http://localhost:5000/ in your browser
app.get('/', (req, res) => {
    res.send('EventHub API is running...');
});

// Start the server and listen for requests
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});