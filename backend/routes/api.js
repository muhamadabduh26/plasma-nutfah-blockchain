'use strict';

const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Konfigurasi upload berkas (off-chain file storage).
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

const reg = require('../controllers/registrationController');
const ver = require('../controllers/verificationController');
const cert = require('../controllers/certificateController');
const pub = require('../controllers/publicController');
const auth = require('../controllers/authController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// ---- Authentication ----
router.post('/auth/login', auth.login);
router.post('/auth/register', auth.register);

// ---- User & Admin Management ----
router.post('/users', verifyToken, authorizeRoles('admin'), pub.createUser);
router.get('/users', verifyToken, authorizeRoles('admin'), pub.listUsers);
router.get('/users/:id', verifyToken, pub.getUser);
router.put('/users/:id', verifyToken, pub.updateUser);
router.post('/users/:id/activate', verifyToken, authorizeRoles('admin'), pub.activateUser);
router.post('/users/:id/deactivate', verifyToken, authorizeRoles('admin'), pub.deactivateUser);
router.get('/transactions', verifyToken, authorizeRoles('admin'), pub.listTransactions);

// ---- Dashboard ----
router.get('/dashboard/stats', verifyToken, authorizeRoles('admin', 'validator_admin', 'validator_substantif', 'validator_final', 'peneliti'), pub.dashboardStats);

// ---- TAHAP 1: Registrasi (Peneliti/User Pengajuan) ----
router.post('/registrations', verifyToken, authorizeRoles('peneliti'), upload.fields([
    { name: 'formulir_bermaterai', maxCount: 1 },
    { name: 'surat_tugas', maxCount: 1 },
    { name: 'data_dukung', maxCount: 1 },
    { name: 'foto_karakteristik', maxCount: 1 }
]), reg.registerPlasma);
router.get('/registrations', verifyToken, authorizeRoles('peneliti', 'validator_admin', 'validator_substantif', 'validator_final', 'admin'), reg.listRegistrations);
router.get('/registrations/:id', verifyToken, authorizeRoles('peneliti', 'validator_admin', 'validator_substantif', 'validator_final', 'admin'), reg.getRegistration);
router.post('/registrations/:id/cancel', verifyToken, authorizeRoles('peneliti', 'admin'), reg.cancelRegistration);

// ---- TAHAP 2: Verifikasi Validator ----
router.get('/verifications/pending', verifyToken, authorizeRoles('validator_admin', 'validator_substantif', 'validator_final'), ver.listPending);
router.post('/registrations/:id/verify-admin', verifyToken, authorizeRoles('validator_admin'), ver.verifyAdmin);
router.post('/registrations/:id/verify-substantive', verifyToken, authorizeRoles('validator_substantif'), ver.verifySubstantive);

// ---- TAHAP 3: Penerbitan Sertifikat ----
router.post('/registrations/:id/issue-certificate', verifyToken, authorizeRoles('validator_final'), cert.issueCertificate);
router.get('/certificates', verifyToken, authorizeRoles('peneliti', 'validator_admin', 'validator_substantif', 'validator_final', 'admin'), cert.listCertificates);
router.get('/certificates/:certificateId/download', cert.downloadCertificate); // Tetap publik untuk verifikasi QR

// ---- TAHAP 4: Histori Ledger (Audit Trail) ----
router.get('/registrations/:id/history', verifyToken, authorizeRoles('peneliti', 'validator_admin', 'validator_substantif', 'validator_final', 'admin'), cert.getHistory);

// ---- TAHAP 5: Validasi Publik ----
router.post('/verify-public', upload.single('dokumen'), pub.verifyPublic);

module.exports = router;
