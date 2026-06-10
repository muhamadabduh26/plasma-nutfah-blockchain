'use strict';

const { Gateway, Wallets } = require('fabric-network');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * FabricGateway
 * -------------
 * Pembungkus (wrapper) untuk berkomunikasi dengan chaincode di Hyperledger
 * Fabric melalui fabric-network SDK.
 *
 * Mendukung dua mode:
 *  - MODE NYATA  : terhubung ke jaringan Fabric (test-network).
 *  - MODE MOCK   : mensimulasikan ledger di memori. Berguna untuk
 *                  pengembangan frontend/backend sebelum jaringan siap.
 *                  Aktif bila FABRIC_MOCK=true pada .env.
 */
class FabricGateway {
    constructor() {
        this.mock = (process.env.FABRIC_MOCK || 'true').toLowerCase() === 'true';
        this.channelName = process.env.FABRIC_CHANNEL || 'mychannel';
        this.chaincodeName = process.env.FABRIC_CHAINCODE || 'plasma-nutfah';
        this.contractName = 'PlasmaNutfahContract';

        // Penyimpanan ledger tiruan untuk mode mock.
        this._mockLedger = new Map();
        this._mockEvents = [];
        this._mockHistory = new Map();

        if (this.mock) {
            this._loadMockData();
        }
    }

    _loadMockData() {
        try {
            const dataDir = path.resolve(__dirname, '../data');
            const ledgerPath = path.join(dataDir, 'mock_ledger.json');
            if (fs.existsSync(ledgerPath)) {
                const data = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
                this._mockLedger = new Map(data);
            }
            const historyPath = path.join(dataDir, 'mock_history.json');
            if (fs.existsSync(historyPath)) {
                const data = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
                this._mockHistory = new Map(data);
            }
        } catch (err) {
            console.error('[FabricGateway] Gagal memuat data mock ledger:', err);
        }
    }

    _saveMockData() {
        try {
            const dataDir = path.resolve(__dirname, '../data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            const ledgerPath = path.join(dataDir, 'mock_ledger.json');
            fs.writeFileSync(ledgerPath, JSON.stringify(Array.from(this._mockLedger.entries()), null, 2), 'utf8');

            const historyPath = path.join(dataDir, 'mock_history.json');
            fs.writeFileSync(historyPath, JSON.stringify(Array.from(this._mockHistory.entries()), null, 2), 'utf8');
        } catch (err) {
            console.error('[FabricGateway] Gagal menyimpan data mock:', err);
        }
    }

    /** Menghubungkan ke gateway (hanya relevan pada mode nyata). */
    async connect() {
        if (this.mock) {
            console.log('[FabricGateway] Berjalan dalam MODE SIMULASI (mock).');
            return;
        }

        const ccpPath = path.resolve(process.env.FABRIC_CONNECTION_PROFILE);
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        const walletPath = path.resolve(process.env.FABRIC_WALLET_PATH || './wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const identity = process.env.FABRIC_IDENTITY || 'appUser';
        const idExists = await wallet.get(identity);
        if (!idExists) {
            throw new Error(`Identitas "${identity}" tidak ada di wallet. Jalankan skrip enrollUser terlebih dahulu.`);
        }

        this.gateway = new Gateway();
        await this.gateway.connect(ccp, {
            wallet,
            identity,
            discovery: { enabled: true, asLocalhost: true },
        });

        const network = await this.gateway.getNetwork(this.channelName);
        this.contract = network.getContract(this.chaincodeName, this.contractName);
        console.log('[FabricGateway] Terhubung ke jaringan Hyperledger Fabric.');
    }

    async disconnect() {
        if (!this.mock && this.gateway) {
            this.gateway.disconnect();
        }
    }

    /**
     * Submit transaksi (mengubah state ledger).
     * Mengembalikan { result, txInfo } di mana txInfo berisi metadata transaksi
     * untuk dicatat di tabel BLOCKCHAIN_TRANSACTION.
     */
    async submit(fn, ...args) {
        if (this.mock) {
            return this._mockSubmit(fn, args);
        }
        const resultBytes = await this.contract.submitTransaction(fn, ...args);
        const result = resultBytes.length ? JSON.parse(resultBytes.toString()) : {};
        const txInfo = {
            tx_hash: crypto.randomBytes(16).toString('hex'),
            block_number: 'n/a',
            gas_used: '0', // Fabric tidak memakai gas; diisi 0 untuk kompatibilitas skema
            tx_status: 'VALID',
            fungsi: fn,
        };
        return { result, txInfo };
    }

    /** Evaluasi transaksi (read-only, tidak mengubah ledger). */
    async evaluate(fn, ...args) {
        if (this.mock) {
            return this._mockEvaluate(fn, args);
        }
        const resultBytes = await this.contract.evaluateTransaction(fn, ...args);
        return resultBytes.length ? JSON.parse(resultBytes.toString()) : {};
    }

    // ============================================================
    // IMPLEMENTASI MODE SIMULASI (MOCK)
    // ============================================================
    _now() { return new Date().toISOString(); }
    _txHash() { return crypto.randomBytes(16).toString('hex'); }

    _mockTxInfo(fn) {
        return {
            tx_hash: this._txHash(),
            block_number: String(this._mockLedger.size + 1),
            gas_used: '0',
            tx_status: 'VALID',
            fungsi: fn,
        };
    }

    _addToMockHistory(id, value) {
        if (!this._mockHistory.has(id)) {
            this._mockHistory.set(id, []);
        }
        const historyList = this._mockHistory.get(id);
        historyList.push({
            txId: this._txHash(),
            timestamp: this._now(),
            value: JSON.parse(JSON.stringify(value))
        });
    }

    async _mockSubmit(fn, args) {
        const L = this._mockLedger;
        let result = {};

        if (fn === 'RegisterPlasma') {
            const [id, namaVarietas, documentHash, ownerName] = args;
            if (L.has(id)) throw new Error(`Registrasi dengan ID ${id} sudah ada`);
            result = {
                docType: 'plasma', id, namaVarietas, documentHash,
                owner: '0xPENELITI01', ownerName, status: 'PENDING',
                certificateId: '', certificateHash: '',
                registeredAt: this._now(), updatedAt: this._now(),
            };
            L.set(id, result);
            this._addToMockHistory(id, result);
            this._mockEvents.push({ event: 'PlasmaRegistered', payload: { id, namaVarietas } });

        } else if (fn === 'VerifyAdmin') {
            const [id, approved, catatan] = args;
            const aset = L.get(id);
            if (!aset) throw new Error(`Aset ${id} tidak ditemukan`);
            if (aset.status !== 'PENDING') throw new Error(`Status bukan PENDING`);
            aset.status = (approved === 'true' || approved === true) ? 'ADMIN_APPROVED' : 'REJECTED';
            aset.validatorAdmin = 'admin_pvt@pertanian.go.id (Verifikator Administrasi)';
            aset.catatanAdmin = catatan || '';
            aset.updatedAt = this._now();
            L.set(id, aset);
            this._addToMockHistory(id, aset);
            result = aset;
            this._mockEvents.push({ event: 'AdminVerified', payload: { id, status: aset.status } });

        } else if (fn === 'VerifySubstantive') {
            const [id, approved, catatan] = args;
            const aset = L.get(id);
            if (!aset) throw new Error(`Aset ${id} tidak ditemukan`);
            if (aset.status !== 'ADMIN_APPROVED') throw new Error(`Status bukan ADMIN_APPROVED`);
            aset.status = (approved === 'true' || approved === true) ? 'SUBSTANTIVE_APPROVED' : 'REJECTED';
            aset.validatorSubstantive = 'ahli_pvt@pertanian.go.id (Pemeriksa Substantif)';
            aset.catatanSubstantive = catatan || '';
            aset.updatedAt = this._now();
            L.set(id, aset);
            this._addToMockHistory(id, aset);
            result = aset;
            this._mockEvents.push({ event: 'SubstantiveVerified', payload: { id, status: aset.status } });

        } else if (fn === 'IssueCertificate') {
            const [id, certificateId, certificateHash] = args;
            const aset = L.get(id);
            if (!aset) throw new Error(`Aset ${id} tidak ditemukan`);
            if (aset.status !== 'SUBSTANTIVE_APPROVED') throw new Error('Registrasi belum SUBSTANTIVE_APPROVED');
            aset.certificateId = certificateId;
            aset.certificateHash = certificateHash;
            aset.status = 'CERTIFIED';
            aset.validatorFinal = 'kepala_pvt@pertanian.go.id (Kepala Balai PPVTPP)';
            aset.issuedAt = this._now();
            aset.updatedAt = aset.issuedAt;
            L.set(id, aset);
            this._addToMockHistory(id, aset);
            result = aset;
            this._mockEvents.push({ event: 'CertificateIssued', payload: { id, certificateId } });

        } else if (fn === 'TransferOwnership') {
            const [id, newOwner, newOwnerName] = args;
            const aset = L.get(id);
            if (!aset) throw new Error(`Aset ${id} tidak ditemukan`);
            if (aset.status !== 'CERTIFIED') throw new Error('Varietas belum bersertifikat');
            const pemilikLama = aset.owner;
            aset.owner = newOwner;
            aset.ownerName = newOwnerName;
            aset.updatedAt = this._now();
            L.set(id, aset);
            this._addToMockHistory(id, aset);
            result = aset;
            this._mockEvents.push({ event: 'OwnershipTransferred', payload: { id, pemilikLama, pemilikBaru: newOwner } });

        } else if (fn === 'VerifyCertificate') {
            return this._mockEvaluate(fn, args);
        } else {
            throw new Error(`Fungsi ${fn} tidak dikenal (mock)`);
        }

        this._saveMockData();
        return { result, txInfo: this._mockTxInfo(fn) };
    }

    async _mockEvaluate(fn, args) {
        const L = this._mockLedger;

        if (fn === 'QueryAsset') {
            const aset = L.get(args[0]);
            if (!aset) throw new Error(`Aset ${args[0]} tidak ditemukan`);
            return aset;
        }
        if (fn === 'GetAllAssets') {
            return Array.from(L.values());
        }
        if (fn === 'VerifyCertificate') {
            const [id, hashToVerify] = args;
            let aset = L.get(id);
            if (!aset) {
                aset = Array.from(L.values()).find((a) => a.certificateId === id);
            }
            if (!aset) throw new Error(`Sertifikat ${id} tidak ditemukan`);
            const cocok = aset.certificateHash === hashToVerify || aset.documentHash === hashToVerify;
            this._mockEvents.push({ event: 'CertificateVerified', payload: { id: aset.id, cocok } });
            return {
                id: aset.id, certificateId: aset.certificateId, namaVarietas: aset.namaVarietas,
                owner: aset.owner, ownerName: aset.ownerName, status: aset.status,
                cocok, verifiedAt: this._now(),
            };
        }
        if (fn === 'GetAssetHistory') {
            return this._mockHistory.get(args[0]) || [];
        }
        throw new Error(`Fungsi query ${fn} tidak dikenal (mock)`);
    }
}

// Singleton agar mock-ledger konsisten di seluruh request.
const instance = new FabricGateway();
module.exports = instance;
