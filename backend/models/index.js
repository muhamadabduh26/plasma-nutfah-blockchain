'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Definisi model database off-chain, dipetakan PERSIS dari ERD pada rancangan:
 *   USER, VARIETAS_REGISTRATION, DOCUMENT, SMART_CONTRACT,
 *   BLOCKCHAIN_TRANSACTION, VERIFICATION_LOG.
 */

// ---------------- USER ----------------
const User = sequelize.define('User', {
    user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, unique: true },
    password: { type: DataTypes.STRING }, // password hash SHA-256
    wallet_address: { type: DataTypes.STRING },
    role: { type: DataTypes.STRING, defaultValue: 'peneliti' }, // peneliti | validator | admin
    last_login: { type: DataTypes.DATE },
}, { tableName: 'USER', timestamps: false });

// ------------ VARIETAS_REGISTRATION ------------
const VarietasRegistration = sequelize.define('VarietasRegistration', {
    registration_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER },
    nama_varietas: { type: DataTypes.STRING },
    asal_plasma_nutfah: { type: DataTypes.TEXT },
    karakter_genetik: { type: DataTypes.TEXT },
    status_registrasi: { type: DataTypes.STRING, defaultValue: 'PENDING' },
    onchain_id: { type: DataTypes.STRING }, // ID yang dipakai di ledger (mis. REG-0001)
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'VARIETAS_REGISTRATION', timestamps: false });

// ---------------- DOCUMENT ----------------
const Document = sequelize.define('Document', {
    document_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    registration_id: { type: DataTypes.INTEGER },
    file_name: { type: DataTypes.STRING },
    file_path_ipfs: { type: DataTypes.STRING }, // path off-chain (lokal/IPFS)
    document_hash: { type: DataTypes.STRING },   // hash SHA-256 (juga disimpan on-chain)
    uploaded_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'DOCUMENT', timestamps: false });

// ---------------- SMART_CONTRACT ----------------
const SmartContract = sequelize.define('SmartContract', {
    contract_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    contract_address: { type: DataTypes.STRING },
    abi_definition: { type: DataTypes.TEXT },
    network_type: { type: DataTypes.STRING, defaultValue: 'Hyperledger Fabric' },
    deployed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'SMART_CONTRACT', timestamps: false });

// ------------ BLOCKCHAIN_TRANSACTION ------------
const BlockchainTransaction = sequelize.define('BlockchainTransaction', {
    tx_hash: { type: DataTypes.STRING, primaryKey: true },
    document_id: { type: DataTypes.INTEGER },
    contract_id: { type: DataTypes.INTEGER },
    block_number: { type: DataTypes.STRING },
    gas_used: { type: DataTypes.STRING },
    tx_status: { type: DataTypes.STRING },
    fungsi: { type: DataTypes.STRING }, // nama fungsi chaincode yang dipanggil
    confirmed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'BLOCKCHAIN_TRANSACTION', timestamps: false });

// ---------------- VERIFICATION_LOG ----------------
const VerificationLog = sequelize.define('VerificationLog', {
    verification_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    document_id: { type: DataTypes.INTEGER },
    verifier_address: { type: DataTypes.STRING },
    result_match: { type: DataTypes.BOOLEAN },
    verified_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'VERIFICATION_LOG', timestamps: false });

// ---------------- RELASI (sesuai kardinalitas ERD) ----------------
User.hasMany(VarietasRegistration, { foreignKey: 'user_id' });
VarietasRegistration.belongsTo(User, { foreignKey: 'user_id' });

VarietasRegistration.hasMany(Document, { foreignKey: 'registration_id' });
Document.belongsTo(VarietasRegistration, { foreignKey: 'registration_id' });

Document.hasMany(VerificationLog, { foreignKey: 'document_id' });
VerificationLog.belongsTo(Document, { foreignKey: 'document_id' });

Document.hasMany(BlockchainTransaction, { foreignKey: 'document_id' });
BlockchainTransaction.belongsTo(Document, { foreignKey: 'document_id' });

SmartContract.hasMany(BlockchainTransaction, { foreignKey: 'contract_id' });
BlockchainTransaction.belongsTo(SmartContract, { foreignKey: 'contract_id' });

module.exports = {
    sequelize,
    User,
    VarietasRegistration,
    Document,
    SmartContract,
    BlockchainTransaction,
    VerificationLog,
};
