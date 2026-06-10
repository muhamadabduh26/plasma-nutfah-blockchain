import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { PlasmaAPI } from '../api/client';

export default function Dashboard() {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    PlasmaAPI.listRegistrations()
      .then((data) => {
        setRegistrations(data);
      })
      .catch((err) => {
        console.error("Gagal memuat data dashboard:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalRegistrasi = registrations.length;
  const menungguVerifikasi = registrations.filter(r => 
    r.status_registrasi === 'PENDING' || 
    r.status_registrasi === 'ADMIN_APPROVED' || 
    r.status_registrasi === 'SUBSTANTIVE_APPROVED'
  ).length;
  const perluPerbaikan = registrations.filter(r => r.status_registrasi === 'REJECTED').length;
  const sertifikatTerbit = registrations.filter(r => r.status_registrasi === 'CERTIFIED').length;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // 1. Data Grafik Trend Bulanan
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthlyData = months.map((m, idx) => {
    const count = registrations.filter(r => {
      if (!r.created_at) return false;
      const date = new Date(r.created_at);
      return date.getMonth() === idx && date.getFullYear() === currentYear;
    }).length;
    return { name: m, 'Registrasi': count };
  });

  // 2. Data Grafik Status Donut
  const statusCounts = {
    draft: 0,
    pending: registrations.filter(r => r.status_registrasi === 'PENDING').length,
    adminApproved: registrations.filter(r => r.status_registrasi === 'ADMIN_APPROVED').length,
    substantiveApproved: registrations.filter(r => r.status_registrasi === 'SUBSTANTIVE_APPROVED').length,
    certified: registrations.filter(r => r.status_registrasi === 'CERTIFIED').length,
    rejected: registrations.filter(r => r.status_registrasi === 'REJECTED').length,
    cancelled: registrations.filter(r => r.status_registrasi === 'CANCELLED').length,
  };

  const donutData = [
    { name: 'Draft', value: statusCounts.draft, color: '#95a5a6' },
    { name: 'Diajukan', value: statusCounts.pending, color: '#e08e0b' },
    { name: 'Verifikasi Administrasi', value: statusCounts.adminApproved, color: '#2a6f97' },
    { name: 'Verifikasi Teknis', value: statusCounts.substantiveApproved, color: '#6a4c93' },
    { name: 'Selesai / Terbit', value: statusCounts.certified, color: '#3a9d4a' },
    { name: 'Ditolak / Perbaikan', value: statusCounts.rejected, color: '#c0392b' },
    { name: 'Dibatalkan', value: statusCounts.cancelled, color: '#7f8c8d' },
  ].filter(d => d.value > 0);

  // 3. Registrasi Terbaru (Top 5)
  const recentRegistrations = registrations.slice(0, 5);

  // 4. Aktivitas Terbaru (Timeline)
  const activities = [];
  registrations.forEach(r => {
    const pemohon = r.User?.name || 'Peneliti';
    const dateStr = r.created_at;
    const date = new Date(dateStr);
    
    // Activity: Diajukan
    activities.push({
      type: 'info',
      text: `Registrasi varietas "${r.nama_varietas}" diajukan oleh ${pemohon}.`,
      date: date,
      dateFormatted: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    });
    
    if (r.status_registrasi === 'ADMIN_APPROVED') {
      const adminDate = new Date(date.getTime() + 1800000);
      activities.push({
        type: 'warning',
        text: `Verifikasi administrasi "${r.nama_varietas}" disetujui.`,
        date: adminDate,
        dateFormatted: adminDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' ' + adminDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      });
    }
    
    if (r.status_registrasi === 'SUBSTANTIVE_APPROVED') {
      const substDate = new Date(date.getTime() + 3600000);
      activities.push({
        type: 'warning',
        text: `Verifikasi teknis (uji lahan) "${r.nama_varietas}" dinyatakan lolos.`,
        date: substDate,
        dateFormatted: substDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' ' + substDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      });
    }

    if (r.status_registrasi === 'CERTIFIED') {
      const certDate = new Date(date.getTime() + 5400000);
      activities.push({
        type: 'success',
        text: `Sertifikat digital "${r.nama_varietas}" diterbitkan oleh Kepala Balai.`,
        date: certDate,
        dateFormatted: certDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' ' + certDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      });
    }

    if (r.status_registrasi === 'REJECTED') {
      const rejectDate = new Date(date.getTime() + 1800000);
      activities.push({
        type: 'danger',
        text: `Registrasi "${r.nama_varietas}" dikembalikan untuk perbaikan.`,
        date: rejectDate,
        dateFormatted: rejectDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' ' + rejectDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      });
    }
  });

  activities.sort((a, b) => b.date - a.date);
  const latestActivities = activities.slice(0, 5);

  // 5. Sertifikat Terbit Stats
  const certifiedThisYear = registrations.filter(r => 
    r.status_registrasi === 'CERTIFIED' && 
    r.created_at && 
    new Date(r.created_at).getFullYear() === currentYear
  ).length;

  const certifiedThisMonth = registrations.filter(r => 
    r.status_registrasi === 'CERTIFIED' && 
    r.created_at && 
    new Date(r.created_at).getFullYear() === currentYear &&
    new Date(r.created_at).getMonth() === currentMonth
  ).length;

  // Helper label status untuk tabel terbaru
  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING': return 'Diajukan';
      case 'ADMIN_APPROVED': return 'Verifikasi Administrasi';
      case 'SUBSTANTIVE_APPROVED': return 'Verifikasi Teknis';
      case 'CERTIFIED': return 'Selesai';
      case 'REJECTED': return 'Ditolak';
      case 'CANCELLED': return 'Dibatalkan';
      default: return status;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'PENDING';
      case 'ADMIN_APPROVED': return 'APPROVED';
      case 'SUBSTANTIVE_APPROVED': return 'APPROVED';
      case 'CERTIFIED': return 'CERTIFIED';
      case 'REJECTED': return 'REJECTED';
      case 'CANCELLED': return 'CANCELLED';
      default: return '';
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>Beranda Layanan PVT</h1>
        <p>Pantau perkembangan pendaftaran, status verifikasi, dan keaslian sertifikat varietas tanaman lokal Anda di sini.</p>
      </div>

      {loading ? (
        <div className="card">Memuat data dashboard...</div>
      ) : (
        <>
          {/* Ringkasan Utama (Statistik) */}
          <div className="grid stat-grid" style={{ marginBottom: 24 }}>
            <div className="stat green">
              <span className="ic">🌱</span>
              <div className="num">{totalRegistrasi}</div>
              <div className="lbl">Total Registrasi Varietas</div>
              <div className="stat-trend">Aktif</div>
            </div>
            <div className="stat gold">
              <span className="ic">⏳</span>
              <div className="num">{menungguVerifikasi}</div>
              <div className="lbl">Menunggu Verifikasi</div>
              <div className="stat-trend">Perlu Tindakan</div>
            </div>
            <div className="stat purple">
              <span className="ic">✏️</span>
              <div className="num">{perluPerbaikan}</div>
              <div className="lbl">Perlu Perbaikan (Ditolak)</div>
              <div className="stat-trend">Revisi Dokumen</div>
            </div>
            <div className="stat blue">
              <span className="ic">📜</span>
              <div className="num">{sertifikatTerbit}</div>
              <div className="lbl">Sertifikat Terbit</div>
              <div className="stat-trend">Terdaftar Resmi</div>
            </div>
          </div>

          <div className="grid two-col" style={{ marginBottom: 24 }}>
            {/* Grafik Registrasi Bulanan */}
            <div className="card chart-card">
              <div className="section-title">Tren Pengajuan Registrasi ({currentYear})</div>
              {totalRegistrasi === 0 ? (
                <div className="empty">Belum ada data registrasi.</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: 12, fill: 'var(--muted)' }} />
                    <YAxis tickLine={false} axisLine={false} style={{ fontSize: 12, fill: 'var(--muted)' }} />
                    <Tooltip cursor={{ fill: '#f7faf6' }} />
                    <Bar dataKey="Registrasi" fill="var(--forest-2)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Status Registrasi Pie Chart */}
            <div className="card chart-card">
              <div className="section-title">Distribusi Status Registrasi</div>
              {donutData.length === 0 ? (
                <div className="empty">Belum ada data status.</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={85} paddingAngle={3}>
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid two-col" style={{ marginBottom: 24 }}>
            {/* Registrasi Terbaru */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div className="section-title" style={{ margin: 0 }}>Registrasi Terbaru</div>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/registrasi')}>
                  Lihat Semua
                </button>
              </div>
              {recentRegistrations.length === 0 ? (
                <div className="empty">Belum ada pengajuan registrasi.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>Nomor</th>
                        <th>Varietas</th>
                        <th>Pemohon</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRegistrations.map((r) => (
                        <tr key={r.registration_id}>
                          <td><span className="hash">{r.onchain_id}</span></td>
                          <td><strong>{r.nama_varietas}</strong></td>
                          <td>{r.User?.name || '-'}</td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(r.status_registrasi)}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                              {getStatusLabel(r.status_registrasi)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Aktivitas Terbaru (Timeline) */}
            <div className="card">
              <div className="section-title">Aktivitas Sistem Terbaru</div>
              {latestActivities.length === 0 ? (
                <div className="empty">Belum ada aktivitas.</div>
              ) : (
                <div className="timeline">
                  {latestActivities.map((act, idx) => (
                    <div className="timeline-item" key={idx}>
                      <div className={`timeline-dot ${act.type}`}></div>
                      <div className="timeline-content">{act.text}</div>
                      <div className="timeline-time">🕒 {act.dateFormatted}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid two-col" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {/* Sertifikat Terbit */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="section-title">Ikhtisar Penerbitan Sertifikat</div>
                <p style={{ color: 'var(--muted)', fontSize: '13.5px', marginBottom: 18 }}>
                  Jumlah sertifikat paten varietas tanaman yang telah terbit dan terdaftar resmi di sistem.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div style={{ background: '#f8faf7', padding: '14px', borderRadius: 12, border: '1px solid var(--line)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Tahun Ini ({currentYear})</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--forest)', marginTop: 4 }}>{certifiedThisYear}</div>
                  </div>
                  <div style={{ background: '#f8faf7', padding: '14px', borderRadius: 12, border: '1px solid var(--line)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Bulan Ini</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--forest)', marginTop: 4 }}>{certifiedThisMonth}</div>
                  </div>
                </div>
              </div>
              <button className="btn btn-primary btn-block" onClick={() => navigate('/sertifikat')} style={{ width: '100%' }}>
                📜 Lihat Sertifikat
              </button>
            </div>

            {/* Pengumuman */}
            <div className="card">
              <div className="section-title">Pengumuman & Regulasi</div>
              <div className="announcement-list">
                <div className="announcement-item">
                  <h4>Pemeliharaan Sistem Berkala</h4>
                  <p>Sistem akan melakukan pemeliharaan rutin pada hari Sabtu mulai pukul 22:00 WIB. Layanan pendaftaran luring tetap dapat digunakan.</p>
                </div>
                <div className="announcement-item">
                  <h4>Aturan Baru Foto Morfologi</h4>
                  <p>Untuk mempermudah verifikasi, pastikan berkas foto tanaman yang dilampirkan menunjukkan ciri fisik yang jelas dan diambil langsung di lokasi asal tanaman.</p>
                </div>
                <div className="announcement-item">
                  <h4>Jaga Kerahasiaan Akun Anda</h4>
                  <p>Demi keamanan data paten Anda, jangan pernah memberikan kata sandi atau kunci pengaman akun kepada siapa pun. Petugas kami tidak pernah meminta data rahasia Anda.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
