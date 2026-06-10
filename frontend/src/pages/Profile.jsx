import { useState, useEffect } from 'react';
import { PlasmaAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  admin: 'Super Admin',
  validator_admin: 'Verifikator Administrasi',
  validator_substantif: 'Pemeriksa Substantif',
  validator_final: 'Kepala Balai',
  peneliti: 'User Pengajuan',
};

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

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('about'); // about | security

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Primary states wired to DB
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: '',
    wallet_address: '',
    status_akun: '',
    npwp: '',
    no_ktp: '',
    jenis_pemohon: 'Instansi Pemerintah',
    nama_institusi: '',
    penanggung_jawab: '',
    provinsi: '',
    kabupaten_kota: '',
    kecamatan: '',
    kelurahan: '',
    alamat: '',
    kode_pos: '',
  });

  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user?.user_id) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    setFetchLoading(true);
    try {
      const data = await PlasmaAPI.getUser(user.user_id);
      setFormState({
        name: data.name || '',
        email: data.email || '',
        username: data.username || '',
        password: '',
        role: data.role || '',
        wallet_address: data.wallet_address || '',
        status_akun: data.status_akun || '',
        npwp: data.npwp || '',
        no_ktp: data.no_ktp || '',
        jenis_pemohon: data.jenis_pemohon || 'Instansi Pemerintah',
        nama_institusi: data.nama_institusi || '',
        penanggung_jawab: data.penanggung_jawab || '',
        provinsi: data.provinsi || '',
        kabupaten_kota: data.kabupaten_kota || '',
        kecamatan: data.kecamatan || '',
        kelurahan: data.kelurahan || '',
        alamat: data.alamat || '',
        kode_pos: data.kode_pos || '',
      });
    } catch (err) {
      setError('Gagal memuat profil data Anda.');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (activeTab === 'security') {
      if (!formState.password || !confirmPassword) {
        setError('Silakan isi kata sandi baru dan konfirmasi kata sandi.');
        setLoading(false);
        return;
      }
      if (formState.password !== confirmPassword) {
        setError('Konfirmasi kata sandi tidak cocok.');
        setLoading(false);
        return;
      }
    }

    try {
      const payload = { ...formState };
      if (!payload.password) {
        delete payload.password;
      }

      delete payload.role;
      delete payload.status_akun;
      delete payload.wallet_address;

      await PlasmaAPI.updateUser(user.user_id, payload);
      setSuccess('Profil berhasil diperbarui!');

      const localUserData = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedLocalUser = {
        ...localUserData,
        name: payload.name,
        email: payload.email,
        username: payload.username,
      };
      localStorage.setItem('user', JSON.stringify(updatedLocalUser));

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memperbarui profil.');
    } finally {
      setLoading(false);
    }
  };

  const handleProvinsiChange = (e) => {
    const prov = e.target.value;
    setFormState((f) => ({
      ...f,
      provinsi: prov,
      kabupaten_kota: '',
      kecamatan: '',
      kelurahan: ''
    }));
  };

  const handleKabupatenChange = (e) => {
    const kab = e.target.value;
    setFormState((f) => ({
      ...f,
      kabupaten_kota: kab,
      kecamatan: '',
      kelurahan: ''
    }));
  };

  const handleKecamatanChange = (e) => {
    const kec = e.target.value;
    setFormState((f) => ({
      ...f,
      kecamatan: kec,
      kelurahan: ''
    }));
  };

  const handleKelurahanChange = (e) => {
    setFormState((f) => ({
      ...f,
      kelurahan: e.target.value
    }));
  };

  const formatNPWP = (value) => {
    const clean = value.replace(/\D/g, '').substring(0, 15);
    let formatted = '';
    if (clean.length > 0) formatted += clean.substring(0, 2);
    if (clean.length > 2) formatted += '.' + clean.substring(2, 5);
    if (clean.length > 5) formatted += '.' + clean.substring(5, 8);
    if (clean.length > 8) formatted += '.' + clean.substring(8, 9);
    if (clean.length > 9) formatted += '-' + clean.substring(9, 12);
    if (clean.length > 12) formatted += '.' + clean.substring(12, 15);
    return formatted;
  };

  const handleNPWPChange = (e) => {
    const formatted = formatNPWP(e.target.value);
    setFormState({ ...formState, npwp: formatted });
  };

  const handleFormField = (k) => (e) => setFormState({ ...formState, [k]: e.target.value });

  if (fetchLoading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Memuat profil...</div>;
  }

  const initialLetter = formState.name ? formState.name.charAt(0).toUpperCase() : '?';

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', margin: '-24px -24px 0 -24px', paddingBottom: '40px' }}>

      {/* 1. TOP BANNER (Adjusted to match the login page background) */}
      <div style={{
        height: '200px',
        background: "linear-gradient(135deg, rgba(20, 64, 31, 0.85) 0%, rgba(12, 32, 16, 0.95) 100%), url('/background.png') no-repeat center center / cover",
        position: 'relative'
      }}>
        {/* Overlay subtle shadow */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)'
        }} />
      </div>

      {/* 2. PROFILE CONTAINER */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: '24px',
        marginTop: '-70px',
        position: 'relative',
        zIndex: 2
      }}>

        {/* LEFT CARD (PROFILE SUMMARY) */}
        <div className="card" style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid #f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          height: 'fit-content'
        }}>
          {/* Avatar Container */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <div style={{
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              background: 'var(--gold-soft)',
              border: '4px solid #fff',
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '42px',
              fontWeight: 700,
              color: 'var(--forest)'
            }}>
              {initialLetter}
            </div>
            {/* Camera Overlay Icon */}
            <div style={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              background: '#fff',
              border: '1px solid #cbd5e1',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }} title="Ubah foto profil">
              📷
            </div>
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>
            {formState.name}
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0', fontFamily: 'monospace' }}>
            {formState.email}
          </p>

          {/* Dotted border divider */}
          <div style={{ width: '100%', borderTop: '1px dotted #cbd5e1', margin: '8px 0 16px 0' }} />

          {/* Badges */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <span className="badge" style={{ background: 'var(--forest-2)', color: '#fff', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
              {ROLE_LABELS[formState.role] || formState.role}
            </span>
            <span className="badge" style={{ background: '#3b82f6', color: '#fff', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
              {formState.status_akun || 'AKTIF'}
            </span>
          </div>

          {/* Sub tags */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
            <span style={{ background: 'var(--leaf-soft)', color: 'var(--forest-2)', fontSize: '10.5px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
              {formState.jenis_pemohon || 'Perorangan'}
            </span>
            {formState.nama_institusi && (
              <span style={{ background: '#eff6ff', color: '#1e40af', fontSize: '10.5px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                {formState.nama_institusi}
              </span>
            )}
          </div>

          {/* Stats indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '12.5px',
            color: '#475569',
            background: 'var(--leaf-soft)',
            padding: '8px 16px',
            borderRadius: '8px',
            width: '100%',
            justifyContent: 'center',
            marginBottom: 20,
            border: '1px solid var(--line)'
          }}>
            <span>⛓️</span>
            <strong style={{ color: 'var(--forest-2)' }}>Dompet Blockchain Terhubung</strong>
          </div>

          {/* Info Details List */}
          <div style={{ width: '100%', textAlign: 'left', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: 12, color: '#475569' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>👤</span>
              <span style={{ wordBreak: 'break-all' }}>Username: <strong>@{formState.username || 'n/a'}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>🔑</span>
              <span style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '11.5px' }}>
                Wallet: <strong>{formState.wallet_address ? `${formState.wallet_address.substring(0, 14)}...` : 'n/a'}</strong>
              </span>
            </div>
          </div>

        </div>

        {/* RIGHT CARD (FORM PROFILE DETAILS WITH EXACT ORIGINAL FIELDS) */}
        <div className="card" style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid #f1f5f9',
          height: 'fit-content'
        }}>
          {/* TABS HEADER */}
          <div style={{
            display: 'flex',
            gap: 24,
            borderBottom: '1px solid #e2e8f0',
            marginBottom: 28,
            paddingBottom: '2px'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('about')}
              style={{
                background: 'none',
                border: 'none',
                padding: '0 0 10px 0',
                fontSize: '14.5px',
                fontWeight: 600,
                color: activeTab === 'about' ? '#f97316' : '#64748b',
                borderBottom: activeTab === 'about' ? '3px solid #f97316' : '3px solid transparent',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s'
              }}
            >
              Profil Pengguna
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              style={{
                background: 'none',
                border: 'none',
                padding: '0 0 10px 0',
                fontSize: '14.5px',
                fontWeight: 600,
                color: activeTab === 'security' ? '#f97316' : '#64748b',
                borderBottom: activeTab === 'security' ? '3px solid #f97316' : '3px solid transparent',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s'
              }}
            >
              Keamanan Sandi
            </button>
          </div>

          {error && <div className="toast err" style={{ marginBottom: 20 }}>{error}</div>}
          {success && <div className="toast ok" style={{ marginBottom: 20 }}>{success} (Halaman memuat ulang...)</div>}

          {/* ABOUT TAB VIEW (Original Indonesian Fields) */}
          {activeTab === 'about' && (
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* SECTION I: IDENTITAS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h4 style={{ margin: 0, color: 'var(--forest)', fontSize: '14px', borderBottom: '1px solid var(--line)', paddingBottom: 6 }}>
                  I. Identitas Diri Pemohon
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Nama Lengkap (Penanggung Jawab) *</label>
                    <input
                      type="text"
                      value={formState.name}
                      onChange={handleFormField('name')}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Alamat Email *</label>
                    <input
                      type="email"
                      value={formState.email}
                      onChange={handleFormField('email')}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Username Login *</label>
                    <input
                      type="text"
                      value={formState.username}
                      onChange={handleFormField('username')}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>No. KTP Pemohon (NIK) *</label>
                    <input
                      type="text"
                      value={formState.no_ktp}
                      onChange={handleFormField('no_ktp')}
                      required
                      maxLength={16}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>NPWP Pemohon</label>
                    <input
                      type="text"
                      value={formState.npwp}
                      onChange={handleNPWPChange}
                      placeholder="00.000.000.0-000.000"
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Jenis Pemohon *</label>
                    <select
                      value={formState.jenis_pemohon}
                      onChange={handleFormField('jenis_pemohon')}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 11, border: '1px solid var(--line)', height: '46px', background: '#fbfdfa', fontSize: '14.5px' }}
                      required
                    >
                      <option value="Instansi Pemerintah">Instansi Pemerintah</option>
                      <option value="Perguruan Tinggi">Perguruan Tinggi</option>
                      <option value="Perorangan">Perorangan</option>
                      <option value="Badan Usaha Berbadan Hukum">Badan Usaha Berbadan Hukum</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Nama Perusahaan / Institusi</label>
                    <input
                      type="text"
                      value={formState.nama_institusi}
                      onChange={handleFormField('nama_institusi')}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Penanggung Jawab Organisasi</label>
                    <input
                      type="text"
                      value={formState.penanggung_jawab}
                      onChange={handleFormField('penanggung_jawab')}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION II: ALAMAT DOMISILI */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h4 style={{ margin: 0, color: 'var(--forest)', fontSize: '14px', borderBottom: '1px solid var(--line)', paddingBottom: 6 }}>
                  II. Domisili & Wilayah
                </h4>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Alamat Lengkap (Domisili/KTP) *</label>
                  <textarea
                    value={formState.alamat}
                    onChange={handleFormField('alamat')}
                    required
                  />
                </div>

                {/* Left/Right structural layout replicating Solaris image */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {/* Left structural inputs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Provinsi *</label>
                      <select
                        value={formState.provinsi}
                        onChange={handleProvinsiChange}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 11, border: '1px solid var(--line)', height: '46px', background: '#fbfdfa', fontSize: '14.5px' }}
                        required
                      >
                        <option value="">-- Pilih Provinsi --</option>
                        {Object.keys(REGION_DATA).map((prov) => (
                          <option key={prov} value={prov}>{prov}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Kelurahan / Desa *</label>
                      <select
                        value={formState.kelurahan}
                        onChange={handleKelurahanChange}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 11, border: '1px solid var(--line)', height: '46px', background: '#fbfdfa', fontSize: '14.5px' }}
                        required
                        disabled={!formState.kecamatan}
                      >
                        <option value="">-- Pilih Kelurahan --</option>
                        {formState.provinsi && formState.kabupaten_kota && formState.kecamatan && REGION_DATA[formState.provinsi][formState.kabupaten_kota][formState.kecamatan].map((kel) => (
                          <option key={kel} value={kel}>{kel}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Right structural inputs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Kabupaten / Kota *</label>
                      <select
                        value={formState.kabupaten_kota}
                        onChange={handleKabupatenChange}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 11, border: '1px solid var(--line)', height: '46px', background: '#fbfdfa', fontSize: '14.5px' }}
                        required
                        disabled={!formState.provinsi}
                      >
                        <option value="">-- Pilih Kabupaten/Kota --</option>
                        {formState.provinsi && Object.keys(REGION_DATA[formState.provinsi]).map((kab) => (
                          <option key={kab} value={kab}>{kab}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Kecamatan *</label>
                      <select
                        value={formState.kecamatan}
                        onChange={handleKecamatanChange}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 11, border: '1px solid var(--line)', height: '46px', background: '#fbfdfa', fontSize: '14.5px' }}
                        required
                        disabled={!formState.kabupaten_kota}
                      >
                        <option value="">-- Pilih Kecamatan --</option>
                        {formState.provinsi && formState.kabupaten_kota && Object.keys(REGION_DATA[formState.provinsi][formState.kabupaten_kota]).map((kec) => (
                          <option key={kec} value={kec}>{kec}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Kode Pos *</label>
                      <input
                        type="text"
                        value={formState.kode_pos}
                        onChange={handleFormField('kode_pos')}
                        placeholder="Masukkan kode pos"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: '12px 24px',
                  fontSize: '15px',
                  fontWeight: 600,
                  borderRadius: 11,
                  marginTop: 8,
                  alignSelf: 'flex-start'
                }}
                disabled={loading}
              >
                {loading ? 'Menyimpan...' : 'Simpan Profil'}
              </button>

            </form>
          )}

          {/* SECURITY TAB VIEW */}
          {activeTab === 'security' && (
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--forest)', margin: '0 0 4px 0' }}>
                  Ubah Kata Sandi Akun
                </h3>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                  Silakan masukkan kata sandi baru Anda dan lakukan konfirmasi di bawah ini.
                </p>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>Kata Sandi Baru *</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formState.password}
                    onChange={handleFormField('password')}
                    placeholder="Masukkan sandi baru"
                    required
                    style={{ width: '100%', padding: '12px 40px 12px 14px', borderRadius: 11, border: '1px solid var(--line)', background: '#fbfdfa' }}
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
                <label>Konfirmasi Kata Sandi Baru *</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi sandi baru Anda"
                    required
                    style={{ width: '100%', padding: '12px 40px 12px 14px', borderRadius: 11, border: '1px solid var(--line)', background: '#fbfdfa' }}
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

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: '12px 24px',
                  fontSize: '15px',
                  fontWeight: 600,
                  borderRadius: 11,
                  marginTop: 8,
                  alignSelf: 'flex-start'
                }}
                disabled={loading}
              >
                {loading ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
              </button>

            </form>
          )}

        </div>

      </div>

    </div>
  );
}
