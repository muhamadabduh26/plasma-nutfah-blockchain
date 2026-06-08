'use strict';

const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { VarietasRegistration, Document, User } = require('../models');
const fabric = require('../fabric/fabricGateway');
const { hashFile } = require('../utils/hash');
const { _catatTransaksi } = require('./registrationController');

const CERT_DIR = path.join(__dirname, '..', 'uploads', 'certificates');
if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true });

/**
 * TAHAP 3 — PENERBITAN SERTIFIKAT
 * Sertifikat digital (PDF) dibuat, lalu hash-nya dimasukkan ke blockchain.
 */
async function issueCertificate(req, res) {
    try {
        const { id } = req.params; // registration_id
        const registrasi = await VarietasRegistration.findByPk(id, { include: [{ model: User }] });
        if (!registrasi) return res.status(404).json({ error: 'Registrasi tidak ditemukan' });

        if (req.user && req.user.role !== 'validator_final') {
            return res.status(403).json({ error: 'Hanya validator_final (Kepala Balai) yang dapat menerbitkan sertifikat' });
        }

        if (registrasi.status_registrasi !== 'SUBSTANTIVE_APPROVED') {
            return res.status(400).json({
                error: `Sertifikat hanya dapat diterbitkan untuk registrasi yang sudah disetujui secara substantif (saat ini: ${registrasi.status_registrasi})`,
            });
        }

        const certificateId = `CERT-${String(registrasi.registration_id).padStart(4, '0')}`;
        const pdfPath = path.join(CERT_DIR, `${certificateId}.pdf`);

        // 1. Buat berkas PDF sertifikat (lengkap dengan QR code untuk validasi publik).
        await _buatPdfSertifikat({
            pdfPath,
            certificateId,
            onchainId: registrasi.onchain_id,
            namaVarietas: registrasi.nama_varietas,
            asal: registrasi.asal_plasma_nutfah,
            pemilik: registrasi.User ? registrasi.User.name : 'Pemilik',
        });

        // 2. Hash berkas PDF -> inilah yang disimpan on-chain.
        const certificateHash = hashFile(pdfPath);

        // 3. Submit penerbitan ke blockchain (event CertificateIssued terpicu).
        const { result, txInfo } = await fabric.submit(
            'IssueCertificate', registrasi.onchain_id, certificateId, certificateHash
        );

        // 4. Catat dokumen sertifikat di database + transaksi blockchain.
        const dokSertifikat = await Document.create({
            registration_id: registrasi.registration_id,
            file_name: `${certificateId}.pdf`,
            file_path_ipfs: pdfPath,
            document_hash: certificateHash,
        });
        await _catatTransaksi(txInfo, dokSertifikat.document_id);

        registrasi.status_registrasi = 'CERTIFIED';
        await registrasi.save();

        return res.json({
            message: 'Sertifikat digital berhasil diterbitkan',
            certificate_id: certificateId,
            certificate_hash: certificateHash,
            pdf_url: `/api/certificates/${certificateId}/download`,
            onchain: result,
            tx_hash: txInfo.tx_hash,
        });
    } catch (err) {
        console.error('issueCertificate error:', err);
        return res.status(500).json({ error: err.message });
    }
}

/** Mengunduh berkas PDF sertifikat. */
async function downloadCertificate(req, res) {
    const { certificateId } = req.params;
    const pdfPath = path.join(CERT_DIR, `${certificateId}.pdf`);
    if (!fs.existsSync(pdfPath)) return res.status(404).json({ error: 'Berkas sertifikat tidak ditemukan' });
    return res.download(pdfPath);
}

/** Daftar seluruh sertifikat yang sudah terbit (status CERTIFIED). */
async function listCertificates(req, res) {
    try {
        const data = await VarietasRegistration.findAll({
            where: { status_registrasi: 'CERTIFIED' },
            include: [{ model: User, attributes: ['name', 'email'] }],
            order: [['registration_id', 'DESC']],
        });
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}


/** Riwayat (audit trail) sebuah aset dari ledger. */
async function getHistory(req, res) {
    try {
        const registrasi = await VarietasRegistration.findByPk(req.params.id);
        if (!registrasi) return res.status(404).json({ error: 'Registrasi tidak ditemukan' });
        const history = await fabric.evaluate('GetAssetHistory', registrasi.onchain_id);
        return res.json(history);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/** Helper: membuat PDF sertifikat dengan QR code. */
async function _buatPdfSertifikat({ pdfPath, certificateId, onchainId, namaVarietas, asal, pemilik }) {
    // URL validasi publik yang akan di-encode ke QR.
    const verifyUrl = `http://localhost:5173/verifikasi?id=${certificateId}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 });
    const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
    const qrBuffer = Buffer.from(qrBase64, 'base64');

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        // Bingkai
        doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50).lineWidth(2).stroke('#1B5E20');

        doc.moveDown(2);
        doc.fontSize(22).fillColor('#1B5E20').font('Helvetica-Bold')
            .text('SERTIFIKAT DIGITAL HAK PATEN VARIETAS TANAMAN', { align: 'center' });
        doc.fontSize(13).fillColor('#555').font('Helvetica')
            .text('(Plasma Nutfah) — Terverifikasi Blockchain', { align: 'center' });

        doc.moveDown(2);
        doc.fontSize(12).fillColor('#000').text('Dengan ini menyatakan bahwa varietas tanaman:', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(20).fillColor('#1B5E20').font('Helvetica-Bold')
            .text(namaVarietas, { align: 'center' });

        doc.moveDown(1.5);
        doc.font('Helvetica').fontSize(12).fillColor('#000');
        const baris = [
            ['ID Sertifikat', certificateId],
            ['ID Registrasi (On-Chain)', onchainId],
            ['Asal Plasma Nutfah', asal || '-'],
            ['Pemilik', pemilik],
            ['Tanggal Terbit', new Date().toLocaleDateString('id-ID')],
        ];
        baris.forEach(([label, nilai]) => {
            doc.text(`${label}: `, 80, doc.y, { continued: true }).font('Helvetica-Bold')
                .text(String(nilai)).font('Helvetica');
            doc.moveDown(0.3);
        });

        // QR code untuk validasi publik
        doc.moveDown(1.5);
        const qrX = (doc.page.width - 140) / 2;
        doc.image(qrBuffer, qrX, doc.y, { width: 140 });
        doc.moveDown(8);
        doc.fontSize(10).fillColor('#777')
            .text('Pindai QR di atas atau kunjungi portal verifikasi untuk memvalidasi keaslian sertifikat ini.',
                { align: 'center' });

        doc.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
    });
}

module.exports = {
    issueCertificate, downloadCertificate, listCertificates,
    getHistory,
};
