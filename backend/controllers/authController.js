const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'plasmanutfah_secret_key_2026';

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Username/Email dan password wajib diisi' });
        }

        // Cari user berdasarkan email ATAU username
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: email },
                    { username: email }
                ]
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'Username/Email atau password salah' });
        }

        // Cek status keaktifan akun pemohon
        if (user.status_akun === 'TIDAK_AKTIF') {
            return res.status(401).json({ error: 'Akun Anda belum diaktivasi oleh Administrator PVTPP.' });
        }

        // Hash input password dengan SHA-256 untuk dicocokkan
        const hash = crypto.createHash('sha256').update(password).digest('hex');
        if (user.password !== hash) {
            return res.status(401).json({ error: 'Username/Email atau password salah' });
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
                username: user.username,
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
                username: user.username,
                role: user.role,
                wallet_address: user.wallet_address,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Terjadi kesalahan pada server saat login' });
    }
}

async function register(req, res) {
    try {
        const {
            npwp,
            no_ktp,
            username,
            password,
            jenis_pemohon,
            nama_institusi,
            penanggung_jawab,
            email,
            provinsi,
            kabupaten_kota,
            kecamatan,
            kelurahan,
            alamat,
            kode_pos
        } = req.body;

        if (!email || !npwp || !no_ktp || !username || !password || !jenis_pemohon || !nama_institusi || !penanggung_jawab) {
            return res.status(400).json({ error: 'NPWP, No KTP, Username, Password, Jenis Pemohon, Nama Institusi, Penanggung Jawab, dan Email wajib diisi' });
        }

        // Cek email duplikat
        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({ error: 'Email sudah terdaftar di sistem' });
        }

        // Cek username duplikat
        const existingUsername = await User.findOne({ where: { username } });
        if (existingUsername) {
            return res.status(400).json({ error: 'Username sudah digunakan' });
        }

        // Hash password dari user
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

        // Hubungkan wallet address demo
        const walletAddress = '0x' + crypto.createHash('sha256').update(email).digest('hex').substring(0, 10).toUpperCase();

        const newUser = await User.create({
            name: penanggung_jawab,
            email,
            password: passwordHash,
            wallet_address: walletAddress,
            role: 'peneliti', // Default role peneliti/pengaju
            npwp,
            no_ktp,
            username,
            jenis_pemohon,
            nama_institusi,
            penanggung_jawab,
            provinsi,
            kabupaten_kota,
            kecamatan,
            kelurahan,
            alamat,
            kode_pos,
            status_akun: 'TIDAK_AKTIF' // Perlu aktivasi oleh Admin
        });

        return res.status(201).json({
            message: 'Registrasi akun berhasil dicatat. Silakan hubungi Admin untuk aktivasi.',
            email: newUser.email,
            username: newUser.username,
        });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ error: 'Terjadi kesalahan pada server saat registrasi' });
    }
}

module.exports = { login, register };
