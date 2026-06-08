'use strict';

const { VarietasRegistration, Document } = require('../models');
const fabric = require('../fabric/fabricGateway');
const { _catatTransaksi } = require('./registrationController');

/**
 * TAHAP 1 — VERIFIKASI ADMINISTRASI
 * validator_admin memproses verifikasi.
 */
async function verifyAdmin(req, res) {
    try {
        const { id } = req.params;          // registration_id (database)
        const { approved, catatan } = req.body;

        const registrasi = await VarietasRegistration.findByPk(id);
        if (!registrasi) return res.status(404).json({ error: 'Registrasi tidak ditemukan' });

        if (registrasi.status_registrasi !== 'PENDING') {
            return res.status(400).json({
                error: `Registrasi tidak dalam status PENDING (saat ini: ${registrasi.status_registrasi})`,
            });
        }

        const isApproved = (approved === true || approved === 'true');

        // Submit keputusan validasi ke blockchain.
        const { result, txInfo } = await fabric.submit(
            'VerifyAdmin', registrasi.onchain_id, String(isApproved), catatan || ''
        );

        // Sinkronkan status ke database off-chain.
        registrasi.status_registrasi = isApproved ? 'ADMIN_APPROVED' : 'REJECTED';
        await registrasi.save();

        const dokumen = await Document.findOne({ where: { registration_id: registrasi.registration_id } });
        if (dokumen) await _catatTransaksi(txInfo, dokumen.document_id);

        return res.json({
            message: isApproved ? 'Registrasi disetujui secara administrasi' : 'Registrasi ditolak',
            status: registrasi.status_registrasi,
            onchain: result,
            tx_hash: txInfo.tx_hash,
        });
    } catch (err) {
        console.error('verifyAdmin error:', err);
        return res.status(500).json({ error: err.message });
    }
}

/**
 * TAHAP 2 — VERIFIKASI SUBSTANTIF
 * validator_substantif memproses verifikasi.
 */
async function verifySubstantive(req, res) {
    try {
        const { id } = req.params;          // registration_id (database)
        const { approved, catatan } = req.body;

        const registrasi = await VarietasRegistration.findByPk(id);
        if (!registrasi) return res.status(404).json({ error: 'Registrasi tidak ditemukan' });

        if (registrasi.status_registrasi !== 'ADMIN_APPROVED') {
            return res.status(400).json({
                error: `Registrasi tidak dalam status ADMIN_APPROVED (saat ini: ${registrasi.status_registrasi})`,
            });
        }

        const isApproved = (approved === true || approved === 'true');

        // Submit keputusan validasi ke blockchain.
        const { result, txInfo } = await fabric.submit(
            'VerifySubstantive', registrasi.onchain_id, String(isApproved), catatan || ''
        );

        // Sinkronkan status ke database off-chain.
        registrasi.status_registrasi = isApproved ? 'SUBSTANTIVE_APPROVED' : 'REJECTED';
        await registrasi.save();

        const dokumen = await Document.findOne({ where: { registration_id: registrasi.registration_id } });
        if (dokumen) await _catatTransaksi(txInfo, dokumen.document_id);

        return res.json({
            message: isApproved ? 'Registrasi disetujui secara substantif' : 'Registrasi ditolak',
            status: registrasi.status_registrasi,
            onchain: result,
            tx_hash: txInfo.tx_hash,
        });
    } catch (err) {
        console.error('verifySubstantive error:', err);
        return res.status(500).json({ error: err.message });
    }
}

/** Daftar registrasi yang menunggu validasi (untuk dashboard validator). */
async function listPending(req, res) {
    try {
        let statusFilter = 'PENDING';
        if (req.user && req.user.role === 'validator_substantif') {
            statusFilter = 'ADMIN_APPROVED';
        } else if (req.user && req.user.role === 'validator_final') {
            statusFilter = 'SUBSTANTIVE_APPROVED';
        } else if (req.user && req.user.role === 'validator_admin') {
            statusFilter = 'PENDING';
        }

        const data = await VarietasRegistration.findAll({
            where: { status_registrasi: statusFilter },
            order: [['created_at', 'ASC']],
        });
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { verifyAdmin, verifySubstantive, listPending };
