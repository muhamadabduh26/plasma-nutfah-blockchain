import { useEffect, useState } from 'react';
import { PlasmaAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function RegistrasiVarietas() {
  const { user, isPeneliti, isValidator, isValidatorAdmin, isValidatorSubstantive, isValidatorFinal } = useAuth();
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  // State Detail View
  const [detailId, setDetailId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailHistory, setDetailHistory] = useState([]);

  // State Form Registrasi
  const [form, setForm] = useState({ nama_varietas: '', asal_plasma_nutfah: '', karakter_genetik: '', user_id: '' });
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);



  // State Validasi Langsung di Detail
  const [catatanValidasi, setCatatanValidasi] = useState('');
  const [validating, setValidating] = useState(false);

  // State Notifikasi
  const [toast, setToast] = useState(null);

  const load = () => {
    PlasmaAPI.listRegistrations()
      .then(setRows)
      .catch((e) => {
        console.error(e);
        setToast({ type: 'err', msg: 'Gagal memuat daftar registrasi.' });
      });
  };

  useEffect(() => {
    load();
    if (user) {
      setForm((f) => ({ ...f, user_id: user.user_id }));
    }
  }, [user]);

  // Load detail jika detailId berubah
  useEffect(() => {
    if (detailId) {
      fetchDetail(detailId);
    } else {
      setDetailData(null);
      setDetailHistory([]);
    }
  }, [detailId]);

  const fetchDetail = async (id) => {
    setDetailLoading(true);
    setToast(null);
    try {
      const data = await PlasmaAPI.getRegistration(id);
      setDetailData(data);
      
      // Ambil riwayat audit trail dari ledger blockchain jika sudah certified atau approved
      const history = await PlasmaAPI.history(id).catch(() => []);
      setDetailHistory(history);
    } catch (e) {
      console.error(e);
      setToast({ type: 'err', msg: 'Gagal memuat detail registrasi.' });
    } finally {
      setDetailLoading(false);
    }
  };

  const setFormField = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.nama_varietas) {
      setToast({ type: 'err', msg: 'Nama varietas wajib diisi.' });
      return;
    }
    setBusy(true);
    setToast(null);
    setResult(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) {
        fd.append('dokumen', file);
      }
      const res = await PlasmaAPI.register(fd);
      setResult(res);
      setToast({ type: 'ok', msg: 'Registrasi berhasil dicatat ke blockchain.' });
      setForm({ nama_varietas: '', asal_plasma_nutfah: '', karakter_genetik: '', user_id: user.user_id });
      setFile(null);
    } catch (err) {
      setToast({ type: 'err', msg: err.response?.data?.error || err.message });
    } finally {
      setBusy(false);
    }
  };



  const handleCancel = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan pengajuan ini? Status akan diubah menjadi CANCELLED secara permanen.')) {
      return;
    }
    setBusy(true);
    try {
      await PlasmaAPI.cancelRegistration(id);
      setToast({ type: 'ok', msg: 'Pengajuan varietas berhasil dibatalkan.' });
      setDetailId(null);
      load();
    } catch (err) {
      setToast({ type: 'err', msg: err.response?.data?.error || err.message });
    } finally {
      setBusy(false);
    }
  };

  // Validasi (Validator Approve/Reject)
  const handleValidate = async (id, approved) => {
    setValidating(true);
    setToast(null);
    try {
      if (user?.role === 'validator_admin') {
        await PlasmaAPI.verifyAdmin(id, { approved, catatan: catatanValidasi });
        setToast({ 
          type: 'ok', 
          msg: approved 
            ? 'Registrasi disetujui secara administrasi!' 
            : 'Registrasi ditolak secara administrasi.' 
        });
      } else if (user?.role === 'validator_substantif') {
        await PlasmaAPI.verifySubstantive(id, { approved, catatan: catatanValidasi });
        setToast({ 
          type: 'ok', 
          msg: approved 
            ? 'Registrasi disetujui secara substantif!' 
            : 'Registrasi ditolak secara substantif.' 
        });
      }
      setCatatanValidasi('');
      if (detailId) {
        fetchDetail(detailId);
      } else {
        load();
      }
    } catch (err) {
      setToast({ type: 'err', msg: err.response?.data?.error || err.message });
    } finally {
      setValidating(false);
    }
  };

  // Penerbitan Sertifikat
  const handleIssueCert = async (id) => {
    setBusy(true);
    setToast(null);
    try {
      const res = await PlasmaAPI.issueCertificate(id);
      setToast({ type: 'ok', msg: `Sertifikat ${res.certificate_id} berhasil diterbitkan & hash di-commit ke blockchain.` });
      if (detailId) {
        fetchDetail(detailId);
      } else {
        load();
      }
    } catch (err) {
      setToast({ type: 'err', msg: err.response?.data?.error || err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleBackToList = () => {
    setShowForm(false);
    setDetailId(null);
    setResult(null);
    load();
  };

  const getDocDownloadUrl = (doc) => {
    if (!doc || doc.file_path_ipfs === '-') return null;
    const diskFilename = doc.file_path_ipfs.split(/[\\/]/).pop();
    return `http://localhost:4000/uploads/${diskFilename}`;
  };

  const renderStepper = (status) => {
    const steps = [
      { key: 'PENDING', label: 'Registrasi Baru', desc: 'Administrasi' },
      { key: 'ADMIN_APPROVED', label: 'Verifikasi Administrasi', desc: 'Substantif/Uji Lahan' },
      { key: 'SUBSTANTIVE_APPROVED', label: 'Verifikasi Substantif', desc: 'Persetujuan Final' },
      { key: 'CERTIFIED', label: 'Sertifikat Terbit', desc: 'Selesai' }
    ];

    let currentIdx = 0;
    if (status === 'ADMIN_APPROVED') currentIdx = 1;
    else if (status === 'SUBSTANTIVE_APPROVED') currentIdx = 2;
    else if (status === 'CERTIFIED') currentIdx = 3;
    else if (status === 'REJECTED') {
      return (
        <div style={{ background: '#fdf2f2', border: '1px solid #f5c2c2', padding: '14px 20px', borderRadius: 12, marginBottom: 20 }}>
          <div style={{ fontWeight: 600, color: '#9b1c1c', fontSize: 16 }}>Pengajuan Ditolak ✕</div>
          <div style={{ fontSize: 13.5, color: '#7f1d1d', marginTop: 4 }}>Proses verifikasi dihentikan karena pengajuan tidak memenuhi kriteria kelayakan.</div>
        </div>
      );
    } else if (status === 'CANCELLED') {
      return (
        <div style={{ background: '#f5f5f5', border: '1px solid #e5e5e5', padding: '14px 20px', borderRadius: 12, marginBottom: 20 }}>
          <div style={{ fontWeight: 600, color: '#6b7280', fontSize: 16 }}>Pengajuan Dibatalkan</div>
          <div style={{ fontSize: 13.5, color: '#4b5563', marginTop: 4 }}>Pengajuan ini telah dibatalkan oleh pihak pengaju.</div>
        </div>
      );
    }

    return (
      <div className="card" style={{ marginBottom: 20, padding: '24px 20px' }}>
        <div className="stepper-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          {steps.map((step, idx) => {
            const isDone = idx < currentIdx;
            const isActive = idx === currentIdx;
            
            let circleColor = 'var(--muted)';
            let circleBg = '#f3f4f6';
            let border = '1px dashed #d1d5db';
            let textColor = 'var(--muted)';

            if (isDone) {
              circleColor = '#fff';
              circleBg = 'var(--forest)';
              border = '1px solid var(--forest)';
              textColor = 'var(--forest)';
            } else if (isActive) {
              circleColor = '#fff';
              circleBg = 'var(--gold)';
              border = '2px solid var(--gold)';
              textColor = '#b27b00';
            }

            return (
              <div key={step.key} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: circleBg,
                  color: circleColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                  border: border,
                  fontWeight: 'bold',
                  fontSize: 14,
                  zIndex: 2,
                  position: 'relative'
                }}>
                  {isDone ? '✓' : idx + 1}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: isActive || isDone ? 600 : 500, color: textColor }}>{step.label}</div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>{step.desc}</div>
                {idx < steps.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    top: 16,
                    left: '50%',
                    right: '-50%',
                    height: 2,
                    background: idx < currentIdx ? 'var(--forest)' : '#e5e7eb',
                    zIndex: 1
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {/* ==================== SCREEN 1: DETAIL VIEW ==================== */}
      {detailId && (
        <div>
          <div style={{ marginBottom: 18 }}>
            <button className="btn btn-ghost btn-sm" onClick={handleBackToList}>
              ← Kembali ke Daftar
            </button>
          </div>

          {detailLoading || !detailData ? (
            <div className="card">Memuat detail data...</div>
          ) : (
            <div>
              {renderStepper(detailData.registration.status_registrasi)}
              <div className="grid two-col">
              {/* Kolom Kiri: Metadata Off-Chain */}
              <div className="card">
                <h2 className="section-title" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
                  Informasi Detail Varietas
                </h2>
                
                <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
                  <div>
                    <label>Nama Varietas</label>
                    <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--forest)' }}>
                      {detailData.registration.nama_varietas}
                    </div>
                  </div>
                  
                  <div>
                    <label>Asal Plasma Nutfah</label>
                    <div style={{ background: '#f8faf7', padding: 12, borderRadius: 8, fontSize: 14 }}>
                      {detailData.registration.asal_plasma_nutfah || <span className="muted">Tidak diisi</span>}
                    </div>
                  </div>

                  <div>
                    <label>Karakter Genetik</label>
                    <div style={{ background: '#f8faf7', padding: 12, borderRadius: 8, fontSize: 14, minHeight: 60 }}>
                      {detailData.registration.karakter_genetik || <span className="muted">Tidak diisi</span>}
                    </div>
                  </div>

                  <div>
                    <label>Pengaju / Pemilik Saat Ini</label>
                    <div><strong>{detailData.registration.User?.name}</strong> ({detailData.registration.User?.email})</div>
                  </div>

                  <div>
                    <label>Status Pengajuan</label>
                    <span className={`badge ${detailData.registration.status_registrasi}`} style={{ fontSize: 13, padding: '6px 14px' }}>
                      {detailData.registration.status_registrasi}
                    </span>
                  </div>

                  {detailData.registration.Documents && detailData.registration.Documents.length > 0 && (
                    <div>
                      <label>Dokumen Pendukung</label>
                      {detailData.registration.Documents.map((doc) => {
                        const url = getDocDownloadUrl(doc);
                        return (
                          <div key={doc.document_id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                            <span style={{ fontSize: 20 }}>📄</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{doc.file_name}</div>
                              {url && (
                                <a href={url} target="_blank" rel="noreferrer" className="btn-link" style={{ fontSize: 12 }}>
                                  ⬇ Unduh Dokumen Pendukung
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* FORM VALIDASI UNTUK VALIDATOR ADMINISTRASI */}
                  {detailData.registration.status_registrasi === 'PENDING' && isValidatorAdmin && (
                    <div style={{ borderTop: '1px solid var(--line)', paddingTop: 18, marginTop: 10 }}>
                      <label style={{ color: 'var(--forest)', fontWeight: 600 }}>Tindakan Verifikator Administrasi</label>
                      <textarea
                        value={catatanValidasi}
                        onChange={(e) => setCatatanValidasi(e.target.value)}
                        placeholder="Tulis catatan kelengkapan berkas administrasi di sini..."
                        style={{ marginBottom: 12 }}
                      />
                      <div className="btn-row">
                        <button 
                          className="btn btn-primary btn-sm" 
                          onClick={() => handleValidate(detailData.registration.registration_id, true)}
                          disabled={validating}
                        >
                          ✓ Setujui Administrasi
                        </button>
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => handleValidate(detailData.registration.registration_id, false)}
                          disabled={validating}
                        >
                          ✕ Tolak
                        </button>
                      </div>
                    </div>
                  )}

                  {/* FORM VALIDASI UNTUK VALIDATOR SUBSTANTIF */}
                  {detailData.registration.status_registrasi === 'ADMIN_APPROVED' && isValidatorSubstantive && (
                    <div style={{ borderTop: '1px solid var(--line)', paddingTop: 18, marginTop: 10 }}>
                      <label style={{ color: 'var(--forest)', fontWeight: 600 }}>Tindakan Pemeriksa Substantif</label>
                      <textarea
                        value={catatanValidasi}
                        onChange={(e) => setCatatanValidasi(e.target.value)}
                        placeholder="Tulis catatan uji lahan/substantif di sini..."
                        style={{ marginBottom: 12 }}
                      />
                      <div className="btn-row">
                        <button 
                          className="btn btn-primary btn-sm" 
                          onClick={() => handleValidate(detailData.registration.registration_id, true)}
                          disabled={validating}
                        >
                          ✓ Setujui Substantif (Uji Lahan Lolos)
                        </button>
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => handleValidate(detailData.registration.registration_id, false)}
                          disabled={validating}
                        >
                          ✕ Tolak
                        </button>
                      </div>
                    </div>
                  )}

                  {/* FORM VALIDASI UNTUK VALIDATOR FINAL / KEPALA BALAI */}
                  {detailData.registration.status_registrasi === 'SUBSTANTIVE_APPROVED' && isValidatorFinal && (
                    <div style={{ borderTop: '1px solid var(--line)', paddingTop: 18, marginTop: 10 }}>
                      <label style={{ color: 'var(--forest)', fontWeight: 600 }}>Persetujuan Akhir & Penerbitan Sertifikat</label>
                      <p style={{ fontSize: 13, marginBottom: 12, color: 'var(--muted)' }}>
                        Seluruh verifikasi awal (Administrasi & Substantif) telah disetujui. Berikan persetujuan akhir untuk menandatangani secara digital dan menerbitkan sertifikat.
                      </p>
                      <div className="btn-row">
                        <button 
                          className="btn btn-primary btn-sm" 
                          onClick={() => handleIssueCert(detailData.registration.registration_id)}
                          disabled={busy}
                        >
                          📜 Berikan Final Approval & Terbitkan Sertifikat
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Kolom Kanan: Catatan Ledger Blockchain */}
              <div className="card">
                <h2 className="section-title" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
                  Bukti Blockchain (On-Chain)
                </h2>

                <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
                  <div>
                    <label>ID Registrasi Blockchain</label>
                    <span className="hash" style={{ fontSize: 14 }}>{detailData.registration.onchain_id}</span>
                  </div>

                  {detailData.onchain ? (
                    <>
                      <div>
                        <label>Status On-Ledger</label>
                        <span className={`badge ${detailData.onchain.status}`} style={{ fontSize: 12 }}>
                          {detailData.onchain.status}
                        </span>
                      </div>
                      
                      <div>
                        <label>Nama Pemilik Terdaftar</label>
                        <div>{detailData.onchain.ownerName}</div>
                      </div>

                      <div>
                        <label>Wallet Address Kriptografi</label>
                        <span className="hash" style={{ fontSize: 11 }}>{detailData.onchain.owner}</span>
                      </div>

                      <div>
                        <label>Hash Dokumen (SHA-256)</label>
                        <span className="hash" style={{ fontSize: 11, background: '#eef3eb', color: 'var(--forest-2)' }}>
                          {detailData.onchain.documentHash}
                        </span>
                      </div>

                      {detailData.onchain.certificateId && (
                        <div>
                          <label>ID Sertifikat Digital</label>
                          <span className="hash" style={{ fontSize: 12 }}>{detailData.onchain.certificateId}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ color: 'var(--muted)', fontSize: 13.5, fontStyle: 'italic' }}>
                      Data on-chain belum terinisiasi penuh atau registrasi dibatalkan.
                    </div>
                  )}

                  {/* TINDAKAN KHUSUS SESUAI HAK AKSES */}
                  <div style={{ borderTop: '1px solid var(--line)', paddingTop: 18, marginTop: 10 }}>
                    <label>Tindakan Tersedia</label>
                    <div className="btn-row">
                      {detailData.registration.status_registrasi === 'PENDING' && isPeneliti && detailData.registration.user_id === user?.user_id && (
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => handleCancel(detailData.registration.registration_id)}
                          disabled={busy}
                        >
                          ❌ Batalkan Pengajuan
                        </button>
                      )}



                      <button className="btn btn-ghost btn-sm" onClick={() => fetchDetail(detailId)}>
                        🔄 Sinkronkan Blockchain
                      </button>
                    </div>
                  </div>

                  {/* Audit Trail dari Blockchain */}
                  {detailHistory.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                      <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--forest)' }}>Jejak Audit Blockchain (Ledger History)</label>
                      <div style={{ display: 'grid', gap: 14, marginTop: 10 }}>
                        {detailHistory.map((h, idx) => {
                          const status = h.value?.status || 'PENDING';
                          const txDate = new Date(h.timestamp?.seconds ? h.timestamp.seconds * 1000 : h.timestamp).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          });

                          let actorInfo = '';
                          let noteText = '';
                          let badgeClass = status;

                          if (status === 'PENDING') {
                            actorInfo = `Didaftarkan oleh: ${h.value?.ownerName || 'Peneliti'}`;
                          } else if (status === 'ADMIN_APPROVED') {
                            actorInfo = `Disetujui Administrasi oleh: ${h.value?.validatorAdmin || 'Verifikator Administrasi'}`;
                            noteText = h.value?.catatanAdmin;
                          } else if (status === 'SUBSTANTIVE_APPROVED') {
                            actorInfo = `Disetujui Substantif oleh: ${h.value?.validatorSubstantive || 'Pemeriksa Substantif'}`;
                            noteText = h.value?.catatanSubstantive;
                          } else if (status === 'CERTIFIED') {
                            actorInfo = `Sertifikat diterbitkan oleh: ${h.value?.validatorFinal || 'Kepala Balai'}`;
                            noteText = `ID Sertifikat: ${h.value?.certificateId}`;
                          } else if (status === 'REJECTED') {
                            actorInfo = `Ditolak oleh Validator`;
                            noteText = h.value?.catatanAdmin || h.value?.catatanSubstantive || '';
                          }

                          return (
                            <div key={idx} style={{ 
                              background: '#ffffff', 
                              border: '1px solid var(--line)',
                              borderLeft: '4px solid ' + (status === 'REJECTED' ? '#ef4444' : 'var(--leaf)'), 
                              padding: '12px 16px', 
                              borderRadius: '0 8px 8px 0', 
                              fontSize: 13,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, marginBottom: 6 }}>
                                <span className={`badge ${badgeClass}`} style={{ fontSize: 11 }}>{status}</span>
                                <span style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 500 }}>
                                  🕒 {txDate}
                                </span>
                              </div>
                              <div style={{ fontWeight: 500, color: '#374151' }}>{actorInfo}</div>
                              {noteText && (
                                <div style={{ 
                                  marginTop: 8, 
                                  fontSize: 12.5, 
                                  color: '#4b5563', 
                                  fontStyle: 'italic', 
                                  background: '#f9fafb', 
                                  padding: '6px 10px', 
                                  borderRadius: 4,
                                  borderLeft: '2px solid #d1d5db'
                                }}>
                                  Catatan: "{noteText}"
                                </div>
                              )}
                              <div className="hash" style={{ fontSize: 10.5, marginTop: 8, color: 'var(--muted)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                TxID: {h.txId}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

      {/* ==================== SCREEN 2: DAFTAR REGISTRASI ==================== */}
      {!detailId && !showForm && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 className="section-title" style={{ margin: 0 }}>Histori Pengajuan</h2>
            <div className="btn-row">
              {isPeneliti && (
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                  ＋ Registrasi Baru
                </button>
              )}
              <button className="btn btn-ghost" onClick={load}>
                🔄 Segarkan
              </button>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="empty">Belum ada registrasi.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>ID On-Chain</th>
                    <th>Varietas</th>
                    <th>Pengaju</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.registration_id}>
                      <td><span className="hash">{r.onchain_id}</span></td>
                      <td><strong>{r.nama_varietas}</strong></td>
                      <td>{r.User?.name || '-'}</td>
                      <td>
                        <span className={`badge ${r.status_registrasi}`}>
                          {r.status_registrasi}
                        </span>
                      </td>
                      <td>
                        <div className="btn-row">
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setDetailId(r.registration_id)}
                          >
                            👁 Lihat Detail
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================== SCREEN 3: FORM REGISTRASI BARU ==================== */}
      {!detailId && showForm && (
        <div className="center-narrow">
          <div style={{ marginBottom: 18 }}>
            <button className="btn btn-ghost btn-sm" onClick={handleBackToList}>
              ← Kembali ke Daftar
            </button>
          </div>

          {!result ? (
            <div className="card">
              <h2 className="section-title" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
                Pendaftaran Varietas Baru (Tahap 1)
              </h2>
              
              <div className="flow-steps" style={{ marginBottom: 20 }}>
                <span className="flow-step done">1. Input Data</span>
                <span className="flow-step done">2. Generate Hash</span>
                <span className="flow-step done">3. Simpan ke Blockchain</span>
              </div>

              <form onSubmit={handleRegister} className="form-grid">
                <div>
                  <label>Nama Varietas *</label>
                  <input
                    value={form.nama_varietas}
                    onChange={setFormField('nama_varietas')}
                    placeholder="mis. Padi Inpari Unggul 32"
                    required
                  />
                </div>
                <div>
                  <label>Asal Plasma Nutfah</label>
                  <textarea
                    value={form.asal_plasma_nutfah}
                    onChange={setFormField('asal_plasma_nutfah')}
                    placeholder="Daerah/sumber asal material genetik"
                  />
                </div>
                <div>
                  <label>Karakter Genetik</label>
                  <textarea
                    value={form.karakter_genetik}
                    onChange={setFormField('karakter_genetik')}
                    placeholder="Deskripsi sifat unggul, ketahanan, morfologi, dll."
                  />
                </div>
                <div>
                  <label>Dokumen Pendukung (opsional)</label>
                  <div
                    className={'dropzone' + (drag ? ' drag' : '')}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDrag(true);
                    }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={onDrop}
                    onClick={() => document.getElementById('fileInput').click()}
                  >
                    <div className="big">📄</div>
                    {file ? (
                      <strong>{file.name}</strong>
                    ) : (
                      <span>Tarik & letakkan berkas, atau klik untuk memilih (PDF/gambar, maks 20MB)</span>
                    )}
                    <input id="fileInput" type="file" hidden onChange={(e) => setFile(e.target.files[0])} />
                  </div>
                </div>
                <div className="btn-row" style={{ marginTop: 12 }}>
                  <button type="submit" className="btn btn-primary" disabled={busy}>
                    {busy ? 'Memproses…' : '⛓ Daftarkan ke Blockchain'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={handleBackToList}>
                    Batal
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card">
              <h2 className="section-title" style={{ color: 'var(--forest-2)' }}>🎉 Registrasi Berhasil Dicatat</h2>
              <p style={{ marginBottom: 12, color: 'var(--muted)' }}>
                Data varietas telah di-hash dan didaftarkan pada Hyperledger Fabric ledger secara permanen.
              </p>

              <div style={{ background: '#f8faf7', padding: 20, borderRadius: 12, border: '1px solid var(--line)', marginBottom: 20 }}>
                <div style={{ marginBottom: 10 }}>
                  <strong>ID On-Chain:</strong> <span className="hash">{result.registration?.onchain_id}</span>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <strong>Hash Dokumen (SHA-256):</strong> <span className="hash">{result.document_hash}</span>
                </div>
                <div>
                  <strong>Hash Transaksi Blockchain:</strong> <span className="hash">{result.tx_hash}</span>
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleBackToList}>
                Selesai & Kembali ke Daftar
              </button>
            </div>
          )}
        </div>
      )}


    </>
  );
}
