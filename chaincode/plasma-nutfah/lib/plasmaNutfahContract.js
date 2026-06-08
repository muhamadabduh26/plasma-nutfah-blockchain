'use strict';

const { Contract } = require('fabric-contract-api');

/**
 * PlasmaNutfahContract
 * --------------------
 * Smart contract (chaincode) untuk sistem verifikasi sertifikat digital
 * hak paten varietas tanaman (plasma nutfah).
 *
 * Data yang disimpan ON-CHAIN bersifat minimal sesuai rancangan arsitektur:
 * ID sertifikat, hash dokumen (SHA-256), timestamp, dan pemilik (owner).
 * Data detail dan dokumen lengkap disimpan OFF-CHAIN (database & file storage)
 * untuk efisiensi biaya dan kecepatan query (pola hybrid storage).
 *
 * Alur kerja yang diimplementasikan:
 *   1. RegisterPlasma       -> event PlasmaRegistered
 *   2. VerifyRegistration   -> validator approve/reject
 *   3. IssueCertificate     -> event CertificateIssued
 *   4. TransferOwnership    -> event OwnershipTransferred
 *   5. VerifyCertificate    -> event CertificateVerified (validasi publik)
 */
class PlasmaNutfahContract extends Contract {

    constructor() {
        // Namespace kontrak agar dapat dibedakan bila ada beberapa kontrak.
        super('PlasmaNutfahContract');
    }

    /**
     * Status registrasi yang valid sepanjang siklus hidup aset.
     */
    _statusEnum() {
        return {
            PENDING: 'PENDING',
            ADMIN_APPROVED: 'ADMIN_APPROVED',
            SUBSTANTIVE_APPROVED: 'SUBSTANTIVE_APPROVED',
            REJECTED: 'REJECTED',
            CERTIFIED: 'CERTIFIED',
        };
    }

    /**
     * InitLedger - opsional, dipanggil saat inisialisasi untuk data contoh.
     */
    async InitLedger(ctx) {
        const contoh = {
            docType: 'plasma',
            id: 'REG-0001',
            namaVarietas: 'Padi Inpari Unggul',
            documentHash: '0'.repeat(64),
            owner: 'INIT',
            ownerName: 'Sistem',
            status: this._statusEnum().PENDING,
            certificateId: '',
            certificateHash: '',
            registeredAt: this._txTimestamp(ctx),
            updatedAt: this._txTimestamp(ctx),
        };
        await ctx.stub.putState(contoh.id, Buffer.from(JSON.stringify(contoh)));
        return JSON.stringify(contoh);
    }

    // ============================================================
    // TAHAP 1 — REGISTRASI PLASMA NUTFAH
    // ============================================================
    /**
     * Mendaftarkan plasma nutfah baru ke blockchain.
     * @param {String} id            ID registrasi unik (mis. REG-0001)
     * @param {String} namaVarietas  Nama varietas tanaman
     * @param {String} documentHash  Hash SHA-256 dari dokumen/data plasma
     * @param {String} ownerName     Nama pemilik (peneliti/petani/breeder)
     */
    async RegisterPlasma(ctx, id, namaVarietas, documentHash, ownerName) {
        if (await this._assetExists(ctx, id)) {
            throw new Error(`Registrasi dengan ID ${id} sudah ada`);
        }
        if (!documentHash || documentHash.length !== 64) {
            throw new Error('documentHash harus berupa hash SHA-256 (64 karakter heksadesimal)');
        }

        // Identitas pengaju diambil dari sertifikat MSP klien (wallet pemilik).
        const ownerAddress = this._clientId(ctx);
        const ts = this._txTimestamp(ctx);

        const aset = {
            docType: 'plasma',
            id,
            namaVarietas,
            documentHash,
            owner: ownerAddress,
            ownerName,
            status: this._statusEnum().PENDING,
            certificateId: '',
            certificateHash: '',
            registeredAt: ts,
            updatedAt: ts,
        };

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(aset)));

        // Event: memicu notifikasi ke validator (balai/instansi).
        ctx.stub.setEvent('PlasmaRegistered', Buffer.from(JSON.stringify({
            id,
            namaVarietas,
            documentHash,
            owner: ownerAddress,
            registeredAt: ts,
        })));

        return JSON.stringify(aset);
    }

    // ============================================================
    // TAHAP 2 — VERIFIKASI OLEH VALIDATOR
    // ============================================================
    /**
     * Verifikasi Administrasi (Tahap 1) oleh validator_admin.
     */
    async VerifyAdmin(ctx, id, approved, catatan) {
        const aset = await this._getAsset(ctx, id);

        if (aset.status !== this._statusEnum().PENDING) {
            throw new Error(`Registrasi ${id} tidak dalam status PENDING (status saat ini: ${aset.status})`);
        }

        const isApproved = (approved === 'true' || approved === true);
        aset.status = isApproved ? this._statusEnum().ADMIN_APPROVED : this._statusEnum().REJECTED;
        aset.validatorAdmin = this._clientId(ctx);
        aset.catatanAdmin = catatan || '';
        aset.updatedAt = this._txTimestamp(ctx);

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(aset)));

        ctx.stub.setEvent('AdminVerified', Buffer.from(JSON.stringify({
            id,
            status: aset.status,
            validator: aset.validatorAdmin,
            catatan: aset.catatanAdmin,
        })));

        return JSON.stringify(aset);
    }

    /**
     * Verifikasi Substantif / Uji Lahan (Tahap 2) oleh validator_substantif.
     */
    async VerifySubstantive(ctx, id, approved, catatan) {
        const aset = await this._getAsset(ctx, id);

        if (aset.status !== this._statusEnum().ADMIN_APPROVED) {
            throw new Error(`Registrasi ${id} tidak dalam status ADMIN_APPROVED (status saat ini: ${aset.status})`);
        }

        const isApproved = (approved === 'true' || approved === true);
        aset.status = isApproved ? this._statusEnum().SUBSTANTIVE_APPROVED : this._statusEnum().REJECTED;
        aset.validatorSubstantive = this._clientId(ctx);
        aset.catatanSubstantive = catatan || '';
        aset.updatedAt = this._txTimestamp(ctx);

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(aset)));

        ctx.stub.setEvent('SubstantiveVerified', Buffer.from(JSON.stringify({
            id,
            status: aset.status,
            validator: aset.validatorSubstantive,
            catatan: aset.catatanSubstantive,
        })));

        return JSON.stringify(aset);
    }

    // ============================================================
    // TAHAP 3 — PENERBITAN SERTIFIKAT (Final Approval)
    // ============================================================
    /**
     * Menerbitkan sertifikat digital. Hanya untuk registrasi berstatus SUBSTANTIVE_APPROVED.
     */
    async IssueCertificate(ctx, id, certificateId, certificateHash) {
        const aset = await this._getAsset(ctx, id);

        if (aset.status !== this._statusEnum().SUBSTANTIVE_APPROVED) {
            throw new Error(`Sertifikat hanya dapat diterbitkan untuk registrasi yang sudah SUBSTANTIVE_APPROVED (status: ${aset.status})`);
        }
        if (!certificateHash || certificateHash.length !== 64) {
            throw new Error('certificateHash harus berupa hash SHA-256 (64 karakter heksadesimal)');
        }

        aset.certificateId = certificateId;
        aset.certificateHash = certificateHash;
        aset.status = this._statusEnum().CERTIFIED;
        aset.validatorFinal = this._clientId(ctx);
        aset.issuedAt = this._txTimestamp(ctx);
        aset.updatedAt = aset.issuedAt;

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(aset)));

        // Event: memberi tahu sistem lain bahwa sertifikat terbit.
        ctx.stub.setEvent('CertificateIssued', Buffer.from(JSON.stringify({
            id,
            certificateId,
            certificateHash,
            owner: aset.owner,
            validator: aset.validatorFinal,
            issuedAt: aset.issuedAt,
        })));

        return JSON.stringify(aset);
    }

    // ============================================================
    // TAHAP 4 — TRANSFER KEPEMILIKAN
    // ============================================================
    /**
     * Memindahkan kepemilikan varietas. Riwayat tercatat permanen di ledger.
     * @param {String} id            ID registrasi
     * @param {String} newOwner      Alamat/identitas pemilik baru
     * @param {String} newOwnerName  Nama pemilik baru
     */
    async TransferOwnership(ctx, id, newOwner, newOwnerName) {
        const aset = await this._getAsset(ctx, id);

        if (aset.status !== this._statusEnum().CERTIFIED) {
            throw new Error('Kepemilikan hanya dapat ditransfer untuk varietas yang sudah bersertifikat');
        }

        const pemilikLama = aset.owner;
        aset.owner = newOwner;
        aset.ownerName = newOwnerName;
        aset.updatedAt = this._txTimestamp(ctx);

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(aset)));

        ctx.stub.setEvent('OwnershipTransferred', Buffer.from(JSON.stringify({
            id,
            pemilikLama,
            pemilikBaru: newOwner,
            namaPemilikBaru: newOwnerName,
            transferredAt: aset.updatedAt,
        })));

        return JSON.stringify(aset);
    }

    // ============================================================
    // TAHAP 5 — VALIDASI PUBLIK
    // ============================================================
    /**
     * Memverifikasi keaslian sertifikat dengan membandingkan hash.
     * Dipanggil saat publik melakukan scan QR / input ID sertifikat.
     * @param {String} id               ID registrasi atau certificateId
     * @param {String} hashToVerify     Hash dokumen yang diunggah pemeriksa
     */
    async VerifyCertificate(ctx, id, hashToVerify) {
        // Pencarian dapat dilakukan via ID registrasi atau via certificateId.
        let aset = null;
        if (await this._assetExists(ctx, id)) {
            aset = await this._getAsset(ctx, id);
        } else {
            aset = await this._findByCertificateId(ctx, id);
        }

        if (!aset) {
            throw new Error(`Sertifikat dengan ID ${id} tidak ditemukan`);
        }

        const cocok = (aset.certificateHash === hashToVerify) || (aset.documentHash === hashToVerify);
        const ts = this._txTimestamp(ctx);

        ctx.stub.setEvent('CertificateVerified', Buffer.from(JSON.stringify({
            id: aset.id,
            certificateId: aset.certificateId,
            cocok,
            verifier: this._clientId(ctx),
            verifiedAt: ts,
        })));

        return JSON.stringify({
            id: aset.id,
            certificateId: aset.certificateId,
            namaVarietas: aset.namaVarietas,
            owner: aset.owner,
            ownerName: aset.ownerName,
            status: aset.status,
            cocok,
            verifiedAt: ts,
        });
    }

    // ============================================================
    // FUNGSI QUERY (read-only)
    // ============================================================

    /** Mengambil satu aset berdasarkan ID. */
    async QueryAsset(ctx, id) {
        const aset = await this._getAsset(ctx, id);
        return JSON.stringify(aset);
    }

    /** Mengambil seluruh aset di ledger. */
    async GetAllAssets(ctx) {
        const hasil = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let res = await iterator.next();
        while (!res.done) {
            const strValue = Buffer.from(res.value.value.toString()).toString('utf8');
            try {
                hasil.push(JSON.parse(strValue));
            } catch (e) {
                // lewati entri yang tidak dapat di-parse
            }
            res = await iterator.next();
        }
        await iterator.close();
        return JSON.stringify(hasil);
    }

    /** Mengambil riwayat perubahan (audit trail) sebuah aset. */
    async GetAssetHistory(ctx, id) {
        const riwayat = [];
        const iterator = await ctx.stub.getHistoryForKey(id);
        let res = await iterator.next();
        while (!res.done) {
            const entri = {
                txId: res.value.txId,
                timestamp: res.value.timestamp,
                isDelete: res.value.isDelete,
            };
            try {
                entri.value = JSON.parse(res.value.value.toString('utf8'));
            } catch (e) {
                entri.value = res.value.value.toString('utf8');
            }
            riwayat.push(entri);
            res = await iterator.next();
        }
        await iterator.close();
        return JSON.stringify(riwayat);
    }

    // ============================================================
    // FUNGSI PEMBANTU (internal, diawali underscore)
    // ============================================================

    async _assetExists(ctx, id) {
        const data = await ctx.stub.getState(id);
        return (!!data && data.length > 0);
    }

    async _getAsset(ctx, id) {
        const data = await ctx.stub.getState(id);
        if (!data || data.length === 0) {
            throw new Error(`Aset dengan ID ${id} tidak ditemukan`);
        }
        return JSON.parse(data.toString());
    }

    async _findByCertificateId(ctx, certificateId) {
        const iterator = await ctx.stub.getStateByRange('', '');
        let res = await iterator.next();
        while (!res.done) {
            try {
                const aset = JSON.parse(res.value.value.toString('utf8'));
                if (aset.certificateId === certificateId) {
                    await iterator.close();
                    return aset;
                }
            } catch (e) { /* lewati */ }
            res = await iterator.next();
        }
        await iterator.close();
        return null;
    }

    _clientId(ctx) {
        // Mengembalikan identitas klien (berasal dari sertifikat X.509 MSP).
        try {
            return ctx.clientIdentity.getID();
        } catch (e) {
            return 'unknown';
        }
    }

    _txTimestamp(ctx) {
        // Timestamp transaksi yang deterministik (sama di semua peer).
        const ts = ctx.stub.getTxTimestamp();
        const millis = (ts.seconds.low !== undefined ? ts.seconds.low : ts.seconds) * 1000
            + Math.round((ts.nanos || 0) / 1e6);
        return new Date(millis).toISOString();
    }
}

module.exports = PlasmaNutfahContract;
