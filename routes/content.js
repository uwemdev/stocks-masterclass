'use strict';
const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/', async (req, res) => {
    try {
        const rows = await db.query("SELECT key, value FROM settings");
        const content = {};
        for (const row of rows) content[row.key] = row.value;
        res.json({ success: true, content });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

module.exports = router;
