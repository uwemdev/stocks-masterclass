'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const DB_DIR = path.join(__dirname);
const DB_PATH = path.join(DB_DIR, 'site.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// ─── Schema ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key     TEXT PRIMARY KEY,
    value   TEXT NOT NULL DEFAULT '',
    label   TEXT NOT NULL DEFAULT '',
    section TEXT NOT NULL DEFAULT 'general',
    type    TEXT NOT NULL DEFAULT 'text'
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    username     TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ─── Seed default settings ────────────────────────────────────────────────────

const defaultSettings = [
  // ── SEO / Meta ──
  { key: 'meta_title', value: 'Stocks Masterclass 2026 — Learn to Invest in Local Stocks', label: 'Page Title', section: 'seo', type: 'text' },
  { key: 'meta_description', value: 'Join the 3-day live Stocks Masterclass on 4th March 2026. Learn how the Ghana Stock Exchange works, pick your first stocks, build a dividend & value-growth portfolio, and manage risk. Beginner-friendly. Limited seats.', label: 'Meta Description', section: 'seo', type: 'textarea' },
  { key: 'og_title', value: 'Stocks Masterclass 2026 — Ghana Stock Exchange', label: 'OG Title', section: 'seo', type: 'text' },
  { key: 'og_description', value: 'From beginner to confident investor in 3 days. Learn stocks, dividends, ETFs & more. 4th March 2026. Limited seats.', label: 'OG Description', section: 'seo', type: 'textarea' },

  // ── Nav ──
  { key: 'nav_logo_text', value: 'StocksClass', label: 'Logo Text', section: 'nav', type: 'text' },
  { key: 'nav_cta_label', value: 'Register Now', label: 'Nav Button Label', section: 'nav', type: 'text' },

  // ── Hero ──
  { key: 'hero_image', value: 'images/instructor.png', label: 'Hero Image', section: 'hero', type: 'image' },
  { key: 'hero_badge', value: 'Next Masterclass: 4th March 2026 · 10:00 AM GMT', label: 'Hero Badge Text', section: 'hero', type: 'text' },
  { key: 'hero_title', value: 'Ghana Stock Investing <span class="hero-accent">Masterclass</span> for Beginners', label: 'Hero Title (HTML allowed)', section: 'hero', type: 'text' },
  { key: 'hero_bullet_1', value: '8 live modules — beginner to advanced strategies', label: 'Bullet 1', section: 'hero', type: 'text' },
  { key: 'hero_bullet_2', value: 'Access to private WhatsApp community & support', label: 'Bullet 2', section: 'hero', type: 'text' },
  { key: 'hero_bullet_3', value: 'Live portfolio building & real trade demonstrations', label: 'Bullet 3', section: 'hero', type: 'text' },
  { key: 'hero_bullet_4', value: 'Session recordings + downloadable notes', label: 'Bullet 4', section: 'hero', type: 'text' },
  { key: 'hero_register_label', value: 'Register Now', label: 'Register Button Label', section: 'hero', type: 'text' },
  { key: 'hero_register_price', value: 'GHS 250', label: 'Register Button Price', section: 'hero', type: 'text' },
  { key: 'hero_learn_label', value: 'See Course Outline', label: '"See Course" Button Label', section: 'hero', type: 'text' },
  { key: 'hero_rating', value: '4.9', label: 'Instructor Rating', section: 'hero', type: 'text' },
  { key: 'hero_students', value: '50+', label: 'Students Trained (Hero Card)', section: 'hero', type: 'text' },
  { key: 'countdown_date', value: '2026-03-04T10:00:00Z', label: 'Countdown Target Date (ISO 8601 UTC)', section: 'hero', type: 'text' },
  { key: 'countdown_label', value: 'Spots closing in', label: 'Countdown Label', section: 'hero', type: 'text' },

  // ── Stats Bar ──
  { key: 'stat_students', value: '50+', label: 'Students Trained', section: 'stats', type: 'text' },
  { key: 'stat_experience', value: '7+', label: 'Years Market Experience', section: 'stats', type: 'text' },
  { key: 'stat_modules', value: '8', label: 'Core Modules', section: 'stats', type: 'text' },
  { key: 'stat_duration', value: '3 Days', label: 'Intensive Format Duration', section: 'stats', type: 'text' },

  // ── Curriculum / Learn section ──
  { key: 'curriculum_section_label', value: 'Curriculum', label: 'Section Label', section: 'curriculum', type: 'text' },
  { key: 'curriculum_title', value: 'What You Will Learn', label: 'Section Title', section: 'curriculum', type: 'text' },
  { key: 'curriculum_sub', value: 'SIX focused modules designed to take you from beginner to confident investor — from understanding how the Ghana Stock Exchange works, to identifying stocks worth buying, to building a profitable long-term portfolio.', label: 'Section Subtitle', section: 'curriculum', type: 'textarea' },

  // ── About Instructor ──
  { key: 'about_image', value: 'images/instructor-about.png', label: 'Instructor Image', section: 'about', type: 'image' },
  { key: 'about_instructor_name', value: 'James Whyte', label: 'Instructor Name', section: 'about', type: 'text' },
  { key: 'about_heading', value: 'Built From the<br><span class="gold">Trading Floor Up</span>', label: 'Section Heading (HTML)', section: 'about', type: 'text' },
  { key: 'about_bio_1', value: 'With over 7 years of experience in the banking sector — from retail and commercial banking to financial analysis and investment advisory — I\'ve helped businesses and individuals navigate the financial landscape with clarity and confidence.', label: 'Bio Paragraph 1', section: 'about', type: 'textarea' },
  { key: 'about_bio_2', value: 'I leverage this deep expertise to guide beginners and aspiring investors on the Ghana Stock Exchange. From reading financial statements and evaluating investments to building profitable portfolios, I\'ve used these skills personally and professionally to grow wealth while managing risk effectively.', label: 'Bio Paragraph 2', section: 'about', type: 'textarea' },
  { key: 'about_bio_3', value: 'In this 3-day live masterclass, I combine my banking experience and hands-on investing knowledge to give you the tools, strategies, and confidence to start your journey toward financial independence.', label: 'Bio Paragraph 3', section: 'about', type: 'textarea' },
  { key: 'about_exp_years', value: '7+', label: 'Years Experience (floating card)', section: 'about', type: 'text' },
  { key: 'about_students', value: '50+', label: 'Students Trained (floating card)', section: 'about', type: 'text' },
  { key: 'about_modules', value: '8', label: 'Live Modules (floating card)', section: 'about', type: 'text' },

  // ── Event Details / Registration ──
  { key: 'event_date', value: '4th March 2026', label: 'Event Date', section: 'event', type: 'text' },
  { key: 'event_time', value: '10:00 AM GMT', label: 'Event Time', section: 'event', type: 'text' },
  { key: 'event_format', value: 'Online via Zoom', label: 'Event Format', section: 'event', type: 'text' },
  { key: 'event_seats', value: 'Limited — First Come, First Served', label: 'Seats Description', section: 'event', type: 'text' },
  { key: 'event_payment', value: 'Card, Mobile Money, Bank Transfer', label: 'Payment Methods', section: 'event', type: 'text' },
  { key: 'event_whatsapp', value: '+233 50 588 7272', label: 'WhatsApp Number (display)', section: 'event', type: 'text' },
  { key: 'event_whatsapp_link', value: 'https://wa.me/233505887272', label: 'WhatsApp Link (href)', section: 'event', type: 'url' },
  { key: 'event_zoom_link', value: '', label: 'Zoom Link', section: 'event', type: 'url' },
  { key: 'event_price', value: 'GHS 250', label: 'Price', section: 'event', type: 'text' },
  { key: 'event_price_note', value: 'One-time payment — full 3-day access', label: 'Price Note', section: 'event', type: 'text' },

  // ── Footer / Socials ──
  { key: 'footer_copyright', value: '© 2026 Stocks Masterclass. All rights reserved.', label: 'Copyright Text', section: 'footer', type: 'text' },
  { key: 'footer_whatsapp_label', value: 'Chat on WhatsApp', label: 'WhatsApp Button Label', section: 'footer', type: 'text' },
  { key: 'social_whatsapp', value: 'https://wa.me/233505887272', label: 'WhatsApp URL', section: 'socials', type: 'url' },
  { key: 'social_instagram', value: '', label: 'Instagram URL', section: 'socials', type: 'url' },
  { key: 'social_twitter', value: '', label: 'Twitter / X URL', section: 'socials', type: 'url' },
  { key: 'social_linkedin', value: '', label: 'LinkedIn URL', section: 'socials', type: 'url' },
  { key: 'social_facebook', value: '', label: 'Facebook URL', section: 'socials', type: 'url' },
  { key: 'social_youtube', value: '', label: 'YouTube URL', section: 'socials', type: 'url' },

  // ── Newsletter section ──
  { key: 'newsletter_heading', value: 'Stay Ahead of the<br><span class="gold">Market</span>', label: 'Newsletter Heading (HTML)', section: 'newsletter', type: 'text' },
  { key: 'newsletter_sub', value: 'Get free weekly stock picks, market analysis, and trading insights delivered to your inbox. No spam, no noise — just what matters.', label: 'Newsletter Sub', section: 'newsletter', type: 'textarea' },
];

const insertSetting = db.prepare(`
  INSERT OR IGNORE INTO settings (key, value, label, section, type)
  VALUES (@key, @value, @label, @section, @type)
`);

const seedSettings = db.transaction((settings) => {
  for (const s of settings) insertSetting.run(s);
});

seedSettings(defaultSettings);

// ─── Seed admin user ──────────────────────────────────────────────────────────

const existingAdmin = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');
if (!existingAdmin) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', hash);
  console.log('[DB] Admin user created: admin / admin123');
}

console.log(`[DB] SQLite database ready: ${DB_PATH}`);

module.exports = db;
