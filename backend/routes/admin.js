const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const Event = require('../models/Event');
const Organizer = require('../models/Organizer');
const Attendee = require('../models/Attendee');
const Category = require('../models/Category');

// A simple hardcoded admin user for demonstration purposes
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password123';

// @route   POST /api/admin/login
// @desc    Admin login and get token
// @access  Public
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = jwt.sign(
            { id: 'admin_user_id_placeholder', role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.json({ token });
    } else {
        res.status(401).json({ message: 'Invalid username or password' });
    }
});

// @route   GET /api/admin/dashboard-stats
// @desc    Get counts for dashboard overview cards
// @access  Private
router.get('/dashboard-stats', protectAdmin, async (req, res) => {
    try {
        const eventsCount = await Event.countDocuments();
        const usersCount = await Organizer.countDocuments();
        const registrationsCount = await Attendee.countDocuments();

        res.json({
            events: eventsCount,
            users: usersCount,
            registrations: registrationsCount
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server error fetching dashboard stats.' });
    }
});

// @route   GET /api/admin/recent-activity
// @desc    Get recent activity for the dashboard
// @access  Private
router.get('/recent-activity', protectAdmin, async (req, res) => {
    try {
        const recentEvents = await Event.find().sort({ createdAt: -1 }).limit(5).select('title createdAt');
        const recentUsers = await Organizer.find().sort({ createdAt: -1 }).limit(5).select('email createdAt');

        res.json({
            events: recentEvents,
            users: recentUsers
        });
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ message: 'Server error fetching recent activity.' });
    }
});

// @route GET /api/admin/events
// @desc Get all events for admin management
// @access Private
router.get('/events', protectAdmin, async (req, res) => {
    try {
        const events = await Event.find().populate('organizer').sort({ date: 1 });
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Server error fetching events.' });
    }
});

// @route GET /api/admin/users
// @desc Get all users for admin management
// @access Private
router.get('/users', protectAdmin, async (req, res) => {
    try {
        const users = await Organizer.find().sort({ createdAt: -1 }).select('-password');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error fetching users.' });
    }
});

// @route GET /api/admin/categories
// @desc Get all categories for admin management
// @access Private
router.get('/categories', protectAdmin, async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Server error fetching categories.' });
    }
});

// NEW: @route PUT /api/admin/events/:id/approve
// @desc Approve a pending event
// @access Private (Admin only)
router.put('/events/:id/approve', protectAdmin, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.status !== 'pending') {
            return res.status(400).json({ message: 'Event is not in a pending state' });
        }

        event.status = 'approved';
        await event.save();
        res.json({ message: 'Event approved successfully', event });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error approving event' });
    }
});

// NEW: @route PUT /api/admin/events/:id/decline
// @desc Decline a pending event
// @access Private (Admin only)
router.put('/events/:id/decline', protectAdmin, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.status !== 'pending') {
            return res.status(400).json({ message: 'Event is not in a pending state' });
        }

        event.status = 'declined';
        await event.save();
        res.json({ message: 'Event declined successfully', event });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error declining event' });
    }
});

module.exports = router;