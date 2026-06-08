'use strict';

/**
 * enrollUser.js
 * -------------
 * Mendaftarkan & meng-enroll identitas aplikasi ('appUser') ke wallet lokal
 * agar backend dapat submit transaksi ke jaringan Fabric.
 *
 * Jalankan SEKALI setelah jaringan & chaincode aktif:
 *   node enrollUser.js
 *
 * Memerlukan paket fabric-ca-client (sudah ikut terbawa fabric-network).
 */

const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
    const ccpPath = path.resolve(process.env.FABRIC_CONNECTION_PROFILE);
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
    const ca = new FabricCAServices(caInfo.url, { trustedRoots: caInfo.tlsCACerts.pem, verify: false }, caInfo.caName);

    const walletPath = path.resolve(process.env.FABRIC_WALLET_PATH || './wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const mspId = process.env.FABRIC_MSP_ID || 'Org1MSP';
    const appUser = process.env.FABRIC_IDENTITY || 'appUser';

    // 1. Enroll admin (bila belum ada).
    if (!(await wallet.get('admin'))) {
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        await wallet.put('admin', {
            credentials: { certificate: enrollment.certificate, privateKey: enrollment.key.toBytes() },
            mspId, type: 'X.509',
        });
        console.log('Admin berhasil di-enroll.');
    }

    // 2. Register & enroll appUser (bila belum ada).
    if (await wallet.get(appUser)) {
        console.log(`Identitas "${appUser}" sudah ada di wallet.`);
        return;
    }
    const adminIdentity = await wallet.get('admin');
    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin');

    const secret = await ca.register({ affiliation: 'org1.department1', enrollmentID: appUser, role: 'client' }, adminUser);
    const enrollment = await ca.enroll({ enrollmentID: appUser, enrollmentSecret: secret });
    await wallet.put(appUser, {
        credentials: { certificate: enrollment.certificate, privateKey: enrollment.key.toBytes() },
        mspId, type: 'X.509',
    });
    console.log(`Identitas "${appUser}" berhasil dibuat di wallet.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
