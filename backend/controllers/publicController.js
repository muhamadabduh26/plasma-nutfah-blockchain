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
            role: role || 'peneliti',
            status_akun: 'AKTIF'
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

async function activateUser(req, res) {
    try {
        const { id } = req.params; // user_id
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

        user.status_akun = 'AKTIF';
        await user.save();

        return res.json({ message: `Akun ${user.email} berhasil diaktivasi`, user });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function deactivateUser(req, res) {
    try {
        const { id } = req.params; // user_id
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

        user.status_akun = 'TIDAK_AKTIF';
        await user.save();

        return res.json({ message: `Akun ${user.email} berhasil dinonaktifkan`, user });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function updateUser(req, res) {
    try {
        const { id } = req.params;
        const {
            name, email, role, password, status_akun, wallet_address,
            npwp, no_ktp, username, jenis_pemohon, nama_institusi,
            penanggung_jawab, provinsi, kabupaten_kota, kecamatan,
            kelurahan, alamat, kode_pos
        } = req.body;

        if (!req.user) {
            return res.status(401).json({ error: 'Akses ditolak. Pengguna tidak terautentikasi.' });
        }

        if (req.user.role !== 'admin') {
            if (req.user.user_id !== Number(id)) {
                return res.status(403).json({ error: 'Akses ditolak. Anda hanya dapat memperbarui profil Anda sendiri.' });
            }
            if (role !== undefined || status_akun !== undefined || wallet_address !== undefined) {
                return res.status(403).json({ error: 'Akses ditolak. Anda tidak diizinkan mengubah hak akses, alamat dompet, atau status akun.' });
            }
        }

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;
        if (role !== undefined) user.role = role;
        if (status_akun !== undefined) user.status_akun = status_akun;
        if (wallet_address !== undefined && req.user.role === 'admin') user.wallet_address = wallet_address;
        if (npwp !== undefined) user.npwp = npwp;
        if (no_ktp !== undefined) user.no_ktp = no_ktp;
        if (username !== undefined) user.username = username;
        if (jenis_pemohon !== undefined) user.jenis_pemohon = jenis_pemohon;
        if (nama_institusi !== undefined) user.nama_institusi = nama_institusi;
        if (penanggung_jawab !== undefined) user.penanggung_jawab = penanggung_jawab;
        if (provinsi !== undefined) user.provinsi = provinsi;
        if (kabupaten_kota !== undefined) user.kabupaten_kota = kabupaten_kota;
        if (kecamatan !== undefined) user.kecamatan = kecamatan;
        if (kelurahan !== undefined) user.kelurahan = kelurahan;
        if (alamat !== undefined) user.alamat = alamat;
        if (kode_pos !== undefined) user.kode_pos = kode_pos;

        if (password) {
            const crypto = require('crypto');
            user.password = crypto.createHash('sha256').update(password).digest('hex');
        }

        await user.save();
        return res.json({ message: 'Data user berhasil diperbarui', user });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function getUser(req, res) {
    try {
        const { id } = req.params;
        if (!req.user) {
            return res.status(401).json({ error: 'Akses ditolak. Pengguna tidak terautentikasi.' });
        }
        if (req.user.role !== 'admin' && req.user.user_id !== Number(id)) {
            return res.status(403).json({ error: 'Akses ditolak. Anda hanya dapat melihat profil Anda sendiri.' });
        }
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

        const data = user.toJSON();
        delete data.password;
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { verifyPublic, createUser, listUsers, dashboardStats, listTransactions, activateUser, deactivateUser, updateUser, getUser };
