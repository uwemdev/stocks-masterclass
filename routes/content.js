'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/content — returns all settings as a flat { key: value } object (public, no auth)
router.get('/', (req, res) => {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const content = {};
    for (const row of rows) content[row.key] = row.value;
    res.json({ success: true, content });
});

module.exports = router;
