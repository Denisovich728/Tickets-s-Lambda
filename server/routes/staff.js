const express = require('express');
const router = express.Router();
const { TimeLog, User, Event, EventStaff, sequelize, Staff } = require('../models'); // Added Staff model
const { authenticateToken } = require('./auth');

// --- New CRUD routes for Staff model ---

// Get all staff
router.get('/', authenticateToken, async (req, res) => {
    try {
        const staff = await Staff.findAll();
        res.json(staff);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create staff
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, role, photo } = req.body;
        const staff = await Staff.create({ name, role, photo });
        // Generate a simple QR data string (e.g. JSON with ID and Type)
        staff.qrCodeData = JSON.stringify({ type: 'staff', id: staff.id, name: staff.name });
        await staff.save();
        res.json(staff);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update staff
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { name, role, isActive, photo } = req.body;
        await Staff.update({ name, role, isActive, photo }, { where: { id: req.params.id } });
        res.json({ message: 'Staff updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete staff
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await Staff.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Staff deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- End of new CRUD routes for Staff model ---


// Get Staff for an Event (Roster + Status)
router.get('/event/:eventId', authenticateToken, async (req, res) => {
    const { eventId } = req.params;
    try {
        const event = await Event.findByPk(eventId, {
            include: [{
                model: Staff,
                as: 'StaffMembers',
                attributes: ['id', 'name', 'role'],
                through: { attributes: ['role'] }
            }]
        });

        if (!event) return res.status(404).json({ error: 'Event not found' });

        // For each staff member, find their latest TimeLog for this event
        const staffList = await Promise.all(event.StaffMembers.map(async (staff) => {
            const log = await TimeLog.findOne({
                where: { staffId: staff.id, eventId },
                order: [['checkInTime', 'DESC']]
            });

            let status = 'Pending';
            let checkIn = null;
            let checkOut = null;

            if (log) {
                checkIn = log.checkInTime;
                checkOut = log.checkOutTime;
                if (checkOut) {
                    status = 'Finished';
                } else {
                    status = 'Working';
                }
            }

            return {
                id: staff.id,
                username: staff.name, // Mapping 'name' to 'username' for frontend compatibility
                role: staff.EventStaff.role || staff.role, 
                status,
                checkIn,
                checkOut
            };
        }));

        res.json(staffList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Assign Staff to Event
router.post('/assign', authenticateToken, async (req, res) => {
    const { eventId, userId, role } = req.body;
    try {
        const event = await Event.findByPk(eventId);
        const staff = await Staff.findByPk(userId);

        if (!event || !staff) return res.status(404).json({ error: 'Event or Staff Profile not found' });

        // Using Sequelize association mixin for clean DB connection
        await event.addStaffMembers(staff, { through: { role: role || 'Staff' } });

        res.json({ message: 'Staff assigned successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// List all active staff profiles (for dropdowns)
router.get('/available', authenticateToken, async (req, res) => {
    try {
        const staff = await Staff.findAll({ where: { isActive: true }, attributes: ['id', 'name'] });
        // Map to format expected by frontend
        const mapped = staff.map(s => ({ id: s.id, username: s.name }));
        res.json(mapped);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check In
router.post('/checkin', authenticateToken, async (req, res) => {
    const { eventId, userId } = req.body;
    try {
        const staff = await Staff.findByPk(userId);
        if (!staff) return res.status(404).json({ error: 'Staff Profile not found' });

        const log = await TimeLog.create({
            staffId: userId,
            eventId,
            type: staff ? staff.role : 'Staff', // reliable on user role
            checkInTime: new Date()
        });

        res.json({ message: 'Check-in successful', log });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check Out
router.post('/checkout', authenticateToken, async (req, res) => {
    const { userId, eventId } = req.body;
    try {
        // Find latest open log
        const log = await TimeLog.findOne({
            where: {
                staffId: userId,
                eventId,
                checkOutTime: null
            },
            order: [['checkInTime', 'DESC']]
        });

        if (!log) {
            return res.status(404).json({ error: 'No active check-in found' });
        }

        log.checkOutTime = new Date();
        await log.save();

        // Calculate hours
        const hours = (log.checkOutTime - log.checkInTime) / 36e5;

        res.json({ message: 'Check-out successful', hoursWorked: hours });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
