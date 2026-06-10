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

        // Extract registration details
        const detailObj = registrasi.detail_pendaftaran ? JSON.parse(registrasi.detail_pendaftaran) : {};
        const userObj = registrasi.User || {};

        // 1. Buat berkas PDF sertifikat (lengkap dengan QR code untuk validasi publik).
        await _buatPdfSertifikat({
            pdfPath,
            certificateId,
            onchainId: registrasi.onchain_id,
            namaVarietas: registrasi.nama_varietas,
            asal: registrasi.asal_plasma_nutfah,
            pemilik: userObj.name || 'Pemilik',
            namaInstitusi: userObj.nama_institusi || '-',
            alamat: userObj.alamat || '-',
            npwp: userObj.npwp || '-',
            komoditas: detailObj.komoditas || 'Tanaman Pangan',
            genus: detailObj.nama_genus || '-',
            spesies: detailObj.nama_spesies || '-',
            karakterGenetik: registrasi.karakter_genetik || '-',
            sifatKhusus: detailObj.sifat_khusus || '-',
            tanggalTerbit: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            tanggalPenetapan: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
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
            document_type: 'sertifikat',
            nomor_dokumen: certificateId,
            tanggal_terbit: new Date().toISOString().split('T')[0],
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
async function _buatPdfSertifikat({
    pdfPath, certificateId, onchainId, namaVarietas, asal, pemilik,
    namaInstitusi, alamat, npwp, komoditas, genus, spesies,
    karakterGenetik, sifatKhusus, tanggalTerbit, tanggalPenetapan
}) {
    // URL validasi publik yang akan di-encode ke QR.
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/verifikasi?id=${certificateId}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 });
    const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
    const qrBuffer = Buffer.from(qrBase64, 'base64');

    return new Promise((resolve, reject) => {
        // Landscape A4: 841.89 x 595.28
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        // 1. Bingkai Premium (Hijau dan Emas)
        // Outer border
        doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).lineWidth(3).strokeColor('#1b5e20').stroke();
        // Inner border
        doc.rect(36, 36, doc.page.width - 72, doc.page.height - 72).lineWidth(1).strokeColor('#d8a72e').stroke();

        // 2. Kop Surat/Kementerian
        doc.fillColor('#333').fontSize(9).font('Helvetica-Bold')
            .text('REPUBLIK INDONESIA', 40, 50, { align: 'center' });
        doc.fillColor('#1b5e20').fontSize(13).font('Helvetica-Bold')
            .text('KEMENTERIAN PERTANIAN', { align: 'center' });
        doc.fillColor('#555').fontSize(9).font('Helvetica')
            .text('PUSAT PERLINDUNGAN VARIETAS TANAMAN DAN PERIZINAN PERTANIAN', { align: 'center' });
        
        // Garis Pembatas Kop
        doc.lineWidth(1.5).strokeColor('#d8a72e').moveTo(60, 95).lineTo(doc.page.width - 60, 95).stroke();

        // 3. Judul Sertifikat
        doc.moveDown(1.5);
        doc.fillColor('#1b5e20').fontSize(18).font('Helvetica-Bold')
            .text('SERTIFIKAT PENDAFTARAN VARIETAS TANAMAN LOKAL', { align: 'center' });
        doc.fillColor('#d8a72e').fontSize(10.5).font('Helvetica-Bold')
            .text(`NOMOR SERTIFIKAT: CERT/PVTPP/${new Date().getFullYear()}/${String(certificateId.split('-').pop()).padStart(4, '0')}`, { align: 'center' });

        // Pernyataan
        doc.moveDown(1);
        doc.fillColor('#333').fontSize(9).font('Helvetica-Oblique')
            .text('Pusat Perlindungan Varietas Tanaman dan Perizinan Pertanian menerangkan bahwa berdasarkan Undang-Undang No. 29 Tahun 2000 tentang Perlindungan Varietas Tanaman, pendaftaran varietas tanaman lokal berikut telah terdaftar secara sah dan tercatat secara permanen pada Blockchain (PlasmaChain):', 60, doc.y, { align: 'center', width: doc.page.width - 120 });

        // 4. Pembagian Kolom Informasi (Y start: 215)
        const colY = 215;

        // --- KOLOM KIRI: IDENTITAS VARIETAS & PEMILIK ---
        // Shaded Background Card
        doc.rect(60, colY, 345, 295).fillColor('#f7faf6').fill();
        doc.rect(60, colY, 345, 295).lineWidth(1).strokeColor('#d2dfcf').stroke();

        // Text Kolom Kiri
        doc.fillColor('#1b5e20').fontSize(10).font('Helvetica-Bold').text('I. DATA VARIETAS & PEMILIK', 75, colY + 15);
        
        // Items Left
        const leftItems = [
            ['Nama Varietas', namaVarietas],
            ['Nomor Registrasi', onchainId],
            ['Jenis/Komoditas', komoditas],
            ['Taksonomi Genus', genus],
            ['Spesies & Author', spesies],
            ['Asal Varietas', asal],
            ['Metode Perolehan', 'Varietas Lokal (Plasma Nutfah)'],
            ['Nama Pemohon', pemilik],
            ['Nama Instansi', namaInstitusi],
            ['Alamat Pemilik', alamat],
            ['NPWP', npwp]
        ];

        let currentY = colY + 40;
        leftItems.forEach(([label, val]) => {
            doc.fillColor('#666').fontSize(8.5).font('Helvetica').text(`${label}`, 75, currentY, { width: 100 });
            doc.fillColor('#111').fontSize(8.5).font('Helvetica-Bold').text(`:  ${val || '-'}`, 180, currentY, { width: 215 });
            currentY += 21;
        });

        // --- KOLOM KANAN: CIRI TEKNIS & PENGESAHAN ---
        // Shaded Background Card
        doc.rect(425, colY, 355, 145).fillColor('#fffdf9').fill();
        doc.rect(425, colY, 355, 145).lineWidth(1).strokeColor('#f9ecd0').stroke();

        // Text Kolom Kanan
        doc.fillColor('#1b5e20').fontSize(10).font('Helvetica-Bold').text('II. CIRI KHAS & KARAKTERISTIK UTAMA', 440, colY + 15);
        
        doc.fillColor('#444').fontSize(8.5).font('Helvetica').text('Karakter Genetik Utama:', 440, colY + 35);
        // Truncate jika terlalu panjang agar tidak tumpah
        const genetikText = karakterGenetik.length > 180 ? `${karakterGenetik.substring(0, 177)}...` : karakterGenetik;
        doc.fillColor('#111').fontSize(8).font('Helvetica-Bold').text(`"${genetikText}"`, 440, colY + 47, { width: 325, align: 'justify' });

        doc.fillColor('#444').fontSize(8.5).font('Helvetica').text('Sifat Pembeda Utama:', 440, colY + 92);
        const sifatText = sifatKhusus.length > 180 ? `${sifatKhusus.substring(0, 177)}...` : sifatKhusus;
        doc.fillColor('#111').fontSize(8).font('Helvetica-Bold').text(`"${sifatText}"`, 440, colY + 104, { width: 325, align: 'justify' });

        // --- PENGESAHAN & QR ---
        // QR Code
        doc.image(qrBuffer, 425, colY + 205, { width: 80, height: 80 });
        doc.fillColor('#777').fontSize(7.5).font('Helvetica')
            .text('Pindai QR untuk verifikasi keaslian blockchain ledger.', 425, colY + 290, { width: 100, align: 'center' });

        // Tanda Tangan & Seal
        const signY = colY + 200;
        doc.fillColor('#000').fontSize(9).font('Helvetica').text(`Jakarta, ${tanggalTerbit}`, 580, signY, { width: 200, align: 'center' });
        doc.text('Kepala Pusat Perlindungan Varietas Tanaman', 580, signY + 13, { width: 200, align: 'center' });
        doc.text('dan Perizinan Pertanian,', 580, signY + 25, { width: 200, align: 'center' });

        // Digital Seal Badge
        // Draw green badge circle
        doc.strokeColor('#1b5e20').lineWidth(1.5).dash(3, {space: 3}).circle(680, signY + 62, 22).stroke();
        doc.undash();
        doc.fontSize(6).fillColor('#1b5e20').font('Helvetica-Bold').text('KEMENTAN RI', 660, signY + 56, {width: 40, align: 'center'});
        doc.fontSize(6).fillColor('#1b5e20').font('Helvetica-Bold').text('TTE SAH', 660, signY + 64, {width: 40, align: 'center'});

        // Pejabat
        doc.fillColor('#111').fontSize(9.5).font('Helvetica-Bold').text('Dr. Ir. Harris Syahruddin, M.Sc.', 580, signY + 90, { width: 200, align: 'center' });
        doc.fillColor('#333').fontSize(8.5).font('Helvetica').text('NIP. 196803241994031001', 580, signY + 104, { width: 200, align: 'center' });

        doc.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
    });
}

module.exports = {
    issueCertificate, downloadCertificate, listCertificates,
    getHistory,
};
