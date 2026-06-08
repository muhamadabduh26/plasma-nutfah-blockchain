# PlasmaChain — Sistem Verifikasi Sertifikat Digital Hak Paten Varietas Tanaman (Plasma Nutfah)

Implementasi *blockchain* berbasis **Hyperledger Fabric** untuk pengajuan, registrasi, validasi, penerbitan sertifikat, transfer kepemilikan, hingga validasi publik hak paten varietas tanaman (plasma nutfah).

Proyek ini terdiri atas tiga komponen utama yang merefleksikan arsitektur empat lapis pada rancangan:

1. **Chaincode (Smart Contract)** — logika bisnis yang berjalan di atas jaringan Hyperledger Fabric.
2. **Backend REST API** — lapisan aplikasi (Node.js/Express) yang menjembatani frontend dengan blockchain dan basis data *off-chain*.
3. **Frontend (React)** — antarmuka pengguna untuk peneliti/petani, validator, dan publik.

---

## 1. Pemetaan Rancangan ke Kode

| Komponen pada Rancangan (PPT) | Implementasi pada Kode |
|---|---|
| **User Layer** (Peneliti, Pemerintah, Lembaga Sertifikasi) | Frontend React + entitas `USER` (peran: `peneliti`, `validator`, `admin`) |
| **Application Layer** (Data Input, API Service, Hash Generation, Certificate Verification) | `backend/` — Express, `utils/hash.js` (SHA-256), controller verifikasi |
| **Blockchain Layer** (Smart Contract: Cert ID, Hash, Timestamp, Owner) | `chaincode/plasma-nutfah/` — `PlasmaNutfahContract` |
| **Off-Chain Storage** (Document Database + File Storage PDF) | `models/` (Sequelize/SQLite) + `backend/uploads/` |
| **ERD 6 entitas** | `backend/models/index.js` (dipetakan persis) |
| **Alur 5 tahap** | Controller `registration`, `verification`, `certificate`, `public` |
| **4 Event** (`PlasmaRegistered`, `CertificateIssued`, `OwnershipTransferred`, `CertificateVerified`) | `setEvent(...)` di dalam chaincode |
| **Hybrid storage** | Hash & ID sertifikat *on-chain*; data detail di DB; dokumen lengkap di *file storage* |

### Pemetaan Alur Kerja (Perancangan Prosedural)

| Tahap | Fungsi Chaincode | Endpoint Backend |
|---|---|---|
| 1. Registrasi Plasma Nutfah | `RegisterPlasma` | `POST /api/registrations` |
| 2. Verifikasi oleh Validator | `VerifyRegistration` | `POST /api/registrations/:id/verify` |
| 3. Penerbitan Sertifikat | `IssueCertificate` | `POST /api/registrations/:id/issue-certificate` |
| 4. Transfer Kepemilikan | `TransferOwnership` | `POST /api/registrations/:id/transfer` |
| 5. Validasi Publik | `VerifyCertificate` | `POST /api/verify-public` |

---

## 2. Struktur Folder

```
plasma-nutfah-blockchain/
├── chaincode/plasma-nutfah/      # Smart contract (Node.js chaincode)
│   ├── index.js
│   ├── package.json
│   └── lib/plasmaNutfahContract.js
├── backend/                      # REST API (Express + Sequelize + Fabric SDK)
│   ├── server.js
│   ├── enrollUser.js             # pendaftaran identitas ke wallet
│   ├── .env.example
│   ├── config/database.js
│   ├── fabric/fabricGateway.js   # koneksi ke Fabric (punya mode simulasi)
│   ├── models/index.js           # 6 entitas ERD
│   ├── controllers/
│   ├── routes/api.js
│   └── utils/hash.js             # generator hash SHA-256
├── frontend/                     # Antarmuka React (Vite)
│   └── src/{pages,components,api,styles}
└── scripts/deploy-chaincode.sh   # deploy chaincode ke test-network
```

---

## 3. Prasyarat

- **Node.js** v16+ (disarankan v18/v20) dan npm.
- **Docker** & **Docker Compose** (hanya untuk menjalankan jaringan Hyperledger Fabric).
- **fabric-samples** beserta *binary* Fabric (hanya untuk mode jaringan nyata).

> **Catatan instalasi `sqlite3`:** paket ini memuat modul *native*. Pada sebagian besar komputer, `npm install` otomatis mengunduh *binary* siap-pakai. Bila terjadi galat kompilasi, pasang *build tools* terlebih dahulu: pada Windows `npm install --global windows-build-tools`, pada macOS `xcode-select --install`, pada Linux `sudo apt-get install build-essential python3`.

---

## 4. Menjalankan Aplikasi — Mode Cepat (Simulasi)

Mode ini menjalankan **seluruh aplikasi tanpa perlu memasang jaringan Hyperledger Fabric**. Transaksi blockchain disimulasikan di memori (*mock ledger*) sehingga ideal untuk pengembangan dan demonstrasi antarmuka. Inilah cara tercepat untuk mencoba sistem.

### a. Backend

```bash
cd backend
cp .env.example .env          # FABRIC_MOCK=true sudah menjadi nilai bawaan
npm install
npm start                     # berjalan di http://localhost:4000
```

Saat pertama dijalankan, backend otomatis membuat basis data SQLite, tabel sesuai ERD, dan tiga user contoh (peneliti, validator, admin).

### b. Frontend

```bash
cd frontend
npm install
npm run dev                   # berjalan di http://localhost:5173
```

Buka `http://localhost:5173` di peramban. Anda dapat langsung mencoba alur penuh: **Registrasi → Validasi → Terbitkan Sertifikat → Verifikasi Publik → Transfer Kepemilikan**.

---

## 5. Menjalankan dengan Jaringan Hyperledger Fabric Nyata

### a. Pasang fabric-samples (sekali saja)

Letakkan `fabric-samples` **sejajar** dengan folder proyek ini:

```bash
# dari folder induk yang memuat plasma-nutfah-blockchain/
curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh | bash -s -- docker samples binary
```

Struktur akhir:

```
induk/
├── fabric-samples/
└── plasma-nutfah-blockchain/
```

### b. Deploy chaincode

```bash
cd plasma-nutfah-blockchain
bash scripts/deploy-chaincode.sh
```

Skrip ini menyalakan `test-network`, membuat channel `mychannel`, dan men-*deploy* chaincode `plasma-nutfah`.

### c. Daftarkan identitas aplikasi ke wallet

```bash
cd backend
node enrollUser.js            # membuat identitas 'appUser' di ./wallet
```

### d. Aktifkan mode nyata

Ubah berkas `backend/.env`:

```
FABRIC_MOCK=false
```

Lalu jalankan ulang `npm start`. Backend kini menyalurkan setiap transaksi ke jaringan Hyperledger Fabric yang sesungguhnya.

---

## 6. Referensi API

| Metode | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/dashboard/stats` | Statistik untuk dashboard |
| `GET` / `POST` | `/api/users` | Daftar / buat user |
| `POST` | `/api/registrations` | **Tahap 1** — registrasi (multipart, field `dokumen`) |
| `GET` | `/api/registrations` | Daftar registrasi |
| `GET` | `/api/registrations/:id` | Detail registrasi + data on-chain |
| `GET` | `/api/verifications/pending` | Registrasi menunggu validasi |
| `POST` | `/api/registrations/:id/verify` | **Tahap 2** — approve/reject |
| `POST` | `/api/registrations/:id/issue-certificate` | **Tahap 3** — terbitkan sertifikat |
| `GET` | `/api/certificates` | Daftar sertifikat |
| `GET` | `/api/certificates/:certId/download` | Unduh PDF sertifikat |
| `POST` | `/api/registrations/:id/transfer` | **Tahap 4** — transfer kepemilikan |
| `GET` | `/api/registrations/:id/history` | Riwayat (audit trail) dari ledger |
| `POST` | `/api/verify-public` | **Tahap 5** — validasi publik (multipart, field `dokumen`) |

---

## 7. Catatan Teknis

- **Mengapa hash, bukan dokumen, yang disimpan on-chain?** Sesuai prinsip *hybrid storage* pada rancangan: menyimpan data besar di blockchain mahal dan lambat. Cukup hash SHA-256 yang disimpan; keaslian dokumen tetap dapat dibuktikan dengan mencocokkan hash.
- **Event-Driven Architecture.** Setiap fungsi chaincode memancarkan *event* (`PlasmaRegistered`, dll.) yang dapat dilanggan oleh sistem lain (mis. SPBE/HKI) melalui *event listener* Fabric SDK, REST API, *message broker*, atau *webhook*.
- **Penyimpanan dokumen.** Saat ini dokumen disimpan pada *file storage* lokal (`backend/uploads/`). Field `file_path_ipfs` pada model `DOCUMENT` disiapkan agar mudah dialihkan ke IPFS bila diperlukan.
- **Chaincode dalam Node.js.** Dipilih karena selaras dengan ekosistem JavaScript backend. Bila diperlukan, logika yang sama dapat ditulis ulang dalam Go atau Java tanpa mengubah backend/frontend.

---

## 8. Lisensi & Atribusi

Dikembangkan sebagai implementasi rancangan **Kelompok 5** — Sistem Verifikasi Sertifikat Digital untuk Hak Paten Varietas Tanaman (Plasma Nutfah).
