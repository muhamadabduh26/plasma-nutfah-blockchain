import { useEffect, useState } from 'react';
import { PlasmaAPI } from '../api/client';

export default function Sertifikat() {
  const [approved, setApproved] = useState([]);
  const [certs, setCerts] = useState([]);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = async () => {
    const all = await PlasmaAPI.listRegistrations().catch(() => []);
    setApproved(all.filter((r) => r.status_registrasi === 'APPROVED'));
    setCerts(await PlasmaAPI.listCertificates().catch(() => []));
  };
  useEffect(() => { load(); }, []);

  const issue = async (id) => {
    setBusy(id);
    try {
      const res = await PlasmaAPI.issueCertificate(id);
      setToast({ type: 'ok', msg: `Sertifikat ${res.certificate_id} diterbitkan & hash dicatat ke blockchain.` });
      load();
    } catch (err) {
      setToast({ type: 'err', msg: err.response?.data?.error || err.message });
    } finally { setBusy(null); }
  };

  return (
    <>
      <div className="page-head">
        <h1>Sertifikat Digital</h1>
        <p>Tahap 3 — sertifikat dibuat dalam format PDF (dengan QR), lalu hash-nya dimasukkan ke blockchain.</p>
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div className="card" style={{ marginBottom: 22 }}>
        <div className="section-title">Siap Diterbitkan (status APPROVED)</div>
        {approved.length === 0 ? <div className="empty">Tidak ada registrasi yang siap diterbitkan.</div> : (
          <table>
            <thead><tr><th>ID On-Chain</th><th>Varietas</th><th>Aksi</th></tr></thead>
            <tbody>
              {approved.map((r) => (
                <tr key={r.registration_id}>
                  <td><span className="hash">{r.onchain_id}</span></td>
                  <td>{r.nama_varietas}</td>
                  <td>
                    <button className="btn btn-gold btn-sm" onClick={() => issue(r.registration_id)} disabled={busy === r.registration_id}>
                      {busy === r.registration_id ? 'Menerbitkan…' : '📜 Terbitkan Sertifikat'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="section-title">Sertifikat Terbit</div>
        {certs.length === 0 ? <div className="empty">Belum ada sertifikat.</div> : (
          <table>
            <thead><tr><th>ID Sertifikat</th><th>Varietas</th><th>Pemilik</th><th>Status</th><th>Berkas</th></tr></thead>
            <tbody>
              {certs.map((r) => {
                const certId = `CERT-${String(r.registration_id).padStart(4, '0')}`;
                return (
                  <tr key={r.registration_id}>
                    <td><span className="hash">{certId}</span></td>
                    <td>{r.nama_varietas}</td>
                    <td>{r.User?.name || '-'}</td>
                    <td><span className="badge CERTIFIED">CERTIFIED</span></td>
                    <td><a className="btn btn-ghost btn-sm" href={PlasmaAPI.downloadUrl(certId)} target="_blank" rel="noreferrer">⬇ Unduh PDF</a></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
