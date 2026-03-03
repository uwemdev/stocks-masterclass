'use strict';
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch'); // Common in Node 18, but we will use native fetch or https
const db = require('../db/database');
const path = require('path');
const fs = require('fs');

const SIGNUPS_FILE = path.join(__dirname, '../data/signups.json');

router.post('/verify', async (req, res) => {
    const { transaction_id, tx_ref } = req.body;
    if (!transaction_id || !tx_ref) {
        return res.status(400).json({ success: false, message: 'Missing transaction references' });
    }

    try {
        // 1. Get the Secret Key from Database
        const settings = await db.query("SELECT key, value FROM settings WHERE key IN ('flutterwave_secret_key', 'payment_amount', 'payment_currency')");
        const config = {};
        for (const row of settings) config[row.key] = row.value;

        if (!config.flutterwave_secret_key) {
            return res.status(500).json({ success: false, message: 'Payment gateway not configured' });
        }

        // 2. Call Flutterwave to verify the transaction actually happened and was successful
        const flwRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.flutterwave_secret_key}`,
                'Content-Type': 'application/json'
            }
        });

        const flwData = await flwRes.json();

        if (flwData.status === 'success' &&
            flwData.data.status === 'successful' &&
            flwData.data.amount >= Number(config.payment_amount) &&
            flwData.data.currency === config.payment_currency) {

            // 3. Update the user in our local JSON
            let signups = [];
            try { signups = JSON.parse(fs.readFileSync(SIGNUPS_FILE, 'utf8')); } catch (e) { }

            let updated = false;
            for (let i = 0; i < signups.length; i++) {
                if (signups[i].tx_ref === tx_ref) {
                    signups[i].paymentStatus = 'paid';
                    signups[i].transactionId = transaction_id;
                    updated = true;
                    break;
                }
            }

            if (updated) {
                fs.writeFileSync(SIGNUPS_FILE, JSON.stringify(signups, null, 2));
                return res.json({ success: true, message: 'Payment verified and status updated.' });
            } else {
                return res.status(404).json({ success: false, message: 'Registration record not found for this transaction.' });
            }
        } else {
            return res.status(400).json({ success: false, message: 'Payment verification failed or amount mismatch.' });
        }

    } catch (err) {
        console.error('Flutterwave verify error:', err);
        return res.status(500).json({ success: false, message: 'Server error during verification.' });
    }
});

module.exports = router;
