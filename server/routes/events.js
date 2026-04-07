const express = require('express');
const router = express.Router();
const { Event } = require('../models');
const { authenticateToken } = require('./auth');

// Get all events
router.get('/', authenticateToken, async (req, res) => {
    try {
        const events = await Event.findAll();
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create event
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, date, type, capacity, accessRules, layout } = req.body;
        const event = await Event.create({
            name,
            date,
            type,
            capacity,
            accessRules,
            layout,
            organizerId: req.user.id
        });
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single event
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) return res.status(404).json({ error: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update event
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) return res.status(404).json({ error: 'Event not found' });
        
        // Explicitly handle fields to ensure they are updated correctly
        const { name, date, type, capacity, accessRules, layout } = req.body;
        await event.update({ name, date, type, capacity, accessRules, layout });
        
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete event
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) return res.status(404).json({ error: 'Event not found' });
        
        // Optional: Admin or Organizer check
        if (req.user.role !== 'admin' && event.organizerId !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await event.destroy();
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
