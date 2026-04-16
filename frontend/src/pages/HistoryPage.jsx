import { useState, useEffect } from 'react';
import { getHistory } from '../api';

const CAT_ICON = { food: '🍕', shopping: '🛍️', transport: '🚗', bills: '📄', entertainment: '🎬', other: '💳' };
const CAT_COLOR = { food: 'ic-primary', shopping: 'ic-lime', transport: 'ic-earn', bills: 'ic-surface', entertainment: 'ic-primary', other: 'ic-surface' };

export default function HistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [filter, setFilter] = useState('all'); // all | sent | received

  useEffect(() => { fetchHistory(); }, [page]);

  async function fetchHistory() {
    setLoading(true);
    try {
      const res = await getHistory(page, 20);
      setTransactions(res.transactions || []);
      setPagination(res.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const filtered = transactions.filter(t =>
    filter === 'all' ? true : filter === 'sent' ? t.direction === 'sent' : t.direction === 'received'
  );

  const totalSpare = transactions.reduce((s, t) => s + (t.roundUpAmount || 0), 0);

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <h1 className="t-h2">History</h1>
        {pagination?.total > 0 && (
          <span className="chip chip-primary">{pagination.total} txns</span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0 1.25rem' }}>

        {/* Spare summary bar */}
        {totalSpare > 0 && (
          <div className="card-earn" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="icon-container ic-earn">
              <span className="mi mi-md" style={{ color: 'var(--secondary)' }}>savings</span>
            </div>
            <div style={{ flex: 1 }}>
              <p className="t-label-sm" style={{ color: 'var(--on-secondary-container)' }}>ROUND-OFF SAVED THIS PAGE</p>
              <p className="t-h3" style={{ color: 'var(--on-secondary-container)' }}>₹{totalSpare}</p>
            </div>
            <span className="chip chip-earn">🌱 Invested</span>
          </div>
        )}

        {/* Segment filter */}
        <div className="seg-control">
          {[['all', 'All'], ['sent', 'Sent'], ['received', 'Received']].map(([val, lbl]) => (
            <button key={val} className={`seg-item ${filter === val ? 'active' : ''}`} onClick={() => setFilter(val)}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Transactions */}
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '68px', borderRadius: 'var(--r-lg)' }} />
          ))
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <span className="mi" style={{ fontSize: '3rem', color: 'var(--outline)', display: 'block', marginBottom: '0.75rem' }}>receipt_long</span>
            <p className="t-title" style={{ marginBottom: '0.25rem' }}>No transactions</p>
            <p className="t-body-sm c-muted">Your payment history will appear here</p>
          </div>
        ) : (
          <div className="card">
            {filtered.map((txn, i) => (
              <div key={txn._id || i}>
                {i > 0 && <div className="divider" />}
                <div className="txn-row">
                  <div className={`icon-container ${CAT_COLOR[txn.category] || 'ic-surface'}`} style={{ fontSize: '1.25rem' }}>
                    {CAT_ICON[txn.category] || '💳'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="txn-name">{txn.peerName || txn.merchantName || 'Transaction'}</div>
                    <div className="txn-sub">
                      {new Date(txn.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {txn.note ? ` · ${txn.note}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={`txn-amt ${txn.direction === 'sent' ? 'out' : 'in'}`}>
                      {txn.displayAmount || (txn.direction === 'sent' ? `-₹${txn.amount}` : `+₹${txn.amount}`)}
                    </div>
                    {txn.roundUpAmount > 0 && (
                      <div className="txn-spare">+₹{txn.roundUpAmount} saved</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', alignItems: 'center' }}>
            <button
              className="btn-icon ic-surface"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              style={{ opacity: page <= 1 ? 0.4 : 1 }}
            >
              <span className="mi mi-md">chevron_left</span>
            </button>
            <span className="t-label c-muted">{page} / {pagination.totalPages}</span>
            <button
              className="btn-icon ic-surface"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{ opacity: page >= pagination.totalPages ? 0.4 : 1 }}
            >
              <span className="mi mi-md">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
