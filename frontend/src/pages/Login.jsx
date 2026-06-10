import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlasmaAPI } from '../api/client';

const REGION_DATA = {
  'Jawa Barat': {
    'Kabupaten Bogor': {
      'Kecamatan Ciawi': ['Kelurahan Ciawi', 'Kelurahan Banjar Waru', 'Kelurahan Bendungan'],
      'Kecamatan Cisarua': ['Kelurahan Cisarua', 'Kelurahan Citeko', 'Kelurahan Kopo']
    },
    'Kota Bandung': {
      'Kecamatan Coblong': ['Kelurahan Dago', 'Kelurahan Sadang Serang', 'Kelurahan Sekeloa'],
      'Kecamatan Lembang': ['Kelurahan Lembang', 'Kelurahan Cikole', 'Kelurahan Jayagiri']
    }
  },
  'DKI Jakarta': {
    'Jakarta Selatan': {
      'Kecamatan Pasar Minggu': ['Kelurahan Pasar Minggu', 'Kelurahan Pejaten Barat', 'Kelurahan Pejaten Timur'],
      'Kecamatan Kebayoran Baru': ['Kelurahan Selong', 'Kelurahan Gunung', 'Kelurahan Kramat Pela']
    },
    'Jakarta Central': {
      'Kecamatan Menteng': ['Kelurahan Menteng', 'Kelurahan Pegangsaan', 'Kelurahan Cikini'],
      'Kecamatan Kemayoran': ['Kelurahan Kemayoran', 'Kelurahan Gunung Sahari Selatan', 'Kelurahan Harapan Mulya']
    }
  },
  'Jawa Tengah': {
    'Kota Semarang': {
      'Kecamatan Tembalang': ['Kelurahan Tembalang', 'Kelurahan Bulusan', 'Kelurahan Sambiroto'],
      'Kecamatan Banyumanik': ['Kelurahan Banyumanik', 'Kelurahan Pudakpayung', 'Kelurahan Srondol Wetan']
    },
    'Kota Surakarta': {
      'Kecamatan Laweyan': ['Kelurahan Laweyan', 'Kelurahan Penumping', 'Kelurahan Purwosari'],
      'Kecamatan Banjarsari': ['Kelurahan Banjarsari', 'Kelurahan Kadipiro', 'Kelurahan Nusukan']
    }
  }
};

export default function Login() {
  const [view, setView] = useState('menu'); // menu | login | verify | register

  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Verification States
  const [certId, setCertId] = useState('');
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState(null);

  // User Registration States (PVTPP 2020)
  const [regForm, setRegForm] = useState({
    npwp: '',
    no_ktp: '',
    username: '',
    password: '',
    jenis_pemohon: 'Instansi Pemerintah',
    nama_institusi: '',
    penanggung_jawab: '',
    email: '',
    provinsi: '',
    kabupaten_kota: '',
    kecamatan: '',
    kelurahan: '',
    alamat: '',
    kode_pos: '',
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [regError, setRegError] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const formatNPWP = (value) => {
    const clean = value.replace(/\D/g, '').substring(0, 15);
    let formatted = '';
    if (clean.length > 0) {
      formatted += clean.substring(0, 2);
    }
    if (clean.length > 2) {
      formatted += '.' + clean.substring(2, 5);
    }
    if (clean.length > 5) {
      formatted += '.' + clean.substring(5, 8);
    }
    if (clean.length > 8) {
      formatted += '.' + clean.substring(8, 9);
    }
    if (clean.length > 9) {
      formatted += '-' + clean.substring(9, 12);
    }
    if (clean.length > 12) {
      formatted += '.' + clean.substring(12, 15);
    }
    return formatted;
  };

  const handleNPWPChange = (e) => {
    const formatted = formatNPWP(e.target.value);
    setRegForm({ ...regForm, npwp: formatted });
  };

  const handleProvinsiChange = (e) => {
    const prov = e.target.value;
    setRegForm((f) => ({
      ...f,
      provinsi: prov,
      kabupaten_kota: '',
      kecamatan: '',
      kelurahan: ''
    }));
  };

  const handleKabupatenChange = (e) => {
    const kab = e.target.value;
    setRegForm((f) => ({
      ...f,
      kabupaten_kota: kab,
      kecamatan: '',
      kelurahan: ''
    }));
  };

  const handleKecamatanChange = (e) => {
    const kec = e.target.value;
    setRegForm((f) => ({
      ...f,
      kecamatan: kec,
      kelurahan: ''
    }));
  };

  const handleKelurahanChange = (e) => {
    setRegForm((f) => ({
      ...f,
      kelurahan: e.target.value
    }));
  };

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    setRegError('');
    if (regForm.password !== confirmPassword) {
      setRegError('Konfirmasi kata sandi tidak cocok. Silakan periksa kembali.');
      return;
    }
    setRegLoading(true);
    try {
      await PlasmaAPI.registerUser(regForm);
      setRegSuccess(true);
    } catch (err) {
      setRegError(err.response?.data?.error || 'Gagal mendaftar. Silakan periksa kembali data Anda.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleRegFormField = (k) => (e) => setRegForm({ ...regForm, [k]: e.target.value });

  const handleBackToMenu = () => {
    setView('menu');
    setError('');
    setVerifyError(null);
    setVerifyResult(null);
    setFile(null);
    setCertId('');
    setRegError('');
    setRegSuccess(false);
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowLoginPassword(false);
    setRegForm({
      npwp: '',
      no_ktp: '',
      username: '',
      password: '',
      jenis_pemohon: 'Instansi Pemerintah',
      nama_institusi: '',
      penanggung_jawab: '',
      email: '',
      provinsi: '',
      kabupaten_kota: '',
      kecamatan: '',
      kelurahan: '',
      alamat: '',
      kode_pos: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleEmail) => {
    setError('');
    setLoading(true);
    try {
      await login(roleEmail, 'password123');
      navigate('/dashboard');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!certId) {
      setVerifyError('Masukkan ID sertifikat atau ID Registrasi terlebih dahulu.');
      return;
    }
    setVerifyLoading(true);
    setVerifyError(null);
    setVerifyResult(null);
    try {
      const fd = new FormData();
      fd.append('certificate_id', certId);
      if (file) {
        fd.append('dokumen', file);
      }
      const res = await PlasmaAPI.verifyPublic(fd);
      setVerifyResult(res);
    } catch (err) {
      setVerifyError(err.response?.data?.error || 'Sertifikat tidak ditemukan atau tidak valid.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ maxWidth: view === 'register' ? '760px' : (view === 'verify' ? '580px' : '460px'), transition: 'max-width 0.3s ease-in-out' }}>

        {/* ================= HEADER ================= */}
        <div className="login-header">
          <span className="login-logo">🌾</span>
          <h1>PlasmaChain</h1>
          <p>Sistem Verifikasi Sertifikat Digital Plasma Nutfah</p>
        </div>

        {/* ================= VIEW 1: MENU UTAMA ================= */}
        {view === 'menu' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24, fontSize: 14.5, color: 'var(--muted)' }}>
              Silakan pilih layanan untuk melanjutkan ke sistem:
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              {/* Button Masuk Ke Sistem */}
              <div
                onClick={() => setView('login')}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 16,
                  padding: '20px 18px',
                  background: '#fbfdfa',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
                className="menu-cta-card"
              >
                <div style={{ fontSize: 32 }}>🔑</div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--forest)', fontSize: 16, marginBottom: 2 }}>Masuk ke Sistem</div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.3 }}>
                    Login untuk peneliti, verifikator balai, dan administrator.
                  </div>
                </div>
              </div>

              {/* Button Registrasi Akun Baru */}
              <div
                onClick={() => setView('register')}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 16,
                  padding: '20px 18px',
                  background: '#fbfdfa',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
                className="menu-cta-card"
              >
                <div style={{ fontSize: 32 }}>📝</div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--forest)', fontSize: 16, marginBottom: 2 }}>Registrasi Akun Baru</div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.3 }}>
                    Daftar akun pemohon varietas lokal atau hasil pemuliaan (PVTPP).
                  </div>
                </div>
              </div>

              {/* Button Verifikasi Publik */}
              <div
                onClick={() => setView('verify')}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 16,
                  padding: '20px 18px',
                  background: '#fbfdfa',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
                className="menu-cta-card"
              >
                <div style={{ fontSize: 32 }}>🔍</div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--forest)', fontSize: 16, marginBottom: 2 }}>Verifikasi Sertifikat</div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.3 }}>
                    Pindai QR atau unggah berkas sertifikat untuk validasi keaslian.
                  </div>
                </div>
              </div>
            </div>

            {/* Custom hover styles using inline CSS hack since we want beautiful styling */}
            <style>{`
              .menu-cta-card:hover {
                transform: translateY(-3px);
                box-shadow: 0 6px 16px rgba(20,64,31,0.08);
                border-color: var(--leaf) !important;
                background: #fff !important;
              }
            `}</style>
          </div>
        )}

        {/* ================= VIEW 2: FORM LOGIN ================= */}
        {view === 'login' && (
          <div>
            <div style={{ marginBottom: 18 }}>
              <button onClick={handleBackToMenu} className="btn-link" style={{ fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', color: 'var(--forest)', fontWeight: 500 }}>
                ← Kembali ke Pilihan Layanan
              </button>
            </div>

            {error && <div className="error-alert">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label>Username atau Alamat Email</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Username atau email Anda"
                  required
                />
              </div>

              <div className="form-group">
                <label>Kata Sandi</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ paddingRight: '40px', width: '100%' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '4px',
                      color: 'var(--muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      outline: 'none'
                    }}
                  >
                    {showLoginPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Menghubungkan...' : 'Masuk ke Sistem'}
              </button>
            </form>

            {/* <div className="demo-divider">
              <span>Mode Demo: Pilih Aktor</span>
            </div>

            <div className="demo-buttons">
              <button
                onClick={() => handleQuickLogin('rahmi@balai.go.id')}
                className="btn btn-secondary demo-btn"
                style={{ width: '100%', marginBottom: 6, display: 'block', padding: '8px 12px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, background: '#f9fafb', cursor: 'pointer' }}
                disabled={loading}
              >
                🌱 Peneliti / Pengaju
              </button>
              <button
                onClick={() => handleQuickLogin('admin_pvt@pertanian.go.id')}
                className="btn btn-secondary demo-btn"
                style={{ width: '100%', marginBottom: 6, display: 'block', padding: '8px 12px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, background: '#f9fafb', cursor: 'pointer' }}
                disabled={loading}
              >
                ✓ Verifikator Administrasi
              </button>
              <button
                onClick={() => handleQuickLogin('ahli_pvt@pertanian.go.id')}
                className="btn btn-secondary demo-btn"
                style={{ width: '100%', marginBottom: 6, display: 'block', padding: '8px 12px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, background: '#f9fafb', cursor: 'pointer' }}
                disabled={loading}
              >
                🔍 Pemeriksa Substantif
              </button>
              <button
                onClick={() => handleQuickLogin('kepala_pvt@pertanian.go.id')}
                className="btn btn-secondary demo-btn"
                style={{ width: '100%', marginBottom: 6, display: 'block', padding: '8px 12px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, background: '#f9fafb', cursor: 'pointer' }}
                disabled={loading}
              >
                📜 Kepala Balai (Final)
              </button>
              <button
                onClick={() => handleQuickLogin('admin@plasma.go.id')}
                className="btn btn-secondary demo-btn"
                style={{ width: '100%', display: 'block', padding: '8px 12px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, background: '#f9fafb', cursor: 'pointer' }}
                disabled={loading}
              >
                🛡️ Super Admin
              </button>
            </div> */}
          </div>
        )}

        {/* ================= VIEW 3: FORM VERIFIKASI SERTIFIKAT ================= */}
        {view === 'verify' && (
          <div>
            <div style={{ marginBottom: 18 }}>
              <button onClick={handleBackToMenu} className="btn-link" style={{ fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', color: 'var(--forest)', fontWeight: 500 }}>
                ← Kembali ke Pilihan Layanan
              </button>
            </div>

            {verifyError && <div className="toast err" style={{ marginBottom: 16 }}>{verifyError}</div>}

            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label>ID Sertifikat / ID Registrasi</label>
                <input
                  value={certId}
                  onChange={(e) => setCertId(e.target.value)}
                  placeholder="mis. CERT-0001 atau REG-0001"
                />
              </div>

              <div>
                <label>Unggah Berkas Sertifikat (opsional — untuk mencocokkan hash)</label>
                <div
                  className={'dropzone' + (drag ? ' drag' : '')}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDrag(true);
                  }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={onDrop}
                  onClick={() => document.getElementById('verifyFileInput').click()}
                  style={{ padding: '24px 16px', borderRadius: 12 }}
                >
                  <div className="big" style={{ fontSize: 28, marginBottom: 4 }}>📄</div>
                  {file ? (
                    <strong style={{ fontSize: 12.5 }}>{file.name}</strong>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Tarik & letakkan berkas PDF sertifikat, atau klik untuk memilih</span>
                  )}
                  <input id="verifyFileInput" type="file" hidden onChange={(e) => setFile(e.target.files[0])} />
                </div>
              </div>

              <button className="btn btn-primary btn-block" onClick={handleVerify} disabled={verifyLoading}>
                {verifyLoading ? 'Memverifikasi…' : '⛓ Verifikasi ke Blockchain'}
              </button>
            </div>

            {/* HASIL VERIFIKASI */}
            {verifyResult && (
              <div className={'verify-box ' + (verifyResult.valid ? 'ok' : 'bad')} style={{ marginTop: 18, padding: 18 }}>
                <div className="icon" style={{ fontSize: 36 }}>{verifyResult.valid ? '✅' : '⚠️'}</div>
                <h2 style={{ fontSize: 18, margin: '6px 0' }}>{verifyResult.valid ? 'Sertifikat Asli' : 'Perlu Perhatian'}</h2>
                <p className="muted" style={{ fontSize: 12.5 }}>{verifyResult.pesan}</p>
                {verifyResult.data && (
                  <div style={{ textAlign: 'left', marginTop: 12, fontSize: 13, lineHeight: 1.7, background: 'rgba(255,255,255,0.7)', padding: 12, borderRadius: 8 }}>
                    <div><strong>Varietas:</strong> {verifyResult.data.namaVarietas}</div>
                    <div><strong>ID Registrasi:</strong> <span className="hash" style={{ fontSize: 11 }}>{verifyResult.data.id}</span></div>
                    <div><strong>ID Sertifikat:</strong> <span className="hash" style={{ fontSize: 11 }}>{verifyResult.data.certificateId || '-'}</span></div>
                    <div><strong>Pemilik Paten:</strong> {verifyResult.data.ownerName}</div>
                    <div><strong>Status Aset:</strong> <span className={`badge ${verifyResult.data.status}`} style={{ fontSize: 10, padding: '2px 8px' }}>{verifyResult.data.status}</span></div>
                    <div><strong>Waktu Verifikasi:</strong> {new Date(verifyResult.data.verifiedAt).toLocaleString('id-ID')}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 4: FORM REGISTRASI USER ================= */}
        {view === 'register' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <button onClick={handleBackToMenu} className="btn-link" style={{ fontSize: 13.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', color: 'var(--forest)', fontWeight: 600 }}>
                ← Kembali ke Pilihan Layanan
              </button>
            </div>

            {regError && <div className="toast err" style={{ marginBottom: 20 }}>{regError}</div>}

            {!regSuccess ? (
              <form onSubmit={handleRegisterUser} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', color: 'var(--forest)', fontSize: '20px', fontWeight: 700 }}>
                    Registrasi Pengguna Baru
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                    Lengkapi data pemohon di bawah ini untuk pendaftaran akun layanan PVTPP.
                  </p>
                </div>

                {/* SECTION 1: PROFIL & IDENTITAS PEMOHON */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <h4 style={{ margin: '0 0 4px 0', color: 'var(--forest)', fontSize: '14.5px', fontWeight: 600, borderBottom: '1.5px solid var(--line)', paddingBottom: 6 }}>
                    I. Profil & Identitas Pemohon
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 500, fontSize: '13px', marginBottom: 6, display: 'block' }}>NPWP Pemohon *</label>
                      <input
                        type="text"
                        value={regForm.npwp}
                        onChange={handleNPWPChange}
                        placeholder="00.000.000.0-000.000"
                        required
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 500, fontSize: '13px', marginBottom: 6, display: 'block' }}>No. KTP Pemohon (NIK) *</label>
                      <input
                        type="text"
                        value={regForm.no_ktp}
                        onChange={handleRegFormField('no_ktp')}
                        placeholder="16-digit NIK KTP"
                        maxLength={16}
                        required
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 500, fontSize: '13px', marginBottom: 6, display: 'block' }}>Jenis Pemohon *</label>
                      <select
                        value={regForm.jenis_pemohon}
                        onChange={handleRegFormField('jenis_pemohon')}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', height: '42px', background: '#fff', fontSize: '13.5px' }}
                        required
                      >
                        <option value="Instansi Pemerintah">Instansi Pemerintah</option>
                        <option value="Perguruan Tinggi">Perguruan Tinggi</option>
                        <option value="Perorangan">Perorangan</option>
                        <option value="Badan Usaha Berbadan Hukum">Badan Usaha Berbadan Hukum</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 500, fontSize: '13px', marginBottom: 6, display: 'block' }}>Nama Perusahaan / Institusi *</label>
                      <input
                        type="text"
                        value={regForm.nama_institusi}
                        onChange={handleRegFormField('nama_institusi')}
                        placeholder="mis. PT Benih Unggul Nusantara"
                        required
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 500, fontSize: '13px', marginBottom: 6, display: 'block' }}>Nama Penanggung Jawab *</label>
                      <input
                        type="text"
                        value={regForm.penanggung_jawab}
                        onChange={handleRegFormField('penanggung_jawab')}
                        placeholder="mis. Dr. Ir. Budi Santoso"
                        required
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 500, fontSize: '13px', marginBottom: 6, display: 'block' }}>Alamat Email Aktif *</label>
                      <input
                        type="email"
                        value={regForm.email}
                        onChange={handleRegFormField('email')}
                        placeholder="nama@perusahaan.com"
                        required
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: ALAMAT DOMISILI */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <h4 style={{ margin: '0 0 4px 0', color: 'var(--forest)', fontSize: '14.5px', fontWeight: 600, borderBottom: '1.5px solid var(--line)', paddingBottom: 6 }}>
                    II. Alamat Lengkap & Domisili
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 500, fontSize: '13px', marginBottom: 6, display: 'block' }}>Provinsi *</label>
                      <select
                        value={regForm.provinsi}
                        onChange={handleProvinsiChange}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', height: '42px', background: '#fff', fontSize: '13.5px' }}
                        required
                      >
                        <option value="">-- Pilih Provinsi --</option>
                        {Object.keys(REGION_DATA).map((prov) => (
                          <option key={prov} value={prov}>{prov}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 500, fontSize: '13px', marginBottom: 6, display: 'block' }}>Kabupaten / Kota *</label>
                      <select
                        value={regForm.kabupaten_kota}
                        onChange={handleKabupatenChange}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', height: '42px', background: '#fff', fontSize: '13.5px' }}
                        required
                        disabled={!regForm.provinsi}
                      >
                        <option value="">-- Pilih Kabupaten/Kota --</option>
                        {regForm.provinsi && Object.keys(REGION_DATA[regForm.provinsi]).map((kab) => (
                          <option key={kab} value={kab}>{kab}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 500, fontSize: '13px', marginBottom: 6, display: 'block' }}>Kecamatan *</label>
                      <select
                        value={regForm.kecamatan}
                        onChange={handleKecamatanChange}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', height: '42px', background: '#fff', fontSize: '13.5px' }}
                        required
                        disabled={!regForm.kabupaten_kota}
                      >
                        <option value="">-- Pilih Kecamatan --</option>
                        {regForm.provinsi && regForm.kabupaten_kota && Object.keys(REGION_DATA[regForm.provinsi][regForm.kabupaten_kota]).map((kec) => (
                          <option key={kec} value={kec}>{kec}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 500, fontSize: '13px', marginBottom: 6, display: 'block' }}>Kelurahan *</label>
                      <select
                        value={regForm.kelurahan}
                        onChange={handleKelurahanChange}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', height: '42px', background: '#fff', fontSize: '13.5px' }}
                        required
                        disabled={!regForm.kecamatan}
                      >
                        <option value="">-- Pilih Kelurahan --</option>
                        {regForm.provinsi && regForm.kabupaten_kota && regForm.kecamatan && REGION_DATA[regForm.provinsi][regForm.kabupaten_kota][regForm.kecamatan].map((kel) => (
                          <option key={kel} value={kel}>{kel}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 500, fontSize: '13px', marginBottom: 6, display: 'block' }}>Alamat Lengkap (KTP/Domisili) *</label>
                      <input
                        type="text"
                        value={regForm.alamat}
                        onChange={handleRegFormField('alamat')}
                        placeholder="Jl. Pembangunan No. 12"
                        required
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 500, fontSize: '13px', marginBottom: 6, display: 'block' }}>Kode Pos *</label>
                      <input
                        type="text"
                        value={regForm.kode_pos}
                        onChange={handleRegFormField('kode_pos')}
                        placeholder="12345"
                        required
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: INFORMASI LOGIN AKUN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ borderTop: '1.5px solid var(--line)', paddingTop: 16, marginBottom: 4 }}>
                    <h4 style={{ margin: 0, color: 'var(--forest)', fontSize: '14.5px', fontWeight: 600 }}>
                      Informasi Login Akun
                    </h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                      Gunakan informasi ini untuk masuk ke dalam dasbor sistem setelah akun Anda diaktifkan.
                    </p>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 500, fontSize: '13px', marginBottom: 6, display: 'block' }}>Pilihan Username Login *</label>
                    <input
                      type="text"
                      value={regForm.username}
                      onChange={handleRegFormField('username')}
                      placeholder="Masukkan username unik"
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 500, fontSize: '13px', marginBottom: 6, display: 'block' }}>Kata Sandi *</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={regForm.password}
                          onChange={handleRegFormField('password')}
                          placeholder="Masukkan password kuat"
                          required
                          style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: 8 }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: '4px',
                            color: 'var(--muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            outline: 'none'
                          }}
                        >
                          {showPassword ? '👁️' : '🙈'}
                        </button>
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 500, fontSize: '13px', marginBottom: 6, display: 'block' }}>Konfirmasi Kata Sandi *</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Ulangi password Anda"
                          required
                          style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: 8 }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: '4px',
                            color: 'var(--muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            outline: 'none'
                          }}
                        >
                          {showConfirmPassword ? '👁️' : '🙈'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 12, padding: '12px', fontSize: '15px', fontWeight: 600, borderRadius: 8 }} disabled={regLoading}>
                  {regLoading ? 'Mendaftarkan Akun...' : 'Kirim Pendaftaran'}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 10px' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>⏳</div>
                <h2 style={{ color: 'var(--forest)', marginBottom: 8, fontSize: '22px', fontWeight: 700 }}>Registrasi Berhasil Dikirim!</h2>
                <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.6, marginBottom: 24 }}>
                  Pendaftaran akun baru Anda telah berhasil direkam dengan status <strong style={{ color: 'var(--forest)' }}>TIDAK AKTIF</strong>.
                </p>

                <div style={{ background: '#f8faf7', border: '1px solid var(--line)', borderRadius: 12, padding: 18, marginBottom: 24, textAlign: 'left', fontSize: '14px', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Username:</span> <strong style={{ fontFamily: 'monospace', fontSize: '14.5px' }}>{regForm.username}</strong>
                  </div>
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Email:</span> <strong style={{ fontFamily: 'monospace', fontSize: '14.5px' }}>{regForm.email}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--muted)' }}>Status Akun:</span> <span className="badge PENDING" style={{ fontSize: '11px', padding: '3px 10px', fontWeight: 600 }}>MENUNGGU AKTIVASI</span>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: 24, padding: '0 12px' }}>
                  Akun Anda memerlukan verifikasi dan persetujuan dari Administrator sebelum dapat masuk ke sistem. Silakan laporkan pendaftaran ini ke pengelola sistem.
                </div>

                <button
                  onClick={() => {
                    setEmail(regForm.username); // Pre-fill username
                    setPassword('');
                    setView('login');
                    setRegSuccess(false);
                  }}
                  className="btn btn-primary btn-block"
                  style={{ padding: '12px', borderRadius: 8, fontWeight: 600 }}
                >
                  Kembali ke Halaman Login
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
