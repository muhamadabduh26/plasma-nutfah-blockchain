import { useEffect, useState } from 'react';
import { PlasmaAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function RegistrasiVarietas() {
  const { user, isPeneliti, isValidatorAdmin, isValidatorSubstantive, isValidatorFinal } = useAuth();
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // State Pencarian & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // State Detail View
  const [detailId, setDetailId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailHistory, setDetailHistory] = useState([]);

  // State Form Registrasi
  const [form, setForm] = useState({
    nama_varietas: '',
    asal_plasma_nutfah: '',
    karakter_genetik: '',
    user_id: ''
  });

  // State Detail Pendaftaran (Gambar 12 PDF)
  const [detailForm, setDetailForm] = useState({
    komoditas: 'Tanaman Pangan',
    nama_genus: '',
    nama_spesies: '',
    nama_umum: '',
    nama_lokal: '',
    usulan_nama_1: '',
    usulan_nama_2: '',
    usulan_nama_3: '',
    lokasi_pendataan: '',
    tahun_dikenal: '',
    sebaran_geografis: '',
    nama_pendaftar: '',
    jabatan: '',
    asal_instansi: '',
    morfologi_pertumbuhan: '',
    morfologi_batang: '',
    morfologi_daun: '',
    morfologi_bunga: '',
    morfologi_buah: '',
    morfologi_biji: '',
    sifat_khusus: ''
  });

  // Dynamic lists of descriptors
  const [pendeskripsiList, setPendeskripsiList] = useState(['']);

  // Document attachments
  const [fileFormulir, setFileFormulir] = useState(null);
  const [nomorFormulir, setNomorFormulir] = useState('');
  const [tanggalFormulir, setTanggalFormulir] = useState('');

  const [fileSuratTugas, setFileSuratTugas] = useState(null);
  const [nomorSuratTugas, setNomorSuratTugas] = useState('');
  const [tanggalSuratTugas, setTanggalSuratTugas] = useState('');

  const [fileDataDukung, setFileDataDukung] = useState(null);
  const [nomorDataDukung, setNomorDataDukung] = useState('');
  const [tanggalDataDukung, setTanggalDataDukung] = useState('');

  const [fileFoto, setFileFoto] = useState(null);
  const [nomorFoto, setNomorFoto] = useState('');
  const [tanggalFoto, setTanggalFoto] = useState('');

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  // State Validasi Langsung di Detail
  const [catatanValidasi, setCatatanValidasi] = useState('');
  const [validating, setValidating] = useState(false);

  // State Notifikasi
  const [toast, setToast] = useState(null);

  // State Tab Navigasi (Gambar 12 PDF)
  const [activeFormTab, setActiveFormTab] = useState('umum'); // 'umum' | 'morfologi' | 'berkas'
  const [activeDetailTab, setActiveDetailTab] = useState('umum'); // 'umum' | 'morfologi' | 'berkas'

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
      setDetailForm((df) => ({
        ...df,
        nama_pendaftar: user.name || '',
        asal_instansi: user.nama_institusi || ''
      }));
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
  const setDetailFormField = (k) => (e) => setDetailForm({ ...detailForm, [k]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setToast(null);
    setResult(null);

    // --- Tab I Validation ---
    if (!form.nama_varietas) {
      setToast({ type: 'err', msg: 'Nama varietas tanaman wajib diisi.' });
      setActiveFormTab('umum');
      return;
    }
    if (!detailForm.komoditas) {
      setToast({ type: 'err', msg: 'Komoditas varietas wajib dipilih.' });
      setActiveFormTab('umum');
      return;
    }
    if (!detailForm.nama_genus) {
      setToast({ type: 'err', msg: 'Nama genus wajib diisi.' });
      setActiveFormTab('umum');
      return;
    }
    if (!detailForm.nama_spesies) {
      setToast({ type: 'err', msg: 'Nama spesies dan author wajib diisi.' });
      setActiveFormTab('umum');
      return;
    }
    if (!detailForm.nama_umum) {
      setToast({ type: 'err', msg: 'Nama umum wajib diisi.' });
      setActiveFormTab('umum');
      return;
    }
    if (!detailForm.nama_lokal) {
      setToast({ type: 'err', msg: 'Nama lokal wajib diisi.' });
      setActiveFormTab('umum');
      return;
    }
    if (!detailForm.usulan_nama_1) {
      setToast({ type: 'err', msg: 'Usulan Nama Pertama wajib diisi.' });
      setActiveFormTab('umum');
      return;
    }
    if (!form.asal_plasma_nutfah) {
      setToast({ type: 'err', msg: 'Asal plasma nutfah wajib diisi.' });
      setActiveFormTab('umum');
      return;
    }
    if (!detailForm.tahun_dikenal) {
      setToast({ type: 'err', msg: 'Tahun dikenal wajib diisi.' });
      setActiveFormTab('umum');
      return;
    }
    if (!detailForm.lokasi_pendataan) {
      setToast({ type: 'err', msg: 'Lokasi pendataan wajib diisi.' });
      setActiveFormTab('umum');
      return;
    }
    if (!detailForm.sebaran_geografis) {
      setToast({ type: 'err', msg: 'Sebaran geografis wajib diisi.' });
      setActiveFormTab('umum');
      return;
    }
    if (pendeskripsiList.filter(Boolean).length === 0) {
      setToast({ type: 'err', msg: 'Minimal harus mengisi 1 nama pendeskripsi.' });
      setActiveFormTab('umum');
      return;
    }
    if (!detailForm.nama_pendaftar) {
      setToast({ type: 'err', msg: 'Nama pendaftar wajib diisi.' });
      setActiveFormTab('umum');
      return;
    }
    if (!detailForm.jabatan) {
      setToast({ type: 'err', msg: 'Jabatan pendaftar wajib diisi.' });
      setActiveFormTab('umum');
      return;
    }
    if (!detailForm.asal_instansi) {
      setToast({ type: 'err', msg: 'Asal instansi pendaftar wajib diisi.' });
      setActiveFormTab('umum');
      return;
    }

    // --- Tab II Validation ---
    if (!form.karakter_genetik) {
      setToast({ type: 'err', msg: 'Karakter genetik utama wajib diisi.' });
      setActiveFormTab('morfologi');
      return;
    }
    if (!detailForm.sifat_khusus) {
      setToast({ type: 'err', msg: 'Sifat khusus / ciri spesifik wajib diisi.' });
      setActiveFormTab('morfologi');
      return;
    }

    // --- Tab III Validation ---
    if (!fileFormulir) {
      setToast({ type: 'err', msg: 'Unggah file Formulir Pendaftaran Bermaterai wajib diisi.' });
      setActiveFormTab('berkas');
      return;
    }
    if (!nomorFormulir) {
      setToast({ type: 'err', msg: 'Nomor dokumen Formulir Pendaftaran Bermaterai wajib diisi.' });
      setActiveFormTab('berkas');
      return;
    }
    if (!tanggalFormulir) {
      setToast({ type: 'err', msg: 'Tanggal terbit Formulir Pendaftaran Bermaterai wajib diisi.' });
      setActiveFormTab('berkas');
      return;
    }

    if (!fileSuratTugas) {
      setToast({ type: 'err', msg: 'Unggah file Surat Kuasa/Tugas Penunjukan wajib diisi.' });
      setActiveFormTab('berkas');
      return;
    }
    if (!nomorSuratTugas) {
      setToast({ type: 'err', msg: 'Nomor dokumen Surat Kuasa/Tugas Penunjukan wajib diisi.' });
      setActiveFormTab('berkas');
      return;
    }
    if (!tanggalSuratTugas) {
      setToast({ type: 'err', msg: 'Tanggal terbit Surat Kuasa/Tugas Penunjukan wajib diisi.' });
      setActiveFormTab('berkas');
      return;
    }

    if (!fileFoto) {
      setToast({ type: 'err', msg: 'Unggah file Foto Karakteristik Tanaman wajib diisi.' });
      setActiveFormTab('berkas');
      return;
    }
    if (!nomorFoto) {
      setToast({ type: 'err', msg: 'Keterangan/Nomor Foto Karakteristik Tanaman wajib diisi.' });
      setActiveFormTab('berkas');
      return;
    }
    if (!tanggalFoto) {
      setToast({ type: 'err', msg: 'Tanggal pengambilan Foto Karakteristik Tanaman wajib diisi.' });
      setActiveFormTab('berkas');
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('nama_varietas', form.nama_varietas);
      fd.append('asal_plasma_nutfah', form.asal_plasma_nutfah);
      fd.append('karakter_genetik', form.karakter_genetik);
      fd.append('user_id', form.user_id);

      const fullDetail = {
        ...detailForm,
        pendeskripsi: pendeskripsiList.filter(Boolean)
      };
      fd.append('detail_pendaftaran', JSON.stringify(fullDetail));

      fd.append('formulir_bermaterai', fileFormulir);
      fd.append('nomor_formulir', nomorFormulir);
      fd.append('tanggal_formulir', tanggalFormulir);

      fd.append('surat_tugas', fileSuratTugas);
      fd.append('nomor_surat_tugas', nomorSuratTugas);
      fd.append('tanggal_surat_tugas', tanggalSuratTugas);

      if (fileDataDukung) {
        fd.append('data_dukung', fileDataDukung);
        fd.append('nomor_data_dukung', nomorDataDukung);
        fd.append('tanggal_data_dukung', tanggalDataDukung);
      }

      fd.append('foto_karakteristik', fileFoto);
      fd.append('nomor_foto', nomorFoto);
      fd.append('tanggal_foto', tanggalFoto);

      const res = await PlasmaAPI.register(fd);
      setResult(res);
      setToast({ type: 'ok', msg: 'Registrasi berhasil dicatat ke blockchain.' });
      
      // Reset form
      setForm({ nama_varietas: '', asal_plasma_nutfah: '', karakter_genetik: '', user_id: user.user_id });
      setDetailForm({
        komoditas: 'Tanaman Pangan',
        nama_genus: '',
        nama_spesies: '',
        nama_umum: '',
        nama_lokal: '',
        usulan_nama_1: '',
        usulan_nama_2: '',
        usulan_nama_3: '',
        lokasi_pendataan: '',
        tahun_dikenal: '',
        sebaran_geografis: '',
        nama_pendaftar: user.name || '',
        jabatan: '',
        asal_instansi: user.nama_institusi || '',
        morfologi_pertumbuhan: '',
        morfologi_batang: '',
        morfologi_daun: '',
        morfologi_bunga: '',
        morfologi_buah: '',
        morfologi_biji: '',
        sifat_khusus: ''
      });
      setPendeskripsiList(['']);
      setFileFormulir(null); setNomorFormulir(''); setTanggalFormulir('');
      setFileSuratTugas(null); setNomorSuratTugas(''); setTanggalSuratTugas('');
      setFileDataDukung(null); setNomorDataDukung(''); setTanggalDataDukung('');
      setFileFoto(null); setNomorFoto(''); setTanggalFoto('');
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
    setActiveFormTab('umum');
    setActiveDetailTab('umum');
    load();
  };

  const getDocDownloadUrl = (doc) => {
    if (!doc || doc.file_path_ipfs === '-') return null;
    const diskFilename = doc.file_path_ipfs.split(/[\\/]/).pop();
    return `/uploads/${diskFilename}`;
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

  // Helper formatting tanggal
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Helper label status ramah pengguna
  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING': return 'Diajukan';
      case 'ADMIN_APPROVED': return 'Verifikasi Administrasi';
      case 'SUBSTANTIVE_APPROVED': return 'Verifikasi Teknis';
      case 'CERTIFIED': return 'Sertifikat Terbit';
      case 'REJECTED': return 'Ditolak';
      case 'CANCELLED': return 'Dibatalkan';
      default: return status;
    }
  };

  // Helper kelas badge CSS
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

  // Proses pencarian data
  const filteredRows = rows.filter(r => {
    if (!searchQuery) return true;
    let detail = {};
    try { detail = r.detail_pendaftaran ? JSON.parse(r.detail_pendaftaran) : {}; } catch (e) {}

    const q = searchQuery.toLowerCase();
    return (
      (r.onchain_id || '').toLowerCase().includes(q) ||
      (r.nama_varietas || '').toLowerCase().includes(q) ||
      (r.User?.name || '').toLowerCase().includes(q) ||
      (detail.komoditas || '').toLowerCase().includes(q)
    );
  });


  // Hitung data pagination
  const totalItems = filteredRows.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalItems);
  const paginatedRows = filteredRows.slice(startIdx, endIdx);

  // Fungsi navigasi page
  const changePage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset page ke 1 jika search berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

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
              <div className="grid two-col" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
                {/* Kolom Kiri: Metadata Off-Chain */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <h2 className="section-title" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 12, margin: 0 }}>
                      Detail Pengajuan Registrasi Varietas
                    </h2>
                  </div>

                  {/* Detail Tab Navigation */}
                  <div style={{ display: 'flex', borderBottom: '2px solid var(--line)', gap: '6px', margin: '0 0 4px 0' }}>
                    <button
                      type="button"
                      onClick={() => setActiveDetailTab('umum')}
                      style={{
                        padding: '10px 16px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeDetailTab === 'umum' ? '3px solid var(--forest)' : '3px solid transparent',
                        color: activeDetailTab === 'umum' ? 'var(--forest)' : 'var(--muted)',
                        fontWeight: activeDetailTab === 'umum' ? '600' : '500',
                        cursor: 'pointer',
                        fontSize: '13.5px',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      I. Data Umum
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveDetailTab('morfologi')}
                      style={{
                        padding: '10px 16px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeDetailTab === 'morfologi' ? '3px solid var(--forest)' : '3px solid transparent',
                        color: activeDetailTab === 'morfologi' ? 'var(--forest)' : 'var(--muted)',
                        fontWeight: activeDetailTab === 'morfologi' ? '600' : '500',
                        cursor: 'pointer',
                        fontSize: '13.5px',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      II. Morfologi
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveDetailTab('berkas')}
                      style={{
                        padding: '10px 16px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeDetailTab === 'berkas' ? '3px solid var(--forest)' : '3px solid transparent',
                        color: activeDetailTab === 'berkas' ? 'var(--forest)' : 'var(--muted)',
                        fontWeight: activeDetailTab === 'berkas' ? '600' : '500',
                        cursor: 'pointer',
                        fontSize: '13.5px',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      III. Berkas Lampiran
                    </button>
                  </div>

                  {/* SECTION I: DATA UMUM */}
                  {activeDetailTab === 'umum' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <h3 style={{ fontSize: '15px', color: 'var(--forest)', borderBottom: '1.5px solid var(--line)', paddingBottom: 4, margin: 0 }}>
                        I. Data Umum & Usulan Nama
                      </h3>
                      
                      {(() => {
                        const detail = detailData.registration.detail_pendaftaran ? JSON.parse(detailData.registration.detail_pendaftaran) : {};
                        return (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', fontSize: '13.5px' }}>
                            <div>
                              <span style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 600, display: 'block' }}>NAMA VARIETAS</span>
                              <strong>{detailData.registration.nama_varietas}</strong>
                            </div>
                            <div>
                              <span style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 600, display: 'block' }}>KOMODITAS</span>
                              <span>{detail.komoditas || '-'}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 600, display: 'block' }}>NAMA GENUS</span>
                              <span>{detail.nama_genus || '-'}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 600, display: 'block' }}>SPESIES & AUTHOR</span>
                              <span>{detail.nama_spesies || '-'}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 600, display: 'block' }}>NAMA UMUM</span>
                              <span>{detail.nama_umum || '-'}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 600, display: 'block' }}>NAMA LOKAL</span>
                              <span>{detail.nama_lokal || '-'}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 600, display: 'block' }}>USULAN NAMA</span>
                              <div style={{ lineHeight: 1.4 }}>
                                1. {detail.usulan_nama_1 || '-'}<br />
                                2. {detail.usulan_nama_2 || '-'}<br />
                                3. {detail.usulan_nama_3 || '-'}
                              </div>
                            </div>
                            <div>
                              <span style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 600, display: 'block' }}>TAHUN DIKENAL</span>
                              <span>{detail.tahun_dikenal || '-'}</span>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                              <span style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 600, display: 'block' }}>LOKASI PENDATAAN & SEBARAN</span>
                              <div><strong>Lokasi:</strong> {detail.lokasi_pendataan || '-'}</div>
                              <div><strong>Sebaran Geografis:</strong> {detail.sebaran_geografis || '-'}</div>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                              <span style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 600, display: 'block' }}>NAMA PENDESKRIPSI VARIETAS</span>
                              <span>{Array.isArray(detail.pendeskripsi) ? detail.pendeskripsi.join(', ') : (detail.pendeskripsi || '-')}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 600, display: 'block' }}>NAMA PENDAFTAR</span>
                              <span>{detail.nama_pendaftar || '-'} ({detail.jabatan || '-'})</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 600, display: 'block' }}>ASAL INSTANSI</span>
                              <span>{detail.asal_instansi || '-'}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* SECTION II: MORFOLOGI */}
                  {activeDetailTab === 'morfologi' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <h3 style={{ fontSize: '15px', color: 'var(--forest)', borderBottom: '1.5px solid var(--line)', paddingBottom: 4, margin: 0 }}>
                        II. Karakteristik Morfologi Tanaman
                      </h3>
                      {(() => {
                        const detail = detailData.registration.detail_pendaftaran ? JSON.parse(detailData.registration.detail_pendaftaran) : {};
                        return (
                          <div style={{ display: 'grid', gap: 12, fontSize: '13.5px' }}>
                            <div style={{ background: '#f8faf7', padding: '10px 14px', borderRadius: 8 }}>
                              <strong style={{ display: 'block', fontSize: '11.5px', color: 'var(--forest-2)', marginBottom: 2 }}>SIFAT PERTUMBUHAN</strong>
                              {detail.morfologi_pertumbuhan || '-'}
                            </div>
                            <div style={{ background: '#f8faf7', padding: '10px 14px', borderRadius: 8 }}>
                              <strong style={{ display: 'block', fontSize: '11.5px', color: 'var(--forest-2)', marginBottom: 2 }}>BATANG</strong>
                              {detail.morfologi_batang || '-'}
                            </div>
                            <div style={{ background: '#f8faf7', padding: '10px 14px', borderRadius: 8 }}>
                              <strong style={{ display: 'block', fontSize: '11.5px', color: 'var(--forest-2)', marginBottom: 2 }}>DAUN</strong>
                              {detail.morfologi_daun || '-'}
                            </div>
                            <div style={{ background: '#f8faf7', padding: '10px 14px', borderRadius: 8 }}>
                              <strong style={{ display: 'block', fontSize: '11.5px', color: 'var(--forest-2)', marginBottom: 2 }}>BUNGA</strong>
                              {detail.morfologi_bunga || '-'}
                            </div>
                            <div style={{ background: '#f8faf7', padding: '10px 14px', borderRadius: 8 }}>
                              <strong style={{ display: 'block', fontSize: '11.5px', color: 'var(--forest-2)', marginBottom: 2 }}>BUAH</strong>
                              {detail.morfologi_buah || '-'}
                            </div>
                            <div style={{ background: '#f8faf7', padding: '10px 14px', borderRadius: 8 }}>
                              <strong style={{ display: 'block', fontSize: '11.5px', color: 'var(--forest-2)', marginBottom: 2 }}>BIJI</strong>
                              {detail.morfologi_biji || '-'}
                            </div>
                            <div style={{ background: '#f8faf7', padding: '10px 14px', borderRadius: 8 }}>
                              <strong style={{ display: 'block', fontSize: '11.5px', color: 'var(--forest-2)', marginBottom: 2 }}>SIFAT KHUSUS</strong>
                              {detail.sifat_khusus || '-'}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* SECTION III: DOKUMEN DAN PERSYARATAN */}
                  {activeDetailTab === 'berkas' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <h3 style={{ fontSize: '15px', color: 'var(--forest)', borderBottom: '1.5px solid var(--line)', paddingBottom: 4, margin: 0 }}>
                        III. Berkas Kelengkapan Administrasi & Lampiran
                      </h3>
                      
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                          <thead>
                            <tr style={{ background: 'var(--leaf-soft)', borderBottom: '2px solid var(--line)' }}>
                              <th style={{ padding: '10px' }}>Jenis Dokumen Persyaratan</th>
                              <th style={{ padding: '10px' }}>Nomor Dokumen</th>
                              <th style={{ padding: '10px' }}>Tanggal Terbit</th>
                              <th style={{ padding: '10px', textAlign: 'center' }}>Status</th>
                              <th style={{ padding: '10px', textAlign: 'right' }}>Berkas</th>
                            </tr>
                          </thead>
                          <tbody>
                            {['formulir_bermaterai', 'surat_tugas', 'data_dukung', 'foto_karakteristik'].map((type) => {
                              const doc = (detailData.registration.Documents || []).find((d) => d.document_type === type);
                              const labelMap = {
                                formulir_bermaterai: 'Formulir Pendaftaran Bermaterai',
                                surat_tugas: 'Surat Kuasa/Tugas Penunjukan',
                                data_dukung: 'Data Dukung Morfologi (Lainnya)',
                                foto_karakteristik: 'Foto Asli Karakteristik Tanaman'
                              };

                              return (
                                <tr key={type} style={{ borderBottom: '1px solid var(--line)' }}>
                                  <td style={{ padding: '12px 10px', fontWeight: 500 }}>{labelMap[type]}</td>
                                  <td style={{ padding: '12px 10px' }}>{doc ? doc.nomor_dokumen : '-'}</td>
                                  <td style={{ padding: '12px 10px' }}>{doc ? doc.tanggal_terbit : '-'}</td>
                                  <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                    <span className={`badge ${doc ? 'CERTIFIED' : 'CANCELLED'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                                      {doc ? 'Ada' : 'Tidak Ada'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                                    {doc && getDocDownloadUrl(doc) ? (
                                      <a href={getDocDownloadUrl(doc)} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ padding: '4px 10px', fontSize: '11px', display: 'inline-flex' }}>
                                        ⬇ Unduh
                                      </a>
                                    ) : (
                                      <span className="muted" style={{ fontSize: '11.5px' }}>-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
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

                {/* Kolom Kanan: Catatan Ledger Blockchain */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div className="card">
                    <h2 className="section-title" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 12, margin: 0 }}>
                      Bukti Pendaftaran Blockchain
                    </h2>

                    <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
                      <div>
                        <label>Kode Registrasi Blockchain</label>
                        <span className="hash" style={{ fontSize: 14 }}>{detailData.registration.onchain_id}</span>
                      </div>

                      {detailData.onchain ? (
                        <>
                          <div>
                            <label>Status Ledger Blockchain</label>
                            <span className={`badge ${detailData.onchain.status}`} style={{ fontSize: 12 }}>
                              {detailData.onchain.status}
                            </span>
                          </div>

                          <div>
                            <label>Nama Pemegang Hak Paten</label>
                            <div>{detailData.onchain.ownerName}</div>
                          </div>

                          <div>
                            <label>Alamat Wallet Digital</label>
                            <span className="hash" style={{ fontSize: 11 }}>{detailData.onchain.owner}</span>
                          </div>

                          <div>
                            <label>Kode Verifikasi Dokumen (Hash SHA-256)</label>
                            <span className="hash" style={{ fontSize: 11, background: '#eef3eb', color: 'var(--forest-2)', display: 'block', wordBreak: 'break-all' }}>
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
                          Data blockchain belum tersedia atau pengajuan telah dibatalkan.
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
                    </div>
                  </div>

                  {/* Audit Trail dari Blockchain */}
                  {detailHistory.length > 0 && (
                    <div className="card">
                      <h2 className="section-title" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 12, margin: 0 }}>
                        Jejak Audit Ledger (History)
                      </h2>
                      <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
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
                              padding: '12px 14px',
                              borderRadius: '0 8px 8px 0',
                              fontSize: 12.5,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, marginBottom: 6 }}>
                                <span className={`badge ${badgeClass}`} style={{ fontSize: '10px' }}>{status}</span>
                                <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 500 }}>
                                  🕒 {txDate}
                                </span>
                              </div>
                              <div style={{ fontWeight: 500, color: '#374151' }}>{actorInfo}</div>
                              {noteText && (
                                <div style={{
                                  marginTop: 8,
                                  fontSize: 12,
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
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
            <h2 className="section-title" style={{ margin: 0 }}>Histori Pengajuan Registrasi Varietas</h2>
            <div className="btn-row" style={{ alignItems: 'center' }}>
              {isPeneliti && (
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                  ＋ Registrasi Varietas Baru
                </button>
              )}
              <button
                className="btn btn-ghost tooltip-btn"
                onClick={load}
                data-tooltip="Segarkan Data"
                style={{ padding: '10px 12px' }}
              >
                <i className="ri-refresh-line" style={{ fontSize: '18px' }}></i>
              </button>
            </div>
          </div>

          {/* Kotak Pencarian */}
          <div style={{ marginBottom: 20, position: 'relative' }}>
            <i className="ri-search-line" style={{
              position: 'absolute', left: 14, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 16
            }}></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor registrasi, nama varietas, atau nama pemohon..."
              style={{ paddingLeft: 40 }}
            />
          </div>

          {filteredRows.length === 0 ? (
            <div className="empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '60px 20px' }}>
              <div style={{ fontSize: 48 }}>🌱</div>
              <p style={{ color: 'var(--muted)', fontSize: 16 }}>Belum ada data registrasi varietas.</p>
              {isPeneliti && (
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                  Buat Registrasi Baru
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Nomor Registrasi</th>
                      <th>Nama Varietas</th>
                      <th>Jenis Tanaman</th>
                      <th>Pemohon</th>
                      <th>Tanggal Pengajuan</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((r) => {
                      let detail = {};
                      try {
                        detail = r.detail_pendaftaran ? JSON.parse(r.detail_pendaftaran) : {};
                      } catch(e) {}

                      return (
                        <tr key={r.registration_id}>
                          <td><span className="hash">{r.onchain_id}</span></td>
                          <td><strong>{r.nama_varietas}</strong></td>
                          <td>{detail.komoditas || '-'}</td>
                          <td>{r.User?.name || '-'}</td>
                          <td>{formatDate(r.created_at)}</td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(r.status_registrasi)}`}>
                              {getStatusLabel(r.status_registrasi)}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setDetailId(r.registration_id)}
                            >
                              👁 Lihat Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination-container">
                <div className="pagination-limit">
                  <span>Tampilkan:</span>
                  <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                
                <div className="pagination-info">
                  {totalItems > 0 ? (
                    `Menampilkan ${startIdx + 1}-${endIdx} dari ${totalItems} data`
                  ) : (
                    'Menampilkan 0-0 dari 0 data'
                  )}
                </div>

                <div className="pagination-controls">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage === 1 || totalPages <= 1}
                  >
                    Sebelumnya
                  </button>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, padding: '0 8px' }}>
                    {currentPage} / {totalPages || 1}
                  </span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => changePage(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages <= 1}
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ==================== SCREEN 3: FORM REGISTRASI BARU (Gambar 12 PDF) ==================== */}
      {!detailId && showForm && (
        <div style={{ maxWidth: '880px', margin: '0 auto' }}>
          <div style={{ marginBottom: 18 }}>
            <button className="btn btn-ghost btn-sm" onClick={handleBackToList}>
              ← Kembali ke Daftar
            </button>
          </div>

          {!result ? (
            <div className="card" style={{ padding: '32px' }}>
              <h2 className="section-title" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 12, margin: 0 }}>
                Form Isian Permohonan Pendaftaran Varietas Tanaman
              </h2>

              <div className="flow-steps" style={{ margin: '14px 0 24px', display: 'flex', gap: '16px' }}>
                <span className={`flow-step ${activeFormTab === 'umum' ? 'active' : 'done'}`}>1. Data Umum</span>
                <span className={`flow-step ${activeFormTab === 'morfologi' ? 'active' : (activeFormTab === 'berkas' ? 'done' : '')}`}>2. Morfologi Tanaman</span>
                <span className={`flow-step ${activeFormTab === 'berkas' ? 'active' : ''}`}>3. Berkas & Lampiran</span>
              </div>

              {/* Tab Headers */}
              <div style={{ display: 'flex', borderBottom: '2px solid var(--line)', gap: '6px', marginBottom: '24px' }}>
                <button
                  type="button"
                  onClick={() => setActiveFormTab('umum')}
                  style={{
                    padding: '10px 18px',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeFormTab === 'umum' ? '3px solid var(--forest)' : '3px solid transparent',
                    color: activeFormTab === 'umum' ? 'var(--forest)' : 'var(--muted)',
                    fontWeight: activeFormTab === 'umum' ? '600' : '500',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.18s ease'
                  }}
                >
                  I. Data Umum & Usulan Nama
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormTab('morfologi')}
                  style={{
                    padding: '10px 18px',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeFormTab === 'morfologi' ? '3px solid var(--forest)' : '3px solid transparent',
                    color: activeFormTab === 'morfologi' ? 'var(--forest)' : 'var(--muted)',
                    fontWeight: activeFormTab === 'morfologi' ? '600' : '500',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.18s ease'
                  }}
                >
                  II. Karakteristik Morfologi
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormTab('berkas')}
                  style={{
                    padding: '10px 18px',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeFormTab === 'berkas' ? '3px solid var(--forest)' : '3px solid transparent',
                    color: activeFormTab === 'berkas' ? 'var(--forest)' : 'var(--muted)',
                    fontWeight: activeFormTab === 'berkas' ? '600' : '500',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.18s ease'
                  }}
                >
                  III. Berkas Administrasi & Foto
                </button>
              </div>

              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                
                {/* SECTION I: DATA UMUM */}
                {activeFormTab === 'umum' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <h3 style={{ fontSize: '15px', color: 'var(--forest)', borderBottom: '1.5px solid var(--line)', paddingBottom: 6, margin: 0 }}>
                      I. Data Umum & Usulan Nama
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Nama Varietas Tanaman *</label>
                        <input
                          type="text"
                          value={form.nama_varietas}
                          onChange={setFormField('nama_varietas')}
                          placeholder="mis. Mangga Gadung Klonal 21"
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Komoditas Varietas *</label>
                        <select
                          value={detailForm.komoditas}
                          onChange={setDetailFormField('komoditas')}
                          style={{ height: '46px', background: '#fbfdfa', border: '1px solid var(--line)', borderRadius: 11 }}
                        >
                          <option value="Tanaman Pangan">Tanaman Pangan</option>
                          <option value="Tanaman Hortikultura">Tanaman Hortikultura</option>
                          <option value="Tanaman Perkebunan">Tanaman Perkebunan</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Nama Genus *</label>
                        <input
                          type="text"
                          value={detailForm.nama_genus}
                          onChange={setDetailFormField('nama_genus')}
                          placeholder="mis. Mangifera"
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Nama Spesies, dan Author(s) *</label>
                        <input
                          type="text"
                          value={detailForm.nama_spesies}
                          onChange={setDetailFormField('nama_spesies')}
                          placeholder="mis. Mangga indica L."
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Nama Umum *</label>
                        <input
                          type="text"
                          value={detailForm.nama_umum}
                          onChange={setDetailFormField('nama_umum')}
                          placeholder="mis. Mangga"
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Nama Lokal *</label>
                        <input
                          type="text"
                          value={detailForm.nama_lokal}
                          onChange={setDetailFormField('nama_lokal')}
                          placeholder="mis. Gadung Arum"
                        />
                      </div>
                    </div>

                    <div style={{ border: '1px solid var(--line)', padding: '16px', borderRadius: 12, background: '#fcfdfc' }}>
                      <label style={{ fontWeight: 600, color: 'var(--forest-2)', marginBottom: 10 }}>Usulan Nama Varietas (Maks 30 Huruf, Tanpa Tanda Baca) *</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '12px' }}>Nama Pertama *</label>
                          <input
                            type="text"
                            value={detailForm.usulan_nama_1}
                            onChange={setDetailFormField('usulan_nama_1')}
                            placeholder="Usulan 1"
                            maxLength={30}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '12px' }}>Nama Kedua</label>
                          <input
                            type="text"
                            value={detailForm.usulan_nama_2}
                            onChange={setDetailFormField('usulan_nama_2')}
                            placeholder="Usulan 2"
                            maxLength={30}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '12px' }}>Nama Ketiga</label>
                          <input
                            type="text"
                            value={detailForm.usulan_nama_3}
                            onChange={setDetailFormField('usulan_nama_3')}
                            placeholder="Usulan 3"
                            maxLength={30}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Asal Plasma Nutfah (Daerah Asal Material Genetik) *</label>
                        <input
                          type="text"
                          value={form.asal_plasma_nutfah}
                          onChange={setFormField('asal_plasma_nutfah')}
                          placeholder="mis. Pasuruan, Jawa Timur"
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Dikenal Sejak Tahun *</label>
                        <input
                          type="text"
                          value={detailForm.tahun_dikenal}
                          onChange={setDetailFormField('tahun_dikenal')}
                          placeholder="mis. 1995"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Lokasi Pendataan (Desa/Kec/Kab/Prov) *</label>
                        <input
                          type="text"
                          value={detailForm.lokasi_pendataan}
                          onChange={setDetailFormField('lokasi_pendataan')}
                          placeholder="mis. Desa Rembang, Kec. Rembang, Kab. Pasuruan"
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Sebaran Geografis *</label>
                        <input
                          type="text"
                          value={detailForm.sebaran_geografis}
                          onChange={setDetailFormField('sebaran_geografis')}
                          placeholder="mis. Kabupaten Pasuruan dan sekitarnya"
                        />
                      </div>
                    </div>

                    {/* Dynamic Descriptors */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Nama-nama Pendeskripsi Varietas *</label>
                      {pendeskripsiList.map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <input
                            type="text"
                            value={p}
                            onChange={(e) => {
                              const newList = [...pendeskripsiList];
                              newList[idx] = e.target.value;
                              setPendeskripsiList(newList);
                            }}
                            placeholder={`Pendeskripsi ke-${idx + 1}`}
                          />
                          {pendeskripsiList.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => {
                                const newList = pendeskripsiList.filter((_, i) => i !== idx);
                                setPendeskripsiList(newList);
                              }}
                              style={{ padding: '0 12px', borderRadius: 11 }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setPendeskripsiList([...pendeskripsiList, ''])}
                        style={{ marginTop: 4, display: 'inline-flex', alignSelf: 'flex-start' }}
                      >
                        ＋ Tambah Pendeskripsi
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Nama Pendaftar *</label>
                        <input
                          type="text"
                          value={detailForm.nama_pendaftar}
                          onChange={setDetailFormField('nama_pendaftar')}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Jabatan Pendaftar *</label>
                        <input
                          type="text"
                          value={detailForm.jabatan}
                          onChange={setDetailFormField('jabatan')}
                          placeholder="mis. Peneliti Madya"
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Asal Instansi Pendaftar *</label>
                        <input
                          type="text"
                          value={detailForm.asal_instansi}
                          onChange={setDetailFormField('asal_instansi')}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 20 }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          // Quick partial validation before going to next tab
                          if (!form.nama_varietas) {
                            setToast({ type: 'err', msg: 'Nama varietas tanaman wajib diisi.' });
                            return;
                          }
                          setToast(null);
                          setActiveFormTab('morfologi');
                        }}
                      >
                        Lanjut ke Morfologi Tanaman →
                      </button>
                    </div>
                  </div>
                )}

                {/* SECTION II: MORFOLOGI */}
                {activeFormTab === 'morfologi' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <h3 style={{ fontSize: '15px', color: 'var(--forest)', borderBottom: '1.5px solid var(--line)', paddingBottom: 6, margin: 0 }}>
                      II. Karakteristik Morfologi Tanaman & Sifat Khusus
                    </h3>
                    
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Karakter Genetik Utama (Karakteristik Umum) *</label>
                      <textarea
                        value={form.karakter_genetik}
                        onChange={setFormField('karakter_genetik')}
                        placeholder="Ringkasan ciri genetik varietas tanaman..."
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Sifat Pertumbuhan Tanaman</label>
                        <input
                          type="text"
                          value={detailForm.morfologi_pertumbuhan}
                          onChange={setDetailFormField('morfologi_pertumbuhan')}
                          placeholder="Ketik data sifat pertumbuhan"
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Karakteristik Batang</label>
                        <input
                          type="text"
                          value={detailForm.morfologi_batang}
                          onChange={setDetailFormField('morfologi_batang')}
                          placeholder="Ketik data bentuk/warna batang"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Karakteristik Daun</label>
                        <input
                          type="text"
                          value={detailForm.morfologi_daun}
                          onChange={setDetailFormField('morfologi_daun')}
                          placeholder="Ketik data bentuk/warna daun"
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Karakteristik Bunga</label>
                        <input
                          type="text"
                          value={detailForm.morfologi_bunga}
                          onChange={setDetailFormField('morfologi_bunga')}
                          placeholder="Ketik data kelopak/warna bunga"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Karakteristik Buah</label>
                        <input
                          type="text"
                          value={detailForm.morfologi_buah}
                          onChange={setDetailFormField('morfologi_buah')}
                          placeholder="Ketik data bentuk/ukuran buah"
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Karakteristik Biji</label>
                        <input
                          type="text"
                          value={detailForm.morfologi_biji}
                          onChange={setDetailFormField('morfologi_biji')}
                          placeholder="Ketik data bentuk/permukaan biji"
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Sifat Khusus / Ciri Spesifik (Penciri Utama) *</label>
                      <textarea
                        value={detailForm.sifat_khusus}
                        onChange={setDetailFormField('sifat_khusus')}
                        placeholder="Ciri spesifik pembeda dengan varietas lain & keunggulan..."
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 20 }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setActiveFormTab('umum')}
                      >
                        ← Kembali ke Data Umum
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          if (!form.karakter_genetik) {
                            setToast({ type: 'err', msg: 'Karakter genetik utama wajib diisi.' });
                            return;
                          }
                          setToast(null);
                          setActiveFormTab('berkas');
                        }}
                      >
                        Lanjut ke Upload Berkas →
                      </button>
                    </div>
                  </div>
                )}

                {/* SECTION III: DOKUMEN DAN FOTO */}
                {activeFormTab === 'berkas' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <h3 style={{ fontSize: '15px', color: 'var(--forest)', borderBottom: '1.5px solid var(--line)', paddingBottom: 6, margin: 0 }}>
                      III. Berkas Kelengkapan Administrasi & Lampiran
                    </h3>

                    {/* 1. Formulir Pendaftaran Bermaterai */}
                    <div style={{ border: '1px solid var(--line)', padding: '18px', borderRadius: 12, background: '#fbfdfb' }}>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '13.5px', color: 'var(--forest-2)' }}>1. Formulir Pendaftaran Bermaterai *</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '12px' }}>Nomor Dokumen *</label>
                          <input type="text" value={nomorFormulir} onChange={(e) => setNomorFormulir(e.target.value)} placeholder="Ketik nomor dokumen" />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '12px' }}>Tanggal Terbit *</label>
                          <input type="date" value={tanggalFormulir} onChange={(e) => setTanggalFormulir(e.target.value)} />
                        </div>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <label style={{ fontSize: '12px' }}>Unggah File PDF (Maks 10MB) *</label>
                        <input type="file" accept=".pdf" onChange={(e) => setFileFormulir(e.target.files[0])} />
                      </div>
                    </div>

                    {/* 2. Surat Kuasa / Tugas Penunjukan */}
                    <div style={{ border: '1px solid var(--line)', padding: '18px', borderRadius: 12, background: '#fbfdfb' }}>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '13.5px', color: 'var(--forest-2)' }}>2. Surat Kuasa / Tugas Penunjukan *</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '12px' }}>Nomor Dokumen *</label>
                          <input type="text" value={nomorSuratTugas} onChange={(e) => setNomorSuratTugas(e.target.value)} placeholder="Ketik nomor dokumen" />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '12px' }}>Tanggal Terbit *</label>
                          <input type="date" value={tanggalSuratTugas} onChange={(e) => setTanggalSuratTugas(e.target.value)} />
                        </div>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <label style={{ fontSize: '12px' }}>Unggah File PDF (Maks 10MB) *</label>
                        <input type="file" accept=".pdf" onChange={(e) => setFileSuratTugas(e.target.files[0])} />
                      </div>
                    </div>

                    {/* 3. Data Dukung Morfologi (Lainnya) */}
                    <div style={{ border: '1px solid var(--line)', padding: '18px', borderRadius: 12, background: '#fbfdfb' }}>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '13.5px', color: 'var(--forest-2)' }}>3. Lampiran Data Dukung Deskripsi (Opsional)</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '12px' }}>Nomor Dokumen</label>
                          <input type="text" value={nomorDataDukung} onChange={(e) => setNomorDataDukung(e.target.value)} placeholder="Ketik nomor dokumen" />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '12px' }}>Tanggal Terbit</label>
                          <input type="date" value={tanggalDataDukung} onChange={(e) => setTanggalDataDukung(e.target.value)} />
                        </div>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <label style={{ fontSize: '12px' }}>Unggah File PDF (Maks 10MB)</label>
                        <input type="file" accept=".pdf" onChange={(e) => setFileDataDukung(e.target.files[0])} />
                      </div>
                    </div>

                    {/* 4. Foto Karakteristik Tanaman */}
                    <div style={{ border: '1px solid var(--line)', padding: '18px', borderRadius: 12, background: '#fbfdfb' }}>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '13.5px', color: 'var(--forest-2)' }}>4. Foto Karakteristik Tanaman *</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '12px' }}>Keterangan / Nomor Foto *</label>
                          <input type="text" value={nomorFoto} onChange={(e) => setNomorFoto(e.target.value)} placeholder="mis. Foto Organ Daun & Buah" />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '12px' }}>Tanggal Pengambilan Foto *</label>
                          <input type="date" value={tanggalFoto} onChange={(e) => setTanggalFoto(e.target.value)} />
                        </div>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <label style={{ fontSize: '12px' }}>Unggah File Foto (JPG/PNG, Maks 10MB) *</label>
                        <input type="file" accept="image/*" onChange={(e) => setFileFoto(e.target.files[0])} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 20 }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setActiveFormTab('morfologi')}
                      >
                        ← Kembali ke Morfologi
                      </button>
                      <div className="btn-row">
                        <button type="submit" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '15px' }} disabled={busy}>
                          {busy ? 'Mendaftarkan Varietas...' : '⛓ Daftarkan Varietas ke Blockchain'}
                        </button>
                        <button type="button" className="btn btn-ghost" style={{ padding: '14px 28px', fontSize: '15px' }} onClick={handleBackToList}>
                          Batal
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          ) : (
            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
              <h2 className="section-title" style={{ color: 'var(--forest-2)', fontSize: '24px', marginBottom: 12 }}>🎉 Pendaftaran Berhasil Diajukan</h2>
              <p style={{ marginBottom: 24, color: 'var(--muted)', fontSize: '14.5px', lineHeight: 1.6 }}>
                Pendaftaran varietas tanaman Anda telah berhasil dikirim dan tercatat secara aman di dalam sistem blockchain. Berkas Anda kini siap untuk diperiksa oleh petugas verifikasi.
              </p>

              <div style={{ background: '#f8faf7', padding: '20px 24px', borderRadius: 12, border: '1px solid var(--line)', marginBottom: 28, textAlign: 'left', fontSize: '13.5px' }}>
                <div style={{ marginBottom: 10 }}>
                  <strong>Kode Registrasi Blockchain:</strong> <span className="hash" style={{ fontSize: '12px' }}>{result.registration?.onchain_id}</span>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <strong>Kode Verifikasi Dokumen (Hash):</strong> <span className="hash" style={{ fontSize: '11px', display: 'block', wordBreak: 'break-all', marginTop: 4 }}>{result.document_hash}</span>
                </div>
                <div>
                  <strong>Kode Transaksi Blockchain:</strong> <span className="hash" style={{ fontSize: '11px', display: 'block', wordBreak: 'break-all', marginTop: 4 }}>{result.tx_hash}</span>
                </div>
              </div>

              <button className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: 11 }} onClick={handleBackToList}>
                Selesai & Kembali ke Daftar
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
