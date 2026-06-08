import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlasmaAPI } from '../api/client';

export default function Login() {
  const [view, setView] = useState('menu'); // menu | login | verify
  
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

  const handleBackToMenu = () => {
    setView('menu');
    setError('');
    setVerifyError(null);
    setVerifyResult(null);
    setFile(null);
    setCertId('');
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ maxWidth: view === 'verify' ? '580px' : '460px', transition: 'max-width 0.3s ease-in-out' }}>
        
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
                <label>Alamat Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Kata Sandi</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Menghubungkan...' : 'Masuk ke Sistem'}
              </button>
            </form>

            <div className="demo-divider">
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
            </div>
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

      </div>
    </div>
  );
}
