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
        const { nama_varietas, asal_plasma_nutfah, karakter_genetik, user_id } = req.body;

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
            status_registrasi: 'PENDING',
        });

        // ID on-chain yang konsisten dengan ledger.
        const onchainId = `REG-${String(registrasi.registration_id).padStart(4, '0')}`;
        registrasi.onchain_id = onchainId;
        await registrasi.save();

        // 2. Tentukan hash dokumen: dari berkas terunggah bila ada,
        //    bila tidak, dari data plasma yang diinput.
        let documentHash;
        let dokumen = null;
        if (req.file) {
            documentHash = hashFile(req.file.path);
            dokumen = await Document.create({
                registration_id: registrasi.registration_id,
                file_name: req.file.originalname,
                file_path_ipfs: req.file.path, // off-chain storage (lokal; dapat diganti IPFS)
                document_hash: documentHash,
            });
        } else {
            documentHash = hashPlasmaData({
                namaVarietas: nama_varietas,
                asalPlasmaNutfah: asal_plasma_nutfah,
                karakterGenetik: karakter_genetik,
                owner: user.wallet_address || user.email,
            });
            dokumen = await Document.create({
                registration_id: registrasi.registration_id,
                file_name: 'data-plasma.json',
                file_path_ipfs: '-',
                document_hash: documentHash,
            });
        }

        // 3. Submit ke blockchain (event PlasmaRegistered terpicu di chaincode).
        const { result, txInfo } = await fabric.submit(
            'RegisterPlasma', onchainId, nama_varietas, documentHash, user.name || 'Pemilik'
        );

        // 4. Catat transaksi blockchain ke database.
        await _catatTransaksi(txInfo, dokumen.document_id);

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
