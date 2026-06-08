import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = {
  peneliti: [
    { to: '/dashboard', label: 'Dashboard', icon: '◧' },
    { to: '/registrasi', label: 'Registrasi Varietas', icon: '🌱' },
    { to: '/sertifikat', label: 'Sertifikat', icon: '📜' },
  ],
  validator_admin: [
    { to: '/dashboard', label: 'Dashboard', icon: '◧' },
    { to: '/registrasi', label: 'Daftar Registrasi', icon: '🗂' },
  ],
  validator_substantif: [
    { to: '/dashboard', label: 'Dashboard', icon: '◧' },
    { to: '/registrasi', label: 'Daftar Registrasi', icon: '🗂' },
  ],
  validator_final: [
    { to: '/dashboard', label: 'Dashboard', icon: '◧' },
    { to: '/registrasi', label: 'Daftar Registrasi', icon: '🗂' },
    { to: '/sertifikat', label: 'Sertifikat', icon: '📜' },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: '◧' },
    { to: '/admin/users', label: 'Manajemen Pengguna', icon: '👤' },
    { to: '/admin/transactions', label: 'Audit Blockchain', icon: '🛡️' },
  ],
};

const TITLES = {
  '/dashboard': 'Ringkasan Sistem',
  '/registrasi': 'Registrasi & Histori Varietas',
  '/sertifikat': 'Sertifikat Digital',
  '/admin/users': 'Manajemen Pengguna Sistem',
  '/admin/transactions': 'Audit Transaksi Blockchain',
};

const ROLE_LABELS = {
  admin: 'Super Admin',
  validator_admin: 'Verifikator Administrasi',
  validator_substantif: 'Pemeriksa Substantif',
  validator_final: 'Kepala Balai',
  peneliti: 'Peneliti / Pengaju',
};

export default function Layout({ children }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const isPublicPage = loc.pathname === '/' || loc.pathname === '/login';

  if (isPublicPage) {
    return <div className="public-layout">{children}</div>;
  }

  // Fallback jika belum login (agar route guard mengarahkan ke login)
  if (!isAuthenticated) {
    return <div className="public-layout">{children}</div>;
  }

  const role = user?.role || 'peneliti';
  const nav = NAV_ITEMS[role] || [];
  const initial = user?.name ? user.name.charAt(0) : '?';

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">🌾</div>
          <div>
            <div className="brand-name">PlasmaChain</div>
            <div className="brand-sub">Hyperledger Fabric</div>
          </div>
        </div>

        <div className="nav-label">Menu {ROLE_LABELS[role]}</div>
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
          >
            <span className="nav-icon">{n.icon}</span>
            <span>{n.label}</span>
          </NavLink>
        ))}

        <div className="sidebar-profile">
          <div className="profile-avatar">{initial}</div>
          <div className="profile-info">
            <div className="profile-name">{user?.name}</div>
            <div className="profile-role">{ROLE_LABELS[role]}</div>
          </div>
        </div>

        <button onClick={logout} className="btn-logout">
          <span>🚪</span> Keluar
        </button>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-title">{TITLES[loc.pathname] || 'Sistem Plasma Nutfah'}</div>
          
          <div className="user-meta-info">
            <div className="user-name-badge">
              <span>👤</span> {user?.name}
              <span className="user-role-badge">{ROLE_LABELS[role]}</span>
            </div>
            <div className="chain-badge">
              <span className="dot" /> Blockchain Aktif
            </div>
          </div>
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
