const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const SECRET_KEY = process.env.JWT_SECRET || 'secretkey123';

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username' });
        }

        // In a real app, compare hashed password
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token, role: user.role, username: user.username });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Middleware to verify token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Register (Protected, for Admin to create users)
router.post('/register', authenticateToken, async (req, res) => {
    // Only admins can create users
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Require Admin Role' });
    }

    const { username, password, role } = req.body;
    try {
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const user = await User.create({
            username,
            password, // Hash in production
            role: role || 'client'
        });

        res.json({ message: 'User created successfully', userId: user.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Public Register (For self-registration)
router.post('/register-public', async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const user = await User.create({
            username,
            password, // Hash in production
            role: 'staff' // Default role for public registration in this context
        });

        res.json({ message: 'Registration successful', userId: user.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update User Role (Admin only)
router.put('/users/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Require Admin Role' });

    try {
        const { role } = req.body;
        // Validate role if necessary
        await User.update({ role }, { where: { id: req.params.id } });
        res.json({ message: 'User role updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete User
router.delete('/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Require Admin Role' });

    try {
        await User.destroy({ where: { id: req.params.id } });
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// List Users
router.get('/', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Require Admin Role' });
    try {
        const users = await User.findAll({ attributes: ['id', 'username', 'role'] });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = { router, authenticateToken };
