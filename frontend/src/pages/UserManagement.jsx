import { useState, useEffect } from 'react';
import { PlasmaAPI } from '../api/client';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [wallet, setWallet] = useState('');
  const [role, setRole] = useState('peneliti');
  const [password, setPassword] = useState('password123'); // default password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await PlasmaAPI.createUser({
        name,
        email,
        wallet_address: wallet || '0x' + Math.random().toString(16).substr(2, 10).toUpperCase(), // otomatis jika kosong
        role,
        password,
      });
      setSuccess('Pengguna baru berhasil dibuat!');
      setName('');
      setEmail('');
      setWallet('');
      setRole('peneliti');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal membuat pengguna baru.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1>Manajemen Pengguna</h1>
        <p>Kelola akun pengguna sistem (Peneliti, Verifikator, dan Super Admin) serta alamat wallet blockchain mereka.</p>
      </div>

      <div className="grid two-col">
        {/* Daftar Pengguna */}
        <div className="card">
          <h2 className="section-title">Daftar Pengguna Aktif</h2>
          {users.length === 0 ? (
            <div className="empty">Tidak ada data pengguna.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Wallet Address</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_id}>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'REJECTED' : u.role === 'validator' ? 'APPROVED' : 'CERTIFIED'}`}>
                          {u.role === 'admin' ? 'Super Admin' : u.role === 'validator' ? 'Verifikator' : 'User Pengajuan'}
                        </span>
                      </td>
                      <td><span className="hash">{u.wallet_address || 'n/a'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Buat Pengguna Baru */}
        <div className="card">
          <h2 className="section-title">Tambah Pengguna Baru</h2>
          {error && <div className="toast err">{error}</div>}
          {success && <div className="toast ok">{success}</div>}

          <form onSubmit={handleCreate} className="form-grid">
            <div className="form-group">
              <label>Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="mis. Dr. Ahmad, M.Si"
                required
              />
            </div>

            <div className="form-group">
              <label>Alamat Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ahmad@instansi.go.id"
                required
              />
            </div>

            <div className="form-group">
              <label>Kata Sandi (Password)</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password123"
                required
              />
            </div>

            <div className="form-group">
              <label>Wallet Address Blockchain (Opsional)</label>
              <input
                type="text"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="mis. 0xAHMAD001 (Kosongkan untuk auto-generate)"
              />
            </div>

            <div className="form-group">
              <label>Peran / Hak Akses (Role)</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="peneliti">User Pengajuan (Peneliti/Petani)</option>
                <option value="validator">Verifikator (Balai/Validator)</option>
                <option value="admin">Super Admin (Pengelola Sistem)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : '＋ Tambah Pengguna'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
