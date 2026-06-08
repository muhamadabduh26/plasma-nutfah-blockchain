import { useState, useEffect } from 'react';
import { PlasmaAPI } from '../api/client';

export default function AuditBlockchain() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTxs();
  }, []);

  const fetchTxs = async () => {
    try {
      const data = await PlasmaAPI.transactions();
      setTxs(data);
    } catch (e) {
      console.error(e);
      setError('Gagal memuat log transaksi blockchain.');
    } finally {
      setLoading(false);
    }
  };

  const getFunctionBadge = (fn) => {
    switch (fn) {
      case 'RegisterPlasma':
        return <span className="badge CERTIFIED">🌱 RegisterPlasma</span>;
      case 'VerifyRegistration':
        return <span className="badge APPROVED">✓ VerifyRegistration</span>;
      case 'IssueCertificate':
        return <span className="badge PENDING">📜 IssueCertificate</span>;
      case 'TransferOwnership':
        return <span className="badge" style={{ background: '#f5eefb', color: '#6a4c93' }}>🔄 TransferOwnership</span>;
      default:
        return <span className="badge">{fn}</span>;
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1>Audit Log Transaksi Blockchain</h1>
        <p>Halaman pemantauan off-chain untuk mendokumentasikan log transaksi yang tersimpan di Hyperledger Fabric.</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Log Ledger Blockchain</h2>
          <button className="btn btn-ghost btn-sm" onClick={fetchTxs} disabled={loading}>
            🔄 Segarkan Data
          </button>
        </div>

        {error && <div className="toast err">{error}</div>}

        {loading ? (
          <div className="empty">Memuat log transaksi...</div>
        ) : txs.length === 0 ? (
          <div className="empty">Tidak ada log transaksi blockchain tercatat.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Fungsi Chaincode</th>
                  <th>Hash Transaksi (TxID)</th>
                  <th>Nomor Blok</th>
                  <th>Status Ledger</th>
                  <th>Gas Terpakai</th>
                  <th>Waktu Konfirmasi</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((tx) => (
                  <tr key={tx.tx_hash}>
                    <td>{getFunctionBadge(tx.fungsi)}</td>
                    <td><span className="hash" style={{ fontSize: 12 }}>{tx.tx_hash}</span></td>
                    <td><span className="badge" style={{ background: '#eef2f7', color: '#475569' }}>Blok #{tx.block_number}</span></td>
                    <td>
                      <span className="badge" style={{ background: '#d4edda', color: '#155724' }}>
                        ● {tx.tx_status}
                      </span>
                    </td>
                    <td><span className="muted">{tx.gas_used} (Fabric)</span></td>
                    <td>{new Date(tx.confirmed_at).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
