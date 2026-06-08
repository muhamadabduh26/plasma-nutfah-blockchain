import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PlasmaAPI } from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, certified: 0, verifikasi: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    PlasmaAPI.stats().then(setStats).catch(() => {});
    PlasmaAPI.listRegistrations().then((d) => setRecent(d.slice(0, 6))).catch(() => {});
  }, []);

  const donut = [
    { name: 'Menunggu', value: stats.pending, color: '#d8a72e' },
    { name: 'Disetujui', value: stats.approved, color: '#2a6f97' },
    { name: 'Bersertifikat', value: stats.certified, color: '#3a9d4a' },
    { name: 'Ditolak', value: stats.rejected, color: '#c0392b' },
  ].filter((d) => d.value > 0);

  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        <p>Ringkasan registrasi, validasi, dan penerbitan sertifikat plasma nutfah.</p>
      </div>

      <div className="grid stat-grid" style={{ marginBottom: 24 }}>
        <Stat cls="green" num={stats.total} lbl="Total Registrasi" ic="🌱" />
        <Stat cls="gold" num={stats.pending} lbl="Menunggu Validasi" ic="⏳" />
        <Stat cls="blue" num={stats.certified} lbl="Sertifikat Terbit" ic="📜" />
        <Stat cls="purple" num={stats.verifikasi} lbl="Verifikasi Publik" ic="🔍" />
      </div>

      <div className="grid two-col">
        <div className="card">
          <div className="section-title">Registrasi Terbaru</div>
          {recent.length === 0 ? (
            <div className="empty">Belum ada data registrasi.</div>
          ) : (
            <table>
              <thead>
                <tr><th>ID On-Chain</th><th>Varietas</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.registration_id}>
                    <td><span className="hash">{r.onchain_id}</span></td>
                    <td>{r.nama_varietas}</td>
                    <td><span className={`badge ${r.status_registrasi}`}>{r.status_registrasi}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="section-title">Distribusi Status</div>
          {donut.length === 0 ? (
            <div className="empty">Belum ada data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={donut} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={3}>
                  {donut.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ cls, num, lbl, ic }) {
  return (
    <div className={`stat ${cls}`}>
      <span className="ic">{ic}</span>
      <div className="num">{num}</div>
      <div className="lbl">{lbl}</div>
    </div>
  );
}
