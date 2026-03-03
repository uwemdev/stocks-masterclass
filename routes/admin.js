'use strict';
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');
const auth = require('../middleware/auth').requireAuth;

const DATA_DIR = path.join(__dirname, '../data');
const EMAILS_FILE = path.join(DATA_DIR, 'newsletter.json');
const SIGNUPS_FILE = path.join(DATA_DIR, 'signups.json');

function readJSON(file) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/uploads/')),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});
const upload = multer({ storage });

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const users = await db.query('SELECT * FROM admin_users WHERE username = ?', [username]);
        const user = users[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, token });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/upload', auth, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });
    res.json({ success: true, url: 'uploads/' + req.file.filename });
});

router.get('/settings', auth, async (req, res) => {
    try {
        const rows = await db.query("SELECT * FROM settings ORDER BY section, label");
        res.json({ success: true, settings: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to load settings' });
    }
});

router.put('/settings/bulk', auth, async (req, res) => {
    const updates = req.body; // { key: value, key: value }
    try {
        for (const [key, value] of Object.entries(updates)) {
            await db.runAsync("UPDATE settings SET value = ? WHERE key = ?", [value, key]);
        }
        res.json({ success: true, message: 'Settings saved' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to save settings' });
    }
});

// ─── Data & Export Routes ───────────────────────────────────────────────────

router.get('/subscribers', auth, (req, res) => {
    const list = readJSON(EMAILS_FILE);
    res.json({ success: true, count: list.length, subscribers: list });
});

router.get('/subscribers/export', auth, (req, res) => {
    const list = readJSON(EMAILS_FILE);
    if (!list.length) return res.send('No subscribers found.');

    // Convert JSON to quick CSV format
    const headers = ['Email', 'Name', 'Subscribed At'];
    const rows = list.map(sub => `"${sub.email}","${sub.name.replace(/"/g, '""')}","${sub.subscribedAt}"`);
    const csvStr = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="newsletter_subscribers.csv"');
    res.send(csvStr);
});

router.get('/signups', auth, (req, res) => {
    const list = readJSON(SIGNUPS_FILE);
    res.json({ success: true, count: list.length, signups: list });
});

router.get('/signups/export', auth, (req, res) => {
    const list = readJSON(SIGNUPS_FILE);
    if (!list.length) return res.send('No registrations found.');

    // Convert JSON to quick CSV format
    const headers = ['Email', 'Name', 'Phone', 'Payment Status', 'Registered At'];
    const rows = list.map(sub => `"${sub.email}","${sub.name.replace(/"/g, '""')}","${sub.phone}","${sub.paymentStatus}","${sub.registeredAt}"`);
    const csvStr = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="masterclass_registrations.csv"');
    res.send(csvStr);
});

module.exports = router;
