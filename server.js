'use strict';

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Initialize database (creates tables + seeds admin user on first run)
require('./db/database');

const app = express();
const PORT = 3000;

const DATA_DIR = path.join(__dirname, 'data');
const EMAILS_FILE = path.join(DATA_DIR, 'newsletter.json');
const SIGNUPS_FILE = path.join(DATA_DIR, 'signups.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(EMAILS_FILE)) fs.writeFileSync(EMAILS_FILE, JSON.stringify([], null, 2));
if (!fs.existsSync(SIGNUPS_FILE)) fs.writeFileSync(SIGNUPS_FILE, JSON.stringify([], null, 2));

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Helper: read/write JSON ──────────────────────────────────────────────────
function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ─── Mount API routes ─────────────────────────────────────────────────────────
app.use('/api/admin', require('./routes/admin'));
app.use('/api/content', require('./routes/content'));

// ─── POST /api/newsletter ─────────────────────────────────────────────────────
app.post('/api/newsletter', (req, res) => {
  const { email, name } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'A valid email address is required.' });
  }
  const list = readJSON(EMAILS_FILE);
  if (list.find(e => e.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ success: false, message: 'This email is already subscribed.' });
  }
  list.push({ email: email.toLowerCase().trim(), name: (name || '').trim(), subscribedAt: new Date().toISOString() });
  writeJSON(EMAILS_FILE, list);
  console.log(`[Newsletter] New subscriber: ${email}`);
  return res.json({ success: true, message: 'You are now subscribed to stock updates.' });
});

// ─── POST /api/signup ─────────────────────────────────────────────────────────
app.post('/api/signup', (req, res) => {
  const { name, email, phone } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'A valid email address is required.' });
  }
  const list = readJSON(SIGNUPS_FILE);
  if (list.find(e => e.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ success: false, message: 'This email has already been registered.' });
  }
  list.push({
    name: (name || '').trim(),
    email: email.toLowerCase().trim(),
    phone: (phone || '').trim(),
    registeredAt: new Date().toISOString(),
    paymentStatus: 'pending'
  });
  writeJSON(SIGNUPS_FILE, list);
  console.log(`[Signup] New registration: ${email}`);
  return res.json({ success: true, message: 'Registration recorded. Redirecting to payment.' });
});

// ─── Legacy admin read-only routes (still accessible) ────────────────────────
app.get('/api/subscribers', (req, res) => {
  const list = readJSON(EMAILS_FILE);
  res.json({ count: list.length, subscribers: list });
});
app.get('/api/signups', (req, res) => {
  const list = readJSON(SIGNUPS_FILE);
  res.json({ count: list.length, signups: list });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Stocks Masterclass server running at http://localhost:${PORT}`);
  console.log(`🔐 Admin panel: http://localhost:${PORT}/admin/`);
  console.log(`📊 Content API: http://localhost:${PORT}/api/content`);
});
