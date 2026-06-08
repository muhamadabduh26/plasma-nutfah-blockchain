'use strict';

const crypto = require('crypto');
const fs = require('fs');

/**
 * Modul pembuatan hash SHA-256.
 * Sesuai dengan blok "Hash Generation (SHA-256)" pada Application Layer.
 * Hash inilah yang disimpan on-chain, bukan dokumen aslinya.
 */

/** Menghasilkan hash SHA-256 dari sebuah string (heksadesimal, 64 karakter). */
function hashString(text) {
    return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

/** Menghasilkan hash SHA-256 dari sebuah buffer (mis. isi berkas). */
function hashBuffer(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

/** Menghasilkan hash SHA-256 dari berkas pada path tertentu. */
function hashFile(filePath) {
    const buffer = fs.readFileSync(filePath);
    return hashBuffer(buffer);
}

/**
 * Membuat hash kanonik dari objek data plasma nutfah.
 * Field diurutkan agar hasil hash deterministik (input sama -> hash sama).
 */
function hashPlasmaData(data) {
    const kanonik = JSON.stringify({
        namaVarietas: data.namaVarietas || '',
        asalPlasmaNutfah: data.asalPlasmaNutfah || '',
        karakterGenetik: data.karakterGenetik || '',
        owner: data.owner || '',
    });
    return hashString(kanonik);
}

module.exports = { hashString, hashBuffer, hashFile, hashPlasmaData };
