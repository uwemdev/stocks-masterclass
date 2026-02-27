'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const db = require('../db/database');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

// ─── Setup Multer Storage ─────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `${name}-${Date.now()}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only images are allowed'));
    }
});

// ─── POST /api/admin/login ────────────────────────────────────────────────────
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ success: true, token, username: user.username });
});

// ─── GET /api/admin/settings ─────────────────────────────────────────────────
router.get('/settings', requireAuth, (req, res) => {
    const settings = db.prepare('SELECT * FROM settings ORDER BY section, key').all();
    res.json({ success: true, settings });
});

// ─── GET /api/admin/settings/sections ────────────────────────────────────────
router.get('/settings/sections', requireAuth, (req, res) => {
    const sections = db.prepare('SELECT DISTINCT section FROM settings ORDER BY section').all()
        .map(r => r.section);
    res.json({ success: true, sections });
});

// ─── POST /api/admin/upload ──────────────────────────────────────────────────
router.post('/upload', requireAuth, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image uploaded.' });
    }
    // Store the relative path usable from the web root
    const imageUrl = `/uploads/${req.file.filename}`;
    return res.json({ success: true, url: imageUrl });
});

// ─── PUT /api/admin/settings/:key ────────────────────────────────────────────
router.put('/settings/:key', requireAuth, (req, res) => {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
        return res.status(400).json({ success: false, message: 'Value is required.' });
    }

    const existing = db.prepare('SELECT key FROM settings WHERE key = ?').get(key);
    if (!existing) {
        return res.status(404).json({ success: false, message: `Setting "${key}" not found.` });
    }

    db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(String(value), key);
    return res.json({ success: true, message: `Setting "${key}" updated.` });
});

// ─── PUT /api/admin/settings (bulk update) ───────────────────────────────────
router.put('/settings', requireAuth, (req, res) => {
    const { updates } = req.body; // { key: value, key: value, ... }
    if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ success: false, message: 'updates object is required.' });
    }

    const updateOne = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
    const bulkUpdate = db.transaction((map) => {
        let count = 0;
        for (const [key, value] of Object.entries(map)) {
            const info = updateOne.run(String(value), key);
            count += info.changes;
        }
        return count;
    });

    const count = bulkUpdate(updates);
    return res.json({ success: true, message: `${count} setting(s) updated.`, count });
});

// ─── POST /api/admin/password ─────────────────────────────────────────────────
router.post('/password', requireAuth, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Both currentPassword and newPassword are required.' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.admin.id);
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(newHash, user.id);
    return res.json({ success: true, message: 'Password updated successfully.' });
});

// ─── GET /api/admin/signups & subscribers ─────────────────────────────────────
const SIGNUPS_FILE = path.join(__dirname, '../data/signups.json');
const EMAILS_FILE = path.join(__dirname, '../data/newsletter.json');

router.get('/signups', requireAuth, (req, res) => {
    try {
        const list = JSON.parse(fs.readFileSync(SIGNUPS_FILE, 'utf8'));
        res.json({ success: true, count: list.length, signups: list });
    } catch { res.json({ success: true, count: 0, signups: [] }); }
});

router.get('/subscribers', requireAuth, (req, res) => {
    try {
        const list = JSON.parse(fs.readFileSync(EMAILS_FILE, 'utf8'));
        res.json({ success: true, count: list.length, subscribers: list });
    } catch { res.json({ success: true, count: 0, subscribers: [] }); }
});

module.exports = router;
