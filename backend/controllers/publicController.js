'use strict';

const fs = require('fs');
const {
    VarietasRegistration, Document, VerificationLog, User,
} = require('../models');
const fabric = require('../fabric/fabricGateway');
const { hashFile, hashBuffer } = require('../utils/hash');

/**
 * TAHAP 5 — VALIDASI PUBLIK
 * User dapat scan QR / input ID sertifikat, lalu sistem mengecek ke blockchain.
 * Pemeriksa dapat pula mengunggah berkas untuk membandingkan hash-nya.
 */
async function verifyPublic(req, res) {
    try {
        const certId = req.body.certificate_id || req.query.id;
        if (!certId) return res.status(400).json({ error: 'certificate_id wajib diisi' });

        // Hitung hash dari berkas yang diunggah pemeriksa (bila ada).
        let hashToVerify = req.body.hash || '';
        if (req.file) {
            hashToVerify = hashFile(req.file.path);
            fs.unlink(req.file.path, () => {}); // berkas pemeriksa tidak perlu disimpan
        }

        // Cek ke blockchain (event CertificateVerified terpicu di chaincode).
        const hasil = await fabric.evaluate('VerifyCertificate', certId, hashToVerify);

        // Catat log verifikasi ke database.
        const registrasi = await VarietasRegistration.findOne({ where: { onchain_id: hasil.id } });
        if (registrasi) {
            const dokumen = await Document.findOne({ where: { registration_id: registrasi.registration_id } });
            await VerificationLog.create({
                document_id: dokumen ? dokumen.document_id : null,
                verifier_address: req.body.verifier_address || 'publik',
                result_match: !!hasil.cocok,
            });
        }

        return res.json({
            valid: hasil.cocok,
            pesan: hasil.cocok
                ? 'Sertifikat ASLI dan terverifikasi di blockchain'
                : (hashToVerify ? 'Hash dokumen TIDAK COCOK — sertifikat mungkin telah diubah'
                                : 'Sertifikat ditemukan. Unggah berkas untuk mencocokkan hash.'),
            data: hasil,
        });
    } catch (err) {
        console.error('verifyPublic error:', err);
        return res.status(404).json({ valid: false, error: err.message });
    }
}

// ====================== MANAJEMEN USER ======================
async function createUser(req, res) {
    try {
        const { name, email, wallet_address, role, password } = req.body;
        if (!name || !email) return res.status(400).json({ error: 'name dan email wajib diisi' });
        
        const crypto = require('crypto');
        const defaultPassword = password || 'password123';
        const hashedPassword = crypto.createHash('sha256').update(defaultPassword).digest('hex');

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            wallet_address: wallet_address || '0x' + crypto.randomBytes(4).toString('hex').toUpperCase(),
            role: role || 'peneliti'
        });
        return res.status(201).json(user);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function listUsers(req, res) {
    try {
        const users = await User.findAll({ order: [['user_id', 'ASC']] });
        return res.json(users);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ====================== STATISTIK DASHBOARD ======================
async function dashboardStats(req, res) {
    try {
        const total = await VarietasRegistration.count();
        const pending = await VarietasRegistration.count({ where: { status_registrasi: 'PENDING' } });
        const approved = await VarietasRegistration.count({ where: { status_registrasi: 'APPROVED' } });
        const rejected = await VarietasRegistration.count({ where: { status_registrasi: 'REJECTED' } });
        const certified = await VarietasRegistration.count({ where: { status_registrasi: 'CERTIFIED' } });
        const verifikasi = await VerificationLog.count();
        return res.json({ total, pending, approved, rejected, certified, verifikasi });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function listTransactions(req, res) {
    try {
        const { BlockchainTransaction } = require('../models');
        const txs = await BlockchainTransaction.findAll({ order: [['confirmed_at', 'DESC']] });
        return res.json(txs);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { verifyPublic, createUser, listUsers, dashboardStats, listTransactions };
