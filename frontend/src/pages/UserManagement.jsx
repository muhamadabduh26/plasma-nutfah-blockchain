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

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { user: currentUser } = useAuth();

  // Modal States: null | 'create' | 'view' | 'edit'
  const [activeModal, setActiveModal] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form State
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'peneliti',
    wallet_address: '',
    status_akun: 'AKTIF',
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await PlasmaAPI.users();
      setUsers(data);
    } catch (e) {
      console.error(e);
      setError('Gagal memuat daftar pengguna.');
    }
  };

  const handleOpenCreate = () => {
    setFormState({
      name: '',
      email: '',
      username: '',
      password: '',
      role: 'peneliti',
      wallet_address: '',
      status_akun: 'AKTIF',
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
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setActiveModal('create');
  };

  const handleOpenView = (user) => {
    setSelectedUser(user);
    setError('');
    setSuccess('');
    setActiveModal('view');
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setFormState({
      name: user.name || '',
      email: user.email || '',
      username: user.username || '',
      password: '', // default empty (do not change password unless typed)
      role: user.role || 'peneliti',
      wallet_address: user.wallet_address || '',
      status_akun: user.status_akun || 'AKTIF',
      npwp: user.npwp || '',
      no_ktp: user.no_ktp || '',
      jenis_pemohon: user.jenis_pemohon || 'Instansi Pemerintah',
      nama_institusi: user.nama_institusi || '',
      penanggung_jawab: user.penanggung_jawab || '',
      provinsi: user.provinsi || '',
      kabupaten_kota: user.kabupaten_kota || '',
      kecamatan: user.kecamatan || '',
      kelurahan: user.kelurahan || '',
      alamat: user.alamat || '',
      kode_pos: user.kode_pos || '',
    });
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setActiveModal('edit');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formState.password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formState,
        wallet_address: formState.wallet_address || '0x' + Math.random().toString(16).substr(2, 10).toUpperCase(),
      };
      await PlasmaAPI.createUser(payload);
      setSuccess('User baru berhasil dibuat!');
      setActiveModal(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal membuat user baru.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formState.password && formState.password !== confirmPassword) {
      setError('Konfirmasi kata sandi baru tidak cocok.');
      setLoading(false);
      return;
    }

    try {
      const payload = { ...formState };
      if (!payload.password) {
        delete payload.password; // Do not update password if left blank
      }
      await PlasmaAPI.updateUser(selectedUser.user_id, payload);
      setSuccess('Data user berhasil diperbarui!');
      setActiveModal(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memperbarui data user.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id, email) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await PlasmaAPI.activateUser(id);
      setSuccess(`Akun ${email} berhasil diaktivasi!`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengaktivasi pengguna.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id, email) => {
    if (window.confirm(`Apakah Anda yakin ingin menonaktifkan akun ${email}? Pengguna ini tidak akan dapat login ke dalam sistem.`)) {
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        await PlasmaAPI.deactivateUser(id);
        setSuccess(`Akun ${email} berhasil dinonaktifkan!`);
        fetchUsers();
      } catch (err) {
        setError(err.response?.data?.error || 'Gagal menonaktifkan pengguna.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Dropdown bertingkat handlers
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
    setFormState({ ...formState, npwp: formatted });
  };

  const handleFormField = (k) => (e) => setFormState({ ...formState, [k]: e.target.value });

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1>Manajemen User</h1>
          <p>Kelola akun pengguna sistem (Peneliti, Verifikator, dan Super Admin) serta alamat wallet blockchain mereka.</p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          ＋ Tambah User Baru
        </button>
      </div>

      {error && <div className="toast err" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="toast ok" style={{ marginBottom: 16 }}>{success}</div>}

      <div className="card" style={{ width: '100%', padding: '24px' }}>
        <h2 className="section-title" style={{ marginBottom: 18 }}>Daftar Pengguna Sistem</h2>
        
        {users.length === 0 ? (
          <div className="empty">Tidak ada data pengguna.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="user-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--line)' }}>
                  <th style={{ padding: '12px 8px' }}>Nama Lengkap</th>
                  <th style={{ padding: '12px 8px' }}>Email / Username</th>
                  <th style={{ padding: '12px 8px' }}>Peran (Role)</th>
                  <th style={{ padding: '12px 8px' }}>Wallet Address</th>
                  <th style={{ padding: '12px 8px' }}>Status Akun</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--forest)' }}>{u.name}</div>
                      {u.nama_institusi && <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{u.nama_institusi}</div>}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ fontSize: '13px' }}>{u.email}</div>
                      {u.username && <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace' }}>@{u.username}</div>}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className={`badge ${u.role === 'admin' ? 'REJECTED' : u.role.startsWith('validator') ? 'APPROVED' : 'CERTIFIED'}`} style={{ fontSize: '11px', padding: '2px 8px', fontWeight: 500 }}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <code className="hash" style={{ fontSize: '11.5px', background: '#f5f7f5', padding: '2px 6px', borderRadius: 4 }}>
                        {u.wallet_address || 'n/a'}
                      </code>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className={`badge ${u.status_akun === 'AKTIF' ? 'CERTIFIED' : 'PENDING'}`} style={{ fontSize: '11px', padding: '2px 8px', fontWeight: 600 }}>
                        {u.status_akun || 'AKTIF'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          onClick={() => handleOpenView(u)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '12px', background: '#f3f4f6', border: '1px solid #d1d5db', cursor: 'pointer', borderRadius: '6px' }}
                          title="Lihat Detail"
                        >
                          👁️ Detail
                        </button>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '12px', background: '#f3f4f6', border: '1px solid #d1d5db', cursor: 'pointer', borderRadius: '6px' }}
                          title="Ubah Data"
                        >
                          ✏️ Ubah
                        </button>
                        {u.status_akun === 'TIDAK_AKTIF' ? (
                          <button
                            onClick={() => handleActivate(u.user_id, u.email)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px' }}
                            disabled={loading}
                          >
                            ✓ Aktivasi
                          </button>
                        ) : (
                          currentUser?.user_id !== u.user_id && (
                            <button
                              onClick={() => handleDeactivate(u.user_id, u.email)}
                              className="btn btn-danger btn-sm"
                              style={{ padding: '4px 10px', fontSize: '12px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', cursor: 'pointer', borderRadius: '6px' }}
                              disabled={loading}
                            >
                              🚫 Nonaktifkan
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL DIALOGS ================= */}
      {activeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: '24px 28px',
            width: '100%',
            maxWidth: activeModal === 'view' || activeModal === 'edit' ? '760px' : '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
              <h2 style={{ margin: 0, color: 'var(--forest)', fontSize: 18, fontWeight: 700 }}>
                {activeModal === 'create' && 'Tambah User Baru'}
                {activeModal === 'view' && 'Detail Informasi User'}
                {activeModal === 'edit' && 'Ubah Informasi User'}
              </h2>
              <button 
                onClick={() => setActiveModal(null)} 
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none' }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            
            {/* VIEW MODAL (READ-ONLY) */}
            {activeModal === 'view' && selectedUser && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <h4 style={{ margin: '0 0 10px 0', color: 'var(--forest)', fontSize: '14px', borderBottom: '1px solid var(--line)', paddingBottom: 4 }}>I. Identitas & Informasi Akun</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, display: 'block' }}>NAMA LENGKAP</span>
                      <strong style={{ fontSize: '13.5px', color: 'var(--dark)' }}>{selectedUser.name || '-'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, display: 'block' }}>ALAMAT EMAIL</span>
                      <span style={{ fontSize: '13.5px' }}>{selectedUser.email || '-'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, display: 'block' }}>USERNAME</span>
                      <span style={{ fontSize: '13.5px', fontFamily: 'monospace' }}>@{selectedUser.username || '-'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, display: 'block' }}>HAK AKSES / ROLE</span>
                      <span className="badge APPROVED" style={{ fontSize: '11.5px', display: 'inline-block', marginTop: 2 }}>
                        {ROLE_LABELS[selectedUser.role] || selectedUser.role}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, display: 'block' }}>NO. KTP / NIK</span>
                      <span style={{ fontSize: '13.5px' }}>{selectedUser.no_ktp || '-'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, display: 'block' }}>NPWP PEMOHON</span>
                      <span style={{ fontSize: '13.5px' }}>{selectedUser.npwp || '-'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, display: 'block' }}>WALLET ADDRESS (FABRIC)</span>
                      <code className="hash" style={{ fontSize: '12px' }}>{selectedUser.wallet_address || 'n/a'}</code>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, display: 'block' }}>STATUS AKUN</span>
                      <span className={`badge ${selectedUser.status_akun === 'AKTIF' ? 'CERTIFIED' : 'PENDING'}`} style={{ fontSize: '11.5px', display: 'inline-block', marginTop: 2 }}>
                        {selectedUser.status_akun || 'AKTIF'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 10px 0', color: 'var(--forest)', fontSize: '14px', borderBottom: '1px solid var(--line)', paddingBottom: 4 }}>II. Profil Organisasi & Alamat</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, display: 'block' }}>JENIS PEMOHON</span>
                      <span style={{ fontSize: '13.5px' }}>{selectedUser.jenis_pemohon || '-'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, display: 'block' }}>NAMA PERUSAHAAN / INSTITUSI</span>
                      <span style={{ fontSize: '13.5px' }}>{selectedUser.nama_institusi || '-'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, display: 'block' }}>PENANGGUNG JAWAB</span>
                      <span style={{ fontSize: '13.5px' }}>{selectedUser.penanggung_jawab || '-'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, display: 'block' }}>PROVINSI</span>
                      <span style={{ fontSize: '13.5px' }}>{selectedUser.provinsi || '-'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, display: 'block' }}>KABUPATEN / KOTA</span>
                      <span style={{ fontSize: '13.5px' }}>{selectedUser.kabupaten_kota || '-'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, display: 'block' }}>KECAMATAN</span>
                      <span style={{ fontSize: '13.5px' }}>{selectedUser.kecamatan || '-'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, display: 'block' }}>KELURAHAN</span>
                      <span style={{ fontSize: '13.5px' }}>{selectedUser.kelurahan || '-'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, display: 'block' }}>KODE POS</span>
                      <span style={{ fontSize: '13.5px' }}>{selectedUser.kode_pos || '-'}</span>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: 12 }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, display: 'block' }}>ALAMAT LENGKAP</span>
                    <span style={{ fontSize: '13.5px', display: 'block', marginTop: 2, background: '#f9fafb', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--line)' }}>
                      {selectedUser.alamat || '-'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                  <button onClick={() => setActiveModal(null)} className="btn btn-secondary" style={{ padding: '8px 18px', borderRadius: 8 }}>
                    Tutup Detail
                  </button>
                </div>
              </div>
            )}

            {/* CREATE MODAL */}
            {activeModal === 'create' && (
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Nama Lengkap (Penanggung Jawab) *</label>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={handleFormField('name')}
                    placeholder="mis. Dr. Ir. Ahmad Subarjo"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Alamat Email *</label>
                    <input
                      type="email"
                      value={formState.email}
                      onChange={handleFormField('email')}
                      placeholder="ahmad@domain.com"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Username Login *</label>
                    <input
                      type="text"
                      value={formState.username}
                      onChange={handleFormField('username')}
                      placeholder="ahmad_subarjo"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Kata Sandi (Password) *</label>
                    <input
                      type="password"
                      value={formState.password}
                      onChange={handleFormField('password')}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Konfirmasi Kata Sandi *</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Peran / Hak Akses (Role) *</label>
                    <select 
                      value={formState.role} 
                      onChange={handleFormField('role')}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', height: '38px', background: '#fff' }}
                    >
                      <option value="peneliti">User Pengajuan (Peneliti)</option>
                      <option value="validator_admin">Verifikator Administrasi</option>
                      <option value="validator_substantif">Pemeriksa Substantif</option>
                      <option value="validator_final">Kepala Balai</option>
                      <option value="admin">Super Admin</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Wallet Address Blockchain (Opsional)</label>
                    <input
                      type="text"
                      value={formState.wallet_address}
                      onChange={handleFormField('wallet_address')}
                      placeholder="Kosongkan untuk auto-generate"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                  <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary" style={{ padding: '8px 18px', borderRadius: 8 }}>
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 18px', borderRadius: 8 }} disabled={loading}>
                    {loading ? 'Menyimpan...' : 'Simpan User'}
                  </button>
                </div>
              </form>
            )}

            {/* EDIT MODAL */}
            {activeModal === 'edit' && selectedUser && (
              <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Section 1: Profil Akun */}
                <div>
                  <h4 style={{ margin: '0 0 12px 0', color: 'var(--forest)', fontSize: '14px', borderBottom: '1px solid var(--line)', paddingBottom: 4 }}>I. Identitas & Informasi Akun</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12 }}>
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
                      <label>Wallet Address Blockchain *</label>
                      <input
                        type="text"
                        value={formState.wallet_address}
                        onChange={handleFormField('wallet_address')}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Peran / Hak Akses (Role) *</label>
                      <select 
                        value={formState.role} 
                        onChange={handleFormField('role')}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', height: '38px', background: '#fff' }}
                      >
                        <option value="peneliti">User Pengajuan (Peneliti)</option>
                        <option value="validator_admin">Verifikator Administrasi</option>
                        <option value="validator_substantif">Pemeriksa Substantif</option>
                        <option value="validator_final">Kepala Balai</option>
                        <option value="admin">Super Admin</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Status Keaktifan Akun *</label>
                      <select 
                        value={formState.status_akun} 
                        onChange={handleFormField('status_akun')}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', height: '38px', background: '#fff' }}
                      >
                        <option value="AKTIF">AKTIF</option>
                        <option value="TIDAK_AKTIF">TIDAK AKTIF</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>No. KTP Pemohon (NIK)</label>
                      <input
                        type="text"
                        value={formState.no_ktp}
                        onChange={handleFormField('no_ktp')}
                        maxLength={16}
                        placeholder="16-digit NIK"
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>NPWP Pemohon</label>
                      <input
                        type="text"
                        value={formState.npwp}
                        onChange={handleNPWPChange}
                        placeholder="00.000.000.0-000.000"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Profil PVTPP & Domisili */}
                <div>
                  <h4 style={{ margin: '0 0 12px 0', color: 'var(--forest)', fontSize: '14px', borderBottom: '1px solid var(--line)', paddingBottom: 4 }}>II. Profil Organisasi & Domisili</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Jenis Pemohon</label>
                      <select 
                        value={formState.jenis_pemohon} 
                        onChange={handleFormField('jenis_pemohon')}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', height: '38px', background: '#fff' }}
                      >
                        <option value="Instansi Pemerintah">Instansi Pemerintah</option>
                        <option value="Perguruan Tinggi">Perguruan Tinggi</option>
                        <option value="Perorangan">Perorangan</option>
                        <option value="Badan Usaha Berbadan Hukum">Badan Usaha Berbadan Hukum</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Nama Perusahaan / Institusi</label>
                      <input
                        type="text"
                        value={formState.nama_institusi}
                        onChange={handleFormField('nama_institusi')}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Penanggung Jawab Organisasi</label>
                      <input
                        type="text"
                        value={formState.penanggung_jawab}
                        onChange={handleFormField('penanggung_jawab')}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Provinsi</label>
                      <select
                        value={formState.provinsi}
                        onChange={handleProvinsiChange}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', height: '38px', background: '#fff' }}
                      >
                        <option value="">-- Pilih Provinsi --</option>
                        {Object.keys(REGION_DATA).map((prov) => (
                          <option key={prov} value={prov}>{prov}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Kabupaten / Kota</label>
                      <select
                        value={formState.kabupaten_kota}
                        onChange={handleKabupatenChange}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', height: '38px', background: '#fff' }}
                        disabled={!formState.provinsi}
                      >
                        <option value="">-- Pilih Kabupaten/Kota --</option>
                        {formState.provinsi && Object.keys(REGION_DATA[formState.provinsi]).map((kab) => (
                          <option key={kab} value={kab}>{kab}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Kecamatan</label>
                      <select
                        value={formState.kecamatan}
                        onChange={handleKecamatanChange}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', height: '38px', background: '#fff' }}
                        disabled={!formState.kabupaten_kota}
                      >
                        <option value="">-- Pilih Kecamatan --</option>
                        {formState.provinsi && formState.kabupaten_kota && Object.keys(REGION_DATA[formState.provinsi][formState.kabupaten_kota]).map((kec) => (
                          <option key={kec} value={kec}>{kec}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Kelurahan</label>
                      <select
                        value={formState.kelurahan}
                        onChange={handleKelurahanChange}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', height: '38px', background: '#fff' }}
                        disabled={!formState.kecamatan}
                      >
                        <option value="">-- Pilih Kelurahan --</option>
                        {formState.provinsi && formState.kabupaten_kota && formState.kecamatan && REGION_DATA[formState.provinsi][formState.kabupaten_kota][formState.kecamatan].map((kel) => (
                          <option key={kel} value={kel}>{kel}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Kode Pos</label>
                      <input
                        type="text"
                        value={formState.kode_pos}
                        onChange={handleFormField('kode_pos')}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: 12 }}>
                    <label>Alamat Lengkap (Jalan, RT/RW, No. Rumah)</label>
                    <textarea
                      value={formState.alamat}
                      onChange={handleFormField('alamat')}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', minHeight: 60, fontFamily: 'inherit', fontSize: '13px' }}
                    />
                  </div>
                </div>

                {/* Section 3: Ubah Password (Opsional) */}
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: 'var(--forest)', fontSize: '14px' }}>III. Ubah Kata Sandi (Opsional)</h4>
                  <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: 'var(--muted)' }}>Biarkan kosong jika tidak ingin memperbarui kata sandi pengguna.</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Kata Sandi Baru</label>
                      <input
                        type="password"
                        value={formState.password}
                        onChange={handleFormField('password')}
                        placeholder="Masukkan sandi baru"
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Konfirmasi Kata Sandi Baru</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Konfirmasi sandi baru"
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                  <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary" style={{ padding: '8px 18px', borderRadius: 8 }}>
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 18px', borderRadius: 8 }} disabled={loading}>
                    {loading ? 'Menyimpan...' : 'Perbarui User'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
