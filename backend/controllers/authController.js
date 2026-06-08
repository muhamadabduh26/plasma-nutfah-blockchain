'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'plasmanutfah_secret_key_2026';

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email dan password wajib diisi' });
        }

        // Cari user berdasarkan email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Email atau password salah' });
        }

        // Hash input password dengan SHA-256 untuk dicocokkan
        const hash = crypto.createHash('sha256').update(password).digest('hex');
        if (user.password !== hash) {
            return res.status(401).json({ error: 'Email atau password salah' });
        }

        // Update waktu login terakhir
        user.last_login = new Date();
        await user.save();

        // Buat token JWT
        const token = jwt.sign(
            {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role,
                wallet_address: user.wallet_address,
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Kirim respon
        return res.json({
            token,
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role,
                wallet_address: user.wallet_address,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Terjadi kesalahan pada server saat login' });
    }
}

module.exports = { login };
