'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { sequelize, User } = require('./models');
const fabric = require('./fabric/fabricGateway');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint kesehatan
app.get('/', (req, res) => {
    res.json({
        nama: 'API Sistem Verifikasi Sertifikat Digital Plasma Nutfah',
        status: 'aktif',
        mode_blockchain: fabric.mock ? 'SIMULASI (mock)' : 'Hyperledger Fabric',
    });
});

app.use('/api', apiRoutes);

// Inisialisasi: koneksi DB, sinkronisasi model, koneksi Fabric, seed user.
async function start() {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: true }); // menyesuaikan tabel bila ada kolom baru
        console.log('[DB] Database off-chain siap.');

        // Seed user contoh agar aplikasi langsung dapat dipakai.
        const crypto = require('crypto');
        const defaultPasswordHash = crypto.createHash('sha256').update('password123').digest('hex');
        const jumlah = await User.count();
        if (jumlah === 0) {
            await User.bulkCreate([
                { name: 'Dr. Rahmi (Peneliti)', email: 'rahmi@balai.go.id', password: defaultPasswordHash, wallet_address: '0xPENELITI01', role: 'peneliti' },
                { name: 'Ahmad (Verifikator Administrasi)', email: 'admin_pvt@pertanian.go.id', password: defaultPasswordHash, wallet_address: '0xVAL_ADMIN1', role: 'validator_admin' },
                { name: 'Prof. Budi (Pemeriksa Substantif)', email: 'ahli_pvt@pertanian.go.id', password: defaultPasswordHash, wallet_address: '0xVAL_SUBST1', role: 'validator_substantif' },
                { name: 'Dr. Ir. H. Suwandi (Kepala Balai PPVTPP)', email: 'kepala_pvt@pertanian.go.id', password: defaultPasswordHash, wallet_address: '0xVAL_FINAL1', role: 'validator_final' },
                { name: 'Admin Sistem', email: 'admin@plasma.go.id', password: defaultPasswordHash, wallet_address: '0xADMIN0001', role: 'admin' },
            ]);
            console.log('[DB] User contoh dibuat.');
        } else {
            // Pastikan user bawaan memiliki password terisi
            await User.update(
                { password: defaultPasswordHash },
                { where: { password: null } }
            );
        }

        await fabric.connect();

        app.listen(PORT, () => {
            console.log(`[Server] Backend berjalan di http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('[Server] Gagal start:', err);
        process.exit(1);
    }
}

start();
