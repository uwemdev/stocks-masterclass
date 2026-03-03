'use strict';

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname);
const DB_PATH = path.join(DB_DIR, 'site.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

// Initialize database
const db = new sqlite3.Database(DB_PATH);

// Helper function to allow synchronous-like usage (Promises)
db.query = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};
db.runAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

db.serialize(() => {
  db.run('PRAGMA journal_mode = WAL');

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key     TEXT PRIMARY KEY,
      value   TEXT NOT NULL DEFAULT '',
      label   TEXT NOT NULL DEFAULT '',
      section TEXT NOT NULL DEFAULT 'general',
      type    TEXT NOT NULL DEFAULT 'text'
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      username     TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

});

module.exports = db;
