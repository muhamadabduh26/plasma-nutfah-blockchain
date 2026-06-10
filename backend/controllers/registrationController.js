'use strict';

const path = require('path');
const fs = require('fs');
const {
    User, VarietasRegistration, Document, BlockchainTransaction, SmartContract,
} = require('../models');
const fabric = require('../fabric/fabricGateway');
const { hashFile, hashPlasmaData } = require('../utils/hash');

/**
 * TAHAP 1 — REGISTRASI PLASMA NUTFAH
 * Alur: user input data -> sistem generate hash -> simpan ke blockchain
 *       -> simpan detail ke database (off-chain) -> catat transaksi.
 */
async function registerPlasma(req, res) {
    try {
        const {
            nama_varietas, asal_plasma_nutfah, karakter_genetik, user_id,
            detail_pendaftaran,
            nomor_formulir, tanggal_formulir,
            nomor_surat_tugas, tanggal_surat_tugas,
            nomor_data_dukung, tanggal_data_dukung,
            nomor_foto, tanggal_foto
        } = req.body;

        if (!nama_varietas || !user_id) {
            return res.status(400).json({ error: 'nama_varietas dan user_id wajib diisi' });
        }

        const user = await User.findByPk(user_id);
        if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

        // 1. Simpan registrasi ke database off-chain (status awal PENDING).
        const registrasi = await VarietasRegistration.create({
            user_id,
            nama_varietas,
            asal_plasma_nutfah,
            karakter_genetik,
            detail_pendaftaran,
            status_registrasi: 'PENDING',
        });

        // ID on-chain yang konsisten dengan ledger.
        const onchainId = `REG-${String(registrasi.registration_id).padStart(4, '0')}`;
        registrasi.onchain_id = onchainId;
        await registrasi.save();

        // 2. Simpan dokumen-dokumen persyaratan yang diunggah.
        const savedDocs = [];
        const crypto = require('crypto');
        const docHashes = {};

        const fileFields = [
            { field: 'formulir_bermaterai', nomor: nomor_formulir, tanggal: tanggal_formulir },
            { field: 'surat_tugas', nomor: nomor_surat_tugas, tanggal: tanggal_surat_tugas },
            { field: 'data_dukung', nomor: nomor_data_dukung, tanggal: tanggal_data_dukung },
            { field: 'foto_karakteristik', nomor: nomor_foto, tanggal: tanggal_foto }
        ];

        for (const item of fileFields) {
            const files = req.files || {};
            if (files[item.field] && files[item.field][0]) {
                const file = files[item.field][0];
                const hash = hashFile(file.path);
                docHashes[item.field] = hash;

                const doc = await Document.create({
                    registration_id: registrasi.registration_id,
                    document_type: item.field,
                    nomor_dokumen: item.nomor || '-',
                    tanggal_terbit: item.tanggal || '-',
                    file_name: file.originalname,
                    file_path_ipfs: file.path,
                    document_hash: hash,
                });
                savedDocs.push(doc);
            }
        }

        // Tentukan combined hash untuk blockchain.
        const combinedData = {
            onchain_id: onchainId,
            nama_varietas,
            asal_plasma_nutfah,
            karakter_genetik,
            detail_pendaftaran: JSON.parse(detail_pendaftaran || '{}'),
            doc_hashes: docHashes,
            owner: user.wallet_address || user.email
        };
        const documentHash = crypto.createHash('sha256').update(JSON.stringify(combinedData)).digest('hex');

        // Jika tidak ada berkas yang diunggah, simpan berkas fallback untuk database.
        if (savedDocs.length === 0) {
            const fallbackDoc = await Document.create({
                registration_id: registrasi.registration_id,
                document_type: 'data_plasma',
                nomor_dokumen: '-',
                tanggal_terbit: '-',
                file_name: 'data-plasma.json',
                file_path_ipfs: '-',
                document_hash: documentHash,
            });
            savedDocs.push(fallbackDoc);
        }

        // 3. Submit ke blockchain (event PlasmaRegistered terpicu di chaincode).
        const { result, txInfo } = await fabric.submit(
            'RegisterPlasma', onchainId, nama_varietas, documentHash, user.name || 'Pemilik'
        );

        // 4. Catat transaksi blockchain ke database.
        await _catatTransaksi(txInfo, savedDocs[0].document_id);

        return res.status(201).json({
            message: 'Plasma nutfah berhasil diregistrasi ke blockchain',
            registration: registrasi,
            document_hash: documentHash,
            onchain: result,
            tx_hash: txInfo.tx_hash,
        });
    } catch (err) {
        console.error('registerPlasma error:', err);
        return res.status(500).json({ error: err.message });
    }
}

/** Mengambil seluruh registrasi (untuk halaman List Registrasi). */
async function listRegistrations(req, res) {
    try {
        const data = await VarietasRegistration.findAll({
            include: [{ model: User, attributes: ['name', 'email', 'wallet_address'] }],
            order: [['registration_id', 'DESC']],
        });
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/** Detail satu registrasi beserta data on-chain dan riwayatnya. */
async function getRegistration(req, res) {
    try {
        const registrasi = await VarietasRegistration.findByPk(req.params.id, {
            include: [{ model: User }, { model: Document }],
        });
        if (!registrasi) return res.status(404).json({ error: 'Registrasi tidak ditemukan' });

        let onchain = null;
        try {
            onchain = await fabric.evaluate('QueryAsset', registrasi.onchain_id);
        } catch (e) { /* data on-chain mungkin belum ada */ }

        return res.json({ registration: registrasi, onchain });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/** Helper: mencatat transaksi blockchain ke tabel BLOCKCHAIN_TRANSACTION. */
async function _catatTransaksi(txInfo, documentId) {
    // Pastikan ada satu baris SMART_CONTRACT sebagai referensi.
    let kontrak = await SmartContract.findOne();
    if (!kontrak) {
        kontrak = await SmartContract.create({
            contract_address: process.env.FABRIC_CHAINCODE || 'plasma-nutfah',
            abi_definition: 'PlasmaNutfahContract',
            network_type: 'Hyperledger Fabric',
        });
    }
    await BlockchainTransaction.create({
        tx_hash: txInfo.tx_hash,
        document_id: documentId,
        contract_id: kontrak.contract_id,
        block_number: txInfo.block_number,
        gas_used: txInfo.gas_used,
        tx_status: txInfo.tx_status,
        fungsi: txInfo.fungsi,
    });
}

async function cancelRegistration(req, res) {
    try {
        const registrasi = await VarietasRegistration.findByPk(req.params.id);
        if (!registrasi) return res.status(404).json({ error: 'Registrasi tidak ditemukan' });

        if (registrasi.user_id !== req.user.user_id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Anda tidak memiliki hak untuk membatalkan pengajuan ini' });
        }

        if (registrasi.status_registrasi !== 'PENDING') {
            return res.status(400).json({ error: 'Hanya pengajuan berstatus PENDING yang dapat dibatalkan' });
        }

        registrasi.status_registrasi = 'CANCELLED';
        await registrasi.save();

        return res.json({ message: 'Pengajuan berhasil dibatalkan', registration: registrasi });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { registerPlasma, listRegistrations, getRegistration, cancelRegistration, _catatTransaksi };
